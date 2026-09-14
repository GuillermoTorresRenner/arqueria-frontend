import { usePublicContent } from '@/hooks/use-content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { Seo } from '@/components/Seo';
import { SITE, stripHtml } from '@/lib/seo';
import type { HeroData, RichTextData } from '@/types';

export function HomePage() {
  const { data: sections, isLoading, isError } = usePublicContent();

  if (isLoading) {
    return (
      <div className="container space-y-6 py-24" aria-busy="true">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-semibold">No pudimos cargar el contenido</h1>
        <p className="section-lead">
          Vuelve a intentarlo en unos minutos.
        </p>
      </div>
    );
  }

  // La descripción sale del propio contenido del CMS: si el admin reescribe
  // el hero, el SEO lo sigue sin tocar código.
  const heroBlock = sections
    ?.flatMap((s) => s.blocks)
    .find((b) => b.type === 'HERO');
  const aboutBlock = sections
    ?.flatMap((s) => s.blocks)
    .find((b) => b.type === 'RICH_TEXT');

  const description =
    (heroBlock?.data as HeroData | undefined)?.text ||
    ((aboutBlock?.data as RichTextData | undefined)?.html
      ? stripHtml((aboutBlock!.data as RichTextData).html!)
      : undefined) ||
    SITE.description;

  return (
    <>
      <Seo description={description} path="/" />
      {sections?.map((section) => (
        <div key={section.key} id={section.key}>
          {section.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      ))}
    </>
  );
}
