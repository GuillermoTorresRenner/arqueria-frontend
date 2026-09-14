import { Link } from 'react-router-dom';
import { CalendarDays, Radio, Users } from 'lucide-react';
import { useAdminTournaments } from '@/hooks/use-tournaments';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TournamentStatus } from '@/types';

const STATUS: Record<
  TournamentStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' }
> = {
  DRAFT: { label: 'Borrador', variant: 'outline' },
  REGISTRATION_OPEN: { label: 'Inscripciones abiertas', variant: 'accent' },
  IN_PROGRESS: { label: 'En curso', variant: 'default' },
  FINISHED: { label: 'Finalizado', variant: 'secondary' },
  CANCELLED: { label: 'Cancelado', variant: 'outline' },
};

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function TournamentsAdminPage() {
  const { data: tournaments, isLoading } = useAdminTournaments();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Torneos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campeonatos, inscripciones, sorteo de grupos y puntuaciones.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 skeleton" />
          ))}
        </div>
      ) : tournaments?.length === 0 ? (
        <p className="state-empty">
          Todavía no hay torneos creados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments?.map((tournament) => {
            const status = STATUS[tournament.status];
            return (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {tournament.status === 'IN_PROGRESS' && (
                      <Radio
                        className="h-3.5 w-3.5 animate-pulse text-accent"
                        aria-label="En vivo"
                      />
                    )}
                  </div>
                  <CardTitle className="mt-2">{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {dateFormatter.format(new Date(tournament.startsAt))}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {tournament._count?.registrations ?? 0} inscritos ·{' '}
                    {tournament._count?.groups ?? 0} grupos
                  </p>
                  {tournament.isPublic && (
                    <Link
                      to={`/torneos/${tournament.slug}`}
                      className="inline-block pt-1 text-primary underline-offset-4 hover:underline"
                    >
                      Ver marcador público
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
