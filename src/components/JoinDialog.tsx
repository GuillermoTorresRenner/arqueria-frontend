import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck, MailWarning } from 'lucide-react';
import { useJoinClub } from '@/hooks/use-join';
import { useJoinStore } from '@/features/join-store';
import { apiErrorMessage } from '@/lib/api';
import { EXPERIENCE_OPTIONS, type ArcheryExperience } from '@/lib/join';
import { Modal } from '@/components/Modal';
import { WhatsAppIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const today = () => new Date().toISOString().slice(0, 10);

/// Mismas reglas que JoinClubDto en el backend, para avisar antes de enviar.
const schema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60),
  surname: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60),
  birthDate: z
    .string()
    .min(1, 'Indica tu fecha de nacimiento')
    .refine((v) => v <= today(), 'La fecha no puede ser futura')
    .refine((v) => v >= '1915-01-01', 'Revisa el año'),
  email: z.string().trim().email('Correo inválido'),
  experience: z.enum(
    EXPERIENCE_OPTIONS.map((o) => o.value) as [ArcheryExperience, ...ArcheryExperience[]],
    { errorMap: () => ({ message: 'Elige una opción' }) },
  ),
  acceptCommunications: z.literal(true, {
    errorMap: () => ({ message: 'Necesitamos tu autorización para escribirte' }),
  }),
  website: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Result = { name: string; email: string; whatsappUrl: string; emailSent: boolean };

/**
 * Formulario «Súmate al club». La invitación al grupo de WhatsApp no está en
 * el sitio: la devuelve el backend solo cuando el registro quedó guardado.
 */
export function JoinDialog() {
  const { open, closeJoin } = useJoinStore();
  const [result, setResult] = useState<Result | null>(null);

  if (!open) return null;

  const close = () => {
    closeJoin();
    setResult(null);
  };

  return (
    <Modal title={result ? '¡Ya eres parte del club!' : 'Súmate al club'} onClose={close}>
      {result ? <JoinSuccess result={result} onClose={close} /> : <JoinForm onDone={setResult} />}
    </Modal>
  );
}

function JoinForm({ onDone }: { onDone: (r: Result) => void }) {
  const join = useJoinClub();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) =>
    join.mutate(values, {
      onSuccess: (data) => onDone({ name: values.name.trim(), email: values.email.trim(), ...data }),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Déjanos tus datos y te sumamos al grupo del club. Te enviaremos un correo para activar tu
        cuenta.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="join-name" label="Nombre" error={errors.name?.message}>
          <Input id="join-name" autoComplete="given-name" {...register('name')} />
        </Field>
        <Field id="join-surname" label="Apellido" error={errors.surname?.message}>
          <Input id="join-surname" autoComplete="family-name" {...register('surname')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="join-birth" label="Fecha de nacimiento" error={errors.birthDate?.message}>
          <Input
            id="join-birth"
            type="date"
            max={today()}
            min="1915-01-01"
            autoComplete="bday"
            {...register('birthDate')}
          />
        </Field>
        <Field id="join-email" label="Correo" error={errors.email?.message}>
          <Input
            id="join-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />
        </Field>
      </div>

      <Field id="join-experience" label="Experiencia con el arco" error={errors.experience?.message}>
        <select
          id="join-experience"
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...register('experience')}
        >
          <option value="" disabled>
            Elige una opción
          </option>
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      {/* El consentimiento es obligatorio: se destaca para que no pase inadvertido */}
      <div className="space-y-1.5">
        <label
          htmlFor="join-consent"
          className="flex cursor-pointer gap-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm"
        >
          <input
            id="join-consent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
            aria-invalid={Boolean(errors.acceptCommunications)}
            {...register('acceptCommunications')}
          />
          <span>
            <strong className="font-semibold">Acepto recibir comunicaciones del club por email</strong>
            <span className="block text-muted-foreground">
              Avisos de actividades, jornadas de tiro y torneos. Es necesario para sumarte.
            </span>
          </span>
        </label>
        {errors.acceptCommunications && (
          <p className="text-xs text-destructive">{errors.acceptCommunications.message}</p>
        )}
      </div>

      {/* Campo trampa anti-bots: fuera de pantalla y fuera del orden de tabulación */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="join-website">No completar</label>
        <input id="join-website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {join.isError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {apiErrorMessage(join.error, 'No pudimos registrar tu inscripción. Inténtalo de nuevo.')}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={join.isPending}>
        {join.isPending ? 'Enviando…' : 'Inscribirme'}
      </Button>
    </form>
  );
}

function JoinSuccess({ result, onClose }: { result: Result; onClose: () => void }) {
  return (
    <div className="space-y-5 text-sm">
      <p className="text-base">
        Gracias, <strong>{result.name}</strong>. Tu inscripción quedó registrada.
      </p>

      <div className="rounded-lg border bg-secondary/50 p-4 text-center">
        <p className="mb-3">Entra al grupo de WhatsApp del club:</p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-5 w-5" />
            Unirme al grupo de WhatsApp
          </a>
        </Button>
      </div>

      {result.emailSent ? (
        <p className="flex gap-3 text-muted-foreground">
          <MailCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Te enviamos un correo a <strong className="text-foreground">{result.email}</strong>.
            Ábrelo para validar tu cuenta y crear tu contraseña; con ella podrás entrar al sitio. Si no
            lo ves, revisa la carpeta de spam.
          </span>
        </p>
      ) : (
        <p className="flex gap-3 text-muted-foreground">
          <MailWarning className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <span>
            No pudimos enviarte el correo para activar tu cuenta. Vuelve a inscribirte con el mismo
            correo más tarde y te lo reenviaremos.
          </span>
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
