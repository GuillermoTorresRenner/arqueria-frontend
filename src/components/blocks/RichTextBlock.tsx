import DOMPurify from 'dompurify';
import type { RichTextData } from '@/types';

/// El editor abre los enlaces en otra pestaña (con rel="noopener"); DOMPurify
/// quita `target` por defecto, así que se permite explícitamente.
const sanitize = (html: string) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

export function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const { title, html } = data as RichTextData;

  return (
    <section className="section">
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        )}
        {html && (
          // El HTML lo escribe el admin, pero se sanea igual: una sesión de
          // admin robada no debe poder inyectar scripts a todos los visitantes.
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{ __html: sanitize(html) }}
          />
        )}
      </div>
    </section>
  );
}
