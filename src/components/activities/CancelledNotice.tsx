import { Ban } from 'lucide-react';
import { CANCELLED_LABEL } from '@/lib/activities';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/types';

/// Etiqueta «Cancelada/o» para calendario y listas
export function CancelledBadge({ type, className }: { type: ActivityType; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground',
        className,
      )}
    >
      <Ban className="h-3.5 w-3.5" aria-hidden="true" />
      {type === 'ACTIVITY' ? 'Cancelada' : 'Cancelado'}
    </span>
  );
}

/// Aviso de cancelación con su causal, para tarjetas y diálogos
export function CancelledNotice({
  type,
  reason,
  className,
}: {
  type: ActivityType;
  reason: string | null;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive',
        className,
      )}
    >
      <p className="flex items-center gap-1.5 font-semibold">
        <Ban className="h-4 w-4" aria-hidden="true" />
        {CANCELLED_LABEL[type]}
      </p>
      {reason && <p className="mt-1 whitespace-pre-line text-foreground/80">{reason}</p>}
    </div>
  );
}
