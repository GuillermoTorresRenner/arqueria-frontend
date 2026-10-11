import { useState } from 'react';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

type AvatarUser = Pick<User, 'name' | 'surname' | 'email' | 'avatar'>;

/// Iniciales para cuando no hay foto: «Guillermo Torres» → «GT»
function initials(user: AvatarUser) {
  const parts = [user.name, user.surname].filter(Boolean) as string[];
  const letters = parts.length ? parts.map((p) => p.trim()[0]) : [user.email[0]];
  return letters.join('').slice(0, 2).toUpperCase();
}

/// Foto del usuario o, si no tiene (o no carga), sus iniciales
export function UserAvatar({ user, className }: { user: AvatarUser; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = assetUrl(user.avatar);
  const showImage = src && failed !== src;

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} />
      ) : (
        initials(user)
      )}
    </span>
  );
}
