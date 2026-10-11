import { useState } from 'react';
import { toast } from 'sonner';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
  type BankAccountInput,
} from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { bankAccountLabel } from '@/lib/activities';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BankAccount } from '@/types';

const EMPTY: BankAccountInput = {
  bankName: '',
  accountType: '',
  accountNumber: '',
  holderName: '',
  holderRut: '',
  holderEmail: '',
};

const FIELDS: {
  key: Exclude<keyof BankAccountInput, 'isActive'>;
  label: string;
  placeholder: string;
  required: boolean;
  maxLength: number;
}[] = [
  { key: 'bankName', label: 'Banco', placeholder: 'Banco de Chile', required: true, maxLength: 80 },
  { key: 'accountType', label: 'Tipo de cuenta', placeholder: 'Cuenta Vista', required: true, maxLength: 60 },
  { key: 'accountNumber', label: 'Número de cuenta', placeholder: '00-061-12262-78', required: true, maxLength: 40 },
  { key: 'holderName', label: 'Titular', placeholder: 'Comunidad Galadhrym', required: true, maxLength: 120 },
  { key: 'holderRut', label: 'RUT del titular', placeholder: '65.123.456-7', required: true, maxLength: 20 },
  { key: 'holderEmail', label: 'Correo del titular (opcional)', placeholder: 'tesoreria@…', required: false, maxLength: 120 },
];

/**
 * Cuentas bancarias guardadas para elegirlas en cada torneo. Una cuenta
 * asignada a torneos no se borra: se desactiva.
 */
export function BankAccountsDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  /// Al crear una desde el formulario del torneo, queda elegida
  onCreated?: (account: BankAccount) => void;
}) {
  const { data: accounts, isLoading } = useBankAccounts();
  const [editing, setEditing] = useState<BankAccount | 'new' | null>(null);
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const confirm = useConfirm();

  const toggleActive = (account: BankAccount) =>
    updateAccount.mutate(
      { id: account.id, isActive: !account.isActive },
      {
        onSuccess: () => toast.success(account.isActive ? 'Cuenta desactivada' : 'Cuenta reactivada'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo actualizar')),
      },
    );

  const remove = async (account: BankAccount) => {
    const ok = await confirm({
      title: `¿Eliminar la cuenta de ${account.holderName}?`,
      description: 'Dejará de aparecer en el desplegable de cuentas.',
      confirmLabel: 'Eliminar cuenta',
      tone: 'danger',
    });
    if (!ok) return;
    deleteAccount.mutate(account.id, {
      onSuccess: () => toast.success('Cuenta eliminada'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar'), { duration: 8000 }),
    });
  };

  return (
    <Modal
      title={editing === 'new' ? 'Nueva cuenta' : editing ? 'Editar cuenta' : 'Cuentas bancarias'}
      onClose={onClose}
      className="max-w-2xl"
    >
      {editing ? (
        <BankAccountForm
          account={editing === 'new' ? null : editing}
          onDone={(saved) => {
            if (editing === 'new' && saved) onCreated?.(saved);
            setEditing(null);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Se eligen en cada torneo para el pago de la inscripción.
            </p>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva cuenta
            </Button>
          </div>

          {isLoading ? (
            <div className="h-24 skeleton" />
          ) : !accounts?.length ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aún no hay cuentas. Crea la primera para asignarla a los torneos.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {accounts.map((account) => {
                const uses = account._count?.tournaments ?? 0;
                return (
                  <li key={account.id} className="flex flex-wrap items-center gap-3 p-3">
                    <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {account.holderName}
                        {!account.isActive && <Badge variant="outline">Inactiva</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bankAccountLabel(account)} · RUT {account.holderRut} ·{' '}
                        {uses === 1 ? '1 torneo' : `${uses} torneos`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(account)}
                        aria-label={`Editar la cuenta de ${account.holderName}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(account)}>
                        {account.isActive ? 'Desactivar' : 'Reactivar'}
                      </Button>
                      {uses === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(account)}
                          aria-label={`Eliminar la cuenta de ${account.holderName}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

function BankAccountForm({
  account,
  onDone,
}: {
  account: BankAccount | null;
  onDone: (saved?: BankAccount) => void;
}) {
  const [form, setForm] = useState<BankAccountInput>(
    account
      ? {
          bankName: account.bankName,
          accountType: account.accountType,
          accountNumber: account.accountNumber,
          holderName: account.holderName,
          holderRut: account.holderRut,
          holderEmail: account.holderEmail ?? '',
        }
      : EMPTY,
  );
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const saving = createAccount.isPending || updateAccount.isPending;
  const uses = account?._count?.tournaments ?? 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: BankAccountInput = {
      bankName: form.bankName.trim(),
      accountType: form.accountType.trim(),
      accountNumber: form.accountNumber.trim(),
      holderName: form.holderName.trim(),
      holderRut: form.holderRut.trim(),
      holderEmail: form.holderEmail?.trim() || null,
    };
    const options = {
      onSuccess: (saved: BankAccount) => {
        toast.success(account ? 'Cuenta actualizada' : 'Cuenta creada');
        onDone(saved);
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err, 'No se pudo guardar')),
    };
    if (account) updateAccount.mutate({ id: account.id, ...body }, options);
    else createAccount.mutate(body, options);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {uses > 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Está asignada a {uses === 1 ? '1 torneo' : `${uses} torneos`}: los cambios se verán en
          todos ellos y en los próximos correos de preinscripción.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label htmlFor={`account-${f.key}`} className="text-xs">
              {f.label}
            </Label>
            <Input
              id={`account-${f.key}`}
              type={f.key === 'holderEmail' ? 'email' : 'text'}
              required={f.required}
              maxLength={f.maxLength}
              value={form[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onDone()}>
          Volver
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
}
