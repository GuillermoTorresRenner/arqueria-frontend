import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import type { RichTextData } from '@/types';

/// El editor abre los enlaces en otra pestaña (con rel="noopener"); DOMPurify
/// quita `target` por defecto, así que se permite explícitamente.
const sanitize = (html: string) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

export function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const { title, html } = data as RichTextData;

  return (
    <section className="section">
      {/* Mismo ancho que el resto de bloques; en escritorio, título a la
          izquierda y texto a la derecha para que las líneas no pasen de una
          medida cómoda de lectura. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        {title && (
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        )}
        {html && (
          // El HTML lo escribe el admin, pero se sanea igual: una sesión de
          // admin robada no debe poder inyectar scripts a todos los visitantes.
          <div
            className={cn('rich-text', !title && 'lg:col-start-2')}
            dangerouslySetInnerHTML={{ __html: sanitize(html) }}
          />
        )}
      </div>
    </section>
  );
}
