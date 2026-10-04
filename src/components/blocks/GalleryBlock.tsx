import { useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { assetUrl } from '@/lib/assets';
import type { GalleryData } from '@/types';

/**
 * Carrusel de imágenes del club. Las imágenes vienen del CMS, así que el admin
 * las gestiona desde el panel sin tocar código.
 *
 * El autoplay se desactiva si el visitante pidió menos movimiento
 * (prefers-reduced-motion) y se detiene al pasar el cursor o al interactuar.
 */
export function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const { title, images = [] } = data as GalleryData;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  );

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  if (images.length === 0) return null;

  // Ocupa el mismo ancho que el resto de bloques: varias fotos por vista para
  // que no midan 800 px de alto. Con una o dos se reparten el ancho entero.
  const perView =
    images.length >= 3 ? 'sm:basis-1/2 lg:basis-1/3' : images.length === 2 ? 'sm:basis-1/2' : '';

  return (
    <section className="section">
      {title && <h2 className="section-title mb-10 text-center">{title}</h2>}

      <Carousel
        setApi={setApi}
        opts={{ loop: images.length > 1, align: 'start', containScroll: 'trimSnaps' }}
        plugins={prefersReducedMotion ? [] : [autoplay.current]}
        className="w-full"
        aria-label={title ?? 'Galería de imágenes'}
      >
        <CarouselContent className="-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className={cn('pl-4', perView)}>
              <figure className="overflow-hidden rounded-lg border bg-muted">
                <img
                  src={assetUrl(image.src)}
                  alt={image.alt ?? ''}
                  onError={(e) => {
                    // Una imagen rota no debe dejar un hueco: se oculta y el
                    // fondo del contenedor mantiene la proporción.
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                  /* La primera imagen entra en el viewport: cargarla con
                     prioridad mejora el LCP; el resto se difiere. */
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  width={1200}
                  height={800}
                  className={cn(
                    'aspect-[3/2] w-full',
                    // Una sola foto ocupa todo el ancho: se muestra entera en
                    // un marco apaisado en vez de recortarla (las fotos del
                    // club no siempre son horizontales).
                    images.length === 1 ? 'object-contain md:aspect-[21/9]' : 'object-cover',
                  )}
                />
                {image.alt && (
                  <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                    {image.alt}
                  </figcaption>
                )}
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

        {count > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`Ir a la imagen ${index + 1} de ${count}`}
              aria-current={index === current}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                index === current
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70',
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
