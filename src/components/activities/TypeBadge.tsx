import { ACTIVITY_TYPES } from '@/lib/activities';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/types';

/// Etiqueta del tipo (Actividad, Evento, Torneo) con su color e icono
export function TypeBadge({ type, className }: { type: ActivityType; className?: string }) {
  const t = ACTIVITY_TYPES[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        t.badge,
        className,
      )}
    >
      <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t.label}
    </span>
  );
}
