import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/use-join';
import { useJoinStore } from '@/features/join-store';
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

/// El token llega en el fragmento (#token=…) para que no viaje en la URL al
/// servidor ni quede en logs. Se lee una vez y se limpia de la barra.
function readToken() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (token) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

/**
 * Destino del enlace del correo de bienvenida: la persona crea su contraseña,
 * su correo queda validado y entra con la sesión iniciada.
 */
export function WelcomePage() {
  const [token] = useState(readToken);
  const navigate = useNavigate();
  const openJoin = useJoinStore((s) => s.openJoin);
  const verify = useVerifyEmail();
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = ({ password }: FormValues) =>
    verify.mutate(
      { token: token!, password },
      {
        onSuccess: (data) => {
          toast.success(`¡Bienvenido, ${data.user.name ?? ''}! Tu cuenta está activa.`);
          navigate('/mi-cuenta', { replace: true });
        },
      },
    );

  return (
    <div className="container flex justify-center py-12 md:py-20">
      <Seo title="Activa tu cuenta" noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LogoFull className="mb-2 h-24" />
          <CardTitle>Activa tu cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>
                Este enlace no es válido. Ábrelo directamente desde el correo de bienvenida o
                inscríbete de nuevo con el mismo correo para recibir uno nuevo.
              </p>
              <Button onClick={openJoin}>Inscribirme</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <p className="text-sm text-muted-foreground">
                Crea la contraseña con la que entrarás al sitio del club.
              </p>
              <div className="space-y-2">
                <Label htmlFor="welcome-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="welcome-password"
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
                <Label htmlFor="welcome-confirm">Repite la contraseña</Label>
                <Input
                  id="welcome-confirm"
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirm')}
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>

              {verify.isError && (
                <div role="alert" className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{apiErrorMessage(verify.error, 'No pudimos activar tu cuenta.')}</p>
                  <button type="button" onClick={openJoin} className="font-medium underline">
                    Pedir un enlace nuevo
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={verify.isPending}>
                {verify.isPending ? 'Activando…' : 'Activar mi cuenta'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ¿Ya la activaste? <Link to="/login" className="underline">Inicia sesión</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
