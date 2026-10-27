import { Minus, Plus } from 'lucide-react-native';
import { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BG, BORDER, CARD, MUTED, ORANGE, TEXT } from '@/constants/palette';

import { LEAFLET_HTML } from './leaflet-html';
import type {
  HistoricalLeafletMapHandle,
  HistoricalLeafletMapProps,
  PageMessage,
} from './historical-leaflet-map.types';

export type { HistoricalLeafletMapHandle, MapBattleMarker, MapNoteMarker } from './historical-leaflet-map.types';

// Ban web: react-native-webview khong chay tren trinh duyet (truoc day ban do quay vong mai).
// Cung trang Leaflet, nhung dat trong iframe srcdoc; trang goi window.ReactNativeWebView.postMessage
// nen gia lap doi tuong do bang postMessage len cua so cha.
const BRIDGE = `<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage({__ht:d},'*');}};</script>`;

type HTWindow = Window & { HT?: Record<string, (...args: unknown[]) => void> };

export const HistoricalLeafletMap = forwardRef<HistoricalLeafletMapHandle, HistoricalLeafletMapProps>(
  function HistoricalLeafletMap(props, ref) {
    const { battles, notes, selectedBattleId, selectedNoteId, draft, placing } = props;
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [ready, setReady] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const handlers = useRef(props);
    useEffect(() => { handlers.current = props; });

    const html = useMemo(() => LEAFLET_HTML.replace('<head>', `<head>${BRIDGE}`), []);

    const call = (fn: string, ...args: unknown[]) => {
      try {
        (frameRef.current?.contentWindow as HTWindow | null)?.HT?.[fn]?.(...args.map((a) => a ?? null));
      } catch {
        // iframe chua san sang
      }
    };

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

    useEffect(() => { if (ready) call('setBattles', battles); }, [ready, battles]);
    useEffect(() => { if (ready) call('setNotes', notes); }, [ready, notes]);
    useEffect(() => { if (ready) call('setSelected', selectedBattleId, selectedNoteId); }, [ready, selectedBattleId, selectedNoteId]);
    useEffect(() => { if (ready) call('setDraft', draft); }, [ready, draft]);
    useEffect(() => { if (ready) call('setPlacing', placing); }, [ready, placing]);
    useEffect(() => { if (ready && pendingCamera.current) call(...pendingCamera.current); }, [ready]);

    useEffect(() => {
      function onMessage(e: MessageEvent) {
        if (e.source !== frameRef.current?.contentWindow || typeof e.data?.__ht !== 'string') return;
        let msg: PageMessage;
        try {
          msg = JSON.parse(e.data.__ht) as PageMessage;
        } catch {
          return;
        }
        const h = handlers.current;
        if (msg.type === 'ready') setReady(true);
        else if (msg.type === 'battle') h.onSelectBattle(msg.id);
        else if (msg.type === 'note') h.onSelectNote(msg.id);
        else if (msg.type === 'mapClick') h.onMapPress({ latitude: msg.lat, longitude: msg.lng });
      }
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, []);

    return (
      <View style={s.root}>
        {createElement('iframe', {
          key: reloadKey,
          ref: frameRef,
          srcDoc: html,
          title: 'Bản đồ trận đánh',
          style: { flex: 1, width: '100%', height: '100%', border: 0, backgroundColor: BG },
        })}

        {!ready ? (
          <View style={s.overlay} pointerEvents="none">
            <ActivityIndicator color={ORANGE} size="large" />
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
        ) : (
          <TouchableOpacity
            onPress={() => { setReady(false); setReloadKey((k) => k + 1); }}
            style={s.reload}
            accessibilityLabel="Tải lại bản đồ"
          >
            <Text style={s.reloadText}>Tải lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  reload: { position: 'absolute', bottom: 16, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  reloadText: { color: MUTED, fontSize: 12, fontWeight: '600' },
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
