import { useState } from 'react';
import { toast } from 'sonner';
import { Dices, Ticket, TriangleAlert } from 'lucide-react';
import { useDraw } from '@/hooks/use-brackets';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberBadge } from '@/components/bracket/BracketView';
import type { BracketParticipant } from '@/types';

const SELECT =
  'flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type Method = 'ALGORITHM' | 'MANUAL';

/// Elegir sorteo del sistema o tómbola (lo que salió, a mano)
function MethodPicker({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  const options = [
    {
      value: 'ALGORITHM' as const,
      icon: Dices,
      title: 'Sorteo del sistema',
      text: 'Al azar, con una semilla que permite repetirlo y auditarlo.',
    },
    {
      value: 'MANUAL' as const,
      icon: Ticket,
      title: 'Tómbola',
      text: 'Se sortea en la cancha y aquí se anota lo que salió.',
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            type="radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-0.5 accent-[hsl(var(--primary))]"
          />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              <o.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {o.title}
            </span>
            <span className="text-xs text-muted-foreground">{o.text}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

/**
 * Sorteo de la primera ronda: entran los inscritos con el pago confirmado.
 * Con la tómbola se anota qué número enfrenta a cuál y quién quedó sin rival.
 */
export function FirstRoundDraw({
  categoryId,
  categoryName,
  confirmed,
  pendingCount,
}: {
  categoryId: string;
  categoryName: string;
  confirmed: BracketParticipant[];
  pendingCount: number;
}) {
  const draw = useDraw();
  const confirm = useConfirm();
  const [method, setMethod] = useState<Method>('ALGORITHM');
  const [seed, setSeed] = useState('');
  const numbers = confirmed.map((p) => p.number);
  const odd = numbers.length % 2 === 1;
  const [pairs, setPairs] = useState<[string, string][]>(() =>
    Array.from({ length: Math.floor(numbers.length / 2) }, () => ['', ''] as [string, string]),
  );
  const [bye, setBye] = useState('');

  const used = new Set([...pairs.flat(), bye].filter(Boolean));
  const options = (current: string) =>
    numbers.filter((n) => String(n) === current || !used.has(String(n)));
  const complete = used.size === numbers.length;

  const submit = async () => {
    const ok = await confirm({
      title: `¿Sortear ${categoryName}?`,
      description:
        method === 'ALGORITHM'
          ? `Se emparejan al azar los ${numbers.length} inscritos confirmados${odd ? ' y uno queda sin rival' : ''}. Quien se inscriba o confirme el pago después ya no entra.`
          : 'Se registra el sorteo de la tómbola tal como lo anotaste. Quien se inscriba o confirme el pago después ya no entra.',
      confirmLabel: 'Registrar sorteo',
    });
    if (!ok) return;
    draw.mutate(
      method === 'ALGORITHM'
        ? { categoryId, method, seed: seed.trim() || undefined }
        : {
            categoryId,
            method,
            pairs: pairs.map(([a, b]) => [Number(a), Number(b)] as [number, number]),
            bye: odd ? Number(bye) : null,
          },
      {
        onSuccess: (r) =>
          toast.success('Sorteo registrado', {
            description: `${r.pairs.map(([a, b]) => `${a} vs ${b}`).join(' · ')}${
              r.bye ? ` · sin rival: n.º ${r.bye}` : ''
            }`,
            duration: 10000,
          }),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo sortear'), { duration: 8000 }),
      },
    );
  };

  if (numbers.length < 2) {
    return (
      <div className="state-empty space-y-1">
        <p>Se necesitan al menos dos inscritos con el pago confirmado para sortear.</p>
        {pendingCount > 0 && <p className="text-xs">{pendingCount} esperan la confirmación del pago.</p>}
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">Sorteo de la primera ronda</h3>
        <p className="text-sm text-muted-foreground">
          {numbers.length} inscritos con el pago confirmado
          {odd && ': al ser impares, uno queda sin rival y se enfrenta al mejor perdedor'}.
        </p>
      </div>
      {pendingCount > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {pendingCount === 1 ? '1 inscripción' : `${pendingCount} inscripciones`} sin pago
          confirmado no entran al sorteo. Confírmalas antes si corresponde.
        </p>
      )}
      <ul className="flex flex-wrap gap-2 text-sm">
        {confirmed.map((p) => (
          <li key={p.participantId} className="flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5">
            <NumberBadge number={p.number} />
            {p.name}
          </li>
        ))}
      </ul>

      <MethodPicker value={method} onChange={setMethod} />

      {method === 'ALGORITHM' ? (
        <div className="space-y-1">
          <Label htmlFor="draw-seed" className="text-xs">
            Semilla (opcional)
          </Label>
          <Input
            id="draw-seed"
            value={seed}
            maxLength={64}
            placeholder="Se genera sola si la dejas vacía"
            onChange={(e) => setSeed(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Con la misma semilla y los mismos inscritos, el sorteo sale igual: sirve para auditarlo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium">Enfrentamientos de la tómbola</p>
          <ol className="space-y-2">
            {pairs.map(([a, b], i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-right text-xs text-muted-foreground">{i + 1}.</span>
                {[a, b].map((value, side) => (
                  <select
                    key={side}
                    aria-label={`Enfrentamiento ${i + 1}, ${side === 0 ? 'primer' : 'segundo'} arquero`}
                    value={value}
                    onChange={(e) =>
                      setPairs(pairs.map((p, j) => (j === i ? (side === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]) : p)))
                    }
                    className={SELECT}
                  >
                    <option value="">N.º</option>
                    {options(value).map((n) => (
                      <option key={n} value={n}>
                        {n} · {confirmed.find((p) => p.number === n)?.name}
                      </option>
                    ))}
                  </select>
                ))}
                <span className="sr-only">contra</span>
              </li>
            ))}
          </ol>
          {odd && (
            <div className="flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap text-xs font-medium">Sin rival</span>
              <select aria-label="Número sin rival" value={bye} onChange={(e) => setBye(e.target.value)} className={SELECT}>
                <option value="">N.º</option>
                {options(bye).map((n) => (
                  <option key={n} value={n}>
                    {n} · {confirmed.find((p) => p.number === n)?.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={draw.isPending || (method === 'MANUAL' && !complete)}>
          {method === 'ALGORITHM' ? <Dices className="h-4 w-4" aria-hidden="true" /> : <Ticket className="h-4 w-4" aria-hidden="true" />}
          {draw.isPending ? 'Sorteando…' : method === 'ALGORITHM' ? 'Sortear' : 'Registrar la tómbola'}
        </Button>
      </div>
    </section>
  );
}

/// Ronda impar posterior: quién queda sin rival (y enfrenta al mejor perdedor)
export function ByeDraw({
  categoryId,
  roundLabel,
  entrants,
}: {
  categoryId: string;
  roundLabel: string;
  entrants: BracketParticipant[];
}) {
  const draw = useDraw();
  const [method, setMethod] = useState<Method>('ALGORITHM');
  const [bye, setBye] = useState('');

  const submit = () =>
    draw.mutate(
      method === 'ALGORITHM' ? { categoryId, method } : { categoryId, method, bye: Number(bye) },
      {
        onSuccess: (r) => toast.success(`Sin rival en ${roundLabel}: n.º ${r.bye}`),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo sortear')),
      },
    );

  return (
    <section className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div>
        <h3 className="font-semibold">{roundLabel}: falta sortear quién queda sin rival</h3>
        <p className="text-sm text-muted-foreground">
          Pasaron {entrants.length} arqueros. Uno queda sin rival y luego enfrenta al mejor
          perdedor de la ronda; el resto se cruza en el orden del cuadro.
        </p>
      </div>
      <MethodPicker value={method} onChange={setMethod} />
      {method === 'MANUAL' && (
        <div className="flex flex-wrap gap-2">
          {entrants.map((p) => (
            <button
              key={p.participantId}
              type="button"
              onClick={() => setBye(String(p.number))}
              className={cn(
                'flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-sm',
                bye === String(p.number) && 'border-primary bg-primary/10',
              )}
              aria-pressed={bye === String(p.number)}
            >
              <NumberBadge number={p.number} strong={bye === String(p.number)} />
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={draw.isPending || (method === 'MANUAL' && !bye)}>
          {draw.isPending ? 'Sorteando…' : method === 'ALGORITHM' ? 'Sortear' : 'Registrar'}
        </Button>
      </div>
    </section>
  );
}
