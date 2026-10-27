// Kieu dung chung cho ban do Leaflet (WebView tren app, iframe tren web).

/** 1 trận đã được ghim trên bản đồ chung. */
export interface MapBattleMarker {
  id: string;
  title: string;
  yearLabel: string;
  imageUrl?: string;
  lat: number;
  lng: number;
}

/** 1 ghi chú học tập (ghim USER) của người xem. */
export interface MapNoteMarker {
  id: string;
  lat: number;
  lng: number;
}

export interface HistoricalLeafletMapHandle {
  /** `cover`: phần chiều cao bản đồ bị che từ dưới lên (0–1), để điểm đến không nằm sau bảng thông tin. */
  flyTo: (lat: number, lng: number, zoom: number, cover?: number) => void;
  focusPoint: (lat: number, lng: number, cover?: number) => void;
  resetView: () => void;
}

export interface HistoricalLeafletMapProps {
  battles: MapBattleMarker[];
  notes: MapNoteMarker[];
  selectedBattleId: string | null;
  selectedNoteId: string | null;
  /** Vị trí ghi chú đang soạn (chưa lưu). */
  draft: { lat: number; lng: number } | null;
  /** Đang chọn vị trí: chạm marker không chọn trận, chỉ chạm nền bản đồ. */
  placing: boolean;
  onSelectBattle: (id: string) => void;
  onSelectNote: (id: string) => void;
  onMapPress: (coords: { latitude: number; longitude: number }) => void;
}

export type PageMessage =
  | { type: 'ready' }
  | { type: 'battle'; id: string }
  | { type: 'note'; id: string }
  | { type: 'mapClick'; lat: number; lng: number };
