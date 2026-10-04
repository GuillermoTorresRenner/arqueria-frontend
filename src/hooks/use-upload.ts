import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface UploadImageResponse {
  /// Ruta relativa al backend, p. ej. `/public/images/abc123.webp`.
  url: string;
}

/// Sube una imagen al backend, que la convierte a WebP y la guarda en el
/// servidor. Devuelve la ruta relativa que se guarda en el bloque.
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return (await api.post<UploadImageResponse>('/upload/image', body)).data.url;
    },
  });
}

/// Mismo tope que el FileInterceptor de /upload/image: avisar antes de subir
/// es mejor que esperar a que el backend devuelva un 413.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/// Sube varios archivos en serie y devuelve las rutas de los que entraron. Los
/// rechazados o fallidos se notifican uno a uno sin cortar el resto.
export function useImageUploader() {
  const upload = useUploadImage();
  // isPending de la mutación parpadea entre archivo y archivo; este estado
  // cubre el lote completo.
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[]) => {
    const urls: string[] = [];
    setIsUploading(true);
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: no es una imagen`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name}: supera los 10 MB`);
        continue;
      }
      try {
        urls.push(await upload.mutateAsync(file));
      } catch {
        toast.error(`${file.name}: no se pudo subir`);
      }
    }
    setIsUploading(false);
    return urls;
  };

  return { uploadFiles, isUploading };
}
