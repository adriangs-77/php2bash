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
    {
      id: 'inventario',
      title: 'Inventario cerrado de runtimes PHP',
      detail:
        'Producción, staging, previews, CI, contenedores, Sail/Valet locales, colas, Horizon, Octane, cron y herramientas heredadas (phpMyAdmin, WordPress, paneles). Ninguno debe quedar fuera.',
    },
    {
      id: 'version',
      title: 'El SAPI web está en una versión corregida',
      detail:
        'PHP-FPM, Octane o FrankenPHP en 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35, o con un backport confirmado. La versión de la CLI no demuestra nada.',
    },
    {
      id: 'restart',
      title: 'Workers reiniciados con el binario nuevo',
      detail:
        'La hora de arranque del maestro de FPM/Apache y de los workers de Octane es posterior a la actualización. Sin esto, el parche no está activo.',
    },
    {
      id: 'build',
      title: 'Build reproducible y fijado',
      detail:
        'Imagen base de PHP actualizada (idealmente por digest), composer.json con la plataforma correcta, pipeline que reconstruye y recrea contenedores, no solo cambia una etiqueta.',
    },
    {
      id: 'funcional',
      title: 'Verificación funcional del backend',
      detail:
        'Login, registro, subida de archivos, importaciones, pagos, colas y Horizon. Las mitigaciones temporales rompen multipart: confirma que ya no están activas o que no rompen nada.',
    },
    {
      id: 'limites',
      title: 'Configuración endurecida',
      detail:
        'post_max_size y upload_max_filesize razonables, límites de tamaño/partes/campos en nginx o el CDN, session.upload_progress.enabled=0 permanente, memory_limit finito, errores no expuestos.',
    },
    {
      id: 'deteccion',
      title: 'Búsqueda de explotación previa completada',
      detail:
        'Logs revisados desde el 17/10/2026 (FPM, Apache/nginx, syslog, EDR), con evidencia preservada antes de la rotación. Ver el apartado 07.',
    },
    {
      id: 'secretos',
      title: 'Secretos y sesiones tratados como expuestos',
      detail:
        'Rotación de credenciales de base de datos, Redis, correo, pasarelas de pago y servicios cloud. Revisión de APP_KEY y de la tienda de sesiones. Cierre de sesiones activas si hay cualquier indicio.',
    },
    {
      id: 'monitor',
      title: 'Monitorización y runbook',
      detail:
        'Alertas de «Allowed memory size exhausted», 500/502 agrupados, workers muertos por señal, procesos hijos raros. SLA de parcheo crítico y proceso documentado para el próximo CVE del intérprete.',
    },
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

  protected readonly arch = `Navegador
   │  Angular 22 (SPA/SSR en Node)  ← NO afectado: no ejecuta PHP
   ▼
CDN / nginx  ── sirve estático ──►  OK
   │
   │  proxy_pass / fastcgi_pass
   ▼
PHP-FPM ──► Laravel (public/index.php, artisan, colas, Octane)
   ▲
   └── ÚNICO punto donde vive la vulnerabilidad: el intérprete PHP`;

  protected readonly identify = `# En el host o contenedor del backend de Twintech
cd /ruta/twintech/current

php -v                                  # CLI (artisan, composer, cron)
php artisan about                       # entorno + versión que ve Laravel
php artisan about --only=environment

# El SAPI que atiende la web (ajusta el binario real)
php-fpm8.3 -v
php -i | grep -E 'Server API|Loaded Configuration File|memory_limit'
php-fpm8.3 -tt | grep -Ei 'upload_progress|fatal_error_backtraces|post_max_size'

# ¿Qué proceso está escuchando de verdad?
sudo ss -lntp | grep -E ':9000|:8000|:443'
pgrep -a -f 'php-fpm|frankenphp|octane'`;

  protected readonly rebuild = `# 1. docker/8.3/Dockerfile (Sail) o el Dockerfile del backend
#    FROM php:8.3-fpm  →  FROM php:8.4-fpm
#    Fija la imagen por digest para que el build sea reproducible.

# 2. Reconstruye y recrea; no basta con reiniciar el contenedor
docker compose build --no-cache laravel.test
docker compose up -d --force-recreate

# 3. Comprueba dentro del contenedor que el binario y el proceso son nuevos
docker compose exec laravel.test php-fpm -v
docker compose exec laravel.test ps -o lstart= -p 1

# 4. Composer: declara la plataforma para evitar sorpresas en CI
composer check-platform-reqs
# composer.json → "config": { "platform": { "php": "8.4.27" } }`;

  protected readonly verify = `# Versión que ve Laravel (CLI)
php artisan about --only=environment

# Versión que ve el servidor web: ruta temporal, solo accesible desde tu IP
# routes/web.php  (ELIMÍNALA tras comprobar)
Route::get('/_phpcheck', function () {
    abort_unless(request()->ip() === '203.0.113.10', 404);
    return response()->json([
        'php'      => PHP_VERSION,
        'sapi'     => PHP_SAPI,
        'upload_progress' => ini_get('session.upload_progress.enabled'),
        'memory_limit'    => ini_get('memory_limit'),
    ]);
})->withoutMiddleware(['web']);

# curl -s https://twintech.example/_phpcheck

# Alternativa sin tocar rutas: comprueba el proceso y su configuración
php-fpm8.3 -tt | grep -Ei 'upload_progress|post_max_size|memory_limit'
ps -o lstart=,cmd= -p $(pgrep -f 'php-fpm: master' | head -1)`;

  protected readonly script = `#!/usr/bin/env bash
# Triage de SOLO LECTURA para un stack Laravel. No modifica nada.
set -uo pipefail
APP_DIR="\${1:-/var/www/twintech/current}"

echo "== PHP CLI / FPM =="
php -v | head -1
for b in php-fpm8.5 php-fpm8.4 php-fpm8.3 php-fpm8.2 php-fpm; do
  command -v "$b" >/dev/null 2>&1 && "$b" -v | head -1
done

echo "== Procesos y hora de arranque =="
pgrep -a -f 'php-fpm: master|frankenphp' || true
ps -o pid,lstart,cmd -p "$(pgrep -f 'php-fpm: master' | head -1)" 2>/dev/null || true

echo "== Errores de memoria y workers muertos =="
grep -rhE 'Allowed memory size of .* exhausted|exited on signal (6|11)|SIGSEGV' \\
  /var/log/php*-fpm*.log* /var/log/nginx/ /var/log/apache2/ /var/log/httpd/ 2>/dev/null \\
  | tail -n 40 || echo "(sin coincidencias o sin permisos)"

echo "== 500 por hora (últimas 24 h de log) =="
for f in /var/log/nginx/access.log /var/log/apache2/access.log; do
  [ -r "$f" ] && awk '$9==500 {split($4,t,":"); print t[1]":"t[2]}' "$f" | sort | uniq -c | tail -20
done

echo "== Árbol de la aplicación =="
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" || exit 0
  echo "- PHP fuera de lo esperado en public/ y storage/:"
  find public storage -type f -name '*.php*' ! -name 'index.php' 2>/dev/null || true
  echo "- Git status (si es un checkout):"
  git status --porcelain 2>/dev/null || echo "(sin git)"
  echo "- Archivos PHP modificados desde el 17/10/2026:"
  find . -path ./vendor -prune -o -type f -name '*.php' -newermt '2026-10-17' -print 2>/dev/null | head -40
fi

echo "== Persistencia y conexiones =="
ps -u www-data -o pid,ppid,lstart,cmd 2>/dev/null | grep -vE 'php-fpm|apache|nginx' || true
ss -tpn state established 2>/dev/null | grep -E 'php|apache|frankenphp' || true
ls -la /var/spool/cron/crontabs 2>/dev/null || true`;

  protected readonly hardening = `# nginx del backend: límites aunque el WAF falle
client_max_body_size 12m;
client_body_buffer_size 128k;
large_client_header_buffers 4 8k;

# Laravel: evita fugas de detalle y sesiones eternas
APP_DEBUG=false
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
TRUSTED_PROXIES=...          # para que los logs guarden la IP real, no la del CDN

# Contenedor: límite real de memoria y sistema de archivos de solo lectura
# docker-compose.yml
services:
  laravel.test:
    read_only: true
    tmpfs: ['/tmp']
    deploy:
      resources:
        limits: { memory: 512M }`;
}
