import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MailCheck, MailQuestion, Pencil, Plus, Send, UserCheck, UserX } from 'lucide-react';
import {
  useCreateUser,
  useSendAccessEmail,
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
/// formulario y no como un 400 después de enviar. Sin contraseña: la crea el
/// propio usuario desde el correo de invitación.
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

type EditValues = z.infer<typeof profile>;

type Dialog = { kind: 'create' } | { kind: 'edit'; user: User } | null;

export function UsersAdminPage() {
  const me = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useStaffUsers();
  const setActive = useSetUserActive();
  const sendAccess = useSendAccessEmail();
  const [dialog, setDialog] = useState<Dialog>(null);

  /// El admin nunca ve ni elige contraseñas: el usuario recibe un enlace.
  const sendAccessEmail = (user: User) => {
    const what = user.emailVerified
      ? 'un enlace para elegir una contraseña nueva'
      : 'de nuevo la invitación para crear su contraseña';
    if (!window.confirm(`¿Enviar a ${user.email} ${what}?`)) return;
    sendAccess.mutate(user.id, {
      onSuccess: ({ sent, kind }) =>
        sent
          ? toast.success(
              kind === 'invite' ? 'Invitación reenviada' : 'Enlace de recuperación enviado',
            )
          : toast.error('No se pudo enviar el correo. Revisa la configuración de email.'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo enviar el correo')),
    });
  };

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
                        <EmailStatus user={user} />
                      </div>
                    </td>
                    <td className="table-td hidden sm:table-cell">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {role?.label}
                      </Badge>
                    </td>
                    <td className="table-td hidden md:table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <EmailStatus user={user} />
                      </div>
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
                          title="Enviar correo de acceso"
                          aria-label={`Enviar correo de acceso a ${fullName(user)}`}
                          onClick={() => sendAccessEmail(user)}
                          disabled={sendAccess.isPending || !user.isActive}
                        >
                          <Send className="h-4 w-4" />
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
    </div>
  );
}

/// Si confirmó su correo (creó su contraseña desde el enlace) y cuándo.
function EmailStatus({ user }: { user: User }) {
  if (user.emailVerified) {
    const when = user.emailVerifiedAt
      ? new Date(user.emailVerifiedAt).toLocaleDateString('es-CL')
      : null;
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={when ? `Correo confirmado el ${when}` : 'Correo confirmado'}
      >
        <MailCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Correo confirmado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MailQuestion className="h-3.5 w-3.5" aria-hidden="true" />
      Invitación pendiente
    </span>
  );
}

function fullName(user: User) {
  return [user.name, user.surname].filter(Boolean).join(' ') || user.email;
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(profile),
    defaultValues: { role: 'JUDGE' },
  });

  const onSubmit = (values: EditValues) =>
    create.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: ({ emailSent }) => {
          if (emailSent) {
            toast.success(`${values.name} creado. Le enviamos un correo para crear su contraseña.`);
          } else {
            toast.warning(
              `${values.name} creado, pero el correo no salió. Reenvíalo con «Enviar correo de acceso».`,
            );
          }
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo crear el usuario')),
      },
    );

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ProfileFields form={form} />
        <p className="flex gap-2 rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">
          <Send className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Le enviaremos un correo para que cree su propia contraseña. Nadie más la conoce.
        </p>
        <DialogActions onClose={onClose} pending={create.isPending} submitLabel="Crear y enviar invitación" />
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

// ---------- Piezas de formulario ----------

function ProfileFields({
  form,
  roleLocked = false,
}: {
  form: ReturnType<typeof useForm<EditValues>>;
  roleLocked?: boolean;
}) {
  const f = form;
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
