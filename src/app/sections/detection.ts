import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../ui/code';

@Component({
  selector: 'app-detection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './detection.html',
})
export class Detection {
  protected readonly hunt = `# 1 · Fatales por memoria (el disparador de ambas CVE)
grep -rhE 'Allowed memory size of [0-9]+ bytes exhausted' \\
  /var/log/php*-fpm*.log* /var/log/nginx/ /var/log/apache2/ 2>/dev/null | tail -40

# 2 · Fatal antes de ejecutar script
grep -rh 'in Unknown on line 0' /var/log/php* 2>/dev/null | tail -20

# 3 · Workers muertos por señal
grep -rhE 'exited on signal (6|11)|SIGSEGV' /var/log/php*-fpm*.log* 2>/dev/null | tail -20

# 4 · Ráfagas de 500 por cliente
awk '$9 == 500 {print $1}' /var/log/nginx/access.log 2>/dev/null | sort | uniq -c | sort -rn | head -15

# 5 · Post-explotación: procesos y archivos nuevos
ps -u www-data -o pid,ppid,cmd 2>/dev/null | grep -vE 'php-fpm|apache|nginx'
find /var/www -type f -name '*.php' -newermt '2026-10-17' 2>/dev/null | head -20`;
}
