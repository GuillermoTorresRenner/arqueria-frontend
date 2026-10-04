import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Activity,
  ActivityDetail,
  ActivityType,
  ActivityWeather,
  MemberActivity,
  PaymentInfo,
  Place,
  PublicActivity,
  RegistrationStatus,
  TournamentDocument,
} from '@/types';

/// Datos propios de un torneo al guardarlo
export interface TournamentInput {
  judgeIds: string[];
  rules: string | null;
  youtubeUrl: string | null;
  registrationEnd: string | null;
  maxParticipants: number | null;
  paymentInfo: PaymentInfo | null;
}

export interface ActivityInput {
  type: ActivityType;
  title: string;
  startsAt: string;
  endsAt: string;
  placeId: string | null;
  recommendations: string | null;
  notifyMembers?: boolean;
  tournament?: TournamentInput;
}

export type PlaceInput = Pick<Place, 'name' | 'address' | 'latitude' | 'longitude'> & {
  isActive?: boolean;
};

/// Resultado del buscador de OpenStreetMap (vía backend)
export interface GeocodingResult {
  name: string;
  /// Calle y número, comuna
  address: string;
  latitude: number;
  longitude: number;
}

type SavedActivity = Activity & { notification: { recipients: number } | null };

// ---------- Público y socios ----------

export function useUpcomingActivities(limit = 6) {
  return useQuery({
    queryKey: ['activities', 'upcoming', limit],
    queryFn: async () =>
      (await api.get<PublicActivity[]>('/activities/upcoming', { params: { limit } })).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemberActivities(enabled = true) {
  return useQuery({
    queryKey: ['activities', 'member'],
    queryFn: async () =>
      (await api.get<{ canAttend: boolean; activities: MemberActivity[] }>('/activities/member'))
        .data,
    enabled,
  });
}

export function useSetAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attending }: { id: string; attending: boolean }) =>
      (
        await (attending
          ? api.post(`/activities/${id}/attendance`)
          : api.delete(`/activities/${id}/attendance`))
      ).data as { id: string; attending: boolean; attendees: number },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

/// Pronóstico de una actividad guardada. Solo se pide cuando puede haberlo
/// (los próximos 16 días); el backend lo cachea media hora.
export function useActivityWeather(id: string, enabled = true) {
  return useQuery({
    queryKey: ['activities', 'weather', id],
    queryFn: async () => (await api.get<ActivityWeather>(`/activities/${id}/weather`)).data,
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

// ---------- Administración ----------

export function useActivitiesRange(from: Date, to: Date) {
  const params = { from: from.toISOString(), to: to.toISOString() };
  return useQuery({
    queryKey: ['activities', 'range', params],
    queryFn: async () => (await api.get<Activity[]>('/activities', { params })).data,
    // Al cambiar de mes se mantiene el anterior hasta que llega el nuevo
    placeholderData: keepPreviousData,
  });
}

export function useActivityDetail(id: string | null) {
  return useQuery({
    queryKey: ['activities', 'detail', id],
    queryFn: async () => (await api.get<ActivityDetail>(`/activities/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useWeatherPreview(params: { placeId: string; startsAt: string; endsAt: string } | null) {
  return useQuery({
    queryKey: ['activities', 'weather-preview', params],
    queryFn: async () =>
      (await api.get<ActivityWeather>('/activities/weather-preview', { params: params! })).data,
    enabled: Boolean(params),
    staleTime: 30 * 60 * 1000,
  });
}

function useActivitiesMutation<T>(fn: (input: T) => Promise<SavedActivity>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useCreateActivity() {
  return useActivitiesMutation(
    async (input: ActivityInput) => (await api.post<SavedActivity>('/activities', input)).data,
  );
}

export function useUpdateActivity() {
  return useActivitiesMutation(
    async ({ id, ...input }: Partial<ActivityInput> & { id: string }) =>
      (await api.patch<SavedActivity>(`/activities/${id}`, input)).data,
  );
}

export function useNotifyActivity() {
  return useActivitiesMutation(
    async (id: string) => (await api.post<SavedActivity>(`/activities/${id}/notify`)).data,
  );
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/activities/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

// ---------- Lugares ----------

export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async () => (await api.get<Place[]>('/places')).data,
  });
}

function usePlacesMutation<T, R = Place>(fn: (input: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useCreatePlace() {
  return usePlacesMutation(
    async (input: PlaceInput) => (await api.post<Place>('/places', input)).data,
  );
}

export function useUpdatePlace() {
  return usePlacesMutation(
    async ({ id, ...input }: Partial<PlaceInput> & { id: string }) =>
      (await api.patch<Place>(`/places/${id}`, input)).data,
  );
}

export function useDeletePlace() {
  return usePlacesMutation(async (id: string) => (await api.delete(`/places/${id}`)).data);
}

export async function geocode(q: string) {
  return (await api.get<GeocodingResult[]>('/places/geocode', { params: { q } })).data;
}

/// Dirección del punto marcado en el mapa (null si no hay nada cerca)
export async function reverseGeocode(lat: number, lon: number) {
  return (
    await api.get<GeocodingResult | null>('/places/reverse', { params: { lat, lon } })
  ).data;
}

// ---------- Torneos ----------

/// Datos de pago del último torneo, para precargar uno nuevo
export function usePaymentDefaults(enabled: boolean) {
  return useQuery({
    queryKey: ['activities', 'payment-defaults'],
    queryFn: async () =>
      (await api.get<PaymentInfo | null>('/activities/payment-defaults')).data,
    enabled,
    staleTime: Infinity,
  });
}

export async function uploadTournamentDocument(activityId: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  return (await api.post<TournamentDocument>(`/activities/${activityId}/documents`, body)).data;
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/activities/documents/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

/// Preinscripción del socio (o su retiro)
export function useTournamentRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, register }: { id: string; register: boolean }) =>
      (
        await (register
          ? api.post(`/activities/${id}/registration`)
          : api.delete(`/activities/${id}/registration`))
      ).data as { status: RegistrationStatus | null; emailSent?: boolean },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

/// El admin confirma el pago (CONFIRMED) o devuelve a pendiente
export function useSetRegistrationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING' | 'CONFIRMED' }) =>
      (await api.patch(`/activities/registrations/${id}`, { status })).data as {
        status: RegistrationStatus;
        emailSent: boolean | null;
      },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/activities/registrations/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  });
}
