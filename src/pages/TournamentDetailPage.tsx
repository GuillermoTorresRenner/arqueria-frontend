import { useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Radio, Target } from 'lucide-react';
import { useLeaderboard, useTournamentBySlug } from '@/hooks/use-tournaments';
import { useLiveScoring } from '@/hooks/use-live-scoring';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { absoluteUrl, SITE } from '@/lib/seo';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
});

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tournament, isLoading, isError } = useTournamentBySlug(slug);
  const { data: leaderboard } = useLeaderboard(tournament?.id);

  // Se suscribe al canal del torneo: el backend empuja el ranking recalculado.
  useLiveScoring(tournament?.id);

  if (isLoading) {
    return (
      <div className="container py-24" aria-busy="true">
        <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (isError || !tournament) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-semibold">Torneo no encontrado</h1>
      </div>
    );
  }

  const isLive = tournament.status === 'IN_PROGRESS';

  // Schema.org SportsEvent: permite que Google muestre el torneo como evento
  // (fecha, lugar, estado) en los resultados de búsqueda.
  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    description: tournament.description ?? undefined,
    startDate: tournament.startsAt,
    endDate: tournament.endsAt ?? undefined,
    eventStatus:
      tournament.status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Tiro con arco',
    url: absoluteUrl(`/torneos/${tournament.slug}`),
    location: tournament.location
      ? { '@type': 'Place', name: tournament.location }
      : undefined,
    organizer: {
      '@type': 'SportsOrganization',
      name: SITE.name,
      url: SITE.url,
    },
  };

  return (
    <div className="container py-16">
      <Seo
        title={tournament.name}
        description={
          tournament.description ??
          `Resultados y clasificación de ${tournament.name}${
            tournament.location ? ` en ${tournament.location}` : ''
          }.`
        }
        path={`/torneos/${tournament.slug}`}
        type="article"
        jsonLd={eventJsonLd}
      />
      <header className="border-b pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="section-title">
            {tournament.name}
          </h1>
          {isLive && (
            <Badge variant="accent" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" aria-hidden="true" />
              En vivo
            </Badge>
          )}
        </div>

        {tournament.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{tournament.description}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {dateFormatter.format(new Date(tournament.startsAt))}
          </span>
          {tournament.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {tournament.location}
            </span>
          )}
          {tournament.scoringFormat && (
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" aria-hidden="true" />
              {tournament.scoringFormat.name}
            </span>
          )}
        </div>
      </header>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Clasificación</h2>
          {leaderboard && leaderboard.entries.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Actualizado a las {timeFormatter.format(new Date(leaderboard.updatedAt))}
            </p>
          )}
        </div>

        {!leaderboard || leaderboard.entries.length === 0 ? (
          <p className="state-empty mt-6">
            Todavía no hay puntajes registrados.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="table-base">
              <caption className="sr-only">
                Clasificación del torneo {tournament.name}
              </caption>
              <thead className="table-head">
                <tr>
                  <th scope="col" className="table-th w-16">#</th>
                  <th scope="col" className="table-th">Arquero</th>
                  <th scope="col" className="table-th hidden text-right sm:table-cell">Series</th>
                  <th scope="col" className="table-th hidden text-right sm:table-cell">X</th>
                  <th scope="col" className="table-th hidden text-right sm:table-cell">10s</th>
                  <th scope="col" className="table-th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.entries.map((entry) => (
                  <tr
                    key={entry.memberId}
                    className={cn('table-row', entry.position <= 3 && 'font-medium')}
                  >
                    <td className="table-td table-num">
                      {entry.position}
                    </td>
                    <td className="table-td">
                      <span>{entry.name}</span>
                      {entry.categories.length > 0 && (
                        <span className="block text-xs text-muted-foreground sm:ml-2 sm:inline">
                          {entry.categories.join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="table-td table-num hidden text-right sm:table-cell">
                      {entry.endsShot}
                    </td>
                    <td className="table-td table-num hidden text-right sm:table-cell">
                      {entry.innerTens}
                    </td>
                    <td className="table-td table-num hidden text-right sm:table-cell">
                      {entry.tens}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums">
                      {entry.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
