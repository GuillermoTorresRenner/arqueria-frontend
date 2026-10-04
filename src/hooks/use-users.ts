import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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

/// «Enviar correo de acceso»: invitación si la cuenta no se activó, enlace de
/// recuperación si ya está activa. El admin nunca elige la contraseña.
export const useSendAccessEmail = () =>
  useStaffMutation((id: string) =>
    api
      .post<{ kind: 'invite' | 'password_reset'; sent: boolean }>(`/users/${id}/access-email`)
      .then((r) => r.data),
  );

/// Baja lógica: el usuario no puede entrar, pero conserva su histórico.
export const useSetUserActive = () =>
  useStaffMutation(({ id, active }: { id: string; active: boolean }) =>
    active
      ? api.patch(`/users/${id}/activate`).then((r) => r.data)
      : api.delete(`/users/${id}`).then((r) => r.data),
  );
