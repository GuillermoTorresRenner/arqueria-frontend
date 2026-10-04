import { Instagram } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons';
import { LINKS } from '@/lib/links';
import { LogoFull } from '@/components/Logo';
import { useJoinStore } from '@/features/join-store';

const ICON_BUTTON =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function SiteFooter() {
  const openJoin = useJoinStore((s) => s.openJoin);
  return (
    <footer className="border-t bg-secondary/40">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <LogoFull className="h-24 text-foreground/90" />

        <div className="flex items-center gap-1">
          {/* WhatsApp abre la inscripción: la invitación al grupo se entrega
              al completarla */}
          <button
            type="button"
            onClick={openJoin}
            aria-label="Unirse al club y al grupo de WhatsApp"
            title="Unirse al club"
            className={ICON_BUTTON}
          >
            <WhatsAppIcon className="h-5 w-5" />
          </button>
          <a
            href={LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Galadhrym"
            title="Instagram de Galadhrym"
            className={ICON_BUTTON}
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Galadhrym
        </p>
      </div>
    </footer>
  );
}
