import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Eraser, Scale, Trash2, Undo2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BattleCompareView } from '@/components/map/battle-compare-view';
import { SymbolGlyph } from '@/components/map/battle-map-canvas';
import { BattleMapSketch, type SketchTool } from '@/components/map/battle-map-sketch';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, ORANGE_TINT_MUTED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import { useAuthStore } from '@/features/auth/store';
import { useHistoricalContext } from '@/features/historical-contexts/hooks/use-historical-context';
import { SYMBOL_GROUPS, SYMBOL_LABELS, isLineSymbol, type BattleMap, type BattleSymbol } from '@/features/map/battle-map';
import { toPracticeMap } from '@/features/map/battle-map-practice';
import { isGradableMap, isScoredSymbol, scoreBattleMap, type BattleMapScore } from '@/features/map/battle-map-scoring';
import { useImageAspect } from '@/features/map/hooks/use-image-aspect';
import {
  readPracticeDraft,
  savePracticeScore,
  writePracticeDraft,
  type PracticeKind,
  type PracticeRecord,
} from '@/features/map/practice-progress';

// Chu tu do can ban phim nhap — chua ho tro tren mobile (cung khong duoc cham diem).
const PALETTE = SYMBOL_GROUPS.map((g) => ({ ...g, types: g.types.filter((t) => t !== 'label') }));

/**
 * "Thu thach tri nho" (ve lai luoc do theo tri nho roi so voi ban goc) va "Tu ve" (giay trang de suy luan
 * chien thuat, khong cham) — ban mobile cua BattleMapEditor o che do practice/sketch tren web.
 */
export default function BattlePracticeScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const contextId = Array.isArray(id) ? id[0] : id ?? '';
  const kind: PracticeKind = mode === 'sketch' ? 'sketch' : 'challenge';
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid);

  const { data: event, isLoading, isError, refetch } = useHistoricalContext(contextId);
  const answer = event?.battleMap ?? null;
  const aspect = useImageAspect(answer?.imageUrl);

  const [sheet, setSheet] = useState<BattleMap | null>(null);
  const [history, setHistory] = useState<BattleSymbol[][]>([]);
  const [tool, setTool] = useState<SketchTool | null>(null);
  const [factionId, setFactionId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    attempt: BattleMap;
    score: BattleMapScore;
    progress: { previous: PracticeRecord | null; record: PracticeRecord };
  } | null>(null);
  const [comparing, setComparing] = useState(false);

  // To giay trang tu anh nen + cac phe cua ban goc, khoi phuc ban nhap neu co.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!answer || loadedFor.current === contextId) return;
    loadedFor.current = contextId;
    const blank = toPracticeMap(answer);
    void readPracticeDraft(uid, contextId, kind).then((draft) => {
      setSheet(draft ? { ...blank, symbols: draft.symbols } : blank);
      setFactionId(blank.factions[0]?.id ?? null);
    });
  }, [answer, contextId, kind, uid]);

  // Tu luu ban nhap tren may.
  useEffect(() => {
    if (!sheet) return;
    const t = setTimeout(() => void writePracticeDraft(uid, contextId, kind, sheet), 400);
    return () => clearTimeout(t);
  }, [sheet, uid, contextId, kind]);

  const target = useMemo(() => (answer ? answer.symbols.filter(isScoredSymbol).length : 0), [answer]);
  const drawn = sheet ? sheet.symbols.filter(isScoredSymbol).length : 0;
  const isChallenge = kind === 'challenge';

  const commit = (symbols: BattleSymbol[]) => {
    if (!sheet) return;
    setHistory((h) => [...h.slice(-49), sheet.symbols]);
    setSheet({ ...sheet, symbols });
  };
  const undo = () => {
    if (!sheet || !history.length) return;
    setSheet({ ...sheet, symbols: history[history.length - 1] });
    setHistory((h) => h.slice(0, -1));
  };
  const clearAll = () => {
    if (!sheet?.symbols.length) return;
    Alert.alert('Xóa hết ký hiệu?', 'Bạn có thể hoàn tác ngay sau đó.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa hết', style: 'destructive', onPress: () => commit([]) },
    ]);
  };

  const compare = async () => {
    if (!answer || !sheet || !sheet.symbols.length) return;
    setComparing(true);
    try {
      const score = scoreBattleMap(answer, sheet, aspect ?? 1);
      const progress = await savePracticeScore(uid, contextId, score.percent);
      setResult({ attempt: sheet, score, progress });
    } catch (e: any) {
      Alert.alert('Không chấm được', e?.message ?? 'Lược đồ này chưa chấm được.');
    } finally {
      setComparing(false);
    }
  };

  const restart = () => {
    if (!answer) return;
    setResult(null);
    setHistory([]);
    setSheet(toPracticeMap(answer));
  };

  if (isLoading || (answer && (!sheet || !aspect))) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  const usable = answer && answer.mode === 'custom' && !!answer.imageUrl.trim() && (!isChallenge || isGradableMap(answer));
  if (isError || !event || !usable || !sheet || !aspect) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.emptyTitle}>{isError ? 'Không tải được trận đánh' : 'Trận đánh này chưa có lược đồ để luyện vẽ'}</Text>
        {isError ? (
          <TouchableOpacity onPress={() => void refetch()} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.link}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeColor = sheet.factions.find((f) => f.id === factionId)?.color ?? ORANGE;
  const hint = !tool
    ? 'Chọn một ký hiệu bên dưới để bắt đầu vẽ.'
    : tool.kind === 'erase'
      ? 'Chạm vào ký hiệu để xóa.'
      : isLineSymbol(tool.type)
        ? `Kéo ngón tay để vẽ «${SYMBOL_LABELS[tool.type]}» theo đúng chiều.`
        : `Chạm lên lược đồ để đặt «${SYMBOL_LABELS[tool.type]}».`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1f1b18' }} edges={['top', 'bottom']}>
      {/* Thanh tren */}
      <View style={s.bar}>
        <TouchableOpacity onPress={() => router.back()} style={s.navBtn} accessibilityLabel="Đóng">
          <X size={18} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.barTitle} numberOfLines={1}>{isChallenge ? 'Thử thách trí nhớ' : 'Tự vẽ lược đồ'}</Text>
          {isChallenge ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.barMeta}><Text style={{ fontWeight: '800', color: TEXT }}>{drawn}</Text> / {target} ký hiệu</Text>
              <View style={s.goalBar}><View style={[s.goalFill, { width: `${Math.min(100, (drawn / Math.max(1, target)) * 100)}%` }]} /></View>
            </View>
          ) : (
            <Text style={s.barMeta} numberOfLines={1}>Bài vẽ tự lưu trên máy này, không chấm điểm</Text>
          )}
        </View>
        {isChallenge ? (
          <TouchableOpacity
            onPress={() => void compare()}
            disabled={!sheet.symbols.length || comparing}
            style={[s.actionBtn, (!sheet.symbols.length || comparing) && s.disabled]}
            accessibilityLabel="So sánh với lược đồ gốc"
          >
            {comparing ? <ActivityIndicator color="#fff" size="small" /> : <Scale size={15} color="#fff" />}
            <Text style={s.actionText}>So sánh</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.back()} style={s.actionBtn} accessibilityLabel="Xong">
            <Check size={15} color="#fff" />
            <Text style={s.actionText}>Xong</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mat phang ve */}
      <View style={{ flex: 1 }}>
        <BattleMapSketch
          value={sheet}
          aspect={aspect}
          tool={tool}
          factionId={factionId}
          onAdd={(sym) => commit([...sheet.symbols, sym])}
          onRemove={(sid) => commit(sheet.symbols.filter((x) => x.id !== sid))}
        />
        <View style={s.hintPill} pointerEvents="none">
          <Text style={s.hintText}>{hint}</Text>
        </View>
      </View>

      {/* Cong cu */}
      <View style={s.tools}>
        <View style={s.toolRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flex: 1 }}>
            {sheet.factions.map((f) => {
              const active = f.id === factionId;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFactionId(f.id)}
                  style={[s.faction, active && { borderColor: f.color, backgroundColor: f.color + '22' }]}
                  accessibilityState={{ selected: active }}
                >
                  <View style={[s.factionDot, { backgroundColor: f.color }]} />
                  <Text style={[s.factionText, active && { color: TEXT, fontWeight: '800' }]} numberOfLines={1}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={undo} disabled={!history.length} style={[s.iconBtn, !history.length && s.disabled]} accessibilityLabel="Hoàn tác">
            <Undo2 size={16} color={TEXT} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTool(tool?.kind === 'erase' ? null : { kind: 'erase' })}
            style={[s.iconBtn, tool?.kind === 'erase' && s.iconBtnActive]}
            accessibilityLabel="Xóa ký hiệu"
          >
            <Eraser size={16} color={tool?.kind === 'erase' ? '#fff' : TEXT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} disabled={!sheet.symbols.length} style={[s.iconBtn, !sheet.symbols.length && s.disabled]} accessibilityLabel="Xóa hết">
            <Trash2 size={16} color={TEXT} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.palette}>
          {PALETTE.map((group) => (
            <View key={group.title} style={s.group}>
              <Text style={s.groupTitle}>{group.title}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {group.types.map((type) => {
                  const active = tool?.kind === 'place' && tool.type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTool(active ? null : { kind: 'place', type })}
                      style={[s.symbolBtn, active && { borderColor: activeColor, backgroundColor: ORANGE_TINT_MUTED }]}
                      accessibilityLabel={SYMBOL_LABELS[type]}
                      accessibilityState={{ selected: active }}
                    >
                      <SymbolGlyph type={type} color={activeColor} width={38} text="1" />
                      <Text style={s.symbolLabel} numberOfLines={1}>{SYMBOL_LABELS[type]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {result ? (
        <BattleCompareView
          visible
          title={event.name}
          answer={answer}
          attempt={result.attempt}
          score={result.score}
          progress={result.progress}
          onContinue={() => setResult(null)}
          onRestart={restart}
          onClose={() => {
            setResult(null);
            router.back();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  primaryBtn: { backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.4 },

  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  barTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  barMeta: { color: MUTED, fontSize: 12 },
  goalBar: { flex: 1, maxWidth: 120, height: 5, borderRadius: 3, backgroundColor: BORDER, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: ORANGE },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: ORANGE,
  },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  hintPill: {
    position: 'absolute', top: 10, alignSelf: 'center', maxWidth: '90%',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  tools: { backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  faction: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 10, maxWidth: 170,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  factionDot: { width: 10, height: 10, borderRadius: 5 },
  factionText: { color: TEXT2, fontSize: 12, fontWeight: '600' },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  iconBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },

  palette: { gap: 14, paddingHorizontal: 12, paddingVertical: 10 },
  group: { gap: 4 },
  groupTitle: { color: MUTED, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  symbolBtn: {
    width: 64, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  symbolLabel: { color: TEXT2, fontSize: 9, fontWeight: '600', maxWidth: 58 },
});
