import DOMPurify from 'dompurify';
import { Download, FileText } from 'lucide-react';
import { assetUrl } from '@/lib/assets';
import {
  formatCLP,
  formatDateTime,
  formatDay,
  formatSize,
  formatTimeRange,
  youtubeId,
} from '@/lib/activities';
import { Modal } from '@/components/Modal';
import { YoutubeEmbed } from './YoutubeEmbed';
import type { PublicActivity, PublicTournament } from '@/types';

const sanitize = (html: string) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

/// Bases del torneo: video instructivo, montos, reglamento y archivos
export function TournamentInfoDialog({
  activity,
  tournament,
  onClose,
}: {
  activity: PublicActivity;
  tournament: PublicTournament;
  onClose: () => void;
}) {
  const videoId = youtubeId(tournament.youtubeUrl);

  return (
    <Modal title={activity.title} onClose={onClose} className="max-w-2xl">
      <div className="space-y-6 text-sm">
        <p className="text-muted-foreground">
          {formatDay(activity.startsAt)}, {formatTimeRange(activity.startsAt, activity.endsAt)}
          {activity.place && ` · ${activity.place.name}`}
        </p>

        {videoId && (
          <section className="space-y-2">
            <h3 className="font-semibold">Video instructivo</h3>
            <YoutubeEmbed id={videoId} title={`Video instructivo: ${activity.title}`} />
          </section>
        )}

        {(tournament.fees.length > 0 || tournament.registrationEnd || tournament.maxParticipants) && (
          <section className="space-y-2">
            <h3 className="font-semibold">Inscripción</h3>
            {tournament.fees.length > 0 && (
              <ul className="divide-y rounded-md border">
                {tournament.fees.map((fee) => (
                  <li key={fee.label} className="flex justify-between gap-4 px-3 py-2">
                    <span>{fee.label}</span>
                    <span className="font-semibold tabular-nums">{formatCLP(fee.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <ul className="space-y-1 text-muted-foreground">
              {tournament.registrationEnd && (
                <li>Inscripciones hasta: {formatDateTime(tournament.registrationEnd)}</li>
              )}
              {tournament.maxParticipants && (
                <li>
                  Cupo: {tournament.maxParticipants} arqueros ({tournament._count.registrations}{' '}
                  {tournament._count.registrations === 1 ? 'inscrito' : 'inscritos'})
                </li>
              )}
            </ul>
            <p className="text-xs text-muted-foreground">
              El pago es por transferencia: al inscribirte desde tu cuenta te enviamos los datos.
            </p>
          </section>
        )}

        {tournament.rules && (
          <section className="space-y-2">
            <h3 className="font-semibold">Reglamento</h3>
            <div
              className="rich-text rounded-md border bg-secondary/30 p-4 [&>*:first-child]:mt-0"
              dangerouslySetInnerHTML={{ __html: sanitize(tournament.rules) }}
            />
          </section>
        )}

        {tournament.documents.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold">Documentos</h3>
            <ul className="space-y-2">
              {tournament.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={assetUrl(`/public/${doc.path}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.name}
                    className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-medium">{doc.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatSize(doc.size)}
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
