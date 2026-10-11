import type { CategoryMode, MatchKind } from '@/types';

export const KIND_LABEL: Record<MatchKind, string | null> = {
  REGULAR: null,
  REPECHAGE: 'Repechaje',
  PLAYOFF: 'Minironda',
  THIRD_PLACE: '3.er lugar',
  FINAL: 'Final',
};

export const MODE_LABEL: Record<CategoryMode, string> = {
  SCORE: 'Puntaje',
  KNOCKDOWN: 'Duelos',
};

export const personName = (p?: { name: string | null; surname: string | null } | null) =>
  [p?.name, p?.surname].filter(Boolean).join(' ');
