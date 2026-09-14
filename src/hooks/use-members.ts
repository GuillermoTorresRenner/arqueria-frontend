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
