import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/// Aplica el tema al <html>. Durante el cambio se suprimen las transiciones
/// para que la página no haga un barrido de colores.
export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  root.classList.add('theme-switching');
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  window.setTimeout(() => root.classList.remove('theme-switching'), 0);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Claro por defecto: el oscuro solo si el visitante lo elige
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => {
        // Alterna sobre lo que se ve, no sobre el valor guardado: desde
        // 'system' el usuario espera pasar al contrario de lo que está viendo.
        const next = resolveTheme(get().theme) === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'abma-theme',
      // v1: el valor por defecto pasa de 'system' a 'light'. El botón solo
      // guarda 'light' o 'dark', así que un 'system' guardado significa que
      // nunca eligió: pasa a claro. Quien eligió oscuro lo conserva.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { theme?: Theme };
        if (version < 1 && state.theme === 'system') return { ...state, theme: 'light' };
        return state as ThemeState;
      },
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'light');
      },
    },
  ),
);
