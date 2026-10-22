import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CodeBlock } from '../ui/code';

type Tab = 'nginx' | 'apache' | 'fpm' | 'waf';

@Component({
  selector: 'app-fixes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './fixes.html',
})
export class Fixes {
  protected readonly tab = signal<Tab>('nginx');

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

  protected readonly nginx = `# Parcial: rompe subidas. Quítalo al parchear.
if ($http_content_type ~* "multipart/form-data") {
    return 403;
}
client_max_body_size 8m;`;

  protected readonly apache = `# Parcial
RewriteEngine On
RewriteCond %{HTTP:Content-Type} multipart/form-data [NC]
RewriteRule ^ - [F]
LimitRequestBody 8388608`;

  protected readonly fpm = `; Pool de FPM (aplica antes de parsear la petición)
php_admin_flag[session.upload_progress.enabled] = off
php_admin_flag[fatal_error_backtraces] = off   ; solo 8.5
php_admin_value[memory_limit] = -1             ; quita el límite controlable
php_admin_value[post_max_size] = 8M`;

  protected readonly waf = `# Reglas de emergencia ya publicadas (no sustituyen al parche):
# Cloudflare · AWS WAF · Fastly · Imperva · Akamai · Vercel
#
# Comprueba siempre:
#  - ningún subdominio (staging, direct) apunta al origen sin proxy
#  - el origen solo acepta tráfico del CDN
#  - las reglas cubren HTTP/2 y chunked sin Content-Length`;

  protected set(t: Tab): void {
    this.tab.set(t);
  }
}
