import { useEffect, useState } from 'react';
import { resolveTheme, useThemeStore } from '@/features/theme-store';
import { cn } from '@/lib/utils';

/**
 * Selector de tema sol/luna.
 *
 * Un único SVG que se transforma: el sol encoge y gira mientras la luna entra
 * con su mordisco (una máscara circular que se desplaza). No son dos iconos
 * cruzados en opacidad — es la misma forma cambiando de estado.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const [isDark, setIsDark] = useState(false);

  // El tema efectivo solo se conoce en el cliente; se sincroniza al montar
  // y cuando cambia la preferencia del sistema.
  useEffect(() => {
    setIsDark(resolveTheme(theme) === 'dark');
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setIsDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className={cn(
        'group relative inline-flex h-10 w-10 items-center justify-center rounded-full',
        'text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="h-[22px] w-[22px]"
        aria-hidden="true"
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* El círculo que muerde la esfera para convertirla en luna */}
          <circle
            cx={isDark ? 16 : 30}
            cy={isDark ? 8 : 0}
            r="9"
            fill="black"
            className="transition-all duration-500 ease-in-out"
          />
        </mask>

        {/* Esfera: sol grande → luna pequeña y mordida */}
        <circle
          cx="12"
          cy="12"
          r={isDark ? 9 : 5}
          mask="url(#moon-mask)"
          className="fill-current transition-all duration-500 ease-in-out"
        />

        {/* Rayos: giran y se repliegan al pasar a oscuro */}
        <g
          stroke="currentColor"
          className={cn(
            'origin-center transition-all duration-500 ease-in-out',
            isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
          )}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>

      {/* Resplandor cálido al pasar el cursor, distinto según el tema */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100',
          isDark
            ? 'bg-[radial-gradient(circle,hsl(var(--accent)/0.18),transparent_70%)]'
            : 'bg-[radial-gradient(circle,hsl(var(--primary)/0.14),transparent_70%)]',
        )}
      />
    </button>
  );
}
