import { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConfirmStore } from '@/features/confirm-store';

/// Se monta una vez (App). Escape o cerrar equivale a cancelar.
export function ConfirmDialog() {
  const { options, answer } = useConfirmStore();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = options?.tone === 'danger';

  // En una acción destructiva el foco empieza en «Cancelar»: un Enter por
  // inercia no debe borrar nada.
  useEffect(() => {
    if (options) (danger ? cancelRef : confirmRef).current?.focus();
  }, [options, danger]);

  if (!options) return null;
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <Modal title={options.title} onClose={() => answer(false)} className="max-w-md">
      <div className="flex gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {options.description && (
          <div className="pt-2 text-sm leading-relaxed text-muted-foreground">
            {options.description}
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button ref={cancelRef} variant="outline" onClick={() => answer(false)}>
          {options.cancelLabel ?? 'Cancelar'}
        </Button>
        <Button
          ref={confirmRef}
          variant={danger ? 'destructive' : 'default'}
          onClick={() => answer(true)}
        >
          {options.confirmLabel ?? 'Confirmar'}
        </Button>
      </div>
    </Modal>
  );
}
