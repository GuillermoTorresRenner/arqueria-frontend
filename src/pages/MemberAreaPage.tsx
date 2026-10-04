import { Navigate } from 'react-router-dom';
import { CalendarDays, LogOut, Trophy } from 'lucide-react';
import { useAuthStore } from '@/features/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useMyMember } from '@/hooks/use-members';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COPY = {
  // En desuso: los socios ya no requieren aprobación
  PENDING: { label: 'Socio activo', text: 'Tu membresía está activa.' },
  ACTIVE: { label: 'Socio activo', text: 'Tu membresía está activa.' },
  SUSPENDED: {
    label: 'Suspendido',
    text: 'Tu membresía está suspendida. Escríbenos si crees que es un error.',
  },
  INACTIVE: { label: 'Inactivo', text: 'Tu membresía no está activa.' },
} as const;

const COMING_SOON = [
  {
    icon: CalendarDays,
    title: 'Calendario de actividades',
    text: 'Jornadas de tiro, clases de la escuela y salidas del club.',
  },
  {
    icon: Trophy,
    title: 'Inscripciones a torneos',
    text: 'Inscríbete en los campeonatos y consulta tus resultados.',
  },
];

/// Área del socio. Por ahora muestra el estado de la inscripción; aquí irán el
/// calendario y las inscripciones a torneos.
export function MemberAreaPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: member, isLoading } = useMyMember(Boolean(user));

  if (!user) return <Navigate to="/login" replace />;
  const status = member ? STATUS_COPY[member.status] : null;

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <Seo title="Mi cuenta" noindex />
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {user.name ?? 'arquero'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" onClick={() => logout.mutate()} className="gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Salir
        </Button>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Tu inscripción</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {isLoading ? (
            <div className="h-12 skeleton" aria-busy="true" />
          ) : status && member ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {status.label}
                </Badge>
                <span className="text-muted-foreground">Socio nº {member.memberNumber}</span>
              </div>
              <p className="text-muted-foreground">{status.text}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Tu cuenta no tiene ficha de socio.</p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Muy pronto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {COMING_SOON.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="border-dashed">
            <CardContent className="flex gap-3 pt-6 text-sm">
              <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-muted-foreground">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
