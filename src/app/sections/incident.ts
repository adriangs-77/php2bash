import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../ui/code';

@Component({
  selector: 'app-incident',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  templateUrl: './incident.html',
})
export class Incident {
  protected readonly pseudo = `// zend_hash.c — _zend_hash_str_add_or_update_i(), simplificado
idx = ht->nNumUsed++;          // 1. el bucket ya "existe" para el teardown
ht->nNumOfElements++;

p = ht->arData + idx;
p->key = zend_string_init(str, len, persistent);  // 2. aquí puede saltar el fatal por OOM

p->h = ZSTR_H(p->key) = h;      // 3. inicialización que nunca llega a ejecutarse
ZVAL_COPY_VALUE(&p->val, pData);

// ...y en el apagado de la petición:
for (p = ht->arData; p < ht->arData + ht->nNumUsed; p++) {
    i_zval_ptr_dtor(&p->val);   // 4. se destruye un bucket NO inicializado
    if (p->key) zend_string_release(p->key);
}`;

  protected readonly trigger = `POST /cualquier-ruta-publica HTTP/1.1
Content-Type: multipart/form-data; boundary=----x
Transfer-Encoding: chunked          <-- sin Content-Length fiable

------x
Content-Disposition: form-data; name="files[a][b][c][d][e]"
filename=""                          <-- carga vacía: no cuenta para max_file_uploads
                                     <-- y genera 6 entradas en $_FILES
------x--`;

  protected readonly fpm = `# El worker sobrevive o muere, y eso cambia el ataque
mod_php  → php_request_shutdown() se ejecuta igual  → se consume el estado corrupto
PHP-FPM  → si falla el arranque, el hijo termina    → el estado se descarta
           pero si el fatal ocurre DESPUÉS del arranque, el worker sigue vivo
           y la siguiente petición hereda la memoria liberada`;
}
