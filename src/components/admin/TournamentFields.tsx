import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useStaffUsers } from '@/hooks/use-users';
import { uploadTournamentDocument, useDeleteDocument } from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { assetUrl } from '@/lib/assets';
import { formatSize, youtubeId } from '@/lib/activities';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { YoutubeEmbed } from '@/components/activities/YoutubeEmbed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PaymentInfo, TournamentDocument } from '@/types';
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_SIZE,
  type TournamentFormState,
} from '@/lib/tournament-form';

const BANK_FIELDS: {
  key: Exclude<keyof PaymentInfo, 'fees' | 'instructions'>;
  label: string;
  placeholder: string;
}[] = [
  { key: 'bankName', label: 'Banco', placeholder: 'Banco Estado' },
  { key: 'accountType', label: 'Tipo de cuenta', placeholder: 'Cuenta corriente' },
  { key: 'accountNumber', label: 'Número de cuenta', placeholder: '12345678' },
  { key: 'holderName', label: 'Titular', placeholder: 'Comunidad Galadhrym' },
  { key: 'holderRut', label: 'RUT del titular', placeholder: '65.123.456-7' },
  { key: 'holderEmail', label: 'Correo del titular', placeholder: 'tesoreria@…' },
];

/**
 * Campos propios de un torneo: jueces, reglamento (redactado o en archivo),
 * video instructivo, inscripción y datos de transferencia.
 */
export function TournamentFields({
  value,
  onChange,
  activityId,
  documents,
  pendingFiles,
  onPendingFiles,
}: {
  value: TournamentFormState;
  onChange: (patch: Partial<TournamentFormState>) => void;
  /// null mientras el torneo no se ha guardado: los archivos esperan en cola
  activityId: string | null;
  documents: TournamentDocument[];
  pendingFiles: File[];
  onPendingFiles: (files: File[]) => void;
}) {
  const { data: staff, isLoading: staffLoading } = useStaffUsers();
  const deleteDocument = useDeleteDocument();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const videoId = youtubeId(value.youtubeUrl);
  const activeStaff = (staff ?? []).filter((u) => u.isActive);

  const setPayment = (patch: Partial<TournamentFormState['payment']>) =>
    onChange({ payment: { ...value.payment, ...patch } });
  const setFee = (i: number, patch: Partial<{ label: string; amount: string }>) =>
    setPayment({ fees: value.payment.fees.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  const toggleJudge = (id: string) =>
    onChange({
      judgeIds: value.judgeIds.includes(id)
        ? value.judgeIds.filter((j) => j !== id)
        : [...value.judgeIds, id],
    });

  const addFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (fileInput.current) fileInput.current.value = '';
    const tooBig = files.filter((f) => f.size > MAX_DOCUMENT_SIZE);
    if (tooBig.length) toast.error(`«${tooBig[0].name}» pesa más de 20 MB`);
    const ok = files.filter((f) => f.size <= MAX_DOCUMENT_SIZE);
    if (!ok.length) return;

    // Torneo aún sin guardar: se suben al guardarlo
    if (!activityId) {
      onPendingFiles([...pendingFiles, ...ok]);
      return;
    }
    setUploading(true);
    try {
      for (const file of ok) await uploadTournamentDocument(activityId, file);
      toast.success(ok.length === 1 ? 'Documento subido' : `${ok.length} documentos subidos`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo subir el documento'));
    } finally {
      setUploading(false);
      // El detalle de la actividad trae la lista nueva
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  };

  const removeDocument = async (doc: TournamentDocument) => {
    const ok = await confirm({
      title: `¿Eliminar «${doc.name}»?`,
      description: 'Se borra el archivo del servidor.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    deleteDocument.mutate(doc.id, {
      onSuccess: () => toast.success('Documento eliminado'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar')),
    });
  };

  return (
    <div className="space-y-6 rounded-lg border border-amber-500/40 bg-amber-50/40 p-4 dark:bg-amber-950/10">
      {/* Jueces */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Jueces</h3>
        <p className="text-xs text-muted-foreground">
          Administradores y jueces del club. Se crean en <em>Usuarios</em>.
        </p>
        {staffLoading ? (
          <div className="h-16 skeleton" />
        ) : activeStaff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay administradores ni jueces activos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {activeStaff.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border bg-background p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={value.judgeIds.includes(u.id)}
                  onChange={() => toggleJudge(u.id)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {[u.name, u.surname].filter(Boolean).join(' ') || u.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {u.role === 'ADMIN' ? 'Administrador' : 'Juez'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Reglamento */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Reglamento</h3>
        <p className="text-xs text-muted-foreground">
          Redáctalo aquí, súbelo en archivo (PDF, Word, PowerPoint…), o ambas cosas.
        </p>
        <RichTextEditor
          id="tournament-rules"
          value={value.rules}
          onChange={(rules) => onChange({ rules })}
        />

        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 rounded-md border bg-background p-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a
                href={assetUrl(`/public/${doc.path}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-medium hover:underline"
              >
                {doc.name}
              </a>
              <span className="shrink-0 text-xs text-muted-foreground">{formatSize(doc.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(doc)}
                aria-label={`Eliminar ${doc.name}`}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {pendingFiles.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-md border border-dashed bg-background p-2.5 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">Se sube al guardar</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPendingFiles(pendingFiles.filter((_, j) => j !== i))}
                aria-label={`Quitar ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={DOCUMENT_ACCEPT}
          className="sr-only"
          id="tournament-documents"
          onChange={(e) => void addFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          Subir documento
        </Button>
      </section>

      {/* Video */}
      <section className="space-y-2">
        <Label htmlFor="tournament-youtube" className="text-sm font-semibold">
          Video instructivo (YouTube)
        </Label>
        <Input
          id="tournament-youtube"
          type="url"
          value={value.youtubeUrl}
          placeholder="https://www.youtube.com/watch?v=…"
          onChange={(e) => onChange({ youtubeUrl: e.target.value })}
          aria-invalid={Boolean(value.youtubeUrl && !videoId)}
        />
        {value.youtubeUrl && !videoId && (
          <p className="text-xs text-destructive">No parece un enlace de video de YouTube.</p>
        )}
        {videoId && <YoutubeEmbed id={videoId} title="Video instructivo" className="max-w-md" />}
      </section>

      {/* Inscripción */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Inscripción</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="registration-end" className="text-xs">
              Cierre (opcional)
            </Label>
            <Input
              id="registration-end"
              type="date"
              value={value.registrationEndDate}
              onChange={(e) => onChange({ registrationEndDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="registration-end-time" className="text-xs">
              Hora de cierre
            </Label>
            <Input
              id="registration-end-time"
              type="time"
              value={value.registrationEndTime}
              disabled={!value.registrationEndDate}
              onChange={(e) => onChange({ registrationEndTime: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-participants" className="text-xs">
              Cupo (opcional)
            </Label>
            <Input
              id="max-participants"
              type="number"
              min={1}
              inputMode="numeric"
              value={value.maxParticipants}
              placeholder="Sin límite"
              onChange={(e) => onChange({ maxParticipants: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Pago */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Pago por transferencia</h3>
          <p className="text-xs text-muted-foreground">
            Se envían por correo a quien se preinscribe. En el sitio público solo se muestran los
            montos.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Montos</p>
          {value.payment.fees.map((fee, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={fee.label}
                placeholder="Socio adulto"
                aria-label={`Concepto ${i + 1}`}
                onChange={(e) => setFee(i, { label: e.target.value })}
              />
              <div className="relative w-36 shrink-0">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  value={fee.amount}
                  inputMode="numeric"
                  placeholder="15000"
                  aria-label={`Monto ${i + 1}`}
                  className="pl-6"
                  onChange={(e) => setFee(i, { amount: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar monto ${i + 1}`}
                disabled={value.payment.fees.length === 1}
                onClick={() => setPayment({ fees: value.payment.fees.filter((_, j) => j !== i) })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPayment({ fees: [...value.payment.fees, { label: '', amount: '' }] })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar monto
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BANK_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={`bank-${f.key}`} className="text-xs">
                {f.label}
              </Label>
              <Input
                id={`bank-${f.key}`}
                type={f.key === 'holderEmail' ? 'email' : 'text'}
                value={value.payment[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setPayment({ [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label htmlFor="payment-instructions" className="text-xs">
            Instrucciones
          </Label>
          <textarea
            id="payment-instructions"
            rows={3}
            value={value.payment.instructions ?? ''}
            placeholder="Indica tu nombre y el torneo en el comentario de la transferencia."
            onChange={(e) => setPayment({ instructions: e.target.value })}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </section>
    </div>
  );
}
