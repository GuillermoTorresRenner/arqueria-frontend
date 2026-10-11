import { toast } from 'sonner';
import { Lock, LockOpen, ShieldCheck } from 'lucide-react';
import { useCloseRound, useReopenRound } from '@/hooks/use-brackets';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { KIND_LABEL, personName } from '@/lib/brackets';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { NumberBadge } from '@/components/bracket/BracketView';
import type { BracketRoundView, CategoryMode, MatchView, StaffCategoryBracket } from '@/types';

const dateTime = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Auditoría de una ronda: cada flecha o disparo con quién lo cargó, los
 * desempates y el sorteo. El juez de la categoría (o un admin) la revisa y la
 * cierra; recién entonces se arma la siguiente ronda.
 */
export function RoundAuditDialog({
  category,
  round,
  isLast,
  onClose,
}: {
  category: StaffCategoryBracket;
  round: BracketRoundView;
  /// Solo la última ronda cerrada se puede reabrir
  isLast: boolean;
  onClose: () => void;
}) {
  const closeRound = useCloseRound();
  const reopenRound = useReopenRound();
  const confirm = useConfirm();
  const isFinal = round.matches.some((m) => m.kind === 'FINAL');

  const close = async () => {
    const ok = await confirm({
      title: `¿Cerrar ${round.label.toLowerCase()}?`,
      description: isFinal
        ? 'Los resultados quedan firmes y se publica el podio de la categoría.'
        : 'Los resultados quedan firmes y se arma la ronda siguiente con los ganadores. Para corregir después, un admin tendrá que reabrirla.',
      confirmLabel: 'Cerrar ronda',
    });
    if (!ok) return;
    closeRound.mutate(round.id, {
      onSuccess: () => {
        toast.success(isFinal ? 'Categoría terminada: podio publicado' : 'Ronda cerrada');
        onClose();
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo cerrar la ronda')),
    });
  };

  const reopen = async () => {
    const ok = await confirm({
      title: `¿Reabrir ${round.label.toLowerCase()}?`,
      description:
        'Se podrá corregir de nuevo. La ronda siguiente se borra (no tiene resultados) y se vuelve a armar al cerrar.',
      confirmLabel: 'Reabrir',
      tone: 'danger',
    });
    if (!ok) return;
    reopenRound.mutate(round.id, {
      onSuccess: () => toast.success('Ronda reabierta'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo reabrir'), { duration: 8000 }),
    });
  };

  const draw = round.draws?.[0];

  return (
    <Modal title={`${category.name} · ${round.label}`} onClose={onClose} className="max-w-3xl">
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>{round.entrantsCount} arqueros</span>
          <span>
            {category.mode === 'KNOCKDOWN'
              ? `${round.targetsToWin} dianas para ganar`
              : `${round.arrowsPerArcher} flechas por arquero`}
          </span>
          <span>Desempate: {category.shootOffArrows} flecha(s) por tanda</span>
          {round.closedAt && (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Cerrada el {dateTime.format(new Date(round.closedAt))}
              {round.closedBy && ` por ${personName(round.closedBy)}`}
            </span>
          )}
        </div>

        {draw && (
          <p className="rounded-md bg-secondary/40 p-3 text-xs">
            <strong>Sorteo</strong> {draw.method === 'ALGORITHM' ? 'del sistema' : 'por tómbola'} ·{' '}
            {draw.result.pairs.map(([a, b]) => `${a} vs ${b}`).join(' · ')}
            {draw.result.bye !== null && ` · sin rival: n.º ${draw.result.bye}`}
            {draw.seed && ` · semilla «${draw.seed}»`}
            {draw.drawnBy && ` · ${personName(draw.drawnBy)}`}, {dateTime.format(new Date(draw.createdAt))}
          </p>
        )}

        <ul className="space-y-3">
          {round.matches.map((match) => (
            <MatchAudit key={match.id} match={match} mode={category.mode} />
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {!round.closedAt && !round.complete && (
            <p className="mr-auto text-xs text-muted-foreground">
              Se puede cerrar cuando todos los enfrentamientos tengan ganador.
            </p>
          )}
          {round.closedAt && isLast && category.canManage && (
            <Button variant="outline" onClick={reopen} disabled={reopenRound.isPending}>
              <LockOpen className="h-4 w-4" aria-hidden="true" />
              Reabrir ronda
            </Button>
          )}
          {!round.closedAt && category.canAudit && (
            <Button onClick={close} disabled={!round.complete || closeRound.isPending}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {closeRound.isPending ? 'Cerrando…' : 'Revisado: cerrar ronda'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function MatchAudit({ match, mode }: { match: MatchView; mode: CategoryMode }) {
  const recorders = [...new Set(match.shots.map((s) => personName(s.recordedBy)).filter(Boolean))];
  const lastChange = match.shots.reduce<string | null>(
    (latest, s) => (s.updatedAt && (!latest || s.updatedAt > latest) ? s.updatedAt : latest),
    null,
  );
  const race = mode === 'KNOCKDOWN' && match.kind !== 'PLAYOFF';

  return (
    <li className="rounded-md border">
      <p className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <span>{KIND_LABEL[match.kind] ?? `Enfrentamiento ${match.order + 1}`}</span>
        <span>
          {match.status === 'FINISHED' ? 'Terminado' : match.status === 'IN_PROGRESS' ? 'En juego' : 'Por jugar'}
          {recorders.length > 0 && ` · cargó ${recorders.join(', ')}`}
          {lastChange && ` · ${dateTime.format(new Date(lastChange))}`}
        </span>
      </p>
      <table className="w-full text-sm">
        <tbody>
          {match.entries.map((entry) => {
            const mine = match.shots.filter((s) => s.entryId === entry.id);
            const regular = mine.filter((s) => s.phase === 'REGULAR');
            const shootOff = mine.filter((s) => s.phase === 'SHOOT_OFF');
            const won = match.winnerEntryId === entry.id;
            return (
              <tr key={entry.id} className={cn('border-b last:border-0', won && 'font-semibold')}>
                <td className="w-full px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <NumberBadge number={entry.number} strong={won} />
                    {entry.name}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs">
                  {regular.map((s) => (race ? (s.value ? '●' : s.hit ? '○' : '·') : s.zoneLabel ?? s.value)).join(' ')}
                  {shootOff.length > 0 && (
                    <span className="ml-2 text-muted-foreground">| {shootOff.map((s) => s.zoneLabel ?? s.value).join(' ')}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                  {entry.total}
                  {shootOff.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({entry.shootOffTotal})</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {race && match.shots.length > 0 && (
        <p className="px-3 pb-1.5 text-[11px] text-muted-foreground">● punto · ○ abatió sin punto · · falló</p>
      )}
    </li>
  );
}
