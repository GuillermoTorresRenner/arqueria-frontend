import type { Place } from '@/types';

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
