import { toast } from 'sonner';
import { BadgeCheck, Clock, Mail, Swords, Target, Ticket, X } from 'lucide-react';
import { useTournamentRegistration } from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { useAuthStore } from '@/features/auth-store';
import { apiErrorMessage } from '@/lib/api';
import { formatCLP } from '@/lib/activities';
import { CLUB_EMAIL } from '@/lib/links';
import { Button } from '@/components/ui/button';
import type { MemberActivity } from '@/types';

/**
 * Inscripción del socio a un torneo, categoría por categoría: cada una se
 * paga y se confirma por separado, con el mismo número de participante.
 * Mientras alguna está pendiente se muestran los datos para transferir.
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
  const mine = activity.registrations ?? [];
  const number = mine[0]?.participant.number;
  const pending = mine.filter((r) => r.status === 'PENDING');
  const payment = tournament.paymentInfo;

  const closed =
    tournament.status !== 'REGISTRATION_OPEN' ||
    Boolean(tournament.registrationEnd && new Date(tournament.registrationEnd) < new Date());
  // El cupo cuenta arqueros: quien ya participa puede sumar categorías
  const full =
    number === undefined &&
    tournament.maxParticipants != null &&
    tournament._count.participants >= tournament.maxParticipants;

  const register = async (category: { id: string; name: string }) => {
    const ok = await confirm({
      title: `¿Inscribirte en ${category.name}?`,
      description: `${activity.title}. Quedarás preinscrito y te enviaremos por correo los datos para transferir. La inscripción se confirma cuando verifiquemos el comprobante de pago.`,
      confirmLabel: 'Preinscribirme',
    });
    if (!ok) return;
    registration.mutate(
      { id: activity.id, categoryId: category.id, register: true },
      {
        onSuccess: (r) =>
          toast.success(`¡Preinscripción en ${category.name} registrada!`, {
            description: [
              r.number ? `Tu número de participante es el ${r.number}.` : '',
              r.emailSent
                ? 'Te enviamos un correo con los datos de pago.'
                : 'No pudimos enviarte el correo: abajo tienes los datos de pago.',
            ].join(' '),
            duration: 8000,
          }),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo completar la inscripción')),
      },
    );
  };

  const withdraw = async (category: { id: string; name: string }) => {
    const ok = await confirm({
      title: `¿Retirar tu preinscripción en ${category.name}?`,
      description: 'Podrás volver a inscribirte mientras sigan abiertas las inscripciones.',
      confirmLabel: 'Retirar',
      tone: 'danger',
    });
    if (!ok) return;
    registration.mutate(
      { id: activity.id, categoryId: category.id, register: false },
      {
        onSuccess: () => toast.success('Preinscripción retirada'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo retirar')),
      },
    );
  };

  if (!mine.length && !canAttend) {
    return (
      <p className="text-xs text-muted-foreground">Solo los socios activos pueden inscribirse.</p>
    );
  }
  if (!mine.length && (closed || full)) {
    return (
      <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
        {closed ? 'Inscripciones cerradas' : 'Cupos completos'}
      </p>
    );
  }

  const name = [user?.name, user?.surname].filter(Boolean).join(' ');
  const subject = `Comprobante de pago · ${activity.title} · ${pending
    .map((r) => r.category.name)
    .join(', ')} · N.º ${number} ${name}`;
  const bank = [
    ['Banco', payment?.bankName],
    ['Tipo de cuenta', payment?.accountType],
    ['Número', payment?.accountNumber],
    ['Titular', payment?.holderName],
    ['RUT', payment?.holderRut],
    ['Correo', payment?.holderEmail],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-3 text-sm">
      {number !== undefined && (
        <p className="flex items-center gap-2 font-medium">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold tabular-nums text-primary-foreground">
            {number}
          </span>
          Tu número de participante
        </p>
      )}

      <ul className="divide-y rounded-md border">
        {tournament.categories.map((category) => {
          const r = mine.find((x) => x.category.id === category.id);
          const Icon = category.mode === 'KNOCKDOWN' ? Swords : Target;
          return (
            <li key={category.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 font-medium">{category.name}</span>
              {r?.status === 'CONFIRMED' ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Inscrito
                </span>
              ) : r?.status === 'PENDING' ? (
                <span className="flex items-center gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Pendiente de pago
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => withdraw(category)}
                    disabled={registration.isPending}
                    aria-label={`Retirarme de ${category.name}`}
                    title="Retirarme"
                    className="h-7 px-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </span>
              ) : closed || full || !canAttend ? (
                <span className="text-xs text-muted-foreground">
                  {closed ? 'Cerrada' : full ? 'Sin cupo' : 'No disponible'}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => register(category)}
                  disabled={registration.isPending}
                >
                  <Ticket className="h-4 w-4" aria-hidden="true" />
                  Inscribirme
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {pending.length > 0 && (
        <div className="space-y-3 rounded-md border border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/30">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Falta el comprobante de pago
            {pending.length > 1 ? ` de ${pending.length} categorías` : ` de ${pending[0].category.name}`}
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
          <Button asChild size="sm">
            <a href={`mailto:${CLUB_EMAIL}?subject=${encodeURIComponent(subject)}`}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Enviar comprobante
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Adjunta el comprobante en un correo a {CLUB_EMAIL}. Te avisaremos al confirmar cada
            inscripción.
          </p>
        </div>
      )}
    </div>
  );
}
