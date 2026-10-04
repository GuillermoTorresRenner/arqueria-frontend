import { useId, useState } from 'react';
import { CtaLink } from '@/components/blocks/CtaLink';
import { Input } from '@/components/ui/input';
import { JOIN_HREF, isJoinHref } from '@/lib/join';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { value: '', label: 'Sin icono' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const SELECT =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Botón de un bloque HERO o CTA. En vez de escribir «#unirse» a mano, se
 * elige la acción: abrir el formulario de inscripción (el mismo de «Súmate al
 * club») o ir a un enlace. La vista previa usa el componente real del sitio.
 */
export function CtaButtonField({
  id,
  label,
  href,
  icon,
  surface,
  onChange,
}: {
  id: string;
  label: string;
  href: string;
  icon: string;
  /// Fondo sobre el que se ve el botón en el sitio, para la vista previa
  surface: 'hero' | 'cta';
  onChange: (patch: { ctaLabel?: string; ctaHref?: string; ctaIcon?: string }) => void;
}) {
  const uid = useId();
  // La acción va en estado propio: al pasar a «enlace» el href queda vacío
  // mientras se escribe, y no debe volver solo a «inscripción». Un bloque sin
  // enlace todavía arranca como inscripción, que es su uso habitual.
  const [mode, setMode] = useState<'join' | 'link'>(
    !href || isJoinHref(href) ? 'join' : 'link',
  );
  const isJoin = mode === 'join';

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          Texto del botón
        </label>
        <Input
          id={id}
          value={label}
          placeholder="Súmate al club"
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Al pulsarlo</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              join: true,
              title: 'Abre la inscripción',
              help: 'El formulario «Súmate al club»; al completarlo se muestra el grupo de WhatsApp.',
            },
            { join: false, title: 'Va a un enlace', help: 'Una página del sitio u otra web.' },
          ].map((option) => (
            <label
              key={String(option.join)}
              className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name={`${uid}-action`}
                checked={isJoin === option.join}
                onChange={() => {
                  setMode(option.join ? 'join' : 'link');
                  onChange({ ctaHref: option.join ? JOIN_HREF : '' });
                }}
                className="mt-0.5 accent-[hsl(var(--primary))]"
              />
              <span>
                <span className="block font-medium">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!isJoin && (
        <div className="space-y-2">
          <label htmlFor={`${uid}-href`} className="text-sm font-medium">
            Enlace
          </label>
          <Input
            id={`${uid}-href`}
            value={href}
            placeholder="https://… o /torneos"
            onChange={(e) => onChange({ ctaHref: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={`${uid}-icon`} className="text-sm font-medium">
          Icono
        </label>
        <select
          id={`${uid}-icon`}
          value={icon}
          onChange={(e) => onChange({ ctaIcon: e.target.value })}
          className={SELECT}
        >
          {ICON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Vista previa</p>
        {/* Solo visual: el botón real no debe reaccionar dentro del editor */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex justify-center rounded-md px-4 py-6',
            surface === 'hero' ? 'surface-hero' : 'bg-secondary',
          )}
        >
          <CtaLink
            href={isJoin ? JOIN_HREF : href || '#'}
            label={label || 'Súmate al club'}
            icon={icon || undefined}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
