import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import type {
  BracketTournament,
  CategoryBracket,
  MatchDetail,
  ShotPhase,
  StaffCategoryBracket,
} from '@/types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/api\/?$/, '');

// ---------- Lecturas ----------

/// Cuadro de un torneo para el panel (admin y jueces)
export function useStaffBracket(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['bracket', 'staff', tournamentId],
    queryFn: async () =>
      (
        await api.get<{ tournament: BracketTournament; categories: StaffCategoryBracket[] }>(
          `/brackets/tournaments/${tournamentId}`,
        )
      ).data,
    enabled: Boolean(tournamentId),
  });
}

/// Fixture público
export function usePublicBracket(slug: string | undefined) {
  return useQuery({
    queryKey: ['bracket', 'public', slug],
    queryFn: async () =>
      (
        await api.get<{ tournament: BracketTournament; categories: CategoryBracket[] }>(
          `/brackets/public/${slug}`,
        )
      ).data,
    enabled: Boolean(slug),
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['bracket', 'match', matchId],
    queryFn: async () => (await api.get<MatchDetail>(`/brackets/matches/${matchId}`)).data,
    enabled: Boolean(matchId),
  });
}

/**
 * En vivo: el backend avisa por el socket /scoring cada vez que cambia un
 * cuadro del torneo, y aquí se refrescan las consultas del cuadro.
 */
export function useBracketLive(tournamentId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!tournamentId) return;
    const socket: Socket = io(`${SOCKET_URL}/scoring`, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socket.on('connect', () => socket.emit('joinTournament', { tournamentId }));
    socket.on('bracket', () => queryClient.invalidateQueries({ queryKey: ['bracket'] }));
    return () => {
      socket.emit('leaveTournament', { tournamentId });
      socket.disconnect();
    };
  }, [tournamentId, queryClient]);
}

// ---------- Cambios ----------

function useBracketMutation<T, R = unknown>(fn: (vars: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bracket'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export interface DrawInput {
  categoryId: string;
  method: 'ALGORITHM' | 'MANUAL';
  seed?: string;
  pairs?: [number, number][];
  bye?: number | null;
}

export const useDraw = () =>
  useBracketMutation(
    async ({ categoryId, ...body }: DrawInput) =>
      (
        await api.post<{ seed: string | null; pairs: [number, number][]; bye: number | null }>(
          `/brackets/categories/${categoryId}/draw`,
          body,
        )
      ).data,
  );

export const useUndoDraw = () =>
  useBracketMutation(
    async (categoryId: string) => (await api.delete(`/brackets/categories/${categoryId}/draw`)).data,
  );

export const useUpdateRound = () =>
  useBracketMutation(
    async ({ id, ...body }: { id: string; arrowsPerArcher?: number; targetsToWin?: number }) =>
      (await api.patch(`/brackets/rounds/${id}`, body)).data,
  );

export const useCloseRound = () =>
  useBracketMutation(
    async (roundId: string) => (await api.post(`/brackets/rounds/${roundId}/close`)).data,
  );

export const useReopenRound = () =>
  useBracketMutation(
    async (roundId: string) => (await api.post(`/brackets/rounds/${roundId}/reopen`)).data,
  );

export interface ShotInput {
  entryId: string;
  phase: ShotPhase;
  sequence: number;
  zoneLabel?: string;
  hit?: boolean;
  point?: boolean;
}

/// Cada carga devuelve el enfrentamiento recalculado: se escribe directo en
/// la caché para que la pantalla del juez responda al instante
export function useRecordShots(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shots: ShotInput[]) =>
      (await api.put<MatchDetail>(`/brackets/matches/${matchId}/shots`, { shots })).data,
    onSuccess: (match) => {
      queryClient.setQueryData(['bracket', 'match', matchId], match);
      queryClient.invalidateQueries({ queryKey: ['bracket', 'staff'] });
    },
  });
}

export function useDeleteShot(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { phase: ShotPhase; sequence: number; entryId?: string }) =>
      (await api.delete<MatchDetail>(`/brackets/matches/${matchId}/shots`, { params })).data,
    onSuccess: (match) => {
      queryClient.setQueryData(['bracket', 'match', matchId], match);
      queryClient.invalidateQueries({ queryKey: ['bracket', 'staff'] });
    },
  });
}
