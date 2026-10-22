# php2bash · Dossier PHP2Shell

Aplicación Angular 22 (SSR) que documenta el incidente **PHP2Shell** — `CVE-2026-109618` y
`CVE-2026-109619` — y su impacto en un stack **Angular + Laravel** como el de Twinteach.

> El nombre `php2bash` es el del proyecto: *PHP → bash*, el objetivo final del exploit.
> En el ecosistema el incidente se conoce como **PHP2Shell**.

## Contenido (formato breve)

1. **Resumen** — qué pasó, a quién afecta y qué hacer.
2. **Origen y cronología** — 2012 → agosto 2026 → 17–22 de octubre.
3. **Anatomía del fallo** — OOM, estado obsoleto y las dos CVE.
4. **Versiones** — tabla por rama + **verificador interactivo**.
5. **Soluciones** — parcheo, reinicio y mitigaciones en pestañas.
6. **Twintech (Angular + Laravel)** — seis pasos, comandos, script de triage y **checklist**.
7. **Detección** — señales, comandos y matriz de decisión.
8. **Contexto** — escala, IA y lecciones.
9. **FAQ** — siete dudas rápidas.
10. **Fuentes**.

Cada sección usa un acento de color propio (menta, ámbar, coral, azul, lima, violeta) sobre una base
verde-pizarra oscura o clara. Sin imágenes: el peso visual lo llevan la tipografía, los degradados y el color.

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
