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

/// Enlace del correo de bienvenida: crea la contraseña, valida el correo y
/// deja la sesión iniciada.
export function useVerifyEmail() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) =>
      (await api.post<{ user: User }>('/auth/verify-email', payload)).data,
    onSuccess: (data) => setUser(data.user),
  });
}
