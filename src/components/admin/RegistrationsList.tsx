import { toast } from 'sonner';
import { BadgeCheck, Clock, Trash2, Undo2, Users } from 'lucide-react';
import { useDeleteRegistration, useSetRegistrationStatus } from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { CLUB_EMAIL } from '@/lib/links';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TournamentRegistration } from '@/types';

const dateFormat = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const fullName = (r: TournamentRegistration) =>
  [r.member.user.name, r.member.user.surname].filter(Boolean).join(' ') || r.member.user.email;

/**
 * Inscripciones de un torneo. Quien se preinscribe queda pendiente; al llegar
 * el comprobante a {CLUB_EMAIL}, un admin confirma el pago y queda inscrito.
 */
export function RegistrationsList({ registrations }: { registrations: TournamentRegistration[] }) {
  const setStatus = useSetRegistrationStatus();
  const deleteRegistration = useDeleteRegistration();
  const confirm = useConfirm();
  const pending = registrations.filter((r) => r.status === 'PENDING').length;
  const confirmed = registrations.length - pending;

  const confirmPayment = async (r: TournamentRegistration) => {
    const ok = await confirm({
      title: `¿Confirmar el pago de ${fullName(r)}?`,
      description: 'Quedará inscrito y le enviaremos un correo de inscripción confirmada.',
      confirmLabel: 'Confirmar pago',
    });
    if (!ok) return;
    setStatus.mutate(
      { id: r.id, status: 'CONFIRMED' },
      {
        onSuccess: (res) =>
          toast.success(`${fullName(r)} quedó inscrito`, {
            description:
              res.emailSent === false ? 'No se pudo enviar el correo de confirmación.' : undefined,
          }),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo confirmar')),
      },
    );
  };

  const revert = async (r: TournamentRegistration) => {
    const ok = await confirm({
      title: `¿Devolver a ${fullName(r)} a preinscrito?`,
      description: 'Su pago quedará como pendiente de verificar. No se le envía ningún correo.',
      confirmLabel: 'Devolver a pendiente',
    });
    if (!ok) return;
    setStatus.mutate(
      { id: r.id, status: 'PENDING' },
      { onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo actualizar')) },
    );
  };

  const remove = async (r: TournamentRegistration) => {
    const ok = await confirm({
      title: `¿Eliminar la inscripción de ${fullName(r)}?`,
      description:
        r.status === 'CONFIRMED'
          ? 'Ya pagó: recuerda gestionar la devolución si corresponde. No se le avisa por correo.'
          : 'No se le avisa por correo.',
      confirmLabel: 'Eliminar inscripción',
      tone: 'danger',
    });
    if (!ok) return;
    deleteRegistration.mutate(r.id, {
      onSuccess: () => toast.success('Inscripción eliminada'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar')),
    });
  };

  if (!registrations.length) {
    return (
      <p className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Users className="h-6 w-6" aria-hidden="true" />
        Nadie se ha inscrito todavía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {confirmed === 1 ? '1 inscrito' : `${confirmed} inscritos`}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {pending === 1 ? '1 preinscrito' : `${pending} preinscritos`}
        </span>
      </div>
      {pending > 0 && (
        <p className="text-xs text-muted-foreground">
          Los comprobantes llegan a {CLUB_EMAIL}. Al verificarlo, confirma el pago.
        </p>
      )}

      <ul className="divide-y rounded-md border">
        {registrations.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{fullName(r)}</p>
              <p className="text-xs text-muted-foreground">
                Nº {r.member.memberNumber} · {r.member.user.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Preinscrito el {dateFormat.format(new Date(r.createdAt))}
                {r.confirmedAt &&
                  ` · pago confirmado el ${dateFormat.format(new Date(r.confirmedAt))}${
                    r.confirmedBy?.name ? ` por ${r.confirmedBy.name}` : ''
                  }`}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                r.status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
              )}
            >
              {r.status === 'CONFIRMED' ? 'Inscrito' : 'Pendiente de pago'}
            </span>
            <div className="flex gap-1">
              {r.status === 'PENDING' ? (
                <Button size="sm" onClick={() => confirmPayment(r)} disabled={setStatus.isPending}>
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Confirmar pago
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revert(r)}
                  disabled={setStatus.isPending}
                  aria-label={`Devolver a pendiente a ${fullName(r)}`}
                  title="Devolver a pendiente"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(r)}
                aria-label={`Eliminar la inscripción de ${fullName(r)}`}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
