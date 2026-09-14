import { NavLink, Outlet, Link, Navigate } from 'react-router-dom';
import { FileText, LogOut, Target, Trophy, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Seo } from './Seo';

const NAV = [
  { to: '/admin', label: 'Contenido', icon: FileText, end: true },
  { to: '/admin/socios', label: 'Socios', icon: Users, end: false },
  { to: '/admin/torneos', label: 'Torneos', icon: Trophy, end: false },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  // Guarda de conveniencia: la autorización real la aplica el backend en cada
  // endpoint. Esto solo evita mostrar un panel que no se podría usar.
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'MEMBER') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Seo title="Administración" noindex />
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            Galadhrym
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              administración
            </span>
          </Link>
          <div className="flex items-center gap-3">
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
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex flex-1 flex-col gap-8 py-8 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
