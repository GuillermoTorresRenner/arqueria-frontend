import { useEffect } from 'react';
import { SITE, absoluteUrl, truncate } from '@/lib/seo';

interface SeoProps {
  title?: string;
  description?: string;
  /// Ruta relativa que se usa como canonical (por defecto, la actual).
  path?: string;
  image?: string;
  /// `article` para torneos y noticias; `website` para páginas estables.
  type?: 'website' | 'article';
  /// Páginas que no deben indexarse (panel, login).
  noindex?: boolean;
  /// JSON-LD adicional de la página.
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Actualiza los meta tags de la página.
 *
 * Importante: esto corre en el cliente, así que **solo lo aprovechan los
 * crawlers que ejecutan JavaScript** (Google, Bing). Los crawlers sociales
 * leen el HTML estático de index.html. Por eso los valores por defecto del
 * sitio viven allí y aquí solo se refinan por ruta.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE.name}` : SITE.title;
    const desc = truncate(description ?? SITE.description);
    const url = absoluteUrl(path ?? window.location.pathname);
    const img = absoluteUrl(image ?? SITE.image);

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow',
    );
    setLink('canonical', url);

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:image"]', 'property', 'og:image', img);

    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);
  }, [title, description, path, image, type, noindex]);

  // JSON-LD de la página: se monta y se retira con el componente para que no
  // se acumulen bloques de rutas anteriores.
  useEffect(() => {
    if (!jsonLd) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.page = 'true';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [jsonLd]);

  return null;
}
