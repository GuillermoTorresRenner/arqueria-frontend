import { useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Radio, Swords, Target } from 'lucide-react';
import { useTournamentBySlug } from '@/hooks/use-tournaments';
import { Badge } from '@/components/ui/badge';
import { Seo } from '@/components/Seo';
import { absoluteUrl, SITE } from '@/lib/seo';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const MODE_LABEL = {
  SCORE: 'Puntaje',
  KNOCKDOWN: 'Duelos con dianas abatibles',
} as const;

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tournament, isLoading, isError } = useTournamentBySlug(slug);

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
          `Categorías y enfrentamientos de ${tournament.name}${
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
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Categorías</h2>
        {!tournament.categories?.length ? (
          <p className="state-empty mt-6">Las categorías se anunciarán pronto.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {tournament.categories.map((category) => (
              <li key={category.id} className="rounded-lg border p-4">
                <p className="flex items-center gap-2 font-semibold">
                  {category.mode === 'KNOCKDOWN' ? (
                    <Swords className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                  {category.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {MODE_LABEL[category.mode]}
                  {category.scoringFormat ? ` · ${category.scoringFormat.name}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Los enfrentamientos se sortean al comenzar el torneo. Desde ese momento, el fixture de
          cada categoría se publica aquí y se actualiza en vivo.
        </p>
      </section>
    </div>
  );
}
