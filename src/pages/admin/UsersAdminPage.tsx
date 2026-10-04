import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound, Pencil, Plus, UserCheck, UserX, Wand2 } from 'lucide-react';
import {
  useCreateUser,
  useResetPassword,
  useSetUserActive,
  useStaffUsers,
  useUpdateUser,
  type StaffRole,
} from '@/hooks/use-users';
import { useAuthStore } from '@/features/auth-store';
import { apiErrorMessage } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/types';

const ROLES: Record<StaffRole, { label: string; help: string }> = {
  ADMIN: {
    label: 'Administrador',
    help: 'Acceso total: contenido, socios, torneos y usuarios.',
  },
  JUDGE: {
    label: 'Juez de evento',
    help: 'Carga puntajes de los grupos que tenga asignados en un torneo.',
  },
};

/// Mismas reglas que CreateUserDto en el backend: así el error sale en el
/// formulario y no como un 400 después de enviar.
const password = z
  .string()
  .min(6, 'Mínimo 6 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener minúscula, mayúscula y número');

const profile = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60),
  surname: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60),
  email: z.string().trim().email('Correo inválido'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s()-]{8,20})?$/, 'Teléfono inválido')
    .optional(),
  role: z.enum(['ADMIN', 'JUDGE']),
});

const createSchema = profile.extend({ password });
type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof profile>;

/// Contraseña aleatoria que cumple la política (sin caracteres ambiguos como
/// 0/O o 1/l, para poder dictarla). Usa crypto, no Math.random.
function generatePassword(length = 12) {
  const sets = ['abcdefghijkmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789'];
  const all = sets.join('');
  const pick = (chars: string) =>
    chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [...sets.map(pick), ...Array.from({ length: length - 3 }, () => pick(all))];
  // Mezcla para que los obligatorios no queden siempre al principio
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: User }
  | { kind: 'password'; user: User }
  | null;

export function UsersAdminPage() {
  const me = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useStaffUsers();
  const setActive = useSetUserActive();
  const [dialog, setDialog] = useState<Dialog>(null);

  const toggleActive = (user: User) => {
    const name = fullName(user);
    if (user.isActive && !window.confirm(`¿Desactivar a ${name}? No podrá entrar al panel.`)) {
      return;
    }
    setActive.mutate(
      { id: user.id, active: !user.isActive },
      {
        onSuccess: () => toast.success(user.isActive ? `${name} desactivado` : `${name} reactivado`),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo actualizar')),
      },
    );
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administradores del sitio y jueces de los eventos.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo usuario
        </Button>
      </header>

      {isLoading ? (
        <div className="h-48 skeleton" aria-busy="true" />
      ) : !users?.length ? (
        <p className="state-empty">Todavía no hay administradores ni jueces.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th scope="col" className="table-th">Usuario</th>
                <th scope="col" className="table-th hidden sm:table-cell">Rol</th>
                <th scope="col" className="table-th hidden md:table-cell">Estado</th>
                <th scope="col" className="table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const isMe = user.id === me?.id;
                const role = ROLES[user.role as StaffRole];
                return (
                  <tr key={user.id} className={user.isActive ? 'table-row' : 'table-row opacity-60'}>
                    <td className="table-td">
                      <div className="font-medium">
                        {fullName(user)}
                        {isMe && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
                      </div>
                      <div className="break-words text-xs text-muted-foreground">
                        {user.email.split('@')[0]}@<wbr />
                        {user.email.split('@').slice(1).join('@')}
                      </div>
                      {/* En móvil, rol y estado van bajo el nombre */}
                      <div className="mt-1.5 flex flex-wrap gap-2 md:hidden">
                        <Badge variant="secondary" className="sm:hidden">{role?.label}</Badge>
                        {!user.isActive && <Badge variant="outline">Inactivo</Badge>}
                      </div>
                    </td>
                    <td className="table-td hidden sm:table-cell">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {role?.label}
                      </Badge>
                    </td>
                    <td className="table-td hidden md:table-cell">
                      <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="table-td">
                      {/* En móvil, en columna: tres iconos en fila no caben junto al correo */}
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          aria-label={`Editar a ${fullName(user)}`}
                          onClick={() => setDialog({ kind: 'edit', user })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restablecer contraseña"
                          aria-label={`Restablecer la contraseña de ${fullName(user)}`}
                          onClick={() => setDialog({ kind: 'password', user })}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {/* El backend también lo impide: nadie se desactiva a sí mismo */}
                        {!isMe && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.isActive ? 'Desactivar' : 'Reactivar'}
                            aria-label={`${user.isActive ? 'Desactivar' : 'Reactivar'} a ${fullName(user)}`}
                            onClick={() => toggleActive(user)}
                            disabled={setActive.isPending}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === 'create' && <CreateUserDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && (
        <EditUserDialog
          user={dialog.user}
          isMe={dialog.user.id === me?.id}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'password' && (
        <PasswordDialog user={dialog.user} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function fullName(user: User) {
  return [user.name, user.surname].filter(Boolean).join(' ') || user.email;
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'JUDGE', password: generatePassword() },
  });

  const onSubmit = (values: CreateValues) =>
    create.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: () => {
          toast.success(`${values.name} creado. Compártele su contraseña.`);
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo crear el usuario')),
      },
    );

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ProfileFields form={form} />
        <PasswordField
          id="new-user-password"
          register={form.register('password')}
          error={form.formState.errors.password?.message}
          onGenerate={() => form.setValue('password', generatePassword(), { shouldValidate: true })}
        />
        <DialogActions onClose={onClose} pending={create.isPending} submitLabel="Crear usuario" />
      </form>
    </Modal>
  );
}

function EditUserDialog({
  user,
  isMe,
  onClose,
}: {
  user: User;
  isMe: boolean;
  onClose: () => void;
}) {
  const update = useUpdateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(profile),
    defaultValues: {
      name: user.name ?? '',
      surname: user.surname ?? '',
      email: user.email,
      phone: user.phone ?? '',
      role: user.role as StaffRole,
    },
  });

  const onSubmit = (values: EditValues) =>
    update.mutate(
      // Sin teléfono no se envía: el DTO lo valida si llega vacío
      { id: user.id, ...values, phone: values.phone || undefined, ...(isMe ? { role: undefined } : {}) },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado');
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar')),
      },
    );

  return (
    <Modal title={`Editar a ${fullName(user)}`} onClose={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ProfileFields form={form} roleLocked={isMe} />
        <DialogActions onClose={onClose} pending={update.isPending} submitLabel="Guardar" />
      </form>
    </Modal>
  );
}

function PasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const reset = useResetPassword();
  const form = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password })),
    defaultValues: { password: generatePassword() },
  });

  const onSubmit = ({ password: newPassword }: { password: string }) =>
    reset.mutate(
      { id: user.id, newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña restablecida. Compártela con el usuario.');
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo restablecer')),
      },
    );

  return (
    <Modal title="Restablecer contraseña" onClose={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <p className="text-sm text-muted-foreground">
          Nueva contraseña para <strong className="text-foreground">{fullName(user)}</strong>.
        </p>
        <PasswordField
          id="reset-password"
          register={form.register('password')}
          error={form.formState.errors.password?.message}
          onGenerate={() => form.setValue('password', generatePassword(), { shouldValidate: true })}
        />
        <DialogActions onClose={onClose} pending={reset.isPending} submitLabel="Restablecer" />
      </form>
    </Modal>
  );
}

// ---------- Piezas de formulario ----------

function ProfileFields({
  form,
  roleLocked = false,
}: {
  // Los dos formularios comparten estos campos; el tipo mínimo común basta.
  form: ReturnType<typeof useForm<EditValues>> | ReturnType<typeof useForm<CreateValues>>;
  roleLocked?: boolean;
}) {
  const f = form as ReturnType<typeof useForm<EditValues>>;
  const errors = f.formState.errors;
  const role = f.watch('role');

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="user-name" label="Nombre" error={errors.name?.message}>
          <Input id="user-name" autoComplete="off" {...f.register('name')} />
        </Field>
        <Field id="user-surname" label="Apellido" error={errors.surname?.message}>
          <Input id="user-surname" autoComplete="off" {...f.register('surname')} />
        </Field>
      </div>
      <Field id="user-email" label="Correo" error={errors.email?.message}>
        <Input id="user-email" type="email" autoComplete="off" {...f.register('email')} />
      </Field>
      <Field id="user-phone" label="Teléfono (opcional)" error={errors.phone?.message}>
        <Input id="user-phone" type="tel" placeholder="+56 9 1234 5678" {...f.register('phone')} />
      </Field>

      <fieldset className="space-y-2" disabled={roleLocked}>
        <legend className="text-sm font-medium">Rol</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(ROLES) as StaffRole[]).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                type="radio"
                value={value}
                className="mt-0.5 accent-[hsl(var(--primary))]"
                {...f.register('role')}
              />
              <span>
                <span className="block font-medium">{ROLES[value].label}</span>
                <span className="block text-xs text-muted-foreground">{ROLES[value].help}</span>
              </span>
            </label>
          ))}
        </div>
        {roleLocked && (
          <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>
        )}
        {!roleLocked && role === 'ADMIN' && (
          <p className="text-xs text-muted-foreground">
            Un administrador puede crear y desactivar otros usuarios.
          </p>
        )}
      </fieldset>
    </>
  );
}

function PasswordField({
  id,
  register,
  error,
  onGenerate,
}: {
  id: string;
  register: ReturnType<ReturnType<typeof useForm<{ password: string }>>['register']>;
  error?: string;
  onGenerate: () => void;
}) {
  const [visible, setVisible] = useState(true);
  return (
    <Field id={id} label="Contraseña" error={error}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            className="pr-10 font-mono"
            {...register}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="button" variant="outline" onClick={onGenerate} className="gap-2" title="Generar otra">
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Generar</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mínimo 6 caracteres, con minúscula, mayúscula y número. Cópiala antes de guardar: no se
        vuelve a mostrar.
      </p>
    </Field>
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

function DialogActions({
  onClose,
  pending,
  submitLabel,
}: {
  onClose: () => void;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </div>
  );
}
