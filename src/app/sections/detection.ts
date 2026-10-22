import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../ui/code';

@Component({
  selector: 'app-detection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './detection.html',
})
export class Detection {
  protected readonly hunt = `# 1 · Fatales por memoria: el disparador de ambas CVE
grep -rhE 'Allowed memory size of [0-9]+ bytes exhausted' \\
  /var/log/php*-fpm*.log* /var/log/nginx/ /var/log/apache2/ /var/log/httpd/ 2>/dev/null | tail -n 60

# 2 · El fatal ocurrió ANTES de ejecutar script (arranque de la petición)
grep -rh 'in Unknown on line 0' /var/log/php* /var/log/nginx /var/log/apache2 2>/dev/null | tail -n 40

# 3 · Workers muertos por señal: huella de un exploit que falla
grep -rhE 'exited on signal (6|11)|SIGSEGV|SIGBUS|exit signal Segmentation fault' \\
  /var/log/php*-fpm*.log* /var/log/apache2/ /var/log/httpd/ 2>/dev/null | tail -n 40
journalctl -k --since '2026-10-17' 2>/dev/null | grep -iE 'segfault|php'

# 4 · Sesiones corruptas o ilegibles
grep -rhE 'Failed to decode session object|illegal session' /var/log/php* 2>/dev/null | tail -n 40

# 5 · Ráfagas de 500 por cliente (nginx/Apache combined)
awk '$6 ~ /"POST/ && $9 == 500 {print $1}' /var/log/nginx/access.log 2>/dev/null \\
  | sort | uniq -c | sort -rn | head -n 25

# 6 · Estallidos de OOM agrupados por hora
grep -rh 'Allowed memory size' /var/log/php*-fpm*.log* 2>/dev/null \\
  | awk '{print $1" "$2}' | sort | uniq -c | sort -rn | head -n 20`;

  protected readonly host = `# Archivos PHP donde no deberían existir
find /var/www/twintech/current/public /var/www/twintech/current/storage \\
  -type f -name '*.php*' ! -name 'index.php' 2>/dev/null

# Integridad del despliegue
cd /var/www/twintech/current && git status --porcelain

# Modificados desde el inicio de la ventana de exposición
find /var/www -type f -name '*.php' -newermt '2026-10-17' -printf '%TY-%Tm-%Td %TH:%TM %p\\n' 2>/dev/null | sort | tail -n 60

# ¿Hay una shell esperando?
ps -u www-data -o pid,ppid,lstart,cmd 2>/dev/null | grep -vE 'php-fpm|apache|nginx'
ss -tpn state established 2>/dev/null | grep -E 'php|apache|frankenphp'

# Persistencia
crontab -l -u www-data 2>/dev/null; ls -la /var/spool/cron/crontabs/ 2>/dev/null
find /tmp /var/tmp /dev/shm -xdev -type f \\( -name '*.php' -o -name '*.sh' -o -perm -u+x \\) 2>/dev/null | head -n 40

# Claves y accesos
ls -la /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null
last -ai | head -n 30`;

  protected readonly rotate = `# Secretos que un RCE como www-data podría haber leído
#   .env                 → DB_PASSWORD, REDIS_PASSWORD, MAIL_PASSWORD, claves AWS/Stripe
#   config/*.php         → credenciales embebidas, APP_KEY
#   storage/             → logs con datos personales, sesiones, tokens
#   /etc/…               → credenciales de sistema, certificados TLS

# Laravel: cierra sesiones y regenera lo que corresponda
php artisan optimize:clear
php artisan queue:restart
php artisan horizon:terminate

# APP_KEY: cambiarla invalida sesiones y hace ilegibles los datos cifrados
# con la clave anterior. Planifica el re-cifrado ANTES de rotarla.
php artisan key:generate --show     # genera, no aplica

# Rotación de credenciales: hazlo desde un host limpio, no desde el comprometido.
# Revisa también tokens de CI/CD, webhooks y claves de despliegue.`;
}
