/** ADMIN = ghim trận đánh do Content Admin đặt; USER = ghi chú học tập của chính người xem. */
export type MapPinOwnerType = 'ADMIN' | 'USER';

export interface MapPin {
  pinId: string;
  contextId: string;
  createdBy: string;
  pinOwnerType: MapPinOwnerType;
  label: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  pinYear: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMapPinRequest {
  label: string;
  description?: string;
  latitude: number;
  longitude: number;
  pinYear: number;
}

/** Cập nhật từng phần: field bỏ trống giữ nguyên; `description: ""` xoá nội dung. */
export type UpdateMapPinRequest = Partial<CreateMapPinRequest>;

/** Điểm camera bản đồ staff đặt cho 1 bối cảnh (GET công khai). */
export interface MapFocus {
  focusId: string;
  contextId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  /** 1.0 – 20.0 */
  zoomLevel: number | null;
  orderIndex: number;
  isDefault: boolean;
  isActive: boolean;
}

export type MapCoordinates = { latitude: number; longitude: number };

/** Vùng kéo được của bản đồ (Leaflet `maxBounds`) — giống web. */
export const MAP_BOUNDS = { south: 5.7, west: 97.4, north: 24.6, east: 117.2 } as const;

export const STUDY_NOTE_LABEL_MAX = 100;
export const STUDY_NOTE_TEXT_MAX = 2000;
export const STUDY_NOTE_COLOR = '#1E8A6E';
/** Role được viết ghi chú học tập trên bản đồ (giống web). */
export const STUDY_NOTE_ROLES = ['CUSTOMER', 'SCHOOL_STUDENT', 'TEACHER'];
