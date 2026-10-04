import { create } from 'zustand';

/// Abre el formulario «Súmate al club» desde cualquier botón del sitio (CTA
/// del CMS, footer). El diálogo se monta una vez en PublicLayout.
export const useJoinStore = create<{
  open: boolean;
  openJoin: () => void;
  closeJoin: () => void;
}>((set) => ({
  open: false,
  openJoin: () => set({ open: true }),
  closeJoin: () => set({ open: false }),
}));
