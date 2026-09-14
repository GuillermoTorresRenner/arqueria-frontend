import { CtaLink } from './CtaLink';
import type { HeroData } from '@/types';

export function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const { title, subtitle, text, ctaLabel, ctaHref, ctaIcon, image } =
    data as HeroData;

  return (
    <section className="surface-hero overflow-hidden border-b border-border/40">
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}

      {/* Velo cálido: funde la imagen con el tinta del afiche */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-brand-ink/95 via-brand-ink/85 to-brand-sepia/40"
      />

      <div className="container relative py-20 md:py-28">
        <div className="max-w-2xl">
          {subtitle && (
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-brand-parchment/80">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-4xl font-bold tracking-tight text-brand-parchment md:text-6xl">
              {title}
            </h1>
          )}

          {/* Filete rojo, como el que separa la fecha en el afiche */}
          <div className="mt-5 h-[3px] w-24 rounded-full bg-brand-vermilion" />

          {text && (
            <p className="mt-6 text-lg text-brand-parchment/85 md:text-xl">{text}</p>
          )}
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
      </div>
    </section>
  );
}
