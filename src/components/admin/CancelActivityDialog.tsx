import { useState } from 'react';
import { toast } from 'sonner';
import { Ban } from 'lucide-react';
import { useCancelActivity } from '@/hooks/use-activities';
import { apiErrorMessage } from '@/lib/api';
import { ACTIVITY_TYPES, CANCELLED_LABEL } from '@/lib/activities';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ActivityDetail } from '@/types';

/**
 * Cancelar una actividad, evento o torneo con una causal opcional. No se
 * borra: queda en el calendario marcada como cancelada y se puede reactivar.
 */
export function CancelActivityDialog({
  activity,
  onClose,
}: {
  activity: ActivityDetail;
  onClose: () => void;
}) {
  const cancel = useCancelActivity();
  const editing = Boolean(activity.cancelledAt);
  const [reason, setReason] = useState(activity.cancellationReason ?? '');
  const affected =
    activity.type === 'TOURNAMENT'
      ? (activity.tournament?.registrations.length ?? 0)
      : activity._count.attendances;
  // Si se había anunciado a todos, la cancelación también llega a todos
  const audience = activity.notifiedAt
    ? 'todos los socios activos (la actividad se había anunciado)'
    : activity.type === 'TOURNAMENT'
      ? affected === 1
        ? 'la persona inscrita'
        : `las ${affected} personas inscritas`
      : affected === 1
        ? 'el socio que confirmó asistencia'
        : `los ${affected} socios que confirmaron asistencia`;
  const canNotify = !editing && (Boolean(activity.notifiedAt) || affected > 0);
  const [notify, setNotify] = useState(canNotify);
  const kind = ACTIVITY_TYPES[activity.type].label.toLowerCase();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    cancel.mutate(
      { id: activity.id, reason: reason.trim() || undefined, notify: canNotify && notify },
      {
        onSuccess: (saved) => {
          toast.success(editing ? 'Causal actualizada' : CANCELLED_LABEL[activity.type], {
            description: saved.notification
              ? `Avisando por correo a ${saved.notification.recipients === 1 ? '1 socio' : `${saved.notification.recipients} socios`}`
              : undefined,
          });
          onClose();
        },
        onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo cancelar')),
      },
    );
  };

  return (
    <Modal title={editing ? 'Editar causal' : `Cancelar ${kind}`} onClose={onClose} className="max-w-md">
      <form onSubmit={submit} className="space-y-4 text-sm">
        {!editing && (
          <p className="text-muted-foreground">
            «{activity.title}» seguirá en el calendario y en el sitio, marcada como cancelada.
            {activity.type === 'TOURNAMENT' && ' Se cierran las inscripciones.'} Podrás reactivarla
            después.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Causal (opcional)</Label>
          <textarea
            id="cancel-reason"
            rows={3}
            maxLength={1000}
            value={reason}
            placeholder="Suspendida por lluvia: la reagendaremos pronto."
            onChange={(e) => setReason(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <p className="text-xs text-muted-foreground">Los socios la verán junto al aviso de cancelación.</p>
        </div>

        {canNotify && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="block font-medium">Avisar por correo</span>
              <span className="text-muted-foreground">Se enviará a {audience}.</span>
            </span>
          </label>
        )}
        {activity.type === 'TOURNAMENT' &&
          (activity.tournament?.registrations.some((r) => r.status === 'CONFIRMED') ?? false) &&
          !editing && (
            <p className="rounded-md bg-amber-100 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Hay inscritos con el pago confirmado: recuerda gestionar las devoluciones.
            </p>
          )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button type="submit" variant="destructive" disabled={cancel.isPending}>
            <Ban className="h-4 w-4" aria-hidden="true" />
            {cancel.isPending ? 'Guardando…' : editing ? 'Guardar causal' : `Cancelar ${kind}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
