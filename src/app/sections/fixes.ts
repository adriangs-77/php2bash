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

  protected readonly nginx = `# Cada bloque server que hable con PHP. Es una medida PARCIAL y rompe subidas.
if ($http_content_type ~* "multipart/form-data") {
    return 403;
}

# Mejor aún: límites de tamaño y de partes a nivel de proxy
client_max_body_size 8m;
large_client_header_buffers 4 8k;`;

  protected readonly apache = `# Cada <VirtualHost> que sirva PHP. Medida PARCIAL y rompe subidas.
RewriteEngine On
RewriteCond %{HTTP:Content-Type} multipart/form-data [NC]
RewriteRule ^ - [F]

# Limita también el cuerpo decodificado, no solo el Content-Length
LimitRequestBody 8388608`;

  protected readonly fpm = `; /etc/php/8.3/fpm/pool.d/www.conf  (o el pool de Twinteach)
; Aplica ANTES del parseo de la petición: ini_set() y .user.ini no sirven.
php_admin_flag[session.upload_progress.enabled] = off
php_admin_flag[fatal_error_backtraces] = off        ; solo PHP 8.5
php_admin_value[memory_limit] = -1                  ; quita el límite controlable (¡ojo!)
php_admin_value[post_max_size] = 8M
php_admin_value[upload_max_filesize] = 6M

; Luego: systemctl reload php8.3-fpm  (o restart para recrear workers)`;

  protected readonly waf = `# Ejemplos de lo que ya despliegan los proveedores (no sustituye al parche)
# - Cloudflare: reglas gestionadas para PHP2Shell, incluido el plan gratuito.
# - AWS WAF: reglas gestionadas + límites de tamaño y de partes multipart.
# - Fastly, Imperium, Akamai, Vercel: reglas de emergencia publicadas el 20-21/10.

# Comprobación imprescindible si estás detrás de un CDN:
#  1. Ningún subdominio (staging, direct, ftp) apunte al origen sin proxy.
#  2. El origen solo acepte tráfico de los rangos del CDN.
#  3. El WAF cubra también HTTP/2 y chunked sin Content-Length.`;

  protected readonly debian = `sudo apt update
apt list --upgradable | grep -E '^php'      # ver qué se va a mover
sudo apt install --only-upgrade php8.3-fpm php8.3-cli php8.3-common \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-mysql php8.3-redis

# Fuerza la recreación de los workers (la instalación no basta)
sudo systemctl restart php8.3-fpm`;

  protected readonly rhel = `sudo dnf update --security
# o, si usas módulos/streams:
sudo dnf module update php:8.3
sudo systemctl restart php-fpm

# Comprueba que el paquete incluye las CVE
rpm -q --changelog php-fpm | grep -E '109618|109619'`;

  protected readonly docker = `# Dockerfile del backend (Sail o propio)
FROM php:8.3-fpm            # pasa a 8.4-fpm / 8.3.36+ / imagen con el parche

# Reconstruye SIN caché de la capa base y recrea contenedores
docker compose build --no-cache laravel.test
docker compose up -d --force-recreate

# Verifica el binario DENTRO del contenedor y su hora de arranque
docker compose exec laravel.test php -v
docker compose exec laravel.test php-fpm -v
docker inspect --format '{{.Created}}' $(docker compose ps -q laravel.test)

# Nota: fijar la etiqueta no actualiza un contenedor que ya corre.
# Reconstruye, recrea y vuelve a desplegar la app.`;

  protected readonly restart = `# PHP-FPM (ajusta versión y nombre del servicio)
sudo systemctl restart php8.3-fpm
systemctl status php8.3-fpm --no-pager

# Apache con mod_php: reinicia el proceso padre, no solo recarga
sudo systemctl restart apache2     # o httpd

# Comprueba que el proceso VIVO es nuevo
ps -o lstart= -p $(pgrep -f 'php-fpm: master' | head -1)
php-fpm8.3 -v`;

  protected readonly laravelRestart = `# Octane (FrankenPHP, Swoole o RoadRunner): los workers son de larga vida
php artisan octane:reload
# Si el binario de PHP cambió de verdad:
php artisan octane:stop && php artisan octane:start --server=frankenphp

# Colas y Horizon: que Supervisor levante procesos nuevos
php artisan queue:restart
php artisan horizon:terminate

# Limpia cachés de configuración/OPcache de la app
php artisan optimize:clear`;

  protected set(t: Tab): void {
    this.tab.set(t);
  }
}
