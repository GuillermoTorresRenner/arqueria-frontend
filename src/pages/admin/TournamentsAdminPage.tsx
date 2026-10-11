import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, GitFork, Radio, Users } from 'lucide-react';
import { useAdminTournaments } from '@/hooks/use-tournaments';
import { useActivityDetail } from '@/hooks/use-activities';
import { useAuthStore } from '@/features/auth-store';
import { Modal } from '@/components/Modal';
import { RegistrationsList } from '@/components/admin/RegistrationsList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament, TournamentStatus } from '@/types';

const STATUS: Record<
  TournamentStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' }
> = {
  DRAFT: { label: 'Borrador', variant: 'outline' },
  REGISTRATION_OPEN: { label: 'Inscripciones abiertas', variant: 'accent' },
  IN_PROGRESS: { label: 'En curso', variant: 'default' },
  FINISHED: { label: 'Finalizado', variant: 'secondary' },
  CANCELLED: { label: 'Cancelado', variant: 'outline' },
};

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function TournamentsAdminPage() {
  const { data: tournaments, isLoading } = useAdminTournaments();
  // Inscripciones y pagos son del ADMIN; el juez solo ve el listado
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [open, setOpen] = useState<Tournament | null>(null);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Torneos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campeonatos por categoría: inscritos numerados, sorteo y fixture.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 skeleton" />
          ))}
        </div>
      ) : tournaments?.length === 0 ? (
        <p className="state-empty">
          Todavía no hay torneos creados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments?.map((tournament) => {
            const status = STATUS[tournament.status];
            return (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {tournament.status === 'IN_PROGRESS' && (
                      <Radio
                        className="h-3.5 w-3.5 animate-pulse text-accent"
                        aria-label="En vivo"
                      />
                    )}
                  </div>
                  <CardTitle className="mt-2">{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {dateFormatter.format(new Date(tournament.startsAt))}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {tournament._count?.participants ?? 0} arqueros
                    {tournament.categories?.length
                      ? ` · ${tournament.categories.map((c) => c.name).join(', ')}`
                      : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                    <Button asChild size="sm">
                      <Link to={`/admin/torneos/${tournament.id}/cuadro`}>
                        <GitFork className="h-4 w-4 rotate-90" aria-hidden="true" />
                        Cuadro y puntajes
                      </Link>
                    </Button>
                    {isAdmin && tournament.activity && (
                      <Button size="sm" variant="outline" onClick={() => setOpen(tournament)}>
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Participantes e inscripciones
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                    {tournament.isPublic && (
                      <Link
                        to={`/torneos/${tournament.slug}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Ver página pública
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {open?.activity && (
        <ParticipantsDialog tournament={open} activityId={open.activity.id} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

/// Participantes numerados del torneo y sus inscripciones por categoría: aquí
/// se confirma el pago de cada una para dejarla inscrita.
function ParticipantsDialog({
  tournament,
  activityId,
  onClose,
}: {
  tournament: Tournament;
  activityId: string;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useActivityDetail(activityId);
  const registrations = detail?.tournament?.registrations ?? [];
  const participants = new Set(registrations.map((r) => r.participant.number)).size;

  return (
    <Modal title={tournament.name} onClose={onClose} className="max-w-3xl">
      {isLoading || !detail ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-10 skeleton" />
          <div className="h-40 skeleton" />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {participants === 1 ? '1 arquero' : `${participants} arqueros`} ·{' '}
            {registrations.length === 1 ? '1 inscripción' : `${registrations.length} inscripciones`}.
            Al llegar el comprobante, confirma el pago de cada categoría para dejarla inscrita.
          </p>
          <RegistrationsList
            registrations={registrations}
            categories={detail.tournament?.categories ?? []}
          />
        </div>
      )}
    </Modal>
  );
}
