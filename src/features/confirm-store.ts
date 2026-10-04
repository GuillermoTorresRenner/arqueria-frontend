import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description?: import('react').ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /// `danger`: acciones destructivas (eliminar, desactivar, suspender)
  tone?: 'danger' | 'default';
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  options: null,
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      // Si quedara otra pregunta abierta, se da por cancelada
      get().resolve?.(false);
      set({ options, resolve });
    }),
  answer: (ok) => {
    get().resolve?.(ok);
    set({ options: null, resolve: null });
  },
}));

/**
 * Confirmación con el estilo del sitio, en lugar de window.confirm:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Eliminar…?', tone: 'danger' }))) return;
 */
export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}
