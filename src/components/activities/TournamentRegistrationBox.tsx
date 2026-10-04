import { toast } from 'sonner';
import { BadgeCheck, Clock, Mail, Ticket, X } from 'lucide-react';
import { useTournamentRegistration } from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { useAuthStore } from '@/features/auth-store';
import { apiErrorMessage } from '@/lib/api';
import { formatCLP } from '@/lib/activities';
import { CLUB_EMAIL } from '@/lib/links';
import { Button } from '@/components/ui/button';
import type { MemberActivity } from '@/types';

/**
 * Inscripción del socio a un torneo: preinscribirse, ver los datos de pago
 * mientras está pendiente y enviar el comprobante por correo.
 */
export function TournamentRegistrationBox({
  activity,
  canAttend,
}: {
  activity: MemberActivity;
  canAttend: boolean;
}) {
  const registration = useTournamentRegistration();
  const confirm = useConfirm();
  const user = useAuthStore((s) => s.user);
  const tournament = activity.tournament!;
  const status = activity.registration?.status;
  const payment = tournament.paymentInfo;

  const closed =
    tournament.status !== 'REGISTRATION_OPEN' ||
    (tournament.registrationEnd && new Date(tournament.registrationEnd) < new Date());
  const full =
    tournament.maxParticipants != null &&
    tournament._count.registrations >= tournament.maxParticipants;

  const register = async () => {
    const ok = await confirm({
      title: `¿Inscribirte en «${activity.title}»?`,
      description:
        'Quedarás preinscrito y te enviaremos por correo los datos para transferir. Tu inscripción se confirma cuando verifiquemos el comprobante de pago.',
      confirmLabel: 'Preinscribirme',
    });
    if (!ok) return;
    registration.mutate(
      { id: activity.id, register: true },
      {
        onSuccess: (r) =>
          toast.success('¡Preinscripción registrada!', {
            description: r.emailSent
              ? 'Te enviamos un correo con los datos de pago.'
              : 'No pudimos enviarte el correo: abajo tienes los datos de pago.',
            duration: 8000,
          }),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo completar la inscripción')),
      },
    );
  };

  const withdraw = async () => {
    const ok = await confirm({
      title: '¿Retirar tu preinscripción?',
      description: 'Podrás volver a inscribirte mientras sigan abiertas las inscripciones.',
      confirmLabel: 'Retirar',
      tone: 'danger',
    });
    if (!ok) return;
    registration.mutate(
      { id: activity.id, register: false },
      {
        onSuccess: () => toast.success('Preinscripción retirada'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo retirar')),
      },
    );
  };

  if (status === 'CONFIRMED') {
    return (
      <p className="flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        Inscrito: pago verificado
      </p>
    );
  }

  if (status === 'PENDING') {
    const name = [user?.name, user?.surname].filter(Boolean).join(' ');
    const subject = `Comprobante de pago · ${activity.title} · ${name}`;
    const bank = [
      ['Banco', payment?.bankName],
      ['Tipo de cuenta', payment?.accountType],
      ['Número', payment?.accountNumber],
      ['Titular', payment?.holderName],
      ['RUT', payment?.holderRut],
      ['Correo', payment?.holderEmail],
    ].filter(([, v]) => v);

    return (
      <div className="space-y-3 rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
        <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Preinscrito: falta el comprobante de pago
        </p>
        <details>
          <summary className="cursor-pointer select-none font-medium">Datos para transferir</summary>
          <div className="mt-2 space-y-2">
            {(payment?.fees ?? []).length > 0 && (
              <ul>
                {payment!.fees!.map((f) => (
                  <li key={f.label} className="flex justify-between gap-3">
                    <span>{f.label}</span>
                    <span className="font-semibold tabular-nums">{formatCLP(f.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            {bank.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t pt-2">
                {bank.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="select-all break-all font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {payment?.instructions && (
              <p className="whitespace-pre-line border-t pt-2 text-muted-foreground">
                {payment.instructions}
              </p>
            )}
          </div>
        </details>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild size="sm">
            <a href={`mailto:${CLUB_EMAIL}?subject=${encodeURIComponent(subject)}`}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Enviar comprobante
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={withdraw}
            disabled={registration.isPending}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Retirarme
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjunta el comprobante en un correo a {CLUB_EMAIL}. Te avisaremos al confirmar tu
          inscripción.
        </p>
      </div>
    );
  }

  if (!canAttend) {
    return (
      <p className="text-xs text-muted-foreground">Solo los socios activos pueden inscribirse.</p>
    );
  }
  if (closed || full) {
    return (
      <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
        {full ? 'Cupos completos' : 'Inscripciones cerradas'}
      </p>
    );
  }
  return (
    <Button className="w-full" onClick={register} disabled={registration.isPending}>
      <Ticket className="h-4 w-4" aria-hidden="true" />
      Inscribirme
    </Button>
  );
}
