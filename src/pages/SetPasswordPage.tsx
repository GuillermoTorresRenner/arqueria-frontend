import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useSetPassword } from '@/hooks/use-join';
import { apiErrorMessage } from '@/lib/api';
import { Seo } from '@/components/Seo';
import { LogoFull } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z
  .object({
    password: z
      .string()
      .min(6, 'Mínimo 6 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener minúscula, mayúscula y número'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });
type FormValues = z.infer<typeof schema>;

const COPY = {
  activate: {
    title: 'Activa tu cuenta',
    lead: 'Crea la contraseña con la que entrarás al sitio del club.',
    submit: 'Activar mi cuenta',
    pending: 'Activando…',
    done: 'Tu cuenta está activa.',
    invalid:
      'Este enlace no es válido. Ábrelo directamente desde el correo que te enviamos o pide uno nuevo.',
    newLink: { to: '/recuperar', label: 'Pedir un enlace nuevo' },
  },
  reset: {
    title: 'Elige una contraseña nueva',
    lead: 'Escribe la contraseña nueva para tu cuenta.',
    submit: 'Guardar contraseña',
    pending: 'Guardando…',
    done: 'Tu contraseña se actualizó.',
    invalid:
      'Este enlace no es válido. Ábrelo directamente desde el correo de recuperación o solicita otro.',
    newLink: { to: '/recuperar', label: 'Solicitar otro enlace' },
  },
} as const;

/// El token llega en el fragmento (#token=…) para que no viaje al servidor ni
/// quede en logs. Se lee una vez y se borra de la barra de direcciones.
function readToken() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (token) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

/**
 * Destino de los enlaces del correo. Es el único sitio donde se elige una
 * contraseña: nadie la escribe por otra persona.
 * - `activate` (/bienvenida): cuenta nueva (inscripción web o alta desde el
 *   panel); el correo queda confirmado.
 * - `reset` (/restablecer): recuperación de contraseña.
 */
export function SetPasswordPage({ mode }: { mode: 'activate' | 'reset' }) {
  const copy = COPY[mode];
  const [token] = useState(readToken);
  const navigate = useNavigate();
  const setPassword = useSetPassword(mode);
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = ({ password }: FormValues) =>
    setPassword.mutate(
      { token: token!, password },
      {
        onSuccess: ({ user }) => {
          toast.success(`${user.name ? `¡Hola, ${user.name}! ` : ''}${copy.done}`);
          navigate(user.role === 'MEMBER' ? '/mi-cuenta' : '/admin', { replace: true });
        },
      },
    );

  return (
    <div className="container flex justify-center py-12 md:py-20">
      <Seo title={copy.title} noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LogoFull className="mb-2 h-24" />
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>{copy.invalid}</p>
              <Button asChild>
                <Link to={copy.newLink.to}>{copy.newLink.label}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <p className="text-sm text-muted-foreground">{copy.lead}</p>
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={visible ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('password')}
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
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres, con minúscula, mayúscula y número.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repite la contraseña</Label>
                <Input
                  id="confirm-password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirm')}
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>

              {setPassword.isError && (
                <div
                  role="alert"
                  className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <p>{apiErrorMessage(setPassword.error, 'No pudimos guardar tu contraseña.')}</p>
                  <Link to={copy.newLink.to} className="font-medium underline">
                    {copy.newLink.label}
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={setPassword.isPending}>
                {setPassword.isPending ? copy.pending : copy.submit}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ¿Ya tienes contraseña?{' '}
                <Link to="/login" className="underline">
                  Inicia sesión
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
