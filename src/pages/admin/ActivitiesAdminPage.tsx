import { useMemo, useState } from 'react';
import {
  BellRing,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { useActivitiesRange } from '@/hooks/use-activities';
import { capitalize, dayKey, formatDay, formatTime, formatTimeRange } from '@/lib/activities';
import { cn } from '@/lib/utils';
import { ActivityDialog } from '@/components/admin/ActivityDialog';
import { PlacesDialog } from '@/components/admin/PlacesDialog';
import { ActivityWeatherPanel } from '@/components/activities/WeatherInfo';
import { Button } from '@/components/ui/button';
import type { Activity } from '@/types';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const monthTitle = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

/// Semanas visibles del mes (de lunes a domingo), completas
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const end = new Date(days[days.length - 1]);
  end.setDate(end.getDate() + 1);
  return { days, start, end };
}

type DialogState =
  | { kind: 'activity'; activity: Activity | null; date?: string }
  | { kind: 'places' }
  | null;

export function ActivitiesAdminPage() {
  const today = dayKey(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { days, start, end } = useMemo(() => monthGrid(month), [month]);
  const { data: activities, isLoading } = useActivitiesRange(start, end);

  // Actividades por día (las que cruzan la medianoche cuentan en su inicio)
  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities ?? []) {
      const key = dayKey(new Date(a.startsAt));
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [activities]);

  const moveMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const goToday = () => {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };

  const selectedActivities = byDay.get(selected) ?? [];
  const selectedDate = new Date(`${selected}T12:00`);
  const openNew = (date: string) => setDialog({ kind: 'activity', activity: null, date });
  const openEdit = (activity: Activity) => setDialog({ kind: 'activity', activity });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda jornadas, clases y salidas. Los socios las ven en su cuenta y en la portada, y
            pueden confirmar asistencia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialog({ kind: 'places' })}>
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Lugares
          </Button>
          <Button onClick={() => openNew(selected < today ? today : selected)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva actividad
          </Button>
        </div>
      </header>

      {/* Navegación del mes */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoy
          </Button>
        </div>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {capitalize(monthTitle.format(month))}
        </h2>
      </div>

      {/* Calendario */}
      <div
        className={cn('overflow-hidden rounded-lg border bg-card', isLoading && 'opacity-60')}
        role="grid"
        aria-label={`Calendario de ${monthTitle.format(month)}`}
      >
        <div className="grid grid-cols-7 border-b bg-secondary/50" role="row">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              role="columnheader"
              className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = dayKey(day);
            const items = byDay.get(key) ?? [];
            const inMonth = day.getMonth() === month.getMonth();
            const isToday = key === today;
            const isSelected = key === selected;
            const past = key < today;
            return (
              <div
                key={key}
                role="gridcell"
                aria-selected={isSelected}
                className={cn(
                  'group relative min-h-[4.25rem] border-b border-r p-1 text-left transition-colors md:min-h-[7.5rem] md:p-1.5',
                  (i + 1) % 7 === 0 && 'border-r-0',
                  i >= days.length - 7 && 'border-b-0',
                  !inMonth && 'bg-muted/40 text-muted-foreground',
                  isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary/60',
                )}
              >
                {/* Toda la celda selecciona el día; las actividades van encima */}
                <button
                  type="button"
                  onClick={() => setSelected(key)}
                  onDoubleClick={() => !past && openNew(key)}
                  className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={`${formatDay(day)}${items.length ? `, ${items.length} actividades` : ''}`}
                />
                <div className="pointer-events-none relative flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium md:text-sm',
                      isToday && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {!past && (
                    <button
                      type="button"
                      onClick={() => openNew(key)}
                      className="pointer-events-auto hidden h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 md:inline-flex"
                      aria-label={`Agendar el ${formatDay(day)}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Escritorio: una línea por actividad */}
                <ul className="relative mt-1 hidden space-y-1 md:block">
                  {items.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className={cn(
                          'flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-colors',
                          new Date(a.endsAt) < new Date()
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-primary/15 text-foreground hover:bg-primary/25',
                        )}
                        title={`${formatTimeRange(a.startsAt, a.endsAt)} · ${a.title}`}
                      >
                        <span className="tabular-nums opacity-70">{formatTime(a.startsAt)}</span>
                        <span className="truncate">{a.title}</span>
                      </button>
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li className="px-1.5 text-xs text-muted-foreground">+{items.length - 3} más</li>
                  )}
                </ul>

                {/* Móvil: puntos */}
                {items.length > 0 && (
                  <div className="pointer-events-none relative mt-1 flex flex-wrap gap-0.5 md:hidden">
                    {items.slice(0, 4).map((a) => (
                      <span key={a.id} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 hidden text-xs text-muted-foreground md:block">
        Doble clic en un día o el botón + para agendar; clic en una actividad para editarla.
      </p>

      {/* Agenda del día elegido */}
      <section className="mt-8" aria-labelledby="day-agenda">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="day-agenda" className="text-lg font-semibold">
            {formatDay(selectedDate)}
          </h2>
          {selected >= today && (
            <Button variant="outline" size="sm" onClick={() => openNew(selected)}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Agendar este día
            </Button>
          )}
        </div>

        {selectedActivities.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No hay actividades este día.
          </p>
        ) : (
          <ul className="space-y-3">
            {selectedActivities.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="w-full rounded-lg border bg-card p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold">{a.title}</p>
                    <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {a._count.attendances} confirmados
                      </span>
                      {a.notifiedAt && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                          Avisada
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {formatTimeRange(a.startsAt, a.endsAt)}
                    </span>
                    {a.place && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {a.place.name}
                      </span>
                    )}
                  </p>
                  <ActivityWeatherPanel activity={a} compact className="mt-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog?.kind === 'activity' && (
        <ActivityDialog
          activity={dialog.activity}
          defaultDate={dialog.date}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'places' && <PlacesDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
