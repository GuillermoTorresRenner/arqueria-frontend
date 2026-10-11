import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth-store';
import { useChangeMyPassword, useMyAvatar, useUpdateMe } from '@/hooks/use-users';
import { apiErrorMessage } from '@/lib/api';
import { AvatarField } from '@/components/AvatarField';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_LABEL = { ADMIN: 'Administrador', JUDGE: 'Juez', MEMBER: 'Socio' } as const;

/// Mismas reglas que el backend (CreateUserDto)
const profileSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  surname: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || /^\+?[\d\s()-]{8,20}$/.test(v), 'El teléfono no tiene un formato válido'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Indica tu contraseña actual'),
    newPassword: z
      .string()
      .min(6, 'Debe tener al menos 6 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe incluir mayúscula, minúscula y número'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/**
 * Mi perfil: foto, nombre, apellido, teléfono y contraseña del usuario que
 * inició sesión. El correo es el acceso a la cuenta y lo cambia un admin.
 */
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const avatar = useMyAvatar();
  const changePassword = useChangeMyPassword();

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', surname: user?.surname ?? '', phone: user?.phone ?? '' },
  });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  if (!user) return null;

  const saveProfile = (values: ProfileValues) =>
    updateMe.mutate(
      // Sin teléfono no se envía: el DTO lo valida si llega vacío
      { name: values.name, surname: values.surname, phone: values.phone || undefined },
      {
        onSuccess: () => {
          toast.success('Perfil actualizado');
          profile.reset(values);
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar')),
      },
    );

  const savePassword = ({ currentPassword, newPassword }: PasswordValues) =>
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada');
          password.reset();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo cambiar la contraseña')),
      },
    );

  const setAvatar = (file: File | null) =>
    avatar.mutate(file, {
      onSuccess: () => toast.success(file ? 'Foto actualizada' : 'Foto eliminada'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo actualizar la foto')),
    });

  const pErrors = profile.formState.errors;
  const wErrors = password.formState.errors;

  return (
    <Modal title="Mi perfil" onClose={onClose} className="max-w-xl">
      <div className="space-y-8">
        <section className="space-y-3">
          <AvatarField
            user={user}
            pending={avatar.isPending}
            onUpload={setAvatar}
            onRemove={() => setAvatar(null)}
          />
          <p className="text-sm text-muted-foreground">
            {user.email} · {ROLE_LABEL[user.role]}
          </p>
        </section>

        <form onSubmit={profile.handleSubmit(saveProfile)} className="space-y-4" noValidate>
          <h3 className="text-sm font-semibold">Datos personales</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-name" label="Nombre" error={pErrors.name?.message}>
              <Input id="profile-name" autoComplete="given-name" {...profile.register('name')} />
            </Field>
            <Field id="profile-surname" label="Apellido" error={pErrors.surname?.message}>
              <Input id="profile-surname" autoComplete="family-name" {...profile.register('surname')} />
            </Field>
          </div>
          <Field id="profile-phone" label="Teléfono (opcional)" error={pErrors.phone?.message}>
            <Input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+56 9 1234 5678"
              {...profile.register('phone')}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMe.isPending || !profile.formState.isDirty}>
              {updateMe.isPending ? 'Guardando…' : 'Guardar datos'}
            </Button>
          </div>
        </form>

        <form
          onSubmit={password.handleSubmit(savePassword)}
          className="space-y-4 border-t pt-6"
          noValidate
        >
          <h3 className="text-sm font-semibold">Cambiar contraseña</h3>
          <Field id="profile-current" label="Contraseña actual" error={wErrors.currentPassword?.message}>
            <Input
              id="profile-current"
              type="password"
              autoComplete="current-password"
              {...password.register('currentPassword')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-new" label="Nueva contraseña" error={wErrors.newPassword?.message}>
              <Input
                id="profile-new"
                type="password"
                autoComplete="new-password"
                {...password.register('newPassword')}
              />
            </Field>
            <Field id="profile-confirm" label="Repítela" error={wErrors.confirm?.message}>
              <Input
                id="profile-confirm"
                type="password"
                autoComplete="new-password"
                {...password.register('confirm')}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
