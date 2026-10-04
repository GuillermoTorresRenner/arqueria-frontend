import { cn } from '@/lib/utils';

/// Emblema (las flechas y la lagartija) sin texto. Para tamaños de icono:
/// header, admin. Da el alto con `h-*`; el ancho sale del aspect-ratio.
export function LogoEmblem({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('logo-emblem', className)} />;
}

/// Logo completo con «GALADHRYM · ARQUERIA TRADICIONAL». Lleva el nombre en
/// la propia imagen, así que se anuncia como imagen con texto alternativo.
export function LogoFull({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Galadhrym, arquería tradicional"
      className={cn('logo-full', className)}
    />
  );
}
