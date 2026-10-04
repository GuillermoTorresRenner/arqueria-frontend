import { CtaLink } from './CtaLink';
import { assetUrl } from '@/lib/assets';
import type { HeroData } from '@/types';

export function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const { title, subtitle, text, ctaLabel, ctaHref, ctaIcon, image } =
    data as HeroData;

  return (
    <section className="surface-hero overflow-hidden border-b border-border/40">
      {/* Fondo del texto: la misma foto desenfocada y velada. Da ambiente sin
          competir con el texto, y como no tiene que verse entera, aquí sí
          puede recortarse (object-cover). */}
      {image && (
        <>
          <img
            src={assetUrl(image)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-brand-ink/75" />
        </>
      )}

      <div className="container relative py-14 md:py-20">
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

      {/* La foto, entera: va bajo el texto y no detrás porque el club usa
          panorámicas muy apaisadas (≈6:1) que, a pantalla completa detrás del
          texto, perdían los laterales. Con object-contain y un alto máximo,
          tampoco se recorta una foto vertical o 16:9. */}
      {image && (
        <div className="container relative pb-12 md:pb-16">
          <img
            src={assetUrl(image)}
            alt=""
            className="block h-auto max-h-[70vh] w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}
