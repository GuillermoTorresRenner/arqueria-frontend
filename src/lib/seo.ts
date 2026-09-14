/**
 * Configuración de SEO del sitio.
 *
 * `SITE_URL` debe apuntar al dominio real en producción: los canonical y las
 * URLs absolutas de Open Graph salen de aquí. Se toma de VITE_SITE_URL para
 * que QA y producción no compartan canonical (Google penaliza el duplicado).
 */
export const SITE = {
  name: 'Galadhrym',
  title: 'Galadhrym — Arquería Tradicional',
  description:
    'Asociación de arquería tradicional Galadhrym: escuela para principiantes, entrenamiento y torneos de tiro con arco.',
  url: import.meta.env.VITE_SITE_URL ?? 'https://galadhrym.cl',
  image: '/og-image.jpg',
  locale: 'es_CL',
  instagram: 'https://www.instagram.com/galadhrym_arqueria/',
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE.url).toString();
}

/// Recorta a la longitud que Google suele mostrar, sin cortar palabras.
export function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).trimEnd() + '…';
}

/// Quita el HTML del contenido del CMS para poder usarlo como description.
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
