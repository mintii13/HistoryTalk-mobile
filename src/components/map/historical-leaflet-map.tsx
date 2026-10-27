import { Minus, Plus } from 'lucide-react-native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Text } from '@/components/ui/text';
import { BG, BORDER, CARD, MUTED, ORANGE, TEXT } from '@/constants/palette';

import { LEAFLET_HTML } from './leaflet-html';
import type {
  HistoricalLeafletMapHandle,
  HistoricalLeafletMapProps,
  PageMessage,
} from './historical-leaflet-map.types';

export type { HistoricalLeafletMapHandle, MapBattleMarker, MapNoteMarker } from './historical-leaflet-map.types';

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

    // Lenh camera gui truoc khi trang Leaflet san sang (vd. mo /map?battle=...) bi bo qua: nho lai, chay khi ready.
    const pendingCamera = useRef<[string, ...unknown[]] | null>(null);
    const camera = (fn: string, ...args: unknown[]) => {
      pendingCamera.current = [fn, ...args];
      call(fn, ...args);
    };
    useImperativeHandle(ref, () => ({
      flyTo: (lat, lng, zoom, cover = 0) => camera('flyTo', lat, lng, zoom, cover),
      focusPoint: (lat, lng, cover = 0) => camera('focusPoint', lat, lng, cover),
      resetView: () => camera('resetView'),
    }));

    useEffect(() => { if (ready) call('setBattles', battles); }, [ready, battles]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setNotes', notes); }, [ready, notes]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setSelected', selectedBattleId, selectedNoteId); }, [ready, selectedBattleId, selectedNoteId]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setDraft', draft); }, [ready, draft]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready) call('setPlacing', placing); }, [ready, placing]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (ready && pendingCamera.current) call(...pendingCamera.current); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

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
