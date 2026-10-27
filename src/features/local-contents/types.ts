export type LocalKind = 'CONTEXT' | 'CHARACTER';
export type LocalScope = 'CLASS_ONLY' | 'SCHOOL_WIDE';
export type LocalEra = 'ANCIENT' | 'MEDIEVAL' | 'MODERN' | 'CONTEMPORARY';
export type LocalCategory = 'WAR' | 'POLITICS' | 'CULTURE' | 'SCIENCE' | 'RELIGION' | 'OTHER';

export interface LocalAuthor {
  uid: string;
  userName: string;
  fullName: string;
}

/** Tu lieu thay co soan (boi canh / nhan vat rieng cua lop, truong). */
export interface LocalItem {
  id: string;
  type: LocalKind;
  name: string;
  /** Mo ta boi canh, hoac tieu su nhan vat. */
  description: string;
  imageUrl?: string | null;
  isPublished: boolean;
  contentScope: LocalScope;
  // CONTEXT
  era?: LocalEra | null;
  category?: LocalCategory | null;
  year?: number | null;
  startYear?: number | null;
  endYear?: number | null;
  isBC?: boolean | null;
  location?: string | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // CHARACTER
  title?: string | null;
  personality?: string | null;
  bornYear?: number | null;
  isBornBc?: boolean | null;
  deathYear?: number | null;
  isDeathBc?: boolean | null;
  contextIds?: string[] | null;
  classIds?: string[] | null;
  createdBy?: LocalAuthor | null;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
}

export const LOCAL_ERA_LABELS: Record<LocalEra, string> = {
  ANCIENT: 'Cổ đại',
  MEDIEVAL: 'Trung đại',
  MODERN: 'Cận đại',
  CONTEMPORARY: 'Hiện đại',
};

export const LOCAL_CATEGORY_LABELS: Record<LocalCategory, string> = {
  WAR: 'Chiến tranh',
  POLITICS: 'Chính trị',
  CULTURE: 'Văn hóa',
  SCIENCE: 'Khoa học',
  RELIGION: 'Tôn giáo',
  OTHER: 'Khác',
};
