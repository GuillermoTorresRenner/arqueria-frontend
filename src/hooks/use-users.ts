import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth-store';
import type { Role, User } from '@/types';

/// Roles del equipo que se gestionan desde «Usuarios». Los socios (MEMBER)
/// tienen su propia pantalla.
export type StaffRole = Extract<Role, 'ADMIN' | 'JUDGE'>;

export interface UserInput {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  role: StaffRole;
}

const STAFF_KEY = ['users', 'staff'];

/// Administradores y jueces. El endpoint filtra por un solo rol, así que se
/// piden los dos en paralelo; el equipo de un club cabe holgado en 100.
export function useStaffUsers() {
  return useQuery({
    queryKey: STAFF_KEY,
    queryFn: async () => {
      const byRole = (role: StaffRole) =>
        api
          .get<{ data: User[] }>('/users', {
            params: { role, limit: 100, sortBy: 'name', sortOrder: 'asc' },
          })
          .then((r) => r.data.data);
      const [admins, judges] = await Promise.all([byRole('ADMIN'), byRole('JUDGE')]);
      return [...admins, ...judges];
    },
  });
}

function useStaffMutation<T, R>(fn: (vars: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

/// Alta sin contraseña: el backend envía la invitación para que la cree el
/// propio usuario. Devuelve si el correo salió.
export const useCreateUser = () =>
  useStaffMutation((body: UserInput) =>
    api.post<User & { emailSent: boolean }>('/users', body).then((r) => r.data),
  );

export const useUpdateUser = () =>
  useStaffMutation(({ id, ...body }: Partial<UserInput> & { id: string; isActive?: boolean }) =>
    api.patch(`/users/${id}`, body).then((r) => r.data),
  );

/// Baja lógica: el usuario no puede entrar, pero conserva su histórico.
export const useSetUserActive = () =>
  useStaffMutation(({ id, active }: { id: string; active: boolean }) =>
    active
      ? api.patch(`/users/${id}/activate`).then((r) => r.data)
      : api.delete(`/users/${id}`).then((r) => r.data),
  );

// ---------- Avatar de otro usuario (admin) ----------

/// Sube o quita el avatar de un usuario del equipo
export const useUserAvatar = () =>
  useStaffMutation(({ id, file }: { id: string; file: File | null }) => {
    if (!file) return api.delete<User>(`/users/${id}/avatar`).then((r) => r.data);
    const body = new FormData();
    body.append('avatar', file);
    return api.patch<User>(`/users/${id}`, body).then((r) => r.data);
  });

// ---------- Mi perfil ----------

export interface ProfileInput {
  name: string;
  surname: string;
  phone?: string;
}

/// Tras cada cambio, el usuario de la sesión se actualiza: así el navbar
/// muestra al instante el nombre y la foto nuevos.
function useProfileMutation<T>(fn: (vars: T) => Promise<User>) {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export const useUpdateMe = () =>
  useProfileMutation((body: ProfileInput) =>
    api.patch<User>('/users/me', body).then((r) => r.data),
  );

/// Sube (con archivo) o quita (con null) mi avatar
export const useMyAvatar = () =>
  useProfileMutation((file: File | null) => {
    if (!file) return api.delete<User>('/users/me/avatar').then((r) => r.data);
    const body = new FormData();
    body.append('avatar', file);
    return api.patch<User>('/users/me', body).then((r) => r.data);
  });

export const useChangeMyPassword = () =>
  useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.patch('/users/me/password', body).then((r) => r.data),
  });
