import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target } from 'lucide-react';
import { toast } from 'sonner';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/features/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Seo } from '@/components/Seo';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate(user.role === 'MEMBER' ? '/' : '/admin', { replace: true });
  }, [user, navigate]);

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onSuccess: (data) => {
        toast.success(`Hola, ${data.user.name ?? data.user.email}`);
        navigate(data.user.role === 'MEMBER' ? '/' : '/admin', { replace: true });
      },
      onError: () => toast.error('Correo o contraseña incorrectos'),
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-secondary/40 px-6">
      <Seo title="Acceder" noindex />
      <ThemeToggle className="absolute right-4 top-4" />
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
            Galadhrym
          </Link>
          <CardTitle className="pt-2">Acceder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
