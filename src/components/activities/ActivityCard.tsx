import { useState, type ReactNode } from 'react';
import DOMPurify from 'dompurify';
import { BookOpen, Clock, MapPin, PlayCircle, Ticket, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ACTIVITY_TYPES,
  formatCLP,
  formatDateTime,
  formatDay,
  formatTimeRange,
  mapUrl,
  youtubeId,
} from '@/lib/activities';
import { cn } from '@/lib/utils';
import type { PublicActivity } from '@/types';
import { ActivityWeatherPanel } from './WeatherInfo';
import { TypeBadge } from './TypeBadge';
import { TournamentInfoDialog } from './TournamentInfoDialog';
import { CancelledBadge, CancelledNotice } from './CancelledNotice';

const sanitize = (html: string) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

const monthShort = new Intl.DateTimeFormat('es-CL', { month: 'short' });

/**
 * Tarjeta de una actividad: fecha, horario, lugar, pronóstico y, plegadas,
 * las recomendaciones. La usan el home y el área de socios; `footer` lleva
 * la acción de cada contexto (confirmar asistencia, sumarse al club…).
 */
export function ActivityCard({
  activity,
  footer,
  highlight = false,
}: {
  activity: PublicActivity;
  footer?: ReactNode;
  /// Resalta la tarjeta (p. ej. cuando el socio ya confirmó)
  highlight?: boolean;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const start = new Date(activity.startsAt);
  const { place, tournament } = activity;
  const attendees = activity._count.attendances;
  const kind = ACTIVITY_TYPES[activity.type];
  const cancelled = Boolean(activity.cancelledAt);
  const hasInfo = Boolean(
    tournament &&
      (tournament.rules || tournament.documents.length > 0 || youtubeId(tournament.youtubeUrl)),
  );

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden border-l-4 transition-shadow hover:shadow-md',
        cancelled ? 'border-l-destructive bg-muted/30' : kind.stripe,
        highlight && !cancelled && 'ring-1 ring-primary/40',
      )}
    >
      <div className="flex gap-4 p-5">
        {/* Fecha tipo calendario de pared */}
        <div
          className="flex w-14 shrink-0 flex-col items-center self-start rounded-md border bg-secondary/60 py-1.5 text-center"
          aria-hidden="true"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {monthShort.format(start).replace('.', '')}
          </span>
          <span className="text-2xl font-bold leading-none">{start.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <TypeBadge type={activity.type} />
            {cancelled && <CancelledBadge type={activity.type} />}
          </div>
          <h3
            className={cn(
              'text-lg font-semibold leading-snug',
              cancelled && 'text-muted-foreground line-through decoration-destructive',
            )}
          >
            {activity.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatDay(start)}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {formatTimeRange(activity.startsAt, activity.endsAt)}
            </li>
            {place && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <a
                    href={mapUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {place.name}
                  </a>
                  {place.address && <span className="block text-xs">{place.address}</span>}
                </span>
              </li>
            )}
            {!tournament && attendees > 0 && (
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                {attendees === 1 ? '1 socio confirmado' : `${attendees} socios confirmados`}
              </li>
            )}
            {tournament && tournament.fees.length > 0 && (
              <li className="flex items-start gap-2">
                <Ticket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {tournament.fees.map((f) => (
                    <span key={f.label} className="block">
                      {f.label}: <span className="font-medium text-foreground">{formatCLP(f.amount)}</span>
                    </span>
                  ))}
                </span>
              </li>
            )}
            {tournament && (tournament.registrationEnd || tournament.maxParticipants) && (
              <li className="flex items-start gap-2 text-xs">
                <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {tournament.registrationEnd &&
                    `Inscripciones hasta ${formatDateTime(tournament.registrationEnd).toLowerCase()}`}
                  {tournament.registrationEnd && tournament.maxParticipants && ' · '}
                  {tournament.maxParticipants &&
                    `${tournament._count.registrations}/${tournament.maxParticipants} cupos`}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        {cancelled ? (
          <CancelledNotice type={activity.type} reason={activity.cancellationReason} />
        ) : (
          <ActivityWeatherPanel activity={activity} compact />
        )}

        {activity.recommendations && (
          <details className="group rounded-md border bg-secondary/30 text-sm">
            <summary className="cursor-pointer select-none px-3 py-2 font-medium marker:text-muted-foreground">
              Recomendaciones
            </summary>
            <div
              className="rich-text border-t px-3 py-2 text-sm"
              dangerouslySetInnerHTML={{ __html: sanitize(activity.recommendations) }}
            />
          </details>
        )}

        {hasInfo && tournament && (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-2 rounded-md border bg-secondary/30 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
          >
            {youtubeId(tournament.youtubeUrl) ? (
              <PlayCircle className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
            {youtubeId(tournament.youtubeUrl) ? 'Bases, reglamento y video' : 'Bases y reglamento'}
          </button>
        )}

        {/* Cancelada: no hay nada que confirmar ni inscribir */}
        {footer && !cancelled && <div className="mt-auto pt-1">{footer}</div>}
      </div>

      {infoOpen && tournament && (
        <TournamentInfoDialog
          activity={activity}
          tournament={tournament}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </Card>
  );
}
