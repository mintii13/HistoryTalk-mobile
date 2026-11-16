import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import {
  clampPercent,
  defaultSymbolSize,
  isLineSymbol,
  withPoints,
  type BattleMap,
  type BattleSymbol,
  type BattleSymbolType,
  type MapPoint,
} from '@/features/map/battle-map';
import { controlPoints, simplify } from '@/features/map/battle-path';

import { LineSymbol, SymbolGlyph } from './battle-map-canvas';

const DEFAULT_COLOR = '#b91c1c';
/** Di chuyen it hon nguong nay (px) = cham, khong phai keo. */
const TAP_SLOP = 8;
/** Duong ngan hon nguong nay (% chieu rong anh) bi bo qua. */
const MIN_LINE = 3;

export type SketchTool = { kind: 'place'; type: BattleSymbolType } | { kind: 'erase' };

let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Ky hieu gan diem cham nhat (trong vung cham), uu tien ky hieu ve sau. */
function hitTest(symbols: BattleSymbol[], p: MapPoint, aspect: number): BattleSymbol | null {
  let best: { s: BattleSymbol; d: number } | null = null;
  const toPlane = (q: MapPoint) => ({ x: q.x, y: q.y / aspect });
  const tp = toPlane(p);
  for (const s of symbols) {
    let d: number;
    if (isLineSymbol(s.type)) {
      const pts = controlPoints(s, aspect).map(toPlane);
      d = Infinity;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, ((tp.x - a.x) * dx + (tp.y - a.y) * dy) / len2)) : 0;
        d = Math.min(d, Math.hypot(tp.x - (a.x + dx * t), tp.y - (a.y + dy * t)));
      }
      if (d > 4) continue;
    } else {
      d = Math.hypot(tp.x - s.x, tp.y - s.y / aspect);
      if (d > Math.max(4, s.size / 2)) continue;
    }
    if (!best || d <= best.d) best = { s, d };
  }
  return best?.s ?? null;
}

/**
 * Mat phang ve cam ung cho "Thu thach tri nho" / "Tu ve": cham de dat ky hieu, keo de ve mui ten va
 * phong tuyen, cong cu xoa de bo ky hieu. Toa do luu theo % anh nen giong web.
 */
export function BattleMapSketch({
  value,
  aspect,
  tool,
  factionId,
  onAdd,
  onRemove,
  showMap,
}: {
  value: BattleMap;
  aspect: number;
  tool: SketchTool | null;
  factionId: string | null;
  onAdd: (symbol: BattleSymbol) => void;
  onRemove: (id: string) => void;
  /** Ban do hien thay cho bai ve (vd. dang xem nhanh lan nua). */
  showMap?: BattleMap | null;
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [stroke, setStroke] = useState<MapPoint[] | null>(null);
  const plane = box ? (() => {
    const w = Math.min(box.w, box.h * aspect);
    return { w, h: w / aspect };
  })() : null;

  const gesture = useRef<{ start: { x: number; y: number }; points: MapPoint[]; moved: boolean } | null>(null);

  const toPercent = (e: GestureResponderEvent): MapPoint | null => {
    if (!plane) return null;
    return {
      x: clampPercent((e.nativeEvent.locationX / plane.w) * 100),
      y: clampPercent((e.nativeEvent.locationY / plane.h) * 100),
    };
  };

  // Responder thuong cua View (khong dung PanResponder) de handler luon thay props moi nhat.
  const handlers = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const p = toPercent(e);
      if (!p) return;
      gesture.current = { start: { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }, points: [p], moved: false };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const g = gesture.current;
      if (!g) return;
      if (!g.moved && Math.hypot(e.nativeEvent.pageX - g.start.x, e.nativeEvent.pageY - g.start.y) > TAP_SLOP) g.moved = true;
      if (!g.moved || tool?.kind !== 'place' || !isLineSymbol(tool.type)) return;
      const p = toPercent(e);
      if (!p) return;
      const last = g.points[g.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.6) return;
      g.points.push(p);
      setStroke([...g.points]);
    },
    onResponderRelease: () => {
      const g = gesture.current;
      gesture.current = null;
      setStroke(null);
      if (!g || !tool) return;
      const at = g.points[0];
      if (tool.kind === 'erase') {
        const hit = hitTest(value.symbols, at, aspect);
        if (hit) onRemove(hit.id);
        return;
      }
      if (!factionId) return;
      const base: BattleSymbol = {
        id: newId(), type: tool.type, factionId, label: '', x: at.x, y: at.y,
        size: defaultSymbolSize(tool.type), rotation: 0,
      };
      if (isLineSymbol(tool.type)) {
        if (!g.moved || g.points.length < 2) return;
        const pts = simplify(g.points, aspect);
        const span = Math.hypot(pts[pts.length - 1].x - pts[0].x, (pts[pts.length - 1].y - pts[0].y) / aspect);
        const length = pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - pts[i - 1].x, (p.y - pts[i - 1].y) / aspect) : 0), 0);
        if (Math.max(span, length) < MIN_LINE || pts.length < 2) return;
        onAdd(withPoints(base, pts));
        return;
      }
      if (g.moved) return;
      const label = tool.type === 'step' ? String(value.symbols.filter((x) => x.type === 'step').length + 1) : '';
      onAdd({ ...base, label });
    },
    onResponderTerminate: () => {
      gesture.current = null;
      setStroke(null);
    },
  };

  const shown = showMap ?? value;
  const factionColor = (id: string) => shown.factions.find((f) => f.id === id)?.color ?? DEFAULT_COLOR;
  const strokeColor = factionId ? value.factions.find((f) => f.id === factionId)?.color ?? DEFAULT_COLOR : DEFAULT_COLOR;

  return (
    <View style={s.root} onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={{ uri: value.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={18} />
      <View style={s.shade} />
      {plane ? (
        <View style={s.center}>
          <View style={{ width: plane.w, height: plane.h }} {...(showMap ? {} : handlers)}>
            <Image source={{ uri: value.imageUrl }} style={StyleSheet.absoluteFill} contentFit="contain" />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {shown.symbols.filter((sym) => isLineSymbol(sym.type)).map((sym) => (
                <LineSymbol key={sym.id} symbol={sym} aspect={aspect} color={factionColor(sym.factionId)} width={plane.w} height={plane.h} />
              ))}
              {shown.symbols.filter((sym) => !isLineSymbol(sym.type)).map((sym) => {
                const width = (sym.size / 100) * plane.w;
                const color = factionColor(sym.factionId);
                return (
                  <View
                    key={sym.id}
                    style={[s.symbol, {
                      left: (sym.x / 100) * plane.w - width / 2,
                      top: (sym.y / 100) * plane.h - width / 4,
                      width,
                      transform: [{ rotate: `${sym.rotation}deg` }],
                    }]}
                  >
                    {sym.type === 'label' ? (
                      <Text style={[s.textLabel, { color }]}>{sym.label}</Text>
                    ) : (
                      <SymbolGlyph type={sym.type} text={sym.label} color={color} width={width} />
                    )}
                  </View>
                );
              })}
              {stroke && stroke.length > 1 ? (
                <Svg width={plane.w} height={plane.h} viewBox={`0 0 100 ${100 / aspect}`} style={StyleSheet.absoluteFill}>
                  <Path
                    d={stroke.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${(p.y / aspect).toFixed(2)}`).join('')}
                    fill="none"
                    stroke={strokeColor}
                    strokeOpacity={0.75}
                    strokeWidth={0.7}
                    strokeDasharray="1.4 0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#1f1b18' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  symbol: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  textLabel: {
    fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 4, paddingVertical: 2, textAlign: 'center',
  },
});
