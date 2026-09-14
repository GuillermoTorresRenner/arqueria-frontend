import { CtaLink } from './CtaLink';
import type { CtaData } from '@/types';

export function CtaBlock({ data }: { data: Record<string, unknown> }) {
  const { title, text, ctaLabel, ctaHref, ctaIcon } = data as CtaData;

  return (
    <section className="section">
      <div className="rounded-lg border bg-secondary px-6 py-12 text-center md:px-12">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        )}
        {text && <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{text}</p>}
        {ctaLabel && ctaHref && (
          <CtaLink
            href={ctaHref}
            label={ctaLabel}
            icon={ctaIcon}
            size="lg"
            className="mt-8"
          />
        )}
      </div>
    </section>
  );
}
