import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, ShieldCheck, Undo2 } from 'lucide-react';
import {
  useBracketLive,
  useStaffBracket,
  useUndoDraw,
  useUpdateRound,
} from '@/hooks/use-brackets';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { MODE_LABEL, personName } from '@/lib/brackets';
import { cn } from '@/lib/utils';
import { BracketView } from '@/components/bracket/BracketView';
import { ByeDraw, FirstRoundDraw } from '@/components/bracket/DrawPanel';
import { RoundAuditDialog } from '@/components/bracket/RoundAuditDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BracketRoundView, StaffCategoryBracket } from '@/types';

/**
 * Cuadro de un torneo en el panel: sorteo, rondas con su auditoría y acceso a
 * la pantalla del juez de cada enfrentamiento. Se actualiza en vivo.
 */
export function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useStaffBracket(id);
  const [selected, setSelected] = useState<string | null>(null);
  useBracketLive(id);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-1/2 skeleton" />
        <div className="h-72 skeleton" />
      </div>
    );
  }
  if (isError || !data) return <p className="state-empty">No se pudo cargar el torneo.</p>;

  const category = data.categories.find((c) => c.id === selected) ?? data.categories[0];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link to="/admin/torneos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Torneos
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{data.tournament.name}</h1>
          {data.tournament.isPublic && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/torneos/${data.tournament.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Fixture público
              </Link>
            </Button>
          )}
        </div>
      </header>

      {data.categories.length > 1 && (
        <div role="tablist" className="flex flex-wrap gap-1 border-b">
          {data.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === category.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                c.id === category.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {category && <CategoryPanel key={category.id} category={category} />}
    </div>
  );
}

function CategoryPanel({ category }: { category: StaffCategoryBracket }) {
  const navigate = useNavigate();
  const [audit, setAudit] = useState<BracketRoundView | null>(null);
  const undoDraw = useUndoDraw();
  const confirm = useConfirm();
  const last = category.rounds[category.rounds.length - 1];
  const lastClosed = [...category.rounds].reverse().find((r) => r.closedAt);
  const canUndo =
    category.canManage &&
    last &&
    !last.matches.some((m) => m.status !== 'PENDING') &&
    !(last.number > 1 && last.awaitingDraw);

  const undo = async () => {
    const ok = await confirm({
      title: '¿Deshacer el último sorteo?',
      description: 'Los enfrentamientos de esa ronda se borran y se puede sortear de nuevo.',
      confirmLabel: 'Deshacer sorteo',
      tone: 'danger',
    });
    if (!ok) return;
    undoDraw.mutate(category.id, {
      onSuccess: () => toast.success('Sorteo deshecho'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo deshacer')),
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <Badge variant="secondary">{MODE_LABEL[category.mode]}</Badge>
        <span>
          {category.mode === 'KNOCKDOWN'
            ? `${category.targetsToWin} dianas para ganar`
            : `${category.scoringFormat?.name ?? 'Sin diana'} · ${category.arrowsPerArcher} flechas por ronda`}
        </span>
        <span>Juez: {category.judge ? personName(category.judge) : 'jueces del torneo'}</span>
        {!category.canScore && <span className="text-amber-700 dark:text-amber-400">Solo lectura: no eres juez de esta categoría</span>}
      </div>

      {category.status === 'NOT_DRAWN' ? (
        category.canManage ? (
          <FirstRoundDraw
            key={category.confirmed.map((p) => p.number).join(',')}
            categoryId={category.id}
            categoryName={category.name}
            confirmed={category.confirmed}
            pendingCount={category.pendingCount}
          />
        ) : (
          <p className="state-empty">Los enfrentamientos aún no se sortean.</p>
        )
      ) : (
        <>
          {last?.awaitingDraw && category.canManage && (
            <ByeDraw categoryId={category.id} roundLabel={last.label} entrants={last.entrants} />
          )}

          <ul className="flex flex-wrap gap-2">
            {category.rounds.map((round) => (
              <li key={round.id}>
                <RoundChip
                  round={round}
                  canEditRules={category.canManage}
                  mode={category.mode}
                  onAudit={() => setAudit(round)}
                />
              </li>
            ))}
            {canUndo && (
              <li>
                <Button variant="ghost" size="sm" onClick={undo} disabled={undoDraw.isPending}>
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Deshacer sorteo
                </Button>
              </li>
            )}
          </ul>

          <BracketView
            category={category}
            onMatchClick={(match) => navigate(`/admin/enfrentamientos/${match.id}`)}
          />
        </>
      )}

      {audit && (
        <RoundAuditDialog
          category={category}
          // Siempre la versión al día de la ronda (se actualiza en vivo)
          round={category.rounds.find((r) => r.id === audit.id) ?? audit}
          isLast={audit.id === lastClosed?.id}
          onClose={() => setAudit(null)}
        />
      )}
    </section>
  );
}

/// Una ronda: estado, flechas o dianas (editables antes de empezar) y auditoría
function RoundChip({
  round,
  canEditRules,
  mode,
  onAudit,
}: {
  round: BracketRoundView;
  canEditRules: boolean;
  mode: StaffCategoryBracket['mode'];
  onAudit: () => void;
}) {
  const update = useUpdateRound();
  const started = round.matches.some((m) => m.status !== 'PENDING');
  const field = mode === 'KNOCKDOWN' ? 'targetsToWin' : 'arrowsPerArcher';
  const value = mode === 'KNOCKDOWN' ? round.targetsToWin : round.arrowsPerArcher;
  const [draft, setDraft] = useState(String(value));

  const save = () => {
    const n = Number(draft);
    if (!Number.isInteger(n) || n < 1 || n === value) return setDraft(String(value));
    update.mutate(
      { id: round.id, [field]: n },
      {
        onSuccess: () => toast.success(`${round.label}: ${n} ${mode === 'KNOCKDOWN' ? 'dianas para ganar' : 'flechas por arquero'}`),
        onError: (e) => {
          setDraft(String(value));
          toast.error(apiErrorMessage(e, 'No se pudo cambiar'));
        },
      },
    );
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm',
        round.closedAt ? 'bg-emerald-50 dark:bg-emerald-950/30' : round.complete ? 'border-primary' : '',
      )}
    >
      <span className="font-medium">{round.label}</span>
      {canEditRules && !started && !round.closedAt ? (
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Input
            value={draft}
            inputMode="numeric"
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="h-7 w-12 px-1.5 text-center"
            aria-label={`${mode === 'KNOCKDOWN' ? 'Dianas para ganar' : 'Flechas por arquero'} en ${round.label}`}
          />
          {mode === 'KNOCKDOWN' ? 'dianas' : 'flechas'}
        </label>
      ) : (
        <span className="text-xs text-muted-foreground">
          {value} {mode === 'KNOCKDOWN' ? 'dianas' : 'flechas'}
        </span>
      )}
      <Button size="sm" variant={round.complete && !round.closedAt ? 'default' : 'ghost'} className="h-7 px-2" onClick={onAudit}>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {round.closedAt ? 'Auditada' : round.complete ? 'Auditar y cerrar' : 'Auditoría'}
      </Button>
    </div>
  );
}
