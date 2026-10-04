import type { PaymentInfo } from '@/types';

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
  payment: Omit<PaymentInfo, 'fees'> & { fees: { label: string; amount: string }[] };
}

export const EMPTY_TOURNAMENT: TournamentFormState = {
  judgeIds: [],
  rules: '',
  youtubeUrl: '',
  registrationEndDate: '',
  registrationEndTime: '23:59',
  maxParticipants: '',
  payment: { fees: [{ label: 'Inscripción', amount: '' }] },
};

/// Datos de pago guardados → campos del formulario (montos como texto)
export function paymentToForm(info: PaymentInfo | null | undefined): TournamentFormState['payment'] {
  if (!info) return EMPTY_TOURNAMENT.payment;
  return {
    ...info,
    fees: info.fees?.length
      ? info.fees.map((f) => ({ label: f.label, amount: String(f.amount) }))
      : EMPTY_TOURNAMENT.payment.fees,
  };
}

