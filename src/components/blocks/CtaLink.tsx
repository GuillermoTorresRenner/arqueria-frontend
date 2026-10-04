import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons';
import type { ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isJoinHref } from '@/lib/join';
import { useJoinStore } from '@/features/join-store';

/// Iconos que el CMS puede pedir para un botón. Añadir aquí los nuevos.
const ICONS = {
  whatsapp: WhatsAppIcon,
} as const;

interface CtaLinkProps extends Pick<ButtonProps, 'variant' | 'size' | 'className'> {
  href: string;
  label: string;
  icon?: string;
}

/**
 * Botón-enlace de los bloques del CMS. Centraliza dos cosas que es fácil
 * olvidar al repetirlas: resolver el icono por nombre y abrir los enlaces
 * externos con `rel="noopener noreferrer"` (sin él, la página destino puede
 * manipular la nuestra a través de `window.opener`).
 */
export function CtaLink({ href, label, icon, className, ...buttonProps }: CtaLinkProps) {
  const openJoin = useJoinStore((s) => s.openJoin);
  const Icon = icon ? ICONS[icon as keyof typeof ICONS] : undefined;
  const isExternal = /^https?:\/\//i.test(href);
  const classes = cn('h-auto min-h-11 max-w-full whitespace-normal py-2.5 text-center', className);

  // Botones de «unirse»: abren la inscripción en vez de navegar
  if (isJoinHref(href)) {
    return (
      <Button type="button" {...buttonProps} className={classes} onClick={openJoin}>
        {Icon && <Icon className="h-5 w-5" />}
        {label}
      </Button>
    );
  }

  return (
    // El texto lo escribe el admin y puede ser largo: en pantallas estrechas
    // parte línea en vez de desbordar (el Button base es nowrap y alto fijo).
    <Button
      asChild
      {...buttonProps}
      className={classes}
    >
      <a
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {Icon && <Icon className="h-5 w-5" />}
        {label}
      </a>
    </Button>
  );
}
