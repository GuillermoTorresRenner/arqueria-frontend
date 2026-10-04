import { NavLink, Outlet, Link, Navigate } from 'react-router-dom';
import { CalendarDays, FileText, LogOut, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Seo } from './Seo';
import { LogoEmblem } from '@/components/Logo';

const NAV = [
  { to: '/admin', label: 'Contenido', icon: FileText, end: true },
  // El backend solo permite gestionar actividades al ADMIN
  { to: '/admin/actividades', label: 'Actividades', icon: CalendarDays, end: false, adminOnly: true },
  { to: '/admin/socios', label: 'Socios', icon: Users, end: false },
  { to: '/admin/torneos', label: 'Torneos', icon: Trophy, end: false },
  // Solo ADMIN: el backend rechaza /users a cualquier otro rol
  { to: '/admin/usuarios', label: 'Usuarios', icon: ShieldCheck, end: false, adminOnly: true },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  // Guarda de conveniencia: la autorización real la aplica el backend en cada
  // endpoint. Esto solo evita mostrar un panel que no se podría usar.
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'MEMBER') return <Navigate to="/" replace />;
  const nav = NAV.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="flex min-h-screen flex-col">
      <Seo title="Administración" noindex />
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <LogoEmblem className="h-8" />
            Galadhrym
            <span className="ml-1 hidden text-xs font-normal text-muted-foreground sm:inline">
              administración
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {[user.name, user.surname].filter(Boolean).join(' ') || user.email}
              <span className="ml-2 text-xs opacity-70">
                {user.role === 'ADMIN' ? 'Administrador' : 'Juez'}
              </span>
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              className="gap-2"
              aria-label="Salir"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex flex-1 flex-col gap-8 py-8 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          {/* En móvil, barra de pestañas a partes iguales (icono sobre texto)
              para que todas quepan a 320px; en escritorio, menú lateral. */}
          <nav
            className={cn(
              'grid gap-1 md:flex md:flex-col',
              // Con cinco secciones, a 320px no caben en una fila: 3 + 2
              nav.length > 4 ? 'grid-cols-3 sm:grid-cols-5' : nav.length > 3 ? 'grid-cols-4' : 'grid-cols-3',
            )}
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:px-3 sm:text-sm md:justify-start',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
