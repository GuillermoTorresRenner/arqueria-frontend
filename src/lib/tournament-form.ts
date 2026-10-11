import type {
  CategoryMode,
  TournamentCategory,
  TournamentCategoryConfig,
  TournamentPayment,
} from '@/types';

/// Extensiones que acepta el backend para los reglamentos
export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.odt,.odp,.ods,.rtf,.txt';
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

/// Una categoría en el formulario: los números como texto, como en los inputs
export interface CategoryFormState {
  /// null: categoría nueva
  id: string | null;
  /// Clave estable para la lista mientras no tiene id
  key: string;
  name: string;
  mode: CategoryMode;
  scoringFormatId: string;
  arrowsPerArcher: string;
  targetsToWin: string;
  shootOffArrows: string;
  playoffArrows: string;
  judgeId: string;
  /// Con inscritos no se puede quitar; con cuadro no cambia de modalidad
  registrations: number;
  hasBracket: boolean;
}

let nextKey = 0;

export function newCategory(config?: Partial<TournamentCategoryConfig>): CategoryFormState {
  return {
    id: null,
    key: `new-${++nextKey}`,
    name: config?.name ?? '',
    mode: config?.mode ?? 'SCORE',
    scoringFormatId: config?.scoringFormatId ?? '',
    arrowsPerArcher: String(config?.arrowsPerArcher ?? 3),
    targetsToWin: String(config?.targetsToWin ?? 3),
    shootOffArrows: String(config?.shootOffArrows ?? 1),
    playoffArrows: String(config?.playoffArrows ?? 1),
    judgeId: '',
    registrations: 0,
    hasBracket: false,
  };
}

/// Categoría guardada → estado del formulario
export function categoryToForm(c: TournamentCategory): CategoryFormState {
  return {
    ...newCategory(c),
    id: c.id,
    key: c.id,
    judgeId: c.judgeId ?? '',
    registrations: c._count.registrations,
    hasBracket: c._count.rounds > 0,
  };
}

/// Las dos categorías del reglamento del club, para el primer torneo
export const DEFAULT_CATEGORIES: Partial<TournamentCategoryConfig>[] = [
  { name: 'Tiro tradicional', mode: 'SCORE' },
  { name: 'Duelos', mode: 'KNOCKDOWN' },
];

export interface TournamentFormState {
  judgeIds: string[];
  rules: string;
  youtubeUrl: string;
  registrationEndDate: string;
  registrationEndTime: string;
  maxParticipants: string;
  /// Cuenta guardada a la que se transfiere ('' = sin asignar)
  bankAccountId: string;
  categories: CategoryFormState[];
  payment: { instructions?: string; fees: { label: string; amount: string }[] };
}

export const EMPTY_TOURNAMENT: TournamentFormState = {
  judgeIds: [],
  rules: '',
  youtubeUrl: '',
  registrationEndDate: '',
  registrationEndTime: '23:59',
  maxParticipants: '',
  bankAccountId: '',
  categories: [],
  payment: { fees: [{ label: 'Inscripción', amount: '' }] },
};

/// Instrucciones y montos guardados → campos del formulario (montos como texto)
export function paymentToForm(
  info: TournamentPayment | null | undefined,
): TournamentFormState['payment'] {
  if (!info) return EMPTY_TOURNAMENT.payment;
  return {
    instructions: info.instructions,
    fees: info.fees?.length
      ? info.fees.map((f) => ({ label: f.label, amount: String(f.amount) }))
      : EMPTY_TOURNAMENT.payment.fees,
  };
}

