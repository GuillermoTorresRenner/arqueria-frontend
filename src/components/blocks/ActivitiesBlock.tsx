import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useUpcomingActivities } from '@/hooks/use-activities';
import { useAuthStore } from '@/features/auth-store';
import { useJoinStore } from '@/features/join-store';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { Button } from '@/components/ui/button';
import type { ActivitiesData } from '@/types';

/// Bloque «Próximas actividades»: el título lo edita el admin en el CMS y las
/// actividades salen del calendario del panel.
export function ActivitiesBlock({ data }: { data: Record<string, unknown> }) {
  const { title, text } = data as ActivitiesData;
  const { data: activities, isLoading, isError } = useUpcomingActivities(6);
  const user = useAuthStore((s) => s.user);
  const openJoin = useJoinStore((s) => s.openJoin);

  // Un fallo del calendario no debe dejar un hueco roto en la portada
  if (isError) return null;

  return (
    <section className="section" id="actividades" aria-labelledby="activities-title">
      <div className="mb-10 text-center">
        <h2 id="activities-title" className="section-title">
          {title || 'Próximas actividades'}
        </h2>
        {text && <p className="section-lead mx-auto max-w-2xl">{text}</p>}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 skeleton" />
          ))}
        </div>
      ) : !activities?.length ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Pronto publicaremos las próximas actividades del club.
        </p>
      ) : (
        <>
          {/* Centradas: con una o dos actividades no quedan pegadas a la izquierda */}
          <div className="flex flex-wrap justify-center gap-6">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc((100%-3rem)/3)]"
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:justify-center">
            {user?.role === 'MEMBER' ? (
              <Button asChild>
                <Link to="/mi-cuenta#actividades">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Confirmar mi asistencia
                </Link>
              </Button>
            ) : user ? null : (
              <>
                <span>
                  ¿Eres socio?{' '}
                  <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                    Inicia sesión
                  </Link>{' '}
                  para confirmar tu asistencia.
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <button
                  type="button"
                  onClick={openJoin}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Súmate al club
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
