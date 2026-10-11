import type { TournamentPayment } from '@/types';

/// Extensiones que acepta el backend para los reglamentos
export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.odt,.odp,.ods,.rtf,.txt';
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

export interface TournamentFormState {
  judgeIds: string[];
  rules: string;
  youtubeUrl: string;
  registrationEndDate: string;
  registrationEndTime: string;
  maxParticipants: string;
  /// Cuenta guardada a la que se transfiere ('' = sin asignar)
  bankAccountId: string;
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

