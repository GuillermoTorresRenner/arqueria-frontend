import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth-store';
import type { User } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (payload: LoginPayload) =>
      (await api.post<{ user: User }>('/auth/login', payload)).data,
    onSuccess: (data) => setUser(data.user),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      // Aunque el backend falle, hay que limpiar el estado local igualmente.
      try {
        // El backend lo expone como GET (limpia las cookies httpOnly)
        await api.get('/auth/logout');
      } catch {
        /* sin efecto: la sesión local se limpia de todos modos */
      }
    },
    onSettled: () => logout(),
  });
}

/**
 * Al abrir la app con sesión, relee el usuario: el guardado en el navegador
 * puede estar viejo (foto, nombre o rol cambiados desde otro dispositivo o por
 * un admin). Si la sesión ya no vale, el interceptor de la API la cierra.
 */
export function useRefreshSession() {
  const hasUser = useAuthStore((s) => Boolean(s.user));
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    if (!hasUser) return;
    api
      .get<User>('/users/me')
      .then((r) => setUser(r.data))
      .catch(() => {
        /* sin red o sesión vencida: se queda lo que había */
      });
    // Solo al cargar o al iniciar sesión, no en cada cambio del usuario
  }, [hasUser, setUser]);
}
