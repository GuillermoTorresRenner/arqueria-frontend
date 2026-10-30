import type { CategoryMode, MatchKind } from '@/types';

export const KIND_LABEL: Record<MatchKind, string | null> = {
  REGULAR: null,
  THIRD_PLACE: '3.er lugar',
  FINAL: 'Final',
};

/// Tamaño del cuadro: la potencia de 2 que alcanza a todos los arqueros
export function bracketSize(count: number) {
  let size = 1;
  while (size < count) size *= 2;
  return size;
}

/// Cuántos pasan directo a la segunda ronda (bye) para completar el cuadro
export const byeCount = (count: number) => bracketSize(count) - count;

export const MODE_LABEL: Record<CategoryMode, string> = {
  SCORE: 'Puntaje',
  KNOCKDOWN: 'Duelos',
};

export const personName = (p?: { name: string | null; surname: string | null } | null) =>
  [p?.name, p?.surname].filter(Boolean).join(' ');
