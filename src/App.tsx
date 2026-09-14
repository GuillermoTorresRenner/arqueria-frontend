import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { PublicLayout } from '@/components/PublicLayout';
import { HomePage } from '@/pages/HomePage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// El panel y el marcador en vivo (que arrastra socket.io) se cargan aparte:
// quien solo visita la landing no debería descargarlos.
const AdminLayout = lazy(() =>
  import('@/components/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const TournamentDetailPage = lazy(() =>
  import('@/pages/TournamentDetailPage').then((m) => ({
    default: m.TournamentDetailPage,
  })),
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ContentAdminPage = lazy(() =>
  import('@/pages/admin/ContentAdminPage').then((m) => ({
    default: m.ContentAdminPage,
  })),
);
const MembersAdminPage = lazy(() =>
  import('@/pages/admin/MembersAdminPage').then((m) => ({
    default: m.MembersAdminPage,
  })),
);
const TournamentsAdminPage = lazy(() =>
  import('@/pages/admin/TournamentsAdminPage').then((m) => ({
    default: m.TournamentsAdminPage,
  })),
);

function RouteFallback() {
  return (
    <div className="container py-24" aria-busy="true">
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-48 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="torneos" element={<TournamentsPage />} />
              <Route path="torneos/:slug" element={<TournamentDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ContentAdminPage />} />
              <Route path="socios" element={<MembersAdminPage />} />
              <Route path="torneos" element={<TournamentsAdminPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
