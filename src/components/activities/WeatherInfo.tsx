import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Wind,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useActivityWeather } from '@/hooks/use-activities';
import { hasForecast } from '@/lib/activities';
import { cn } from '@/lib/utils';
import type { ActivityWeather, WeatherStatus } from '@/types';

/// Icono según el código WMO del pronóstico
function weatherIcon(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 86) return CloudSnow;
  return CloudLightning;
}

const STATUS: Record<WeatherStatus, { icon: LucideIcon; className: string }> = {
  good: {
    icon: CheckCircle2,
    className:
      'border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  caution: {
    icon: AlertTriangle,
    className:
      'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  },
  bad: {
    icon: XCircle,
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
};

/**
 * Pronóstico de una actividad con su estado (bueno, precaución,
 * desfavorable) y los motivos. `compact` muestra una sola línea, para
 * tarjetas y listas.
 */
export function WeatherPanel({
  weather,
  isLoading,
  compact = false,
  className,
}: {
  weather?: ActivityWeather;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return <div className={cn('h-10 skeleton', className)} aria-label="Cargando pronóstico" />;
  }
  if (!weather) return null;

  if (!weather.available) {
    // En una tarjeta no se ocupa espacio para decir que aún no hay pronóstico
    if (compact) return null;
    return (
      <p className={cn('rounded-md border border-dashed p-3 text-xs text-muted-foreground', className)}>
        {weather.message}
      </p>
    );
  }

  const c = weather.during ?? weather.day;
  const Icon = weatherIcon(c.code);
  const status = STATUS[weather.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn('rounded-md border p-3 text-sm', status.className, className)}
      role="status"
      aria-label={`Pronóstico: ${c.description}. ${weather.statusLabel}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <StatusIcon className="h-4 w-4" aria-hidden="true" />
          {weather.statusLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {c.description}, {c.tempMin === c.tempMax ? `${c.tempMax}` : `${c.tempMin}–${c.tempMax}`} °C
        </span>
        {!compact && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="h-4 w-4" aria-hidden="true" />
              {c.precipitationProbability} %
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wind className="h-4 w-4" aria-hidden="true" />
              hasta {c.gustsMax} km/h
            </span>
          </>
        )}
      </div>
      {!compact && weather.reasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs opacity-90">
          {weather.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {!compact && (
        <p className="mt-2 text-[11px] opacity-75">
          {weather.during ? 'En las horas de la actividad' : 'Para todo el día'} · Pronóstico de
          Open-Meteo, puede cambiar.
        </p>
      )}
    </div>
  );
}

/// Pronóstico de una actividad guardada; no pide nada fuera de los 16 días
export function ActivityWeatherPanel({
  activity,
  compact,
  className,
}: {
  activity: { id: string; startsAt: string; endsAt: string };
  compact?: boolean;
  className?: string;
}) {
  const enabled = hasForecast(activity.startsAt, activity.endsAt);
  const { data, isLoading } = useActivityWeather(activity.id, enabled);
  if (!enabled) return null;
  return <WeatherPanel weather={data} isLoading={isLoading} compact={compact} className={className} />;
}
