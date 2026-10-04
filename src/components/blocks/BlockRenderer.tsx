import type { Block } from '@/types';
import { HeroBlock } from './HeroBlock';
import { RichTextBlock } from './RichTextBlock';
import { CardsBlock } from './CardsBlock';
import { CtaBlock } from './CtaBlock';
import { GalleryBlock } from './GalleryBlock';
import { FaqBlock } from './FaqBlock';
import { ActivitiesBlock } from './ActivitiesBlock';

/**
 * Traduce un bloque del CMS a su componente. Un tipo desconocido no rompe la
 * página: simplemente no se pinta, de modo que añadir tipos en el backend
 * nunca deja la landing en blanco.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'HERO':
      return <HeroBlock data={block.data} />;
    case 'RICH_TEXT':
      return <RichTextBlock data={block.data} />;
    case 'CARDS':
      return <CardsBlock data={block.data} />;
    case 'CTA':
      return <CtaBlock data={block.data} />;
    case 'GALLERY':
      return <GalleryBlock data={block.data} />;
    case 'FAQ':
      return <FaqBlock data={block.data} />;
    case 'ACTIVITIES':
      return <ActivitiesBlock data={block.data} />;
    default:
      return null;
  }
}
