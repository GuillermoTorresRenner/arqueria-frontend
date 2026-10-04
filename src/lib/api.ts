import axios from 'axios';

/// El backend autentica por cookie httpOnly, así que todas las llamadas
/// van con withCredentials.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Una sesión caída en el panel debe devolver al login, no dejar la pantalla rota.
    if (error.response?.status === 401 && location.pathname.startsWith('/admin')) {
      location.href = '/login';
    }
    return Promise.reject(error);
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
