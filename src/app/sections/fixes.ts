import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CodeBlock } from '../ui/code';

type TabId = 'nginx' | 'apache' | 'fpm' | 'waf';

interface TabDef {
  id: TabId;
  label: string;
  codeLabel: string;
  desc: string;
  code: string;
}

@Component({
  selector: 'app-fixes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './fixes.html',
})
export class Fixes {
  protected readonly tab = signal<TabId>('nginx');

  protected readonly debian = `sudo apt update
sudo apt install --only-upgrade php8.3-fpm php8.3-cli php8.3-common
sudo systemctl restart php8.3-fpm      # reinicio, no solo reload

# Verifica que el parche está en el paquete
apt changelog php8.3-fpm | grep -E '109618|109619'`;

  protected readonly docker = `FROM php:8.4-fpm        # imagen base ya corregida

docker compose build --no-cache laravel.test
docker compose up -d --force-recreate

docker compose exec laravel.test php-fpm -v`;

  protected readonly laravelRestart = `php artisan octane:reload     # o stop + start
php artisan queue:restart
php artisan horizon:terminate
php artisan optimize:clear`;

  protected readonly tabs: TabDef[] = [
    {
      id: 'nginx',
      label: 'nginx',
      codeLabel: 'nginx.conf',
      desc: 'Corta el cuerpo multipart en el servidor web, antes de que llegue a PHP. Rompe las subidas de archivos.',
      code: `# Parcial: rompe subidas. Quítalo al parchear.
if ($http_content_type ~* "multipart/form-data") {
    return 403;
}
client_max_body_size 8m;`,
    },
    {
      id: 'apache',
      label: 'Apache',
      codeLabel: 'httpd.conf / .htaccess',
      desc: 'Equivalente para Apache con mod_php o proxy_fcgi. Añádelo en cada VirtualHost que sirva PHP.',
      code: `# Parcial
RewriteEngine On
RewriteCond %{HTTP:Content-Type} multipart/form-data [NC]
RewriteRule ^ - [F]
LimitRequestBody 8388608`,
    },
    {
      id: 'fpm',
      label: 'php.ini / FPM',
      codeLabel: 'pool de PHP-FPM',
      desc: 'Desactiva el progreso de subida y quita el límite de memoria controlable. Debe aplicarse antes de parsear la petición.',
      code: `; Pool de FPM (aplica antes de parsear la petición)
php_admin_flag[session.upload_progress.enabled] = off
php_admin_flag[fatal_error_backtraces] = off   ; solo 8.5
php_admin_value[memory_limit] = -1             ; quita el límite controlable
php_admin_value[post_max_size] = 8M`,
    },
    {
      id: 'waf',
      label: 'WAF / CDN',
      codeLabel: 'borde',
      desc: 'Reglas de emergencia publicadas por los proveedores. Útiles para ganar tiempo, insuficientes por sí solas.',
      code: `# Reglas ya publicadas (no sustituyen al parche):
# Cloudflare · AWS WAF · Fastly · Imperva · Akamai · Vercel
#
# Comprueba siempre:
#  - ningún subdominio (staging, direct) apunta al origen sin proxy
#  - el origen solo acepta tráfico del CDN
#  - las reglas cubren HTTP/2 y chunked sin Content-Length`,
    },
  ];

  protected readonly current = computed(
    () => this.tabs.find((t) => t.id === this.tab()) ?? this.tabs[0],
  );

  protected set(id: TabId): void {
    this.tab.set(id);
  }

  /** Navegación con flechas / Inicio / Fin dentro del tablist. */
  protected onKeydown(event: KeyboardEvent): void {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const count = this.tabs.length;
    // Punto de partida: la pestaña que tiene el foco (no la seleccionada),
    // para que las flechas se comporten como un tablist nativo.
    const focusedId = (event.target as HTMLElement | null)
      ?.closest('[role="tab"]')
      ?.id?.replace('tab-', '');
    const index = Math.max(
      0,
      this.tabs.findIndex((t) => t.id === (focusedId ?? this.tab())),
    );
    let next = -1;

    if (event.key in keys) {
      next = (index + keys[event.key] + count) % count;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = count - 1;
    }

    if (next >= 0) {
      event.preventDefault();
      this.tab.set(this.tabs[next].id);
      const el = document.getElementById('tab-' + this.tabs[next].id);
      el?.focus();
    }
  }
}
