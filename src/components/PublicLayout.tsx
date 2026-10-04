import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { JoinDialog } from './JoinDialog';
import { useJoinStore } from '@/features/join-store';
import { JOIN_HREF } from '@/lib/join';

export function PublicLayout() {
  const { hash } = useLocation();
  const openJoin = useJoinStore((s) => s.openJoin);

  // Un enlace compartido a /#unirse abre directamente la inscripción
  useEffect(() => {
    if (hash === JOIN_HREF) openJoin();
  }, [hash, openJoin]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-4">
        <Outlet />
      </main>
      <SiteFooter />
      <JoinDialog />
    </div>
  );
}
