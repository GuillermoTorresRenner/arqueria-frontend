import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

/**
 * Solo guarda los datos del usuario para pintar la UI. El token vive en una
 * cookie httpOnly que este código no puede leer: la autorización real la
 * decide siempre el backend.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'abma-auth' },
  ),
);
