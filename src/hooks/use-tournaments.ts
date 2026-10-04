import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Leaderboard, Tournament } from '@/types';

export function usePublicTournaments() {
  return useQuery({
    queryKey: ['tournaments', 'public'],
    queryFn: async () => (await api.get<Tournament[]>('/tournaments/public')).data,
  });
}

export function useTournamentBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['tournaments', 'public', slug],
    queryFn: async () =>
      (await api.get<Tournament>(`/tournaments/public/${slug}`)).data,
    enabled: Boolean(slug),
  });
}

export function useLeaderboard(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', tournamentId],
    queryFn: async () =>
      (await api.get<Leaderboard>(`/scoring/leaderboard/${tournamentId}`)).data,
    enabled: Boolean(tournamentId),
  });
}

export function useAdminTournaments() {
  return useQuery({
    queryKey: ['tournaments', 'admin'],
    // El listado de admin es paginado ({ data, pagination }). Un club no
    // acumula más de 100 torneos en años, así que se pide todo de una vez.
    queryFn: async () =>
      (await api.get<{ data: Tournament[] }>('/tournaments', { params: { limit: 100 } }))
        .data.data,
  });
}
