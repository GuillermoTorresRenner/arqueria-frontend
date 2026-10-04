import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ArcheryExperience } from '@/lib/join';
import { api } from '@/lib/api';
import type { Member, MemberStatus } from '@/types';

export interface MemberFilters {
  status?: MemberStatus;
  /// Nombre, apellido o correo; con varias palabras, todas deben aparecer
  search?: string;
  experience?: ArcheryExperience;
}

export function useMembers(filters: MemberFilters = {}) {
  // Solo los filtros con valor: así la clave de caché no cambia por un ''
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => (await api.get<Member[]>('/members', { params })).data,
    // Mientras se escribe, se conserva la lista anterior en vez de parpadear
    placeholderData: keepPreviousData,
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MemberStatus }) =>
      (await api.patch(`/members/${id}/status`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

/// Elimina al socio (cuenta y ficha). El backend lo rechaza si ya participó
/// en torneos, para no alterar resultados.
export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/members/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

/// Ficha del socio con sesión iniciada (área «Mi cuenta»).
export function useMyMember(enabled = true) {
  return useQuery({
    queryKey: ['members', 'me'],
    queryFn: async () => (await api.get<Member>('/members/me')).data,
    enabled,
    retry: false,
  });
}
