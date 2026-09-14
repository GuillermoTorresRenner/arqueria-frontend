import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { Leaderboard } from '@/types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/api\/?$/, '');

/**
 * Sigue el marcador en vivo de un torneo. El backend emite el ranking ya
 * calculado, así que aquí solo se escribe en la caché de React Query y los
 * componentes que lo usan se re-renderizan solos.
 */
export function useLiveScoring(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const socket: Socket = io(`${SOCKET_URL}/scoring`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('joinTournament', { tournamentId });
    });

    socket.on('leaderboard', (payload: Leaderboard) => {
      queryClient.setQueryData(['leaderboard', tournamentId], payload);
    });

    return () => {
      socket.emit('leaveTournament', { tournamentId });
      socket.disconnect();
    };
  }, [tournamentId, queryClient]);
}
