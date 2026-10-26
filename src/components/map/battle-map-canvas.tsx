import { Image } from 'expo-image';
import { ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import {
  SYMBOL_LABELS,
  isLineSymbol,
  isNoteSymbol,
  type BattleMap,
  type BattleSymbol,
  type BattleSymbolType,
  type CameraRect,
} from '@/features/map/battle-map';
import { controlPoints, lineGeometry, pointsRect } from '@/features/map/battle-path';
import type { SymbolView } from '@/features/map/hooks/use-battle-story';

/**
 * Lược đồ trận đánh (chế độ xem) — bản mobile của BattleMapCanvas bên web:
 * ảnh nền + ký hiệu quân sự (react-native-svg), camera zoom theo giai đoạn,
 * khung spotlight và thẻ chú giải. Không có phần chỉnh sửa (chỉ admin, chỉ web).
 */

const DEFAULT_COLOR = '#b91c1c';

/** Glyph quân sự vẽ trong hộp 100×50; mũi tên chỉ sang phải khi rotation = 0. */
export function SymbolGlyph({ type, text, color, width }: {
  type: BattleSymbolType;
  text?: string;
  color: string;
  width: number;
}) {
  const unitBox = <Rect x="14" y="9" width="72" height="32" fill="white" />;
  return (
    <Svg width={width} height={width / 2} viewBox="0 0 100 50" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round">
      {type === 'arrow' && <Path d="M4 18H68V5L96 25 68 45V32H4Z" fill={color} fillOpacity={0.3} />}
      {type === 'flank' && <><Path d="M6 44C18 10 60 4 82 26" strokeWidth={6} /><Path d="M94 38 73 34 88 19Z" fill={color} /></>}
      {type === 'march' && <><Path d="M4 25H88" /><Path d="M74 13 94 25 74 37" /></>}
      {type === 'retreat' && <><Path d="M4 25H76" strokeWidth={6} strokeDasharray="10 7" /><Path d="M72 11 96 25 72 39Z" fill={color} /></>}
      {type === 'infantry' && <>{unitBox}<Path d="m14 9 72 32M86 9 14 41" /></>}
      {type === 'cavalry' && <>{unitBox}<Path d="M14 41 86 9" /></>}
      {type === 'archer' && <>{unitBox}<Path d="M36 35Q50 8 64 35M36 35H64M50 35V16" /></>}
      {type === 'artillery' && <>{unitBox}<Circle cx="50" cy="25" r="7" fill={color} /></>}
      {type === 'armor' && <>{unitBox}<Rect x="28" y="17" width="44" height="16" rx="8" /></>}
      {type === 'navy' && <><Path d="M8 28H92L78 45H22Z" fill="white" /><Path d="M50 28V4M50 6 72 22H50" /></>}
      {type === 'airforce' && <>{unitBox}<Path d="M30 25Q40 13 50 25Q60 37 70 25Q60 13 50 25Q40 37 30 25Z" /></>}
      {type === 'headquarters' && <><Path d="M25 47V5H82L66 18 82 31H25" /><Path d="m40 8 12 20m0-20L40 28" /></>}
      {type === 'fort' && <Path d="M14 45V9H26V17H38V9H50V17H62V9H74V17H86V9V45Z" fill="white" />}
      {type === 'camp' && <><Path d="M18 45 50 7 82 45Z" fill="white" /><Path d="M50 7V45M40 45 50 31 60 45" /></>}
      {type === 'defenseLine' && <><Path d="M2 34H98" strokeWidth={4} /><Path d="M8 34 15 18 22 34ZM32 34 39 18 46 34ZM56 34 63 18 70 34ZM80 34 87 18 94 34Z" fill={color} /></>}
      {type === 'stakes' && <><Path d="M2 40Q10 34 18 40T34 40T50 40T66 40T82 40T98 40" strokeWidth={2} /><Path d="M10 42 16 6 22 42M30 42 36 6 42 42M50 42 56 6 62 42M70 42 76 6 82 42" fill={color} fillOpacity={0.25} /></>}
      {type === 'ambush' && <><Path d="M8 44Q50 -8 92 44" strokeWidth={4} strokeDasharray="8 5" /><Path d="M50 20V36M30 28 37 38M70 28 63 38" /></>}
      {type === 'clash' && <Path d="M50 2 57 16 74 6 69 22 92 25 72 32 82 47 61 39 50 49 39 39 18 47 28 32 8 25 31 22 26 6 43 16Z" fill={color} fillOpacity={0.35} />}
      {type === 'victory' && <><Path d="M32 48V3" strokeWidth={4} /><Path d="M32 5H80L68 17 80 29H32" fill={color} /></>}
      {type === 'destroyed' && <><Circle cx="50" cy="25" r="21" fill="white" /><Path d="M37 12 63 38M63 12 37 38" strokeWidth={5} /></>}
      {type === 'step' && (
        <>
          <Circle cx="50" cy="25" r="22" fill={color} stroke="white" strokeWidth={3} />
          <SvgText x="50" y="33" fill="white" stroke="none" fontSize="24" fontWeight="800" textAnchor="middle">
            {text || '1'}
          </SvgText>
        </>
      )}
      {type === 'label' && <Path d="M30 9H70M50 9V41M39 41H61" />}
    </Svg>
  );
}

/** Vùng bao các ký hiệu (có lề), cùng đơn vị % với khung camera. */
function symbolsRect(symbols: BattleSymbol[], aspect: number): CameraRect | null {
  if (!symbols.length) return null;
  let x0 = 100, x1 = 0, y0 = 100, y1 = 0;
  for (const s of symbols) {
    if (isLineSymbol(s.type)) {
      const r = pointsRect(controlPoints(s, aspect));
      x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w);
      y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y + r.h);
      continue;
    }
    const a = (s.rotation * Math.PI) / 180, w = s.size / 2, h = s.size / 4;
    const ex = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
    const ey = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) * aspect;
    x0 = Math.min(x0, s.x - ex); x1 = Math.max(x1, s.x + ex);
    y0 = Math.min(y0, s.y - ey); y1 = Math.max(y1, s.y + ey);
  }
  const pad = 10;
  return { x: x0 - pad, y: y0 - pad * aspect, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad * aspect };
}

/** Zoom/dịch (gốc trên-trái, đơn vị % của mặt phẳng) để vừa khít `rect` — giống web. */
function cameraTransform(rect: CameraRect) {
  const scale = Math.max(1, Math.min(4, 100 / rect.w, 100 / rect.h));
  const clamp = (v: number) => Math.max(100 - 100 * scale, Math.min(0, v));
  return {
    scale,
    tx: clamp(50 - (rect.x + rect.w / 2) * scale),
    ty: clamp(50 - (rect.y + rect.h / 2) * scale),
  };
}

/** Hiệu ứng xuất hiện của 1 ký hiệu trong giai đoạn đang phát. */
function enteringFor(symbol: BattleSymbol, delay: number) {
  const effect = !symbol.effect || symbol.effect === 'auto'
    ? (symbol.type === 'clash' || symbol.type === 'victory' || symbol.type === 'destroyed' ? 'pop' : 'fade')
    : symbol.effect;
  return effect === 'pop' || effect === 'pulse'
    ? ZoomIn.delay(delay).duration(500)
    : FadeIn.delay(delay).duration(effect === 'draw' ? 950 : 650);
}

function LineSymbol({ symbol, aspect, color, width, height }: {
  symbol: BattleSymbol;
  aspect: number;
  color: string;
  width: number;
  height: number;
}) {
  const g = lineGeometry(symbol, aspect);
  const dashed = !!g.dash;
  return (
    <Svg width={width} height={height} viewBox={`0 0 100 ${100 / aspect}`} style={StyleSheet.absoluteFill}>
      {/* Viền sáng dưới nét mực để đường luôn đọc được trên ảnh tối */}
      <G strokeLinejoin="round">
        <Path d={g.line} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={g.width + 0.55} strokeDasharray={g.dash} strokeLinecap={dashed ? 'butt' : 'round'} />
        {g.teeth ? <Path d={g.teeth} fill={color} stroke="#fff" strokeOpacity={0.85} strokeWidth={0.25} /> : null}
        <Path d={g.line} fill="none" stroke={color} strokeWidth={g.width} strokeDasharray={g.dash} strokeLinecap={dashed ? 'butt' : 'round'} />
      </G>
      {g.head ? (
        <Path
          d={g.head}
          fill={g.headOpen ? 'none' : color}
          stroke={g.headOpen ? color : '#fff'}
          strokeOpacity={g.headOpen ? 1 : 0.85}
          strokeWidth={g.headOpen ? g.width : 0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

interface BattleMapCanvasProps {
  value: BattleMap;
  legendTitle?: string;
  symbolView?: (symbol: BattleSymbol) => SymbolView;
  /** Vùng camera: khung chữ nhật, hoặc danh sách ký hiệu cần zoom vào. */
  focus?: CameraRect | BattleSymbol[] | null;
}

export function BattleMapCanvas({ value, legendTitle, symbolView, focus }: BattleMapCanvasProps) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [image, setImage] = useState<{ src: string; aspect: number | null; status: 'loading' | 'ready' | 'error' }>(
    { src: value.imageUrl, aspect: null, status: 'loading' },
  );
  const [legendOpen, setLegendOpen] = useState(false);

  // Đọc kích thước gốc của ảnh trước để dựng mặt phẳng đúng tỉ lệ
  useEffect(() => {
    if (!value.imageUrl) return;
    let cancelled = false;
    Image.loadAsync(value.imageUrl)
      .then((ref) => {
        if (cancelled) return;
        const ratio = ref.width && ref.height ? ref.width / ref.height : 1;
        setImage({ src: value.imageUrl, aspect: ratio, status: 'ready' });
      })
      .catch(() => {
        if (!cancelled) setImage({ src: value.imageUrl, aspect: null, status: 'error' });
      });
    return () => { cancelled = true; };
  }, [value.imageUrl]);

  const current = image.src === value.imageUrl ? image : { src: value.imageUrl, aspect: null, status: 'loading' as const };
  const aspect = current.aspect;
  const ready = current.status === 'ready' && !!aspect;
  const showSymbols = ready && value.mode === 'custom';

  // Mặt phẳng = ảnh nền vừa khít khung, giữ đúng tỉ lệ
  const plane = box && aspect
    ? (() => {
        const w = Math.min(box.w, box.h * aspect);
        return { w, h: w / aspect };
      })()
    : null;

  const rect = ready && focus && aspect ? (Array.isArray(focus) ? symbolsRect(focus, aspect) : focus) : null;
  const camera = rect ? cameraTransform(rect) : { scale: 1, tx: 0, ty: 0 };
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  useEffect(() => {
    if (!plane) return;
    const timing = { duration: 900 };
    scale.value = withTiming(camera.scale, timing);
    tx.value = withTiming((camera.tx / 100) * plane.w, timing);
    ty.value = withTiming((camera.ty / 100) * plane.h, timing);
  }, [camera.scale, camera.tx, camera.ty, plane?.w, plane?.h, scale, tx, ty]); // eslint-disable-line react-hooks/exhaustive-deps

  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const factionOf = (s: BattleSymbol) => value.factions.find((f) => f.id === s.factionId);
  // 1 dòng chú giải cho mỗi (loại, phe, ghi chú); ký hiệu chưa đặt tên dùng "loại (phe)"
  const legendEntries = [...new Map(value.symbols
    .filter((s) => isNoteSymbol(s.type) && !symbolView?.(s).hidden)
    .map((s) => {
      const faction = factionOf(s);
      const note = s.label.trim();
      const text = note || `${SYMBOL_LABELS[s.type]}${faction ? ` (${faction.name})` : ''}`;
      return [`${s.type}|${s.factionId}|${note}`, { type: s.type, color: faction?.color ?? DEFAULT_COLOR, text }] as const;
    })).values()];

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  }

  if (!value.imageUrl) {
    return (
      <View style={s.empty}>
        <MapIcon size={32} color={MUTED} />
        <Text style={s.emptyText}>Chưa có lược đồ trận đánh</Text>
      </View>
    );
  }

  return (
    <View style={s.root} onLayout={onLayout}>
      {/* Nền mờ cùng ảnh để 2 bên không bị dải trống */}
      <Image source={{ uri: value.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={18} />
      <View style={s.ambientShade} />

      {current.status !== 'ready' ? (
        <View style={s.status}>
          {current.status === 'error'
            ? <Text style={s.statusText}>Không tải được ảnh lược đồ.</Text>
            : <ActivityIndicator color="#fff" />}
        </View>
      ) : null}

      <View style={s.center}>
        <Animated.View
          style={[
            plane ? { width: plane.w, height: plane.h } : s.hidden,
            { overflow: 'visible', transformOrigin: 'top left' },
            cameraStyle,
          ]}
        >
          <Image
            source={{ uri: value.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />

          {showSymbols && plane && aspect ? (
            <>
              {value.symbols.map((symbol) => {
                if (!isLineSymbol(symbol.type)) return null;
                const view = symbolView?.(symbol) ?? {};
                if (view.hidden) return null;
                return (
                  <Animated.View
                    key={view.enter ? `${symbol.id}:${view.enter.key}` : symbol.id}
                    entering={view.enter ? enteringFor(symbol, view.enter.delay) : undefined}
                    style={[StyleSheet.absoluteFill, view.dim && s.dim]}
                    pointerEvents="none"
                  >
                    <LineSymbol
                      symbol={symbol}
                      aspect={aspect}
                      color={factionOf(symbol)?.color ?? DEFAULT_COLOR}
                      width={plane.w}
                      height={plane.h}
                    />
                  </Animated.View>
                );
              })}

              {value.symbols.map((symbol) => {
                if (isLineSymbol(symbol.type)) return null;
                const view = symbolView?.(symbol) ?? {};
                if (view.hidden) return null;
                const width = (symbol.size / 100) * plane.w;
                const color = factionOf(symbol)?.color ?? DEFAULT_COLOR;
                return (
                  <Animated.View
                    key={view.enter ? `${symbol.id}:${view.enter.key}` : symbol.id}
                    entering={view.enter ? enteringFor(symbol, view.enter.delay) : undefined}
                    pointerEvents="none"
                    style={[
                      s.symbol,
                      {
                        left: (symbol.x / 100) * plane.w - width / 2,
                        top: (symbol.y / 100) * plane.h - width / 4,
                        width,
                        transform: [{ rotate: `${symbol.rotation}deg` }],
                      },
                      view.dim && s.dim,
                    ]}
                  >
                    {symbol.type === 'label' ? (
                      <Text style={[s.textLabel, { color }]}>{symbol.label}</Text>
                    ) : (
                      <SymbolGlyph type={symbol.type} text={symbol.label} color={color} width={width} />
                    )}
                  </Animated.View>
                );
              })}
            </>
          ) : null}

          {/* Khung spotlight của giai đoạn có camera "frame" */}
          {ready && plane && focus && !Array.isArray(focus) ? (
            <View
              pointerEvents="none"
              style={[s.spotlight, {
                left: (focus.x / 100) * plane.w,
                top: (focus.y / 100) * plane.h,
                width: (focus.w / 100) * plane.w,
                height: (focus.h / 100) * plane.h,
              }]}
            />
          ) : null}
        </Animated.View>
      </View>

      {showSymbols && legendEntries.length > 0 ? (
        <View style={[s.legend, !legendOpen && s.legendClosed]}>
          <TouchableOpacity
            onPress={() => setLegendOpen((o) => !o)}
            style={s.legendHeader}
            accessibilityLabel={legendOpen ? 'Thu gọn chú giải' : 'Mở chú giải'}
          >
            <Text style={s.legendTitle} numberOfLines={1}>{legendOpen ? legendTitle || 'Chú giải' : 'Chú giải'}</Text>
            {legendOpen ? <ChevronUp size={15} color={TEXT} /> : <ChevronDown size={15} color={TEXT} />}
          </TouchableOpacity>
          {legendOpen ? (
            <View style={s.legendList}>
              {legendEntries.map((entry) => (
                <View key={`${entry.type}|${entry.color}|${entry.text}`} style={s.legendRow}>
                  <SymbolGlyph type={entry.type} color={entry.color} width={40} />
                  <Text style={s.legendText}>{entry.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#1f1b18' },
  ambientShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  hidden: { width: 0, height: 0, opacity: 0 },
  status: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  statusText: { color: '#fff', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CARD },
  emptyText: { color: TEXT2, fontSize: 14 },
  symbol: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  textLabel: {
    fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 4, paddingVertical: 2, textAlign: 'center',
  },
  dim: { opacity: 0.38 },
  spotlight: { position: 'absolute', borderWidth: 2, borderColor: ORANGE, borderStyle: 'dashed' },
  legend: {
    position: 'absolute', top: 10, right: 10, maxWidth: 260, maxHeight: '70%',
    backgroundColor: CARD, borderWidth: 1, borderColor: TEXT, borderRadius: 4, padding: 8,
  },
  legendClosed: { paddingVertical: 4 },
  legendHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  legendTitle: { flexShrink: 1, color: TEXT, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  legendList: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { flex: 1, color: TEXT2, fontSize: 12 },
});
