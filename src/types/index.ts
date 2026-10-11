export type Role = 'ADMIN' | 'JUDGE' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  role: Role;
  avatar: string | null;
  isActive: boolean;
  phone?: string | null;
  /// Confirmó su correo creando la contraseña desde el enlace del email
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
}

// ---------- Contenido (CMS) ----------

export type BlockType =
  | 'HERO'
  | 'RICH_TEXT'
  | 'GALLERY'
  | 'CARDS'
  | 'CTA'
  | 'FAQ'
  | 'ACTIVITIES';

export interface Block {
  id: string;
  type: BlockType;
  order?: number;
  isActive?: boolean;
  data: Record<string, unknown>;
}

export interface Section {
  id?: string;
  key: string;
  title: string;
  order?: number;
  isActive?: boolean;
  blocks: Block[];
}

// Formas concretas de `data` según el tipo de bloque.
export interface HeroData {
  title?: string;
  subtitle?: string;
  text?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /// Nombre del icono del botón (p. ej. "whatsapp"); opcional.
  ctaIcon?: string;
  image?: string | null;
}

export interface RichTextData {
  title?: string;
  html?: string;
}

export interface CardItem {
  title?: string;
  text?: string;
  icon?: string;
}

export interface CardsData {
  title?: string;
  items?: CardItem[];
}

export interface CtaData {
  title?: string;
  text?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /// Nombre del icono del botón (p. ej. "whatsapp"); opcional.
  ctaIcon?: string;
}

export interface GalleryData {
  title?: string;
  images?: { src: string; alt?: string }[];
}

export interface FaqData {
  title?: string;
  items?: { question: string; answer: string }[];
}

// ---------- Socios ----------

export type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type CategoryKind = 'DIVISION' | 'AGE' | 'GENDER';

export interface Category {
  id: string;
  kind: CategoryKind;
  code: string;
  label: string;
  minAge?: number | null;
  maxAge?: number | null;
  isActive: boolean;
}

export interface Member {
  id: string;
  memberNumber: number;
  documentId: string | null;
  phone: string | null;
  status: MemberStatus;
  membershipEnd: string | null;
  experience?: import('@/lib/join').ArcheryExperience | null;
  user: Pick<User, 'id' | 'name' | 'surname' | 'email' | 'avatar' | 'isActive'>;
  categories: { category: Category }[];
}

// ---------- Torneos ----------

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

export interface ScoringZone {
  label: string;
  value: number;
}

/// Diana: solo zonas. Cuántas flechas se tiran lo define la ronda.
export interface ScoringFormat {
  id: string;
  name: string;
  description: string | null;
  zones: ScoringZone[];
  isActive: boolean;
}

/// SCORE: diana por zonas · KNOCKDOWN: duelos con dianas abatibles
export type CategoryMode = 'SCORE' | 'KNOCKDOWN';

export interface TournamentCategorySummary {
  id: string;
  name: string;
  mode: CategoryMode;
  scoringFormat?: Pick<ScoringFormat, 'name' | 'zones'> | null;
}

/// Configuración de una categoría (lo que edita el admin)
export interface TournamentCategoryConfig {
  name: string;
  mode: CategoryMode;
  scoringFormatId: string | null;
  /// Puntaje: flechas por arquero en cada ronda
  arrowsPerArcher: number;
  /// Duelos: dianas abatidas para ganar
  targetsToWin: number;
  /// Flechas por arquero en cada tanda de desempate
  shootOffArrows: number;
  /// Flechas por arquero en la minironda entre perdedores empatados
  playoffArrows: number;
}

export interface TournamentCategory extends TournamentCategoryConfig {
  id: string;
  order: number;
  judgeId: string | null;
  _count: { registrations: number; rounds: number };
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  status: TournamentStatus;
  isPublic: boolean;
  categories?: TournamentCategorySummary[];
  _count?: { participants: number; registrations?: number };
}

// ---------- Actividades ----------

export interface Place {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive?: boolean;
  _count?: { activities: number };
}

export type ActivityType = 'ACTIVITY' | 'EVENT' | 'TOURNAMENT';

export interface Fee {
  label: string;
  amount: number;
}

/// Cuenta guardada para pagar inscripciones; se elige en cada torneo
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderRut: string;
  holderEmail: string | null;
  isActive: boolean;
  _count?: { tournaments: number };
}

/// Lo propio del pago de cada torneo (la cuenta va aparte)
export interface TournamentPayment {
  instructions?: string;
  fees?: Fee[];
}

/// Datos completos para transferir: cuenta asignada + instrucciones y montos
export interface PaymentInfo {
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  holderName?: string;
  holderRut?: string;
  holderEmail?: string;
  instructions?: string;
  fees?: Fee[];
}

export interface TournamentDocument {
  id: string;
  name: string;
  /// Relativa a public/ («documents/x.pdf»)
  path: string;
  mimeType: string;
  size: number;
}

/// Lo público de un torneo: montos sí, cuenta bancaria no
export interface PublicTournament {
  id: string;
  slug: string;
  status: TournamentStatus;
  rules: string | null;
  youtubeUrl: string | null;
  registrationEnd: string | null;
  maxParticipants: number | null;
  fees: Fee[];
  documents: TournamentDocument[];
  categories: TournamentCategorySummary[];
  /// El cupo cuenta arqueros (participantes); registrations, inscripciones por categoría
  _count: { registrations: number; participants: number };
}

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'WITHDRAWN';

/// Lo que ven el home y los socios
export interface PublicActivity {
  id: string;
  type: ActivityType;
  title: string;
  /// Cancelada: sigue visible, marcada; null = vigente
  cancelledAt: string | null;
  cancellationReason: string | null;
  startsAt: string;
  endsAt: string;
  recommendations: string | null;
  place: Place | null;
  tournament: PublicTournament | null;
  _count: { attendances: number };
}

export interface MemberRegistration {
  status: RegistrationStatus;
  createdAt: string;
  confirmedAt: string | null;
  category: { id: string; name: string };
  /// Número de participante: el mismo en todas sus categorías
  participant: { number: number };
}

export interface MemberActivity extends PublicActivity {
  attending: boolean;
  /// En los torneos el socio ve los datos de transferencia
  tournament: (PublicTournament & { paymentInfo: PaymentInfo | null }) | null;
  /// Sus inscripciones al torneo, una por categoría
  registrations?: MemberRegistration[];
}

export interface Activity extends Omit<PublicActivity, 'tournament'> {
  tournament: {
    id: string;
    slug: string;
    status: TournamentStatus;
    _count: { registrations: number };
  } | null;
  placeId: string | null;
  notifyMembers: boolean;
  notifiedAt: string | null;
  notifiedCount: number | null;
}

export interface ActivityAttendee {
  createdAt: string;
  member: {
    id: string;
    memberNumber: number;
    experience: string | null;
    user: { name: string | null; surname: string | null; email: string };
  };
}

export interface TournamentRegistration {
  id: string;
  status: RegistrationStatus;
  category: { id: string; name: string };
  participant: { number: number };
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: { name: string | null; surname: string | null } | null;
  member: ActivityAttendee['member'];
}

export interface ActivityDetail extends Omit<Activity, 'tournament'> {
  attendances: ActivityAttendee[];
  tournament:
    | (Omit<PublicTournament, 'fees' | 'categories'> & {
        categories: TournamentCategory[];
        bankAccountId: string | null;
        paymentInfo: TournamentPayment | null;
        judges: {
          user: { id: string; name: string | null; surname: string | null; email: string; userRoles: Role };
        }[];
        registrations: TournamentRegistration[];
      })
    | null;
}

export type WeatherStatus = 'good' | 'caution' | 'bad';

export interface WeatherConditions {
  code: number;
  description: string;
  tempMin: number;
  tempMax: number;
  precipitationProbability: number;
  windMax: number;
  gustsMax: number;
}

export type ActivityWeather =
  | {
      available: true;
      date: string;
      day: WeatherConditions;
      during: WeatherConditions | null;
      status: WeatherStatus;
      statusLabel: string;
      reasons: string[];
      source: string;
    }
  | {
      available: false;
      reason: 'no_location' | 'out_of_range' | 'past' | 'error';
      message: string;
    };

export interface ActivitiesData {
  title?: string;
  text?: string;
}
