import { useRef } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { assetUrl } from '@/lib/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImageUploader } from '@/hooks/use-upload';
import type { GalleryData } from '@/types';

type GalleryImage = NonNullable<GalleryData['images']>[number];

/// Editor de la lista de imágenes de un bloque GALLERY: subir varias a la vez,
/// escribir el texto alternativo, reordenar y quitar.
export function GalleryEditor({
  images,
  onChange,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useImageUploader();

  const handleFiles = async (files: File[]) => {
    const urls = await uploadFiles(files);
    if (urls.length) onChange([...images, ...urls.map((src) => ({ src, alt: '' }))]);
  };

  const update = (index: number, patch: Partial<GalleryImage>) =>
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));

  const move = (index: number, delta: -1 | 1) => {
    const next = [...images];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">La galería no tiene imágenes.</p>
      )}

      <ul className="space-y-2">
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <img
              src={assetUrl(image.src)}
              alt=""
              className="h-14 w-20 shrink-0 rounded border object-cover"
            />
            <Input
              className="order-last w-full sm:order-none sm:w-auto sm:flex-1"
              value={image.alt ?? ''}
              placeholder="Texto alternativo"
              aria-label={`Texto alternativo de la imagen ${index + 1}`}
              onChange={(e) => update(index, { alt: e.target.value })}
            />
            <span className="ml-auto flex sm:ml-0" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label="Subir en el orden"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(index, 1)}
              disabled={index === images.length - 1}
              aria-label="Bajar en el orden"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              aria-label={`Quitar la imagen ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {isUploading ? 'Subiendo…' : 'Añadir imágenes'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}
