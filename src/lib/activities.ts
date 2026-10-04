import { CalendarDays, PartyPopper, Trophy, type LucideIcon } from 'lucide-react';
import type { ActivityType, Fee, Place } from '@/types';

/// Open-Meteo pronostica 16 días: más allá no se pide el tiempo
export const FORECAST_DAYS = 16;

const pad = (n: number) => String(n).padStart(2, '0');

/// Clave del día en hora local («2026-10-11»), para agrupar en el calendario
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/// Los campos date/time del formulario, desde una fecha ISO
export function toLocalInputs(iso: string) {
  const d = new Date(iso);
  return { date: dayKey(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/// Fecha ISO (UTC) desde los campos date/time, interpretados en hora local
export function fromLocalInputs(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

const dayFormat = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFormat = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/// Mayúscula solo en la primera letra: el `capitalize` de CSS pondría
/// «Octubre De 2026»
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/// «Sábado, 11 de octubre»
export const formatDay = (iso: string | Date) => capitalize(dayFormat.format(new Date(iso)));
/// «10:00»
export const formatTime = (iso: string | Date) => timeFormat.format(new Date(iso));
/// «10:00 a 13:00»
export const formatTimeRange = (start: string, end: string) =>
  `${formatTime(start)} a ${formatTime(end)}`;

/// Si vale la pena pedir el pronóstico: no ha terminado y cae en los 16 días
export function hasForecast(startsAt: string, endsAt: string) {
  const now = Date.now();
  if (new Date(endsAt).getTime() < now) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startsAt);
  start.setHours(0, 0, 0, 0);
  return (start.getTime() - today.getTime()) / 86_400_000 < FORECAST_DAYS;
}

export function mapUrl(place: Pick<Place, 'name' | 'address' | 'latitude' | 'longitude'>) {
  const query =
    place.latitude != null && place.longitude != null
      ? `${place.latitude},${place.longitude}`
      : place.address || place.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Cada tipo con su color (los mismos en el calendario, las tarjetas y los
 * correos). Las clases van completas para que Tailwind las incluya.
 */
export const ACTIVITY_TYPES: Record<
  ActivityType,
  {
    label: string;
    icon: LucideIcon;
    /// Etiqueta con el nombre del tipo
    badge: string;
    /// Línea del calendario
    chip: string;
    /// Punto del calendario en móvil y leyenda
    dot: string;
    /// Franja lateral de la tarjeta
    stripe: string;
  }
> = {
  ACTIVITY: {
    label: 'Actividad',
    icon: CalendarDays,
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    chip: 'bg-sky-100 text-sky-950 hover:bg-sky-200 dark:bg-sky-950/70 dark:text-sky-100 dark:hover:bg-sky-900',
    dot: 'bg-sky-600',
    stripe: 'border-l-sky-600',
  },
  EVENT: {
    label: 'Evento',
    icon: PartyPopper,
    badge: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
    chip: 'bg-violet-100 text-violet-950 hover:bg-violet-200 dark:bg-violet-950/70 dark:text-violet-100 dark:hover:bg-violet-900',
    dot: 'bg-violet-600',
    stripe: 'border-l-violet-600',
  },
  TOURNAMENT: {
    label: 'Torneo',
    icon: Trophy,
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    chip: 'bg-amber-100 text-amber-950 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-100 dark:hover:bg-amber-900',
    dot: 'bg-amber-500',
    stripe: 'border-l-amber-500',
  },
};

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
/// «$15.000»
export const formatCLP = (amount: number) => clp.format(amount);

/// «Socio $10.000 · Infantil $5.000»
export const formatFees = (fees: Fee[]) =>
  fees.map((f) => `${f.label} ${formatCLP(f.amount)}`).join(' · ');

/// ID de un video de YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? null;
}

const dateTimeFormat = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
/// «Viernes, 9 de octubre, 18:00»
export const formatDateTime = (iso: string | Date) => capitalize(dateTimeFormat.format(new Date(iso)));

/// «1,2 MB»
export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`;
}
