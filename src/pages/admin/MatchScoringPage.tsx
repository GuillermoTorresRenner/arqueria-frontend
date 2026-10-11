import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Lock, Trophy, Undo2, X } from 'lucide-react';
import {
  useBracketLive,
  useDeleteShot,
  useMatch,
  useRecordShots,
  type ShotInput,
} from '@/hooks/use-brackets';
import { apiErrorMessage } from '@/lib/api';
import { KIND_LABEL } from '@/lib/brackets';
import { cn } from '@/lib/utils';
import { NumberBadge } from '@/components/bracket/BracketView';
import { Button } from '@/components/ui/button';
import type { MatchDetail, MatchEntryView, MatchShotView, ShotPhase } from '@/types';

/**
 * Pantalla del juez para un enfrentamiento, pensada para el celular en la
 * línea de tiro. Cada toque se guarda al instante; lo cargado se corrige
 * tocándolo mientras la ronda no esté cerrada.
 */
export function MatchScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, isError } = useMatch(matchId);
  useBracketLive(match?.tournament.id);

  if (isLoading) return <div className="h-96 skeleton" aria-busy="true" />;
  if (isError || !match) return <p className="state-empty">No se pudo cargar el enfrentamiento.</p>;

  const race = match.category.mode === 'KNOCKDOWN' && match.kind !== 'PLAYOFF';
  const winner = match.entries.find((e) => e.id === match.winnerEntryId);
  const locked = !match.canScore;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-1">
        <Link
          to={`/admin/torneos/${match.tournament.id}/cuadro`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cuadro de {match.category.name}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          {match.round.label} · {KIND_LABEL[match.kind] ?? `Enfrentamiento ${match.order + 1}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {race
            ? `Gana quien abate primero ${match.rules.targetsToWin} dianas`
            : `${match.rules.arrows} ${match.rules.arrows === 1 ? 'flecha' : 'flechas'} por arquero · desempate de ${match.rules.shootOffArrows}`}
        </p>
      </header>

      {match.round.closedAt ? (
        <p className="flex items-center gap-2 rounded-md bg-secondary/50 p-3 text-sm">
          <Lock className="h-4 w-4" aria-hidden="true" />
          La ronda está cerrada: para corregir, un admin debe reabrirla.
        </p>
      ) : locked ? (
        <p className="rounded-md bg-secondary/50 p-3 text-sm">Solo lectura: no eres juez de esta categoría.</p>
      ) : null}

      {winner && (
        <p className="flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-50 p-3 font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          Gana n.º {winner.number} · {winner.name}
        </p>
      )}
      {match.shootOff && (
        <p className="rounded-md border border-primary/50 bg-primary/5 p-3 text-sm font-medium">
          Empate: tanda de desempate {match.shootOff.tanda} ({match.rules.shootOffArrows}{' '}
          {match.rules.shootOffArrows === 1 ? 'flecha' : 'flechas'} cada uno), hasta que alguien gane.
        </p>
      )}

      {race ? <DuelScoring match={match} disabled={locked} /> : <ArrowScoring match={match} disabled={locked} />}
    </div>
  );
}

// ---------- Puntaje (y minirondas) ----------

/// Clases completas: Tailwind no genera las que se arman en tiempo de ejecución
const COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

interface Slot {
  phase: ShotPhase;
  sequence: number;
}

function ArrowScoring({ match, disabled }: { match: MatchDetail; disabled: boolean }) {
  const record = useRecordShots(match.id);
  const remove = useDeleteShot(match.id);
  const [selected, setSelected] = useState<{ entryId: string; slot: Slot } | null>(null);
  const knockdown = match.category.mode === 'KNOCKDOWN';
  const k = match.rules.shootOffArrows;
  const finished = match.status === 'FINISHED';

  const shotAt = (entryId: string, slot: Slot) =>
    match.shots.find((s) => s.entryId === entryId && s.phase === slot.phase && s.sequence === slot.sequence);

  /// La próxima flecha de un arquero: la fase regular y, si empata, su tanda
  const nextSlot = (entry: MatchEntryView): Slot | null => {
    for (let n = 1; n <= match.rules.arrows; n++) {
      if (!shotAt(entry.id, { phase: 'REGULAR', sequence: n })) return { phase: 'REGULAR', sequence: n };
    }
    const tanda = match.shootOff;
    if (!tanda || !tanda.entryIds.includes(entry.id)) return null;
    for (let n = (tanda.tanda - 1) * k + 1; n <= tanda.tanda * k; n++) {
      if (!shotAt(entry.id, { phase: 'SHOOT_OFF', sequence: n })) return { phase: 'SHOOT_OFF', sequence: n };
    }
    return null;
  };

  const save = (entry: MatchEntryView, choice: Pick<ShotInput, 'zoneLabel' | 'hit'>) => {
    const slot = selected?.entryId === entry.id ? selected.slot : nextSlot(entry);
    if (!slot) return;
    record.mutate([{ entryId: entry.id, ...slot, ...choice }], {
      onSuccess: () => setSelected(null),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar'), { duration: 6000 }),
    });
  };

  const undoLast = (entry: MatchEntryView) => {
    const mine = match.shots.filter((s) => s.entryId === entry.id);
    const last = [...mine].sort((a, b) => (a.phase === b.phase ? b.sequence - a.sequence : a.phase === 'SHOOT_OFF' ? -1 : 1))[0];
    if (!last) return;
    remove.mutate(
      { entryId: entry.id, phase: last.phase, sequence: last.sequence },
      { onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo borrar'), { duration: 6000 }) },
    );
  };

  const pending = record.isPending || remove.isPending;
  const choices = knockdown
    ? [
        { key: 'hit', label: 'Abatió', choice: { hit: true } },
        { key: 'miss', label: 'Falló', choice: { hit: false } },
      ]
    : [...match.category.zones]
        .sort((a, b) => b.value - a.value)
        .map((z) => ({ key: z.label, label: z.label, choice: { zoneLabel: z.label } }));

  return (
    <ul className="space-y-4">
      {match.entries.map((entry) => {
        const won = match.winnerEntryId === entry.id;
        const next = nextSlot(entry);
        const editing = selected?.entryId === entry.id;
        const shootOffShots = match.shots.filter((s) => s.entryId === entry.id && s.phase === 'SHOOT_OFF');
        const shootOffSlots =
          match.shootOff?.entryIds.includes(entry.id) || shootOffShots.length
            ? Math.max(match.shootOff?.entryIds.includes(entry.id) ? match.shootOff.tanda * k : 0, ...shootOffShots.map((s) => s.sequence))
            : 0;
        const canShoot = !disabled && (editing || (next && !finished));
        return (
          <li key={entry.id} className={cn('space-y-3 rounded-lg border p-4', won && 'border-emerald-500/60')}>
            <div className="flex items-center gap-3">
              <NumberBadge number={entry.number} strong={won} />
              <span className="min-w-0 flex-1 truncate font-semibold">{entry.name}</span>
              <span className="text-2xl font-bold tabular-nums">{entry.total}</span>
            </div>

            <SlotRow
              label="Flechas"
              count={match.rules.arrows}
              phase="REGULAR"
              entry={entry}
              shotAt={shotAt}
              next={next}
              selected={editing ? selected!.slot : null}
              disabled={disabled}
              onSelect={(slot) => setSelected(editing && selected!.slot.phase === slot.phase && selected!.slot.sequence === slot.sequence ? null : { entryId: entry.id, slot })}
            />
            {shootOffSlots > 0 && (
              <SlotRow
                label={`Desempate (${entry.shootOffTotal})`}
                count={shootOffSlots}
                phase="SHOOT_OFF"
                entry={entry}
                shotAt={shotAt}
                next={next}
                selected={editing ? selected!.slot : null}
                disabled={disabled}
                onSelect={(slot) => setSelected({ entryId: entry.id, slot })}
              />
            )}

            {canShoot && (
              <div className="space-y-2">
                {editing && (
                  <p className="text-xs font-medium text-primary">
                    Corrigiendo la flecha {selected!.slot.sequence}
                    {selected!.slot.phase === 'SHOOT_OFF' ? ' del desempate' : ''}
                  </p>
                )}
                <div className={cn('grid gap-2', COLUMNS[Math.min(choices.length, 4)])}>
                  {choices.map((c) => (
                    <Button
                      key={c.key}
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-14 text-xl font-bold"
                      disabled={pending}
                      onClick={() => save(entry, c.choice)}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {!disabled && match.shots.some((s) => s.entryId === entry.id) && (
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => undoLast(entry)}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Borrar la última
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SlotRow({
  label,
  count,
  phase,
  entry,
  shotAt,
  next,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  count: number;
  phase: ShotPhase;
  entry: MatchEntryView;
  shotAt: (entryId: string, slot: Slot) => MatchShotView | undefined;
  next: Slot | null;
  selected: Slot | null;
  disabled: boolean;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const slot = { phase, sequence: i + 1 };
          const shot = shotAt(entry.id, slot);
          const isNext = next?.phase === phase && next.sequence === slot.sequence;
          const isSelected = selected?.phase === phase && selected.sequence === slot.sequence;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled || !shot}
              onClick={() => onSelect(slot)}
              title={shot ? 'Tocar para corregir' : undefined}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md border text-base font-semibold tabular-nums',
                shot ? 'bg-secondary' : 'border-dashed text-muted-foreground',
                isNext && !selected && 'border-primary ring-2 ring-primary/40',
                isSelected && 'border-primary bg-primary text-primary-foreground',
              )}
              aria-label={`Flecha ${slot.sequence}${shot ? `: ${shot.zoneLabel ?? (shot.hit ? 'abatió' : 'falló')}` : ''}`}
            >
              {shot ? (shot.zoneLabel ?? (shot.hit ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />)) : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Duelos ----------

type Center = string | 'tie';

function DuelScoring({ match, disabled }: { match: MatchDetail; disabled: boolean }) {
  const record = useRecordShots(match.id);
  const remove = useDeleteShot(match.id);
  const sequences = [...new Set(match.shots.map((s) => s.sequence))].sort((a, b) => a - b);
  const nextSequence = (sequences[sequences.length - 1] ?? 0) + 1;
  const [editing, setEditing] = useState<number | null>(null);
  const [hits, setHits] = useState<Record<string, boolean>>({});
  const [center, setCenter] = useState<Center | null>(null);
  const finished = match.status === 'FINISHED';
  const [a, b] = match.entries;
  const hitters = match.entries.filter((e) => hits[e.id]);

  const reset = () => {
    setHits({});
    setCenter(null);
    setEditing(null);
  };

  const load = (sequence: number) => {
    const volley = match.shots.filter((s) => s.sequence === sequence);
    setEditing(sequence);
    setHits(Object.fromEntries(volley.map((s) => [s.entryId, Boolean(s.hit)])));
    const point = volley.find((s) => s.value === 1);
    setCenter(volley.filter((s) => s.hit).length === 2 ? (point?.entryId ?? 'tie') : null);
  };

  const submit = () => {
    // El punto: el único que abatió o, si fueron los dos, el que quedó más al centro
    const point = hitters.length === 1 ? hitters[0].id : hitters.length === 2 && center !== 'tie' ? center : null;
    record.mutate(
      match.entries.map((e) => ({
        entryId: e.id,
        phase: 'REGULAR',
        sequence: editing ?? nextSequence,
        hit: Boolean(hits[e.id]),
        point: point === e.id,
      })),
      {
        onSuccess: reset,
        onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo guardar'), { duration: 6000 }),
      },
    );
  };

  const deleteVolley = (sequence: number) =>
    remove.mutate(
      { phase: 'REGULAR', sequence },
      {
        onSuccess: reset,
        onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo borrar')),
      },
    );

  const pending = record.isPending || remove.isPending;
  const needsCenter = hitters.length === 2 && center === null;
  const showForm = !disabled && (!finished || editing !== null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {match.entries.map((e) => (
          <div key={e.id} className={cn('rounded-lg border p-3 text-center', match.winnerEntryId === e.id && 'border-emerald-500/60')}>
            <div className="flex items-center justify-center gap-2">
              <NumberBadge number={e.number} strong={match.winnerEntryId === e.id} />
              <span className="truncate font-semibold">{e.name}</span>
            </div>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {e.total}
              <span className="text-base font-medium text-muted-foreground">/{match.rules.targetsToWin}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {e.hits === 1 ? '1 diana abatida' : `${e.hits} dianas abatidas`}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">
            {editing ? `Corrigiendo el disparo ${editing}` : `Disparo ${nextSequence}`}
          </h2>
          <p className="text-xs text-muted-foreground">¿Quién abatió su diana?</p>
          <div className="grid grid-cols-2 gap-2">
            {match.entries.map((e) => (
              <Button
                key={e.id}
                type="button"
                size="lg"
                variant={hits[e.id] ? 'default' : 'outline'}
                className="h-14"
                aria-pressed={Boolean(hits[e.id])}
                onClick={() => {
                  setHits({ ...hits, [e.id]: !hits[e.id] });
                  setCenter(null);
                }}
              >
                n.º {e.number} abatió
              </Button>
            ))}
          </div>
          {hitters.length === 2 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Ambos a la vez: ¿quién quedó más cerca del centro?</p>
              <div className="grid grid-cols-3 gap-2">
                {[...match.entries.map((e) => ({ key: e.id, label: `n.º ${e.number}` })), { key: 'tie', label: 'Igual' }].map((o) => (
                  <Button
                    key={o.key}
                    type="button"
                    variant={center === o.key ? 'default' : 'outline'}
                    aria-pressed={center === o.key}
                    onClick={() => setCenter(o.key)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
              {center === 'tie' && (
                <p className="text-xs text-muted-foreground">Nadie suma: se sigue tirando hasta desempatar.</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" className="flex-1" onClick={submit} disabled={pending || needsCenter}>
              {hitters.length === 0 ? 'Registrar: nadie abatió' : 'Registrar disparo'}
            </Button>
            {editing !== null && (
              <Button type="button" variant="outline" onClick={reset}>
                Cancelar
              </Button>
            )}
          </div>
        </section>
      )}

      {sequences.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Disparos</h2>
          <ol className="divide-y rounded-md border text-sm">
            {[...sequences].reverse().map((seq) => {
              const volley = (id: string) => match.shots.find((s) => s.sequence === seq && s.entryId === id);
              const pointTo = match.shots.find((s) => s.sequence === seq && s.value === 1);
              return (
                <li key={seq} className={cn('flex items-center gap-2 px-3 py-2', editing === seq && 'bg-primary/10')}>
                  <span className="w-6 text-xs text-muted-foreground">{seq}</span>
                  {[a, b].map((e) => (
                    <span key={e.id} className="flex items-center gap-1">
                      <NumberBadge number={e.number} strong={pointTo?.entryId === e.id} />
                      {volley(e.id)?.hit ? <Check className="h-4 w-4 text-emerald-600" aria-label="abatió" /> : <X className="h-4 w-4 text-muted-foreground" aria-label="no abatió" />}
                    </span>
                  ))}
                  <span className="flex-1 text-xs text-muted-foreground">
                    {pointTo ? `punto n.º ${match.entries.find((e) => e.id === pointTo.entryId)?.number}` : 'sin punto'}
                  </span>
                  {!disabled && (
                    <>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => load(seq)}>
                        Corregir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        disabled={pending}
                        onClick={() => deleteVolley(seq)}
                        aria-label={`Borrar el disparo ${seq}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
