import type { RichTextData } from '@/types';

export function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const { title, html } = data as RichTextData;

  return (
    <section className="section">
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        )}
        {html && (
          // El HTML lo escribe un admin autenticado desde el panel, no un
          // visitante anónimo: la superficie de XSS es la del propio equipo.
          <div
            className="space-y-4 text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </section>
  );
}
