import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/// Modales abiertos, del más antiguo al más reciente: con uno encima de otro
/// (lugares sobre actividad), Escape cierra solo el de arriba.
const openModals: string[] = [];

/// Diálogo modal del panel: Escape cierra, el fondo no hace scroll mientras
/// está abierto y el título queda asociado para lectores de pantalla.
export function Modal({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  // onClose suele ser una función nueva en cada render: se lee desde un ref
  // para que el efecto corra solo al abrir y cerrar. Si se repitiera, el modal
  // de abajo volvería a la cima de la pila al re-renderizarse.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    openModals.push(titleId);
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' &&
      openModals[openModals.length - 1] === titleId &&
      onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(titleId), 1);
      document.body.style.overflow = overflow;
    };
  }, [titleId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={cn(
          'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-4 shadow-lg sm:p-6',
          className,
        )}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
