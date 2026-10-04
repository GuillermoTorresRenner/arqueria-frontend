import axios from 'axios';
import { useAuthStore } from '@/features/auth-store';

/// El backend autentica por cookie httpOnly, así que todas las llamadas
/// van con withCredentials.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

/// Rutas que exigen sesión: si se pierde, se vuelve al login.
const PROTECTED = ['/admin', '/mi-cuenta'];

/// Peticiones de auth en las que un 401 es la respuesta, no una sesión caída.
const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/verify-email'];

/// Refresco en curso, compartido: si varias peticiones fallan a la vez, todas
/// esperan al mismo POST /auth/refresh en vez de lanzar uno cada una.
let refreshing: Promise<void> | null = null;

/**
 * La cookie de acceso dura 5 minutos y la de refresco 24 h. Ante un 401 se
 * intenta renovar la sesión una vez y se repite la petición; si no se puede,
 * se limpia la sesión local y, en una ruta protegida, se vuelve al login.
 * (Antes se redirigía sin limpiar: el login veía el usuario guardado y
 * devolvía al panel, en bucle.)
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const isAuthCall = NO_REFRESH.some((path) => original?.url?.startsWith(path));

    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshing ??= api.post('/auth/refresh').then(() => undefined);
      await refreshing;
      return api(original);
    } catch {
      useAuthStore.getState().logout();
      if (PROTECTED.some((path) => location.pathname.startsWith(path))) {
        location.href = '/login';
      }
      return Promise.reject(error);
    } finally {
      refreshing = null;
    }
  },
);

/// Mensaje legible de un error de la API. El backend responde
/// `{ message: string | string[] }` (los errores de validación llegan como
/// lista); si no hay nada útil, se usa el texto de respaldo.
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message) && message.length) return message.join('. ');
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
