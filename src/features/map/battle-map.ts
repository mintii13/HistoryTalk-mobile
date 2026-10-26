/**
 * Lược đồ trận đánh (`battleMap` của bối cảnh) — phần dành cho người xem, port
 * từ HistoryTalk-FE components/historical-map/battle-map.types.ts. Toạ độ và
 * kích thước ký hiệu tính theo % của ảnh nền.
 */

export const SYMBOL_LABELS = {
  // Hướng hành động
  arrow: 'Tiến công', flank: 'Vu hồi / bao vây', march: 'Cơ động', retreat: 'Rút lui',
  // Lực lượng
  infantry: 'Bộ binh', cavalry: 'Kỵ binh', archer: 'Cung nỏ', artillery: 'Pháo binh',
  armor: 'Thiết giáp', navy: 'Thủy quân', airforce: 'Không quân',
  // Trận địa
  headquarters: 'Sở chỉ huy', fort: 'Thành / đồn lũy', camp: 'Doanh trại',
  defenseLine: 'Phòng tuyến', stakes: 'Bãi cọc', ambush: 'Mai phục',
  // Diễn biến
  clash: 'Giao tranh', victory: 'Chiến thắng', destroyed: 'Bị tiêu diệt',
  step: 'Mốc diễn biến', label: 'Chú thích',
} as const;

export type BattleSymbolType = keyof typeof SYMBOL_LABELS;

/** `label` của "label" là chữ vẽ trên bản đồ, của "step" là số trong vòng tròn, còn lại là chú giải. */
export const isNoteSymbol = (type: BattleSymbolType) => type !== 'label' && type !== 'step';

/** Ký hiệu dạng đường: vẽ bằng path theo các điểm. */
export const LINE_SYMBOLS: readonly BattleSymbolType[] = ['arrow', 'flank', 'march', 'retreat', 'defenseLine', 'stakes'];
export const isLineSymbol = (type: BattleSymbolType) => LINE_SYMBOLS.includes(type);

export interface BattleFaction { id: string; name: string; color: string }
/** Điểm trên ảnh, theo % chiều rộng (x) và chiều cao (y). */
export interface MapPoint { x: number; y: number }

export type SymbolEffect = 'auto' | 'draw' | 'fade' | 'pop' | 'pulse';

export interface BattleSymbol {
  id: string;
  type: BattleSymbolType;
  factionId: string;
  label: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  /** Giai đoạn ký hiệu xuất hiện; không có = luôn hiện (lớp nền). */
  phaseId?: string;
  effect?: SymbolEffect;
  /** Ký hiệu dạng đường: đi qua các điểm này. */
  points?: MapPoint[];
  /** Hệ số độ dày nét; không có = 1. */
  weight?: number;
}

/** Vùng ảnh theo % chiều rộng (x, w) và chiều cao (y, h). */
export interface CameraRect { x: number; y: number; w: number; h: number }

/** 1 cảnh của trận: ký hiệu của cảnh hiện ra trong lúc đọc thuyết minh. */
export interface BattlePhase {
  id: string;
  title: string;
  narration: string;
  /** "auto" zoom vào ký hiệu của cảnh, "full" giữ toàn bản đồ, "frame" zoom vào `focus`. */
  camera: 'auto' | 'full' | 'frame';
  focus?: CameraRect;
}

export interface BattleMap {
  version: 1;
  mode: 'custom' | 'image';
  imageUrl: string;
  imageSource: string;
  factions: BattleFaction[];
  symbols: BattleSymbol[];
  phases?: BattlePhase[];
}

export const emptyBattleMap = (): BattleMap => ({
  version: 1, mode: 'custom', imageUrl: '', imageSource: '', factions: [], symbols: [],
});

/** Kiểm tra lỏng hơn web (web còn validate để lưu) — đủ để hiển thị an toàn. */
export function isBattleMap(value: unknown): value is BattleMap {
  if (!value || typeof value !== 'object') return false;
  const map = value as BattleMap;
  return map.version === 1 && (map.mode === 'custom' || map.mode === 'image')
    && typeof map.imageUrl === 'string'
    && Array.isArray(map.factions) && Array.isArray(map.symbols)
    && map.symbols.every((s) => s && typeof s.id === 'string' && Object.hasOwn(SYMBOL_LABELS, s.type)
      && [s.x, s.y, s.size, s.rotation].every(Number.isFinite))
    && (map.phases === undefined || (Array.isArray(map.phases) && map.phases.every((p) => p && typeof p.id === 'string'
      && typeof p.narration === 'string')));
}
