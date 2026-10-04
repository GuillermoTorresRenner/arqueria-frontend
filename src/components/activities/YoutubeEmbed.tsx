import { cn } from '@/lib/utils';

/// Video de YouTube en modo de privacidad mejorada (sin cookies hasta que se
/// reproduce) y con carga diferida.
export function YoutubeEmbed({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn('aspect-video overflow-hidden rounded-md border bg-black', className)}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
