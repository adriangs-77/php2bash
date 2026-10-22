import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CodeBlock } from '../ui/code';

type Status = 'ok' | 'bad' | 'warn' | 'unknown';

interface Verdict {
  status: Status;
  badge: string;
  headline: string;
  detail: string[];
  action: string;
}

const MIN: Record<string, number[]> = {
  '8.5': [8, 5, 12],
  '8.4': [8, 4, 27],
  '8.3': [8, 3, 36],
  '8.2': [8, 2, 35],
};

const FIXED_LABEL: Record<string, string> = {
  '8.5': '8.5.12',
  '8.4': '8.4.27',
  '8.3': '8.3.36',
  '8.2': '8.2.35',
};

function parse(v: string): number[] | null {
  const m = v.trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
  }
  return 0;
}

@Component({
  selector: 'app-versions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './versions.html',
})
export class Versions {
  protected readonly version = signal('8.3.35');
  protected readonly touched = signal(false);

  protected readonly verdict = computed<Verdict>(() => {
    const raw = this.version();
    const v = parse(raw);

    if (!v) {
      return {
        status: 'unknown',
        badge: '?',
        headline: 'No reconozco esa versión',
        detail: ['Escribe el número completo, por ejemplo 8.3.35, 8.4.27 o 8.2.35.'],
        action: '',
      };
    }

    const [maj, min, pat] = v;
    const branch = maj + '.' + min;

    if (maj < 8 || (maj === 8 && min < 2)) {
      return {
        status: 'bad',
        badge: '✕',
        headline: 'Vulnerable y sin soporte oficial',
        detail: [
          'PHP ' + maj + '.' + min + ' está fuera de soporte y no recibirá una actualización del proyecto PHP.',
          'Existen backports de código fuente para 7.4, 8.0 y 8.1, y paquetes de distribuciones o proveedores LTS (Sury, Ubuntu Pro, Freexian ELTS, TuxCare, ZendPHP, Remi, AlmaLinux…).',
          'Para 7.3 y anteriores no hay parche oficial: hay que migrar o retirar el servicio de Internet.',
        ],
        action: 'Actualiza a 8.4 o 8.5 cuanto antes. Mientras tanto, aplica las mitigaciones temporales.',
      };
    }

    if (branch === '8.2' || branch === '8.3' || branch === '8.4' || branch === '8.5') {
      const min = MIN[branch];
      const fixed = FIXED_LABEL[branch];
      if (cmp(v, min) >= 0) {
        return {
          status: 'ok',
          badge: '✓',
          headline: 'Parcheada (' + maj + '.' + min + '.' + pat + ')',
          detail: [
            'Está en el mínimo corregido o por encima: PHP ' + fixed + ' incluye el arreglo de las dos CVE.',
            'Si el binario se actualizó pero los workers no se reiniciaron, el proceso sigue ejecutando código vulnerable. Comprueba la hora de arranque del maestro de FPM/Apache.',
            'En paquetes de distribución el número de versión puede no cambiar aunque el parche esté aplicado: verifica el changelog del paquete.',
          ],
          action: 'Reinicia los workers si aún no lo hiciste y pasa a la detección de explotación.',
        };
      }
      return {
        status: 'bad',
        badge: '✕',
        headline: 'Vulnerable: falta actualizar a ' + fixed,
        detail: [
          'PHP ' + maj + '.' + min + '.' + pat + ' es anterior a ' + fixed + ', la primera versión que corrige CVE-2026-109618 y CVE-2026-109619 en la rama ' + branch + '.',
          branch === '8.2'
            ? 'La rama 8.2 llega a fin de vida el 31 de diciembre de 2026: parchea ya y planifica el salto a 8.4/8.5.'
            : 'Actualiza el paquete, reinicia PHP-FPM/Apache y verifica que el proceso nuevo es el que atiende tráfico.',
        ],
        action: 'Actualiza a ' + fixed + ' (o superior dentro de una rama soportada) y reinicia los workers.',
      };
    }

    if (maj === 8 && (min === 6 || min > 5)) {
      return {
        status: 'warn',
        badge: '?',
        headline: 'Rama posterior a las corregidas',
        detail: [
          'No hay datos públicos de esta rama en el aviso de PHP del 21/10/2026.',
          'Comprueba el changelog oficial: la corrección se publicó en 8.5.12, 8.4.27, 8.3.36 y 8.2.35.',
        ],
        action: 'Consulta php.net y el aviso de tu distribución.',
      };
    }

    return {
      status: 'warn',
      badge: '?',
      headline: 'Versión no contemplada',
      detail: ['Revisa el aviso oficial de PHP para tu rama.'],
      action: '',
    };
  });

  protected readonly examples = ['8.3.35', '8.4.27', '8.2.34', '7.4.33', '8.5.12'];

  protected readonly identify = `# 1. Qué binario y qué SAPI atiende la web
php -v                     # CLI: Composer, artisan, cron (orientativo)
php-fpm8.3 -v              # el que importa si usas FPM (ajusta la ruta/versión)
php -i | grep -E 'Server API|Loaded Configuration File'

# 2. Versiones por paquete (Debian/Ubuntu · RHEL/Alma/Rocky)
dpkg -l | grep -E '^ii\s+php'          rpm -qa | grep -i '^php'

# 3. ¿Está el parche? El número puede no cambiar en backports
apt changelog php8.3-fpm | grep -E '109618|109619'
rpm -q --changelog php-fpm | grep -E '109618|109619'

# 4. Procesos vivos y su hora de arranque (fin real de la ventana)
pgrep -a -f 'php-fpm: master|apache2|frankenphp'
ps -o pid,lstart,cmd -p $(pgrep -f 'php-fpm: master' | head -1)

# 5. Contenedores: etiqueta y digest de la imagen en uso
docker ps --format '{{.Image}}' | sort -u`;

  protected update(event: Event): void {
    this.touched.set(true);
    this.version.set((event.target as HTMLInputElement).value);
  }

  protected use(value: string): void {
    this.touched.set(true);
    this.version.set(value);
  }
}
