import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { usePublicTournaments } from '@/hooks/use-tournaments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Seo } from '@/components/Seo';
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
  month: 'long',
  year: 'numeric',
});

export function TournamentsPage() {
  const { data: tournaments, isLoading } = usePublicTournaments();

  return (
    <div className="container py-16">
      <Seo
        title="Torneos"
        description="Campeonatos de arquería tradicional del club Galadhrym: calendario, inscripciones y resultados."
        path="/torneos"
      />
      <h1 className="section-title">Torneos</h1>
      <p className="section-lead">
        Campeonatos del club y sus resultados.
      </p>

      {isLoading && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 skeleton" />
          ))}
        </div>
      )}

      {!isLoading && tournaments?.length === 0 && (
        <p className="state-empty mt-10">
          Todavía no hay torneos publicados.
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments?.map((tournament) => {
          const status = STATUS[tournament.status];
          return (
            <Link
              key={tournament.id}
              to={`/torneos/${tournament.slug}`}
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <Badge variant={status.variant} className="w-fit">
                    {status.label}
                  </Badge>
                  <CardTitle className="mt-2">{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {dateFormatter.format(new Date(tournament.startsAt))}
                  </p>
                  {tournament.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {tournament.location}
                    </p>
                  )}
                  {tournament._count && (
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {tournament._count.registrations} inscritos
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
