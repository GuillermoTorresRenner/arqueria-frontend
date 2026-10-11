import { ArrowDown, ArrowUp, Plus, Swords, Target, Trash2 } from 'lucide-react';
import { useScoringFormats } from '@/hooks/use-activities';
import { cn } from '@/lib/utils';
import { newCategory, type CategoryFormState } from '@/lib/tournament-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryMode, User } from '@/types';

const SELECT =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const MODES: { value: CategoryMode; label: string; hint: string; icon: typeof Target }[] = [
  {
    value: 'SCORE',
    label: 'Puntaje',
    hint: 'Diana por zonas: gana la suma mayor de las flechas de la ronda.',
    icon: Target,
  },
  {
    value: 'KNOCKDOWN',
    label: 'Duelos',
    hint: 'Dianas abatibles y suelta simultánea: gana quien abate primero las fijadas.',
    icon: Swords,
  },
];

const displayName = (u: Pick<User, 'name' | 'surname' | 'email'>) =>
  [u.name, u.surname].filter(Boolean).join(' ') || u.email;

/**
 * Categorías del torneo: cada una con su modalidad y su propio cuadro. Una
 * categoría con inscritos no se quita, y con cuadro no cambia de modalidad.
 */
export function TournamentCategoriesEditor({
  value,
  onChange,
  judges,
}: {
  value: CategoryFormState[];
  onChange: (categories: CategoryFormState[]) => void;
  /// Jueces elegidos para el torneo: entre ellos se elige el de cada categoría
  judges: Pick<User, 'id' | 'name' | 'surname' | 'email'>[];
}) {
  const { data: formats } = useScoringFormats();

  const update = (key: string, patch: Partial<CategoryFormState>) =>
    onChange(value.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const move = (index: number, delta: number) => {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Categorías</h3>
        <p className="text-xs text-muted-foreground">
          Cada una tiene su cuadro de eliminación directa y su inscripción (con pago aparte). El
          número de participante es el mismo en todas.
        </p>
      </div>

      <ol className="space-y-3">
        {value.map((c, index) => {
          const mode = MODES.find((m) => m.value === c.mode)!;
          // Las desactivadas solo aparecen si la categoría ya la usaba
          const formatOptions = (formats ?? []).filter(
            (f) => f.isActive || f.id === c.scoringFormatId,
          );
          const id = (field: string) => `category-${c.key}-${field}`;
          return (
            <li key={c.key} className="space-y-3 rounded-md border bg-background p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor={id('name')} className="text-xs">
                    Nombre
                  </Label>
                  <Input
                    id={id('name')}
                    value={c.name}
                    maxLength={60}
                    placeholder="Tiro tradicional"
                    onChange={(e) => update(c.key, { name: e.target.value })}
                  />
                </div>
                <div className="flex gap-0.5 pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Subir ${c.name || 'categoría'}`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Bajar ${c.name || 'categoría'}`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={value.length === 1 || c.registrations > 0}
                    title={
                      c.registrations > 0
                        ? 'Tiene inscritos: no se puede quitar'
                        : value.length === 1
                          ? 'El torneo necesita al menos una categoría'
                          : undefined
                    }
                    onClick={() => onChange(value.filter((x) => x.key !== c.key))}
                    aria-label={`Quitar ${c.name || 'categoría'}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <fieldset disabled={c.hasBracket} className="space-y-1">
                <legend className="text-xs font-medium">Modalidad</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MODES.map((m) => (
                    <label
                      key={m.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5',
                        c.hasBracket && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <input
                        type="radio"
                        name={id('mode')}
                        checked={c.mode === m.value}
                        onChange={() => update(c.key, { mode: m.value })}
                        className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <m.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          {m.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{m.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {c.hasBracket && (
                  <p className="text-xs text-muted-foreground">
                    Ya tiene cuadro: la modalidad no se puede cambiar.
                  </p>
                )}
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                {mode.value === 'SCORE' ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor={id('format')} className="text-xs">
                        Diana
                      </Label>
                      <select
                        id={id('format')}
                        value={c.scoringFormatId}
                        onChange={(e) => update(c.key, { scoringFormatId: e.target.value })}
                        className={SELECT}
                      >
                        <option value="">Elige la diana</option>
                        {formatOptions.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.zones.map((z) => z.label).join('-')})
                            {f.isActive ? '' : ' (inactiva)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <NumberField
                      id={id('arrows')}
                      label="Flechas por arquero en cada ronda"
                      value={c.arrowsPerArcher}
                      onChange={(arrowsPerArcher) => update(c.key, { arrowsPerArcher })}
                      hint="Valor por defecto; cada ronda puede cambiarlo."
                    />
                  </>
                ) : (
                  <NumberField
                    id={id('targets')}
                    label="Dianas abatidas para ganar"
                    value={c.targetsToWin}
                    onChange={(targetsToWin) => update(c.key, { targetsToWin })}
                    hint="Valor por defecto; cada ronda puede cambiarlo."
                  />
                )}
                <NumberField
                  id={id('shootoff')}
                  label="Flechas por arquero en cada desempate"
                  value={c.shootOffArrows}
                  onChange={(shootOffArrows) => update(c.key, { shootOffArrows })}
                  hint="Se repite hasta que alguien gane."
                />
                <NumberField
                  id={id('playoff')}
                  label="Flechas en la minironda de perdedores"
                  value={c.playoffArrows}
                  onChange={(playoffArrows) => update(c.key, { playoffArrows })}
                  hint="Si empatan los mejores perdedores de una ronda impar."
                />
                <div className="space-y-1">
                  <Label htmlFor={id('judge')} className="text-xs">
                    Juez de la categoría
                  </Label>
                  <select
                    id={id('judge')}
                    value={judges.some((j) => j.id === c.judgeId) ? c.judgeId : ''}
                    onChange={(e) => update(c.key, { judgeId: e.target.value })}
                    className={SELECT}
                  >
                    <option value="">Sin asignar</option>
                    {judges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {displayName(j)}
                      </option>
                    ))}
                  </select>
                  {judges.length === 0 && (
                    <p className="text-xs text-muted-foreground">Primero marca los jueces del torneo.</p>
                  )}
                </div>
              </div>

              {c.registrations > 0 && (
                <p className="text-xs text-muted-foreground">
                  {c.registrations === 1 ? '1 inscripción' : `${c.registrations} inscripciones`}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={value.length >= 10}
        onClick={() => onChange([...value, newCategory()])}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar categoría
      </Button>
    </section>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
