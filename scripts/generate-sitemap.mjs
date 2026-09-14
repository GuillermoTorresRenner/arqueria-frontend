/**
 * Genera public/sitemap.xml con las rutas estáticas y los torneos publicados.
 *
 * Corre en el build (prebuild). Si la API no responde —por ejemplo al construir
 * la imagen Docker sin red— se emite igualmente el sitemap con las rutas
 * estáticas: es preferible un sitemap parcial a que falle el despliegue.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://galadhrym.cl').replace(/\/$/, '');
const API_URL = process.env.VITE_API_URL ?? '';

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/torneos', changefreq: 'weekly', priority: '0.8' },
];

async function fetchTournaments() {
  if (!API_URL) return [];
  try {
    const res = await fetch(`${API_URL}/tournaments/public`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(
      `[sitemap] No se pudieron leer los torneos (${error.message}). ` +
        'Se genera solo con las rutas estáticas.',
    );
    return [];
  }
}

const tournaments = await fetchTournaments();

const urls = [
  ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: new Date().toISOString() })),
  ...tournaments.map((t) => ({
    loc: `/torneos/${t.slug}`,
    changefreq: t.status === 'IN_PROGRESS' ? 'hourly' : 'monthly',
    priority: '0.7',
    lastmod: new Date(t.startsAt).toISOString(),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const out = path.resolve('public/sitemap.xml');
fs.writeFileSync(out, xml);
console.log(`[sitemap] ${urls.length} URLs → ${out}`);
