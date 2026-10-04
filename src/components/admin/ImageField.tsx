import { useRef } from 'react';
import { ImageUp, Loader2, X } from 'lucide-react';
import { useImageUploader } from '@/hooks/use-upload';
import { assetUrl } from '@/lib/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/// Campo de una sola imagen: se sube un archivo (el backend lo convierte a
/// WebP) o se pega una URL externa. El valor guardado es la ruta o la URL.
export function ImageField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useImageUploader();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const [url] = await uploadFiles([file]);
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      {value && (
        <img
          src={assetUrl(value)}
          alt=""
          className="h-32 w-full rounded-md border object-cover"
        />
      )}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <Input
          className="min-w-0 flex-1 basis-full sm:basis-auto"
          id={id}
          value={value}
          placeholder="Sube una imagen o pega una URL"
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageUp className="h-4 w-4" />
          )}
          Subir
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            aria-label="Quitar imagen"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          // Permite volver a elegir el mismo archivo tras quitarlo.
          e.target.value = '';
        }}
      />
    </div>
  );
}
