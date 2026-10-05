import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, CalendarDays, Check, X } from 'lucide-react';
import { useMemberActivities, useSetAttendance } from '@/hooks/use-activities';
import { apiErrorMessage } from '@/lib/api';
import { capitalize } from '@/lib/activities';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { TournamentRegistrationBox } from '@/components/activities/TournamentRegistrationBox';
import { Button } from '@/components/ui/button';
import type { MemberActivity } from '@/types';

const monthTitle = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

/// Calendario del socio en tarjetas, agrupadas por mes, con la confirmación
/// de asistencia (que el admin ve en el panel).
export function MemberActivities() {
  const { data, isLoading, isError } = useMemberActivities();
  const ref = useRef<HTMLElement>(null);

  // El correo de aviso enlaza a /mi-cuenta#actividades
  useEffect(() => {
    if (data && window.location.hash === '#actividades') {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [data]);

  const groups = new Map<string, MemberActivity[]>();
  for (const a of data?.activities ?? []) {
    const key = capitalize(monthTitle.format(new Date(a.startsAt)));
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const confirmed =
    data?.activities.filter((a) => !a.cancelledAt && (a.attending || a.registration)).length ?? 0;

  return (
    <section id="actividades" ref={ref} className="scroll-mt-24" aria-labelledby="member-activities">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="member-activities" className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          Calendario de actividades
        </h2>
        {confirmed > 0 && (
          <p className="text-sm text-muted-foreground">
            Vas a {confirmed === 1 ? '1 actividad' : `${confirmed} actividades`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-56 skeleton" />
          <div className="h-56 skeleton" />
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No pudimos cargar el calendario. Inténtalo de nuevo en unos minutos.
        </p>
      ) : !data?.activities.length ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay actividades agendadas por ahora. Te avisaremos por correo cuando haya una nueva.
        </p>
      ) : (
        <div className="space-y-8">
          {[...groups].map(([month, activities]) => (
            <div key={month}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {month}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    highlight={activity.attending || Boolean(activity.registration)}
                    footer={
                      activity.type === 'TOURNAMENT' && activity.tournament ? (
                        <TournamentRegistrationBox activity={activity} canAttend={data.canAttend} />
                      ) : (
                        <AttendanceButton activity={activity} canAttend={data.canAttend} />
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AttendanceButton({ activity, canAttend }: { activity: MemberActivity; canAttend: boolean }) {
  const setAttendance = useSetAttendance();

  if (!canAttend) {
    return (
      <p className="text-xs text-muted-foreground">
        Solo los socios activos pueden confirmar asistencia.
      </p>
    );
  }

  const toggle = (attending: boolean) =>
    setAttendance.mutate(
      { id: activity.id, attending },
      {
        onSuccess: () =>
          toast.success(attending ? '¡Te esperamos!' : 'Asistencia cancelada', {
            description: attending ? `Confirmaste tu asistencia a «${activity.title}».` : undefined,
          }),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar tu respuesta')),
      },
    );

  if (activity.attending) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Check className="h-4 w-4" aria-hidden="true" />
          Asistencia confirmada
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggle(false)}
          disabled={setAttendance.isPending}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          No podré ir
        </Button>
      </div>
    );
  }

  return (
    <Button className="w-full" onClick={() => toggle(true)} disabled={setAttendance.isPending}>
      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
      Confirmar asistencia
    </Button>
  );
}
