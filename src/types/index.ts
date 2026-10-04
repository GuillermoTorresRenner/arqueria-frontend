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
  isInner?: boolean;
}

export interface ScoringFormat {
  id: string;
  name: string;
  description: string | null;
  arrowsPerEnd: number;
  endsPerRound: number;
  maxPerArrow: number;
  zones: ScoringZone[];
  isActive: boolean;
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
  scoringFormat?: ScoringFormat;
  _count?: { registrations: number; groups?: number; rounds?: number };
}

export interface LeaderboardEntry {
  position: number;
  memberId: string;
  memberNumber: number;
  name: string;
  avatar: string | null;
  categories: string[];
  total: number;
  innerTens: number;
  tens: number;
  endsShot: number;
}

export interface Leaderboard {
  tournamentId: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
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

/// Lo que ven el home y los socios
export interface PublicActivity {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  recommendations: string | null;
  place: Place | null;
  _count: { attendances: number };
}

export interface MemberActivity extends PublicActivity {
  attending: boolean;
}

export interface Activity extends PublicActivity {
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

export interface ActivityDetail extends Activity {
  attendances: ActivityAttendee[];
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
