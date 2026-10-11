import { Check, Clock, Lock, Medal, Radio, Swords, Trophy, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KIND_LABEL } from '@/lib/brackets';
import type {
  BracketParticipant,
  BracketRoundView,
  CategoryBracket,
  MatchView,
} from '@/types';

/**
 * Fixture de una categoría: una columna por ronda, con sus enfrentamientos,
 * quién quedó sin rival y los extra (minironda, repechaje, 3.er lugar).
 * Se desplaza en horizontal en pantallas chicas.
 */
export function BracketView({
  category,
  onMatchClick,
  highlight,
}: {
  category: CategoryBracket;
  /// En el panel: abre la pantalla del juez
  onMatchClick?: (match: MatchView) => void;
  /// Números de participante a resaltar (los del socio que mira)
  highlight?: number[];
}) {
  if (!category.rounds.length) {
    return (
      <p className="state-empty">
        Los enfrentamientos de {category.name} se publicarán cuando se sorteen.
      </p>
    );
  }
  const unit = category.mode === 'KNOCKDOWN' ? 'pts' : null;

  return (
    <div className="space-y-6">
      {category.podium && <PodiumView podium={category.podium} />}
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <ol className="flex min-w-max snap-x gap-4">
          {category.rounds.map((round) => (
            <li key={round.id} className="flex w-64 shrink-0 snap-start flex-col">
              <RoundHeader round={round} />
              <div className="flex flex-1 flex-col justify-around gap-3">
                {round.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    unit={unit}
                    highlight={highlight}
                    onClick={onMatchClick ? () => onMatchClick(match) : undefined}
                  />
                ))}
                {round.bye && !round.matches.some((m) => m.kind === 'REPECHAGE') && (
                  <ByeCard bye={round.bye} highlight={highlight} />
                )}
                {round.awaitingDraw && (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                    {round.entrantsCount} arqueros: falta sortear quién queda sin rival.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function RoundHeader({ round }: { round: BracketRoundView }) {
  return (
    <div className="mb-3 border-b pb-2">
      <p className="flex items-center justify-between gap-2 text-sm font-semibold">
        {round.label}
        {round.closedAt ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Cerrada
          </span>
        ) : round.matches.some((m) => m.status !== 'PENDING') ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Radio className="h-3 w-3 animate-pulse" aria-hidden="true" />
            En juego
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted-foreground">
        {round.entrantsCount} arqueros · ronda {round.number}
      </p>
    </div>
  );
}

export function MatchCard({
  match,
  unit,
  highlight,
  onClick,
}: {
  match: MatchView;
  unit: string | null;
  highlight?: number[];
  onClick?: () => void;
}) {
  const label = KIND_LABEL[match.kind];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full rounded-md border bg-card text-left text-sm shadow-sm',
        onClick && 'transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        match.kind === 'FINAL' && 'border-amber-500/60',
      )}
    >
      {(label || match.status !== 'FINISHED') && (
        <div className="flex items-center justify-between gap-2 border-b px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="flex items-center gap-1">
            {match.kind === 'FINAL' && <Trophy className="h-3 w-3 text-amber-600" aria-hidden="true" />}
            {match.kind === 'THIRD_PLACE' && <Medal className="h-3 w-3" aria-hidden="true" />}
            {label ?? 'Enfrentamiento'}
          </span>
          {match.status === 'IN_PROGRESS' ? (
            <span className="flex items-center gap-1 normal-case text-primary">
              <Swords className="h-3 w-3" aria-hidden="true" />
              {match.shootOff ? `Desempate ${match.shootOff.tanda}` : 'En juego'}
            </span>
          ) : match.status === 'PENDING' ? (
            <span className="flex items-center gap-1 normal-case">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Por jugar
            </span>
          ) : null}
        </div>
      )}
      <ul>
        {match.entries.map((entry) => {
          const won = match.winnerEntryId === entry.id;
          const lost = match.status === 'FINISHED' && !won;
          return (
            <li
              key={entry.id}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5',
                lost && 'text-muted-foreground',
                highlight?.includes(entry.number) && 'bg-primary/10',
              )}
            >
              <NumberBadge number={entry.number} strong={won} />
              <span className={cn('min-w-0 flex-1 truncate', won && 'font-semibold')}>{entry.name}</span>
              {match.status !== 'PENDING' && (
                <span className="tabular-nums">
                  {entry.total}
                  {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
                  {entry.shootOffTotal > 0 || match.shootOff?.entryIds.includes(entry.id) ? (
                    <span className="ml-1 text-xs text-muted-foreground">({entry.shootOffTotal})</span>
                  ) : null}
                </span>
              )}
              {won && <Check className="h-4 w-4 text-emerald-600" aria-label="Ganador" />}
            </li>
          );
        })}
      </ul>
    </Tag>
  );
}

function ByeCard({ bye, highlight }: { bye: BracketParticipant; highlight?: number[] }) {
  return (
    <div
      className={cn(
        'rounded-md border border-dashed px-2.5 py-2 text-sm',
        highlight?.includes(bye.number) && 'bg-primary/10',
      )}
    >
      <p className="flex items-center gap-2">
        <NumberBadge number={bye.number} />
        <span className="truncate">{bye.name}</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <UserRound className="h-3 w-3" aria-hidden="true" />
        Sin rival: espera al mejor perdedor
      </p>
    </div>
  );
}

export function NumberBadge({ number, strong }: { number: number; strong?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
        strong ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
      )}
      title="Número de participante"
    >
      {number}
    </span>
  );
}

function PodiumView({ podium }: { podium: NonNullable<CategoryBracket['podium']> }) {
  const places = [
    { label: '1.º', person: podium.first, className: 'border-amber-500/60 bg-amber-50 dark:bg-amber-950/30' },
    { label: '2.º', person: podium.second, className: 'bg-secondary/40' },
    { label: '3.º', person: podium.third, className: 'bg-secondary/20' },
  ].filter((p) => p.person);
  return (
    <ol className="grid gap-2 sm:grid-cols-3" aria-label="Podio">
      {places.map((p) => (
        <li key={p.label} className={cn('flex items-center gap-3 rounded-md border p-3', p.className)}>
          <span className="text-lg font-bold">{p.label}</span>
          <NumberBadge number={p.person!.number} strong={p.label === '1.º'} />
          <span className="min-w-0 truncate font-medium">{p.person!.name}</span>
        </li>
      ))}
    </ol>
  );
}
