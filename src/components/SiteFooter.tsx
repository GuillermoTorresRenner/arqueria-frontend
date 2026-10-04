import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';
import { LINKS } from '@/lib/links';
import { LogoFull } from '@/components/Logo';
import { useJoinStore } from '@/features/join-store';

const LINK =
  'rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/// Correo del club: el mismo desde el que salen los correos del sitio.
const CLUB_EMAIL = 'arqueria.galadhrym@gmail.com';

export function SiteFooter() {
  const openJoin = useJoinStore((s) => s.openJoin);

  return (
    <footer className="border-t bg-secondary/40">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <LogoFull className="h-20 text-foreground/90" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Asociación de arquería tradicional. Desde 2011 acercamos el tiro con arco a quienes
            siempre quisieron probarlo, con una escuela abierta a todas las edades y niveles.
          </p>
        </div>

        <nav aria-labelledby="footer-explore" className="space-y-3">
          <h2 id="footer-explore" className="text-sm font-semibold">
            Explora
          </h2>
          <ul className="space-y-2">
            <li>
              <Link to="/" className={LINK}>
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/torneos" className={LINK}>
                Torneos
              </Link>
            </li>
            <li>
              {/* La inscripción entrega la invitación al grupo de WhatsApp */}
              <button type="button" onClick={openJoin} className={LINK}>
                Súmate al club
              </button>
            </li>
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Contacto</h2>
          <ul className="space-y-2">
            <li>
              <a
                href={LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${LINK} inline-flex items-center gap-2`}
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                @galadhrym_arqueria
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CLUB_EMAIL}`}
                className={`${LINK} inline-flex items-center gap-2 break-all`}
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {CLUB_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Galadhrym · Arquería tradicional</p>
          <p className="italic">Galadhrym, en sindarin, «pueblo de los árboles».</p>
        </div>
      </div>
    </footer>
  );
}
