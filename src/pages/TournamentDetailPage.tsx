import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Radio, Swords, Target } from 'lucide-react';
import { useTournamentBySlug } from '@/hooks/use-tournaments';
import { useBracketLive, usePublicBracket } from '@/hooks/use-brackets';
import { useMemberActivities } from '@/hooks/use-activities';
import { useAuthStore } from '@/features/auth-store';
import { cn } from '@/lib/utils';
import { BracketView } from '@/components/bracket/BracketView';
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
  KNOCKDOWN: 'Duelos',
} as const;

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tournament, isLoading, isError } = useTournamentBySlug(slug);
  const { data: bracket } = usePublicBracket(slug);
  const [selected, setSelected] = useState<string | null>(null);
  // El fixture se actualiza solo mientras los jueces cargan resultados
  useBracketLive(tournament?.id);
  // El socio ve resaltados sus enfrentamientos
  const isMember = useAuthStore((s) => s.user?.role === 'MEMBER');
  const { data: mine } = useMemberActivities(isMember);
  const myNumbers =
    mine?.activities
      .find((a) => a.tournament?.slug === slug)
      ?.registrations?.map((r) => r.participant.number) ?? [];

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

      <section className="mt-10 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Fixture</h2>
          {myNumbers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Tu número de participante: <strong>{myNumbers[0]}</strong> (resaltado)
            </p>
          )}
        </div>
        {!tournament.categories?.length ? (
          <p className="state-empty">Las categorías se anunciarán pronto.</p>
        ) : (
          <>
            <div role="tablist" className="flex flex-wrap gap-2">
              {tournament.categories.map((c) => {
                const active = (selected ?? tournament.categories![0].id) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelected(c.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {c.mode === 'KNOCKDOWN' ? (
                      <Swords className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                    {c.name}
                    {/* La modalidad solo si el nombre no la dice ya («Duelos») */}
                    <span className="text-xs font-normal text-muted-foreground">
                      {[c.name !== MODE_LABEL[c.mode] && MODE_LABEL[c.mode], c.scoringFormat?.name]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const id = selected ?? tournament.categories![0].id;
              const category = bracket?.categories.find((c) => c.id === id);
              return category ? (
                <BracketView category={category} highlight={myNumbers} />
              ) : (
                <div className="h-48 skeleton" />
              );
            })()}
            <p className="text-sm text-muted-foreground">
              Eliminación directa: los enfrentamientos de la primera ronda se sortean y los
              ganadores avanzan. El fixture se actualiza en vivo.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
