# php2bash · Dossier PHP2Shell

Aplicación Angular 22 (SSR) que documenta el incidente **PHP2Shell** — `CVE-2026-109618` y
`CVE-2026-109619` — y su impacto en un stack **Angular + Laravel** como el de Twinteach.

> El nombre `php2bash` es el del proyecto: *PHP → bash*, el objetivo final del exploit.
> En el ecosistema el incidente se conoce como **PHP2Shell**.

## Contenido

1. **Resumen ejecutivo** — qué pasó, cuándo y qué hacer.
2. **Origen y cronología** — por qué se descubrió (auditoría con IA, no una brecha), el precedente
   de 2004, el bug de 2020, la auditoría de 2024, la filtración del 20/10 y la explotación desde el 17/10.
3. **Anatomía del fallo** — modelo de worker, OOM, `longjmp`, *use-after-free* entre peticiones,
   las dos CVE, la fuga de memoria vía `PHPSESSID` y por qué `mod_php` es el escenario más grave.
4. **Versiones afectadas** — tabla por rama, SAPIs y **verificador interactivo** de versiones.
5. **Soluciones** — parcheo por tipo de despliegue, reinicio de workers, mitigaciones temporales
   (nginx, Apache, FPM, WAF) y qué *no* funciona.
6. **Twintech (Angular + Laravel)** — ocho pasos verificables, comandos, script de triage de solo
   lectura y **checklist interactiva** con progreso guardado en el navegador.
7. **Detección** — señales en logs y procesos, comandos, matriz de decisión, respuesta a incidentes
   y rotación de secretos en Laravel.
8. **Contexto** — escala, el papel de la IA, respuesta del ecosistema, ruido/desinformación y lecciones.
9. **FAQ** — doce dudas frecuentes.
10. **Fuentes** — avisos oficiales y análisis técnicos.

## Desarrollo

```bash
npm install
npm start          # ng serve · http://localhost:4200
npm run build      # build de producción con SSR
npm run serve:ssr:php2bash   # sirve el build SSR en :4000
```

## Notas técnicas

- Angular standalone + signals, control de flujo `@if`/`@for`/`@switch`, sin Zone.js.
- SSR con hidratación; la interactividad (tema, scroll-spy, checklist, portapapeles) se inicializa
  en `afterNextRender` para no romper la hidratación.
- `allowedHosts: ["*"]` en `angular.json` está pensado para el entorno de preview; **restríngelo**
  a tus dominios reales antes de desplegar en producción.
- Sin dependencias de terceros más allá de Angular y Express.

## Descargo de responsabilidad

Documento informativo elaborado con fuentes públicas el 22 de octubre de 2026. No es un aviso de
seguridad oficial ni sustituye la evaluación de tu equipo. Verifica versiones y enlaces en la fuente
primaria antes de actuar.
