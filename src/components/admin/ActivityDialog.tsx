import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellRing, MapPin, Settings2, Trash2, Users } from 'lucide-react';
import {
  useActivityDetail,
  useCreateActivity,
  useDeleteActivity,
  useNotifyActivity,
  usePlaces,
  useUpdateActivity,
  usePaymentDefaults,
  useWeatherPreview,
  uploadTournamentDocument,
  type ActivityInput,
  type TournamentInput,
} from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import {
  ACTIVITY_TYPES,
  fromLocalInputs,
  hasForecast,
  toLocalInputs,
  youtubeId,
} from '@/lib/activities';
import { EXPERIENCE_OPTIONS } from '@/lib/join';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { WeatherPanel } from '@/components/activities/WeatherInfo';
import { PlacesDialog } from '@/components/admin/PlacesDialog';
import { RegistrationsList } from '@/components/admin/RegistrationsList';
import { TournamentFields } from '@/components/admin/TournamentFields';
import {
  EMPTY_TOURNAMENT,
  paymentToForm,
  type TournamentFormState,
} from '@/lib/tournament-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Activity, ActivityDetail, ActivityType } from '@/types';

const SELECT =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const EXPERIENCE_LABEL = Object.fromEntries(EXPERIENCE_OPTIONS.map((o) => [o.value, o.label]));

const dateTimeFormat = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const SAVED_LABEL: Record<ActivityType, string> = {
  ACTIVITY: 'Actividad agendada',
  EVENT: 'Evento agendado',
  TOURNAMENT: 'Torneo agendado',
};

const notifiedToast = (recipients: number) =>
  recipients === 0
    ? 'No hay socios activos a quienes avisar'
    : `Avisando por correo a ${recipients === 1 ? '1 socio' : `${recipients} socios`}`;

/**
 * Crear o editar una actividad. Al crearla se pregunta si avisar a los socios;
 * si se dice que no, la opción queda guardada y se puede activar después.
 */
export function ActivityDialog({
  activity,
  defaultDate,
  onClose,
}: {
  /// null: nueva actividad
  activity: Activity | null;
  /// Día elegido en el calendario para una actividad nueva
  defaultDate?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'details' | 'people'>('details');
  // El formulario necesita el detalle completo (jueces, pago, documentos) y
  // se mantiene al día (aviso enviado, inscripciones) sin cerrar el diálogo
  const { data: detail, isLoading } = useActivityDetail(activity?.id ?? null);
  const isTournament = detail?.type === 'TOURNAMENT';
  const people = isTournament
    ? `Inscripciones (${detail?.tournament?.registrations.length ?? 0})`
    : `Asistentes (${detail?._count.attendances ?? activity?._count.attendances ?? 0})`;
  const kind = ACTIVITY_TYPES[detail?.type ?? activity?.type ?? 'ACTIVITY'].label.toLowerCase();

  return (
    <Modal
      title={activity ? `Editar ${kind}` : 'Agendar en el calendario'}
      onClose={onClose}
      className="max-w-3xl"
    >
      {activity && (
        <div role="tablist" className="mb-5 flex gap-1 border-b">
          {(
            [
              ['details', 'Detalles'],
              ['people', people],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                tab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activity && (isLoading || !detail) ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-10 skeleton" />
          <div className="h-40 skeleton" />
        </div>
      ) : activity && tab === 'people' ? (
        isTournament ? (
          <RegistrationsList registrations={detail?.tournament?.registrations ?? []} />
        ) : (
          <AttendeesList activityId={activity.id} />
        )
      ) : (
        <ActivityForm activity={detail ?? null} defaultDate={defaultDate} onDone={onClose} />
      )}
    </Modal>
  );
}

/// Ficha del torneo guardada → estado del formulario
function tournamentToForm(t: ActivityDetail['tournament']): TournamentFormState {
  if (!t) return EMPTY_TOURNAMENT;
  const end = t.registrationEnd ? toLocalInputs(t.registrationEnd) : null;
  return {
    judgeIds: t.judges.map((j) => j.user.id),
    rules: t.rules ?? '',
    youtubeUrl: t.youtubeUrl ?? '',
    registrationEndDate: end?.date ?? '',
    registrationEndTime: end?.time ?? '23:59',
    maxParticipants: t.maxParticipants ? String(t.maxParticipants) : '',
    payment: paymentToForm(t.paymentInfo),
  };
}

function ActivityForm({
  activity,
  defaultDate,
  onDone,
}: {
  activity: ActivityDetail | null;
  defaultDate?: string;
  onDone: () => void;
}) {
  const start = activity ? toLocalInputs(activity.startsAt) : null;
  const end = activity ? toLocalInputs(activity.endsAt) : null;
  const [type, setType] = useState<ActivityType>(activity?.type ?? 'ACTIVITY');
  const [tournament, setTournament] = useState<TournamentFormState>(() =>
    tournamentToForm(activity?.tournament ?? null),
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [title, setTitle] = useState(activity?.title ?? '');
  const [date, setDate] = useState(start?.date ?? defaultDate ?? '');
  const [startTime, setStartTime] = useState(start?.time ?? '10:00');
  const [endTime, setEndTime] = useState(end?.time ?? '13:00');
  const [placeId, setPlaceId] = useState(activity?.placeId ?? '');
  const [recommendations, setRecommendations] = useState(activity?.recommendations ?? '');
  const [notifyMembers, setNotifyMembers] = useState(activity?.notifyMembers ?? false);
  const [error, setError] = useState<string | null>(null);
  const [placesOpen, setPlacesOpen] = useState(false);

  const { data: places } = usePlaces();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const notifyActivity = useNotifyActivity();
  const deleteActivity = useDeleteActivity();
  const confirm = useConfirm();
  const [uploading, setUploading] = useState(false);
  const saving = createActivity.isPending || updateActivity.isPending || uploading;
  const isTournament = type === 'TOURNAMENT';

  // Un torneo nuevo arranca con los datos de pago del anterior
  const defaults = usePaymentDefaults(isTournament && !activity?.tournament);
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (prefilled || !defaults.data) return;
    setPrefilled(true);
    setTournament((t) => ({ ...t, payment: paymentToForm(defaults.data) }));
  }, [defaults.data, prefilled]);

  const patchTournament = (patch: Partial<TournamentFormState>) =>
    setTournament((t) => ({ ...t, ...patch }));

  /// Valida y arma la ficha del torneo; devuelve un mensaje si algo falla
  const buildTournament = (): TournamentInput | string => {
    const t = tournament;
    if (t.youtubeUrl.trim() && !youtubeId(t.youtubeUrl)) {
      return 'El enlace del video debe ser de YouTube';
    }
    // Filas vacías se ignoran; una a medio llenar es un error
    const rows = t.payment.fees.filter((f) => f.label.trim() || f.amount);
    if (rows.some((f) => !f.label.trim() || f.amount === '')) {
      return 'Cada monto necesita un concepto y un valor';
    }
    const fees = rows.map((f) => ({ label: f.label.trim(), amount: Number(f.amount) }));
    const max = t.maxParticipants ? Number(t.maxParticipants) : null;
    if (max !== null && (!Number.isInteger(max) || max < 1)) return 'El cupo debe ser un número mayor que cero';
    return {
      judgeIds: t.judgeIds,
      rules: t.rules || null,
      youtubeUrl: t.youtubeUrl.trim() || null,
      registrationEnd: t.registrationEndDate
        ? fromLocalInputs(t.registrationEndDate, t.registrationEndTime || '23:59')
        : null,
      maxParticipants: max,
      paymentInfo: { ...t.payment, fees },
    };
  };

  /// Sube los reglamentos que esperaban a que el torneo existiera
  const uploadPending = async (activityId: string) => {
    if (!pendingFiles.length) return;
    setUploading(true);
    try {
      for (const file of pendingFiles) await uploadTournamentDocument(activityId, file);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Algún documento no se pudo subir'), {
        description: 'Ábrelo de nuevo para intentarlo otra vez.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Lugares activos y, al editar, el actual aunque esté desactivado
  const placeOptions = (places ?? []).filter((p) => p.isActive || p.id === activity?.placeId);

  const schedule = useMemo(() => {
    if (!date || !startTime || !endTime || endTime <= startTime) return null;
    return { startsAt: fromLocalInputs(date, startTime), endsAt: fromLocalInputs(date, endTime) };
  }, [date, startTime, endTime]);

  const forecastable = schedule && placeId && hasForecast(schedule.startsAt, schedule.endsAt);
  const weather = useWeatherPreview(forecastable ? { placeId, ...schedule } : null);

  const ended = activity ? new Date(activity.endsAt).getTime() < Date.now() : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError('El título debe tener al menos 3 caracteres');
    if (!date) return setError('Elige la fecha');
    if (!schedule) return setError('La hora de término debe ser posterior a la de inicio');

    let tournamentInput: TournamentInput | undefined;
    if (isTournament) {
      const built = buildTournament();
      if (typeof built === 'string') return setError(built);
      tournamentInput = built;
    }

    const input: ActivityInput = {
      type,
      tournament: tournamentInput,
      title: title.trim(),
      ...schedule,
      placeId: placeId || null,
      recommendations: recommendations || null,
    };

    if (!activity) {
      const past = new Date(schedule.endsAt).getTime() < Date.now();
      // La pregunta del aviso: la respuesta se guarda en la actividad
      const notify =
        !past &&
        (await confirm({
          title: '¿Avisar a los socios por correo?',
          description:
            'Enviaremos a todos los socios activos los datos de la actividad, las recomendaciones y el pronóstico. Si eliges «Ahora no», podrás avisarles más adelante desde la edición.',
          confirmLabel: 'Sí, avisar ahora',
          cancelLabel: 'Ahora no',
        }));
      createActivity.mutate(
        { ...input, notifyMembers: notify },
        {
          onSuccess: async (saved) => {
            await uploadPending(saved.id);
            toast.success(SAVED_LABEL[type], {
              description: saved.notification
                ? notifiedToast(saved.notification.recipients)
                : undefined,
            });
            onDone();
          },
          onError: (err) => setError(apiErrorMessage(err, 'No se pudo guardar')),
        },
      );
      return;
    }

    updateActivity.mutate(
      { id: activity.id, ...input, notifyMembers },
      {
        onSuccess: (saved) => {
          toast.success('Cambios guardados', {
            description: saved.notification
              ? notifiedToast(saved.notification.recipients)
              : undefined,
          });
          onDone();
        },
        onError: (err) => setError(apiErrorMessage(err, 'No se pudo guardar')),
      },
    );
  };

  const notifyAgain = async () => {
    if (!activity) return;
    const ok = await confirm({
      title: '¿Volver a avisar a los socios?',
      description:
        'Se enviará otra vez el correo con los datos guardados de la actividad. Útil si cambiaste la hora o el lugar: guarda los cambios antes de avisar.',
      confirmLabel: 'Avisar de nuevo',
    });
    if (!ok) return;
    notifyActivity.mutate(activity.id, {
      onSuccess: (saved) => toast.success(notifiedToast(saved.notification?.recipients ?? 0)),
      onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo enviar el aviso')),
    });
  };

  const remove = async () => {
    if (!activity) return;
    const attendees = activity._count.attendances;
    const registered = activity.tournament?.registrations.length ?? 0;
    const ok = await confirm({
      title: `¿Eliminar «${activity.title}»?`,
      description:
        registered > 0
          ? `Se borran el torneo, sus ${registered === 1 ? 'una inscripción' : `${registered} inscripciones`} y los reglamentos subidos. No se avisa a los inscritos por correo: si alguno ya pagó, gestiona la devolución.`
          : attendees > 0
            ? `${attendees === 1 ? 'Un socio había' : `${attendees} socios habían`} confirmado asistencia. No se les avisará de la cancelación por correo.`
            : 'No se puede deshacer.',
      confirmLabel: 'Eliminar actividad',
      tone: 'danger',
    });
    if (!ok) return;
    deleteActivity.mutate(activity.id, {
      onSuccess: () => {
        toast.success('Actividad eliminada');
        onDone();
      },
      onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo eliminar')),
    });
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Tipo</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ACTIVITY_TYPES) as ActivityType[]).map((key) => {
              const t = ACTIVITY_TYPES[key];
              // Un torneo con inscritos no puede cambiar de tipo
              const locked =
                activity?.type === 'TOURNAMENT' &&
                key !== 'TOURNAMENT' &&
                (activity.tournament?.registrations.length ?? 0) > 0;
              return (
                <label
                  key={key}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2.5 text-center text-sm font-medium transition-colors has-[:checked]:ring-2 has-[:checked]:ring-primary sm:flex-row sm:justify-center sm:gap-2',
                    type === key ? t.badge : 'hover:bg-accent',
                    locked && 'cursor-not-allowed opacity-50',
                  )}
                  title={locked ? 'El torneo ya tiene inscritos' : undefined}
                >
                  <input
                    type="radio"
                    name="activity-type"
                    value={key}
                    checked={type === key}
                    disabled={locked}
                    onChange={() => setType(key)}
                    className="sr-only"
                  />
                  <t.icon className="h-4 w-4" aria-hidden="true" />
                  {t.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="activity-title">Nombre</Label>
          <Input
            id="activity-title"
            value={title}
            maxLength={120}
            placeholder={
              isTournament
                ? 'Copa Galadhrym de primavera'
                : type === 'EVENT'
                  ? 'Aniversario del club'
                  : 'Jornada de tiro, clase de iniciación…'
            }
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="activity-date">Fecha</Label>
            <Input id="activity-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-start">Desde</Label>
            <Input
              id="activity-start"
              type="time"
              step={300}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-end">Hasta</Label>
            <Input
              id="activity-end"
              type="time"
              step={300}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="activity-place">Lugar</Label>
            <button
              type="button"
              onClick={() => setPlacesOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              Gestionar lugares
            </button>
          </div>
          <select
            id="activity-place"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className={SELECT}
          >
            <option value="">Sin lugar definido</option>
            {placeOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.address ? ` · ${p.address}` : ''}
                {p.isActive === false ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
          {places && places.length === 0 && (
            <p className="text-xs text-muted-foreground">
              <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Aún no hay lugares guardados: crea uno en «Gestionar lugares».
            </p>
          )}
        </div>

        {/* Pronóstico del día elegido, antes de guardar */}
        {placeId && schedule && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pronóstico</p>
            {forecastable ? (
              <WeatherPanel weather={weather.data} isLoading={weather.isLoading} />
            ) : (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                {new Date(schedule.endsAt).getTime() < Date.now()
                  ? 'La fecha ya pasó.'
                  : 'El pronóstico estará disponible 16 días antes de la actividad.'}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="activity-recommendations">Recomendaciones (opcional)</Label>
          <RichTextEditor
            id="activity-recommendations"
            value={recommendations}
            onChange={setRecommendations}
          />
        </div>

        {isTournament && (
          <TournamentFields
            value={tournament}
            onChange={patchTournament}
            activityId={activity?.tournament ? activity.id : null}
            documents={activity?.tournament?.documents ?? []}
            pendingFiles={pendingFiles}
            onPendingFiles={setPendingFiles}
          />
        )}

        {/* Aviso a los socios: la opción persiste en la actividad */}
        {activity && !ended && (
          <div className="rounded-md border bg-secondary/40 p-4 text-sm">
            {activity.notifiedAt ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-start gap-2">
                  <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Avisada el {dateTimeFormat.format(new Date(activity.notifiedAt))}
                    {activity.notifiedCount != null &&
                      ` a ${activity.notifiedCount === 1 ? '1 socio' : `${activity.notifiedCount} socios`}`}
                    .
                  </span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={notifyAgain}
                  disabled={notifyActivity.isPending}
                >
                  Volver a avisar
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={notifyMembers}
                  onChange={(e) => setNotifyMembers(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    Avisar a los socios por correo
                  </span>
                  <span className="block text-muted-foreground">
                    Aún no se ha avisado. Al guardar con esta opción marcada se envía el correo a
                    todos los socios activos.
                  </span>
                </span>
              </label>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {activity ? (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : activity ? 'Guardar cambios' : `Agendar ${ACTIVITY_TYPES[type].label.toLowerCase()}`}
            </Button>
          </div>
        </div>
      </form>

      {placesOpen && (
        <PlacesDialog
          onClose={() => setPlacesOpen(false)}
          onCreated={(place) => setPlaceId(place.id)}
        />
      )}
    </>
  );
}

function AttendeesList({ activityId }: { activityId: string }) {
  const { data, isLoading } = useActivityDetail(activityId);

  if (isLoading) return <div className="h-32 skeleton" />;
  const list = data?.attendances ?? [];
  if (!list.length) {
    return (
      <p className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Users className="h-6 w-6" aria-hidden="true" />
        Ningún socio ha confirmado asistencia todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Socio</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">Experiencia</th>
            <th className="px-3 py-2 font-medium">Confirmó</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {list.map(({ member, createdAt }) => (
            <tr key={member.id}>
              <td className="px-3 py-2">
                <p className="font-medium">
                  {[member.user.name, member.user.surname].filter(Boolean).join(' ') ||
                    member.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nº {member.memberNumber} · {member.user.email}
                </p>
              </td>
              <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                {member.experience ? EXPERIENCE_LABEL[member.experience] : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                {dateTimeFormat.format(new Date(createdAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
