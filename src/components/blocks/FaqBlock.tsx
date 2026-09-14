import type { FaqData } from '@/types';

export function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const { title, items = [] } = data as FaqData;
  if (items.length === 0) return null;

  return (
    <section className="section">
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        )}
        <dl className="divide-y rounded-lg border">
          {items.map((item, index) => (
            <div key={index} className="p-6">
              <dt className="font-semibold">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
