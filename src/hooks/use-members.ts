import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Member, MemberStatus } from '@/types';

export function useMembers(status?: MemberStatus) {
  return useQuery({
    queryKey: ['members', status ?? 'all'],
    queryFn: async () =>
      (await api.get<Member[]>('/members', { params: status ? { status } : {} })).data,
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
