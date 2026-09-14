import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Block, Section } from '@/types';

export function usePublicContent() {
  return useQuery({
    queryKey: ['content', 'public'],
    queryFn: async () => (await api.get<Section[]>('/content/public')).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSections() {
  return useQuery({
    queryKey: ['content', 'sections'],
    queryFn: async () => (await api.get<Section[]>('/content/sections')).data,
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Block> & { id: string }) =>
      (await api.patch(`/content/blocks/${id}`, body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Block> & { sectionId: string }) =>
      (await api.post('/content/blocks', body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/content/blocks/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Section> & { id: string }) =>
      (await api.patch(`/content/sections/${id}`, body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}
