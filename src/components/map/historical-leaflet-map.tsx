import { Minus, Plus } from 'lucide-react-native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Text } from '@/components/ui/text';
import { BG, BORDER, CARD, MUTED, ORANGE, TEXT } from '@/constants/palette';

import { LEAFLET_HTML } from './leaflet-html';

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

interface HistoricalLeafletMapProps {
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

type PageMessage =
  | { type: 'ready' }
  | { type: 'battle'; id: string }
  | { type: 'note'; id: string }
  | { type: 'mapClick'; lat: number; lng: number };

/**
 * Bản đồ trận đánh: Leaflet trong WebView (giống hệt nền bản đồ web), marker
 * và camera điều khiển từ React Native.
 */
export const HistoricalLeafletMap = forwardRef<HistoricalLeafletMapHandle, HistoricalLeafletMapProps>(
  function HistoricalLeafletMap(props, ref) {
    const { battles, notes, selectedBattleId, selectedNoteId, draft, placing } = props;
    const webRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const handlers = useRef(props);
    useEffect(() => { handlers.current = props; });

    const run = (js: string) => webRef.current?.injectJavaScript(`try{${js}}catch(e){};true;`);
    const call = (fn: string, ...args: unknown[]) =>
      run(`window.HT&&window.HT.${fn}(${args.map((a) => JSON.stringify(a ?? null)).join(',')})`);

    useImperativeHandle(ref, () => ({
      flyTo: (lat, lng, zoom, cover = 0) => call('flyTo', lat, lng, zoom, cover),
      focusPoint: (lat, lng, cover = 0) => call('focusPoint', lat, lng, cover),
      resetView: () => call('resetView'),
    }));

    useEffect(() => { if (ready) call('setBattles', battles); }, [ready, battles]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setNotes', notes); }, [ready, notes]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setSelected', selectedBattleId, selectedNoteId); }, [ready, selectedBattleId, selectedNoteId]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setDraft', draft); }, [ready, draft]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setPlacing', placing); }, [ready, placing]); // eslint-disable-line react-hooks/exhaustive-deps

    function onMessage(e: WebViewMessageEvent) {
      let msg: PageMessage;
      try {
        msg = JSON.parse(e.nativeEvent.data) as PageMessage;
      } catch {
        return;
      }
      const h = handlers.current;
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'battle') h.onSelectBattle(msg.id);
      else if (msg.type === 'note') h.onSelectNote(msg.id);
      else if (msg.type === 'mapClick') h.onMapPress({ latitude: msg.lat, longitude: msg.lng });
    }

    return (
      <View style={s.root}>
        <WebView
          ref={webRef}
          source={{ html: LEAFLET_HTML, baseUrl: 'https://historytalk.app/' }}
          originWhitelist={['*']}
          onMessage={onMessage}
          onError={() => setFailed(true)}
          onLoadStart={() => { setReady(false); setFailed(false); }}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          bounces={false}
          style={s.web}
        />

        {!ready && !failed ? (
          <View style={s.overlay} pointerEvents="none">
            <ActivityIndicator color={ORANGE} size="large" />
          </View>
        ) : null}
        {failed ? (
          <View style={s.overlay}>
            <Text style={s.failText}>Không tải được bản đồ. Kiểm tra kết nối mạng.</Text>
            <TouchableOpacity onPress={() => webRef.current?.reload()} style={s.retryBtn}>
              <Text style={s.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {ready ? (
          <View style={s.zoom}>
            <TouchableOpacity onPress={() => call('zoomIn')} style={s.zoomBtn} accessibilityLabel="Phóng to bản đồ">
              <Plus size={18} color={TEXT} />
            </TouchableOpacity>
            <View style={s.zoomDivider} />
            <TouchableOpacity onPress={() => call('zoomOut')} style={s.zoomBtn} accessibilityLabel="Thu nhỏ bản đồ">
              <Minus size={18} color={TEXT} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  },
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: BG,
  },
  failText: { color: MUTED, fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  zoom: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  zoomBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, backgroundColor: BORDER },
});
