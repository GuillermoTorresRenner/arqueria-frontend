import { useRef } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

/// El backend acepta imágenes de hasta 5 MB y las deja en 150×150 WebP
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

/// Foto de perfil: se sube o se quita al momento, sin esperar al «Guardar»
export function AvatarField({
  user,
  pending,
  onUpload,
  onRemove,
}: {
  user: Pick<User, 'name' | 'surname' | 'email' | 'avatar'>;
  pending: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const pick = (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Elige una imagen (JPG, PNG o WebP)');
    if (file.size > MAX_AVATAR_SIZE) return toast.error('La imagen pesa más de 5 MB');
    onUpload(file);
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar user={user} className="h-20 w-20 text-xl" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden="true" />
            )}
            {user.avatar ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {user.avatar && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 5 MB. Se recorta en cuadrado.</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Elegir foto de perfil"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
