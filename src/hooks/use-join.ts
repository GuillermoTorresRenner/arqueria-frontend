import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth-store';
import type { ArcheryExperience } from '@/lib/join';
import type { User } from '@/types';

export interface JoinPayload {
  name: string;
  surname: string;
  birthDate: string;
  email: string;
  experience: ArcheryExperience;
  acceptCommunications: true;
  website?: string;
}

export function useJoinClub() {
  return useMutation({
    mutationFn: async (payload: JoinPayload) =>
      (
        await api.post<{ whatsappUrl: string; emailSent: boolean }>(
          '/members/join',
          payload,
        )
      ).data,
  });
}

/// Contraseña elegida desde un enlace del correo: `activate` (cuenta nueva,
/// confirma el correo) o `reset` (recuperación). En ambos casos queda la
/// sesión iniciada.
export function useSetPassword(mode: 'activate' | 'reset') {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) =>
      (
        await api.post<{ user: User }>(
          mode === 'activate' ? '/auth/verify-email' : '/auth/reset-password',
          payload,
        )
      ).data,
    onSuccess: (data) => setUser(data.user),
  });
}

/// Pide el enlace de recuperación. El backend responde igual exista o no la
/// cuenta, así que el mensaje al usuario también es siempre el mismo.
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) =>
      (await api.post<{ message: string }>('/auth/forgot-password', { email })).data,
  });
}
