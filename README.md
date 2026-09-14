# abma-frontend

Sitio público y panel de administración de **Galadhrym** (Asociación de Arquería).
React 19 + Vite + TypeScript + Tailwind + React Query.

> El proyecto se llama `abma` en toda la infraestructura (repos, imágenes Docker,
> contenedores, rutas de la VPS). *Galadhrym* es el nombre público del club.
> Ver [CLAUDE.md](../CLAUDE.md) del workspace.

## Desarrollo

```bash
cp .env.example .env     # apunta a http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

Requiere el backend corriendo (ver [abma-backend](../abma-backend/README.md)).

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # sirve el build de producción
```

## Estructura

```
src/
├── components/
│   ├── blocks/        # render de los bloques del CMS (HERO, CARDS, …)
│   └── ui/            # primitivos shadcn/ui
├── features/          # estado global (auth)
├── hooks/             # React Query + websocket del marcador
├── pages/
│   └── admin/         # panel de administración
├── lib/               # cliente axios, utilidades
└── types/             # tipos compartidos con la API
```

## Estilos y tema

**Todo el color vive en [src/styles/theme.css](src/styles/theme.css).** Es la única
fuente de verdad: tokens de shadcn/ui (`--background`, `--primary`, …) más los
colores de marca (`--brand-vermilion`, `--brand-parchment`, `--brand-sepia`,
`--brand-ink`) y las clases compuestas reutilizables (`.section`, `.table-base`,
`.state-empty`, `.skeleton`, `.surface-hero`…).

No escribas colores literales ni cadenas largas de utilidades en los componentes:
usa los tokens vía Tailwind (`bg-background`, `text-muted-foreground`) o las clases
compuestas. Así un cambio de aspecto se hace en un solo archivo.

La paleta procede del afiche de Instagram del club (@galadhrym_arqueria): rojo
bermellón del emblema, pergamino, sepia de los bordes quemados y tinta negra.
Los 14 pares texto/fondo cumplen **WCAG AA (≥4.5:1)** en ambos temas — si cambias
un valor, revalida el contraste.

### Tema claro / oscuro

- Estado en [src/features/theme-store.ts](src/features/theme-store.ts) (Zustand, persistido).
- Selector sol↔luna en [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx):
  un solo SVG que se transforma (el sol encoge y gira, la luna entra con su mordisco
  vía máscara), no dos iconos cruzados en opacidad.
- Tres estados: `light`, `dark` y `system` (sigue la preferencia del SO).
- `index.html` lleva un script inline que aplica el tema **antes** de pintar: sin él,
  un usuario con tema oscuro vería un destello blanco al cargar.

## SEO

Esta es una SPA sin renderizado en servidor, y eso condiciona el enfoque:

- **Los meta tags base van en [index.html](index.html)**, no en React. Los crawlers
  sociales (WhatsApp, Facebook, LinkedIn) **no ejecutan JavaScript**: solo ven el
  HTML estático. Ahí viven el título, la descripción, Open Graph, Twitter Card y
  el JSON-LD de `SportsOrganization`.
- **[src/components/Seo.tsx](src/components/Seo.tsx)** los refina por ruta. Esto sí
  lo aprovechan Google y Bing, que ejecutan JS. El detalle de torneo añade además
  un JSON-LD de `SportsEvent` (fecha, lugar, estado) para que pueda aparecer como
  evento en los resultados.
- `/admin` y `/login` se marcan `noindex, nofollow`.
- **[public/robots.txt](public/robots.txt)** y `sitemap.xml`. El sitemap se genera en
  cada build (`prebuild`) con [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs):
  toma las rutas estáticas y consulta la API por los torneos publicados. Si la API
  no responde, emite igualmente el sitemap con las rutas estáticas en lugar de
  romper el despliegue.
- **`VITE_SITE_URL`** define el dominio de los canonical. Debe diferir entre QA y
  producción: si ambos entornos declaran el mismo canonical, Google los trata como
  contenido duplicado.

> **Si el posicionamiento llega a ser una prioridad real**, lo que más movería la
> aguja es pasar a renderizado en servidor o prerenderizado estático de las rutas
> públicas. Con la arquitectura actual, los enlaces compartidos en redes muestran
> siempre la tarjeta genérica del sitio, no la del torneo concreto.

## Carrusel de imágenes

El bloque `GALLERY` del CMS se renderiza como carrusel
([src/components/blocks/GalleryBlock.tsx](src/components/blocks/GalleryBlock.tsx)),
sobre el componente `Carousel` de shadcn/ui + Embla. El admin gestiona las imágenes
desde el panel; no hay que tocar código para cambiarlas.

- Autoplay de 5 s que se detiene al pasar el cursor o al interactuar, y que **se
  desactiva por completo** si el visitante pidió menos movimiento
  (`prefers-reduced-motion`).
- Navegación por flechas, indicadores y teclado (← →).
- La primera imagen carga con prioridad (mejor LCP); el resto en diferido.

## Notas

- **Las `VITE_*` se inyectan en build time**, no en runtime: cambiarlas exige
  reconstruir la imagen. Por eso los workflows las pasan como `--build-arg`.
- La autenticación usa una cookie httpOnly; el front no lee el token. Las guardas
  de ruta son solo de conveniencia — la autorización real la aplica el backend.
- Para añadir un tipo de bloque: créalo en `components/blocks/`, regístralo en
  `BlockRenderer.tsx` y añade sus campos en `pages/admin/BlockEditor.tsx`.
- Los iconos de las tarjetas se importan uno a uno en `CardsBlock.tsx`
  (un `import * as` de lucide-react añade ~1 MB al bundle).
