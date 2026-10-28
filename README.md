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

Estética de terminal: scanlines y grano muy tenues sobre el fondo, hero a dos columnas con una sesión
de `bash` de ejemplo, luces de ventana en los bloques de código, etiquetas de sección `[01]`, reloj UTC
en la barra superior y atajos `t` / `c` / `Esc` indicados en el pie.

Cada sección usa un acento de color propio (menta, ámbar, coral, azul, lima, violeta) sobre una base
verde-pizarra oscura o clara. Sin imágenes: el peso visual lo llevan la tipografía, los degradados y el color.

## Desarrollo

```bash
npm install
npm start          # ng serve · http://localhost:4200
npm run build      # build de producción con SSR
npm run serve:ssr:php2bash   # sirve el build SSR en :4000
```

## Despliegue en GitHub Pages

El sitio se publica en <https://adriangs-77.github.io/php2bash/> mediante el workflow
`.github/workflows/deploy-pages.yml`, que se ejecuta en cada push a `master`:

1. `npm run build:pages` compila la app con `--base-href=/php2bash/` (imprescindible:
   Pages sirve el sitio bajo el prefijo del repositorio, no en la raíz del dominio).
2. Como las rutas de servidor usan `RenderMode.Prerender`, el build genera un
   `index.html` estático ya renderizado en `dist/php2bash/browser/`.
3. El workflow sube **solo** esa carpeta como artefacto de Pages; el bundle de
   servidor (`dist/php2bash/server/`) se ignora porque Pages no ejecuta Node.

Requisito: en *Settings → Pages* el origen debe ser **GitHub Actions**
(`build_type: workflow`), no una rama. Para probar el despliegue a mano:

```bash
npm run build:pages
npx http-server dist/php2bash/browser -o   # o sirve la carpeta bajo /php2bash/
```

## Notas técnicas

- Angular standalone + signals, control de flujo `@if`/`@for`/`@switch`, sin Zone.js.
- SSR con hidratación; la interactividad (tema, paleta accesible, scroll-spy, checklist, portapapeles)
  se inicializa en `afterNextRender` para no romper la hidratación.
- **Paletas para daltonismo** en la barra superior: color original, deuteranopía, protanopía,
  tritanopía y monocromo. Redefinen solo los seis acentos (`--h-*`) siguiendo las recomendaciones de
  Okabe–Ito y Paul Tol; se combinan con el tema claro/oscuro y se guardan en
  `localStorage['php2bash-cvd']`. Los estados críticos mantienen además icono y texto, de modo que
  nunca dependen únicamente del color.
- `allowedHosts: ["*"]` en `angular.json` está pensado para el entorno de preview; **restríngelo**
  a tus dominios reales antes de desplegar en producción.
- Sin dependencias de terceros más allá de Angular y Express.

## Descargo de responsabilidad

Documento informativo elaborado con fuentes públicas el 22 de octubre de 2026. No es un aviso de
seguridad oficial ni sustituye la evaluación de tu equipo. Verifica versiones y enlaces en la fuente
primaria antes de actuar.
