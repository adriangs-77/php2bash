import { afterNextRender, ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CodeBlock } from '../ui/code';

interface CheckItem {
  id: string;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-twintech',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './twintech.html',
})
export class Twintech {
  protected readonly checks: CheckItem[] = [
    { id: 'inventario', title: 'Inventario de runtimes PHP', detail: 'Producción, staging, previews, CI, Sail, colas y herramientas heredadas.' },
    { id: 'version', title: 'SAPI web en versión corregida', detail: '8.5.12 / 8.4.27 / 8.3.36 / 8.2.35, o backport confirmado. La CLI no cuenta.' },
    { id: 'restart', title: 'Workers reiniciados', detail: 'La hora de arranque del maestro y de Octane es posterior al parche.' },
    { id: 'build', title: 'Imagen y pipeline reproducibles', detail: 'Imagen base actualizada (idealmente por digest); reconstruir y recrear, no solo cambiar etiqueta.' },
    { id: 'funcional', title: 'Pruebas funcionales del backend', detail: 'Login, subidas, importaciones, pagos, webhooks y Horizon.' },
    { id: 'limites', title: 'Configuración endurecida', detail: 'Límites de tamaño y partes, upload_progress off permanente, memoria acotada, errores no expuestos.' },
    { id: 'deteccion', title: 'Búsqueda de explotación hecha', detail: 'Logs revisados desde el 17/10/2026, con evidencia preservada.' },
    { id: 'secretos', title: 'Secretos y sesiones rotados', detail: 'Base de datos, Redis, correo, pagos, cloud y tokens de CI.' },
    { id: 'monitor', title: 'Alertas y runbook', detail: 'OOM, 500 agrupados, workers muertos por señal y SLA de parcheo en horas.' },
  ];

  protected readonly done = signal<Record<string, boolean>>({});
  protected readonly count = computed(() => Object.values(this.done()).filter(Boolean).length);
  protected readonly pct = computed(() => Math.round((this.count() / this.checks.length) * 100));

  private readonly storageKey = 'twintech-php2shell-checklist-v1';

  constructor() {
    afterNextRender(() => {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          this.done.set(JSON.parse(raw) as Record<string, boolean>);
        }
      } catch {
        /* almacenamiento no disponible */
      }
    });
  }

  protected toggle(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.done.update((state) => {
      const next = { ...state, [id]: checked };
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(next));
      } catch {
        /* ignorar */
      }
      return next;
    });
  }

  protected reset(): void {
    this.done.set({});
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* ignorar */
    }
  }

  protected readonly verify = `# Versión que ve el servidor web (ruta temporal, solo desde tu IP)
Route::get('/_phpcheck', fn () => response()->json([
    'php'  => PHP_VERSION,
    'sapi' => PHP_SAPI,
    'upload_progress' => ini_get('session.upload_progress.enabled'),
]))->middleware('throttle:5,1');

# curl -s https://twintech.example/_phpcheck
# ELIMINA la ruta tras comprobarlo.

# Alternativa sin tocar código: proceso vivo y configuración
php-fpm8.3 -tt | grep -Ei 'upload_progress|memory_limit'
ps -o lstart=,cmd= -p $(pgrep -f 'php-fpm: master' | head -1)`;

  protected readonly script = `#!/usr/bin/env bash
# Triage de SOLO LECTURA. No modifica nada.
set -uo pipefail
APP="\${1:-/var/www/twintech/current}"

echo "== PHP =="; php -v | head -1
for b in php-fpm8.5 php-fpm8.4 php-fpm8.3 php-fpm8.2; do
  command -v "$b" >/dev/null && "$b" -v | head -1
done

echo "== Proceso vivo =="
ps -o pid,lstart,cmd -p "$(pgrep -f 'php-fpm: master' | head -1)" 2>/dev/null

echo "== OOM y workers muertos =="
grep -rhE 'Allowed memory size|exited on signal (6|11)|SIGSEGV' \
  /var/log/php*-fpm*.log* /var/log/nginx/ /var/log/apache2/ 2>/dev/null | tail -20

echo "== Archivos sospechosos =="
[ -d "$APP" ] && cd "$APP" || exit 0
find public storage -type f -name '*.php*' ! -name 'index.php' 2>/dev/null
git status --porcelain 2>/dev/null || echo "(sin git)"
find . -path ./vendor -prune -o -type f -name '*.php' \
  -newermt '2026-10-17' -print 2>/dev/null | head -20

echo "== Persistencia =="
ps -u www-data -o pid,cmd 2>/dev/null | grep -vE 'php-fpm|apache|nginx'
ls -la /var/spool/cron/crontabs/ 2>/dev/null`;
}
