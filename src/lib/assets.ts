const API_ORIGIN = new URL(import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api')
  .origin;

/// Las imágenes subidas al backend se guardan en el CMS como ruta relativa
/// (`/public/images/x.webp`) para no atar el contenido a un dominio: QA y prod
/// tienen APIs distintas. Aquí se resuelven contra el origen de la API, que no
/// es el del frontend. Las URLs absolutas y los assets propios del front
/// (`/og-image.jpg`) pasan tal cual.
export function assetUrl(src: string): string;
export function assetUrl(src: string | null | undefined): string | undefined;
export function assetUrl(src: string | null | undefined) {
  if (!src) return undefined;
  return src.startsWith('/public/') ? `${API_ORIGIN}${src}` : src;
}
