import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { useForgotPassword } from '@/hooks/use-join';
import { apiErrorMessage } from '@/lib/api';
import { Seo } from '@/components/Seo';
import { LogoFull } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({ email: z.string().trim().email('Correo inválido') });
type FormValues = z.infer<typeof schema>;

/// Recuperación de contraseña. El mensaje final es el mismo exista o no la
/// cuenta, para no revelar qué correos están registrados.
export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="container flex justify-center py-12 md:py-20">
      <Seo title="Recuperar contraseña" noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LogoFull className="mb-2 h-24" />
          <CardTitle>Recuperar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          {forgot.isSuccess ? (
            <div className="space-y-4 text-sm">
              <p className="flex gap-3 text-muted-foreground">
                <MailCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Si hay una cuenta con <strong className="text-foreground">{getValues('email')}</strong>,
                  te enviamos un enlace para elegir una contraseña nueva. Vale 1 hora. Si no lo ves,
                  revisa la carpeta de spam.
                </span>
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Volver a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(({ email }) => forgot.mutate(email.trim()))}
              className="space-y-4"
              noValidate
            >
              <p className="text-sm text-muted-foreground">
                Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña
                nueva.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Correo</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              {forgot.isError && (
                <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {apiErrorMessage(forgot.error, 'No pudimos procesar la solicitud. Inténtalo más tarde.')}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={forgot.isPending}>
                {forgot.isPending ? 'Enviando…' : 'Enviar enlace'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="underline">
                  Volver a iniciar sesión
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
