import { Eye, Flag, PenLine, RotateCcw, Star, TrendingDown, TrendingUp, Trophy, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, GOLD, MUTED, ORANGE, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import type { BattleMap } from '@/features/map/battle-map';
import { buildCompareMap, COMPARE_FACTIONS } from '@/features/map/battle-map-practice';
import { CORRECT_SCORE, type BattleMapScore } from '@/features/map/battle-map-scoring';
import { missingHints, nextRankAt, practiceRank, type PracticeRecord } from '@/features/map/practice-progress';

import { BattleMapCanvas } from './battle-map-canvas';

const colorOf = (id: string) => COMPARE_FACTIONS.find((f) => f.id === id)?.color ?? MUTED;
const formatPercent = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const TIER_COLORS = ['#6B7280', '#C98A00', '#2E7D32', GOLD];

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

/** "Ket qua so sanh": diem va cap bac, tien bo so voi lan truoc, con thieu gi, va luoc do so sanh. */
export function BattleCompareView({
  visible,
  title,
  answer,
  attempt,
  score,
  progress,
  onContinue,
  onRestart,
  onClose,
}: {
  visible: boolean;
  title: string;
  answer: BattleMap;
  attempt: BattleMap;
  score: BattleMapScore;
  progress?: { previous: PracticeRecord | null; record: PracticeRecord };
  /** "Ve tiep": quay lai bai ve. */
  onContinue: () => void;
  /** "Lam lai": to giay trang. */
  onRestart: () => void;
  /** "Dong": ve trang tran danh. */
  onClose: () => void;
}) {
  // Mac dinh xem luoc do so sanh; giu nut de xem luoc do goc, cham 1 lan de bat/tat.
  const [pinned, setPinned] = useState(false);
  const [holding, setHolding] = useState(false);
  const showAnswer = pinned || holding;
  const compareMap = useMemo(() => buildCompareMap(answer, attempt, score), [answer, attempt, score]);
  const hints = useMemo(() => missingHints(answer, score), [answer, score]);
  const correct = score.matches.filter((m) => m.score >= CORRECT_SCORE).length;
  const partial = score.matches.length - correct;
  const rank = practiceRank(score.percent);
  const nextAt = nextRankAt(score.percent);
  const shown = useCountUp(score.percent);

  const previous = progress?.previous ?? null;
  const isNewBest = !!progress && score.percent > 0 && (!previous || score.percent > previous.best);
  const delta = previous ? Math.round((score.percent - previous.last) * 10) / 10 : null;
  const tierColor = TIER_COLORS[rank.stars];

  const stats = [
    { id: 'cmp-correct', label: 'Đúng', value: correct },
    { id: 'cmp-partial', label: 'Gần đúng', value: partial },
    { id: 'cmp-missed', label: 'Thiếu', value: score.missedIds.length },
    { id: 'cmp-extra', label: 'Thừa / sai', value: score.extraIds.length },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onContinue}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <View style={s.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title}>Kết quả so sánh</Text>
            <Text style={s.sub} numberOfLines={1}>{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.iconBtn} accessibilityLabel="Đóng">
            <X size={18} color={TEXT} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={s.hero}>
            <View style={s.ring} accessibilityLabel={`${formatPercent(score.percent)}% chính xác`}>
              <Svg width={110} height={110} viewBox="0 0 110 110">
                <Circle cx={55} cy={55} r={RING_RADIUS} stroke={BORDER} strokeWidth={9} fill="none" />
                <Circle
                  cx={55} cy={55} r={RING_RADIUS} stroke={tierColor} strokeWidth={9} fill="none" strokeLinecap="round"
                  strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`} strokeDashoffset={RING_LENGTH * (1 - shown / 100)}
                  transform="rotate(-90 55 55)"
                />
              </Svg>
              <View style={s.ringLabel}>
                <Text style={s.ringValue}>{Math.round(shown)}<Text style={s.ringUnit}>%</Text></Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${rank.stars} trên 3 sao`}>
                {[0, 1, 2].map((i) => (
                  <Star key={i} size={18} color={i < rank.stars ? GOLD : BORDER} fill={i < rank.stars ? GOLD : 'transparent'} />
                ))}
              </View>
              <Text style={[s.rankTitle, { color: tierColor }]}>{rank.title}</Text>
              <Text style={s.rankMessage}>{rank.message}</Text>
              {isNewBest ? (
                <View style={s.newBest}>
                  <Trophy size={13} color="#fff" />
                  <Text style={s.newBestText}>Kỷ lục mới!</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={s.chips}>
            {delta !== null && delta !== 0 ? (
              <View style={[s.chip, { borderColor: delta > 0 ? '#2E7D32' : ORANGE }]}>
                {delta > 0 ? <TrendingUp size={13} color="#2E7D32" /> : <TrendingDown size={13} color={ORANGE} />}
                <Text style={[s.chipText, { color: delta > 0 ? '#2E7D32' : ORANGE }]}>
                  {delta > 0 ? '+' : ''}{formatPercent(delta)}% so với lần trước
                </Text>
              </View>
            ) : null}
            {progress ? (
              <>
                <View style={s.chip}><Trophy size={13} color={TEXT2} /><Text style={s.chipText}>Kỷ lục {formatPercent(progress.record.best)}%</Text></View>
                <View style={s.chip}><Text style={s.chipText}>Lần thử {progress.record.attempts}</Text></View>
              </>
            ) : null}
          </View>

          {nextAt !== null ? (
            <View style={s.next}>
              <View style={s.nextBar}><View style={[s.nextFill, { width: `${Math.min(100, (score.percent / nextAt) * 100)}%` }]} /></View>
              <Text style={s.nextText}>
                Còn <Text style={{ fontWeight: '800' }}>{formatPercent(Math.max(0.1, nextAt - score.percent))}%</Text> nữa để lên hạng{' '}
                <Text style={{ fontWeight: '800' }}>{practiceRank(nextAt).title}</Text>.
              </Text>
            </View>
          ) : null}

          <View style={s.stats}>
            {stats.map((st) => (
              <View key={st.id} style={s.stat}>
                <Text style={s.statValue}>{st.value}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={[s.dot, { backgroundColor: colorOf(st.id) }]} />
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={s.mapCard}>
            <Pressable
              onPressIn={() => setHolding(true)}
              onPressOut={() => setHolding(false)}
              onPress={() => setPinned((p) => !p)}
              delayLongPress={300}
              onLongPress={() => {}}
              style={[s.peek, showAnswer && s.peekOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: showAnswer }}
            >
              <Eye size={15} color={showAnswer ? '#fff' : TEXT} />
              <Text style={[s.peekText, showAnswer && { color: '#fff' }]}>
                {pinned ? 'Đang xem lược đồ gốc · chạm để quay lại' : holding ? 'Lược đồ gốc' : 'Giữ để xem lược đồ gốc'}
              </Text>
            </Pressable>
            <View style={s.canvas}>
              {showAnswer ? (
                <BattleMapCanvas key="answer" value={answer} legendTitle={`Lược đồ gốc ${title}`} />
              ) : (
                <BattleMapCanvas
                  key="overlay"
                  value={compareMap}
                  legendTitle="Chú giải so sánh"
                  symbolView={(sym) => ({ dim: sym.factionId === 'cmp-answer' })}
                />
              )}
            </View>
          </View>

          {hints.length > 0 ? (
            <View style={s.hints}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Flag size={14} color={ORANGE} />
                <Text style={s.hintsTitle}>Lược đồ gốc còn có</Text>
              </View>
              {hints.slice(0, 5).map((h) => (
                <Text key={h.key} style={s.hint}>
                  <Text style={{ fontWeight: '800' }}>{h.count}× </Text>
                  {h.label}
                  {h.faction ? <Text style={{ color: h.color ?? TEXT2, fontStyle: 'italic' }}> · {h.faction}</Text> : null}
                </Text>
              ))}
              {hints.length > 5 ? (
                <Text style={[s.hint, { color: MUTED }]}>và {hints.length - 5} nhóm khác, xem các ký hiệu đỏ trên lược đồ.</Text>
              ) : null}
            </View>
          ) : null}

          <Text style={s.note}>
            Điểm tính trên {score.answerCount} ký hiệu của lược đồ gốc và {score.attemptCount} ký hiệu bạn vẽ: vẽ thiếu hay
            vẽ thừa đều làm giảm điểm. Chữ và số thứ tự bước không được chấm. Mũi tên phải vẽ đúng chiều.
          </Text>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity onPress={onRestart} style={s.secondary}>
            <RotateCcw size={15} color={TEXT} />
            <Text style={s.secondaryText}>Làm lại</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onContinue} style={s.primary}>
            <PenLine size={15} color="#fff" />
            <Text style={s.primaryText}>Vẽ tiếp</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SURFACE },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  title: { color: TEXT, fontSize: 17, fontWeight: '800' },
  sub: { color: MUTED, fontSize: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  ring: { width: 110, height: 110 },
  ringLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: TEXT, fontSize: 30, fontWeight: '900' },
  ringUnit: { fontSize: 14, fontWeight: '700' },
  rankTitle: { fontSize: 20, fontWeight: '900' },
  rankMessage: { color: TEXT2, fontSize: 13, lineHeight: 18 },
  newBest: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  newBestText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: CARD,
  },
  chipText: { color: TEXT2, fontSize: 12, fontWeight: '600' },

  next: { paddingHorizontal: 16, marginTop: 12, gap: 6 },
  nextBar: { height: 6, borderRadius: 3, backgroundColor: BORDER, overflow: 'hidden' },
  nextFill: { height: '100%', backgroundColor: ORANGE },
  nextText: { color: TEXT2, fontSize: 12 },

  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  statValue: { color: TEXT, fontSize: 20, fontWeight: '900' },
  statLabel: { color: TEXT2, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  mapCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  peek: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  peekOn: { backgroundColor: TEXT },
  peekText: { color: TEXT, fontSize: 13, fontWeight: '700' },
  canvas: { height: 340 },

  hints: { marginHorizontal: 16, marginTop: 14, gap: 6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  hintsTitle: { color: TEXT, fontSize: 13, fontWeight: '800' },
  hint: { color: TEXT, fontSize: 13 },
  note: { color: MUTED, fontSize: 11, lineHeight: 16, paddingHorizontal: 16, marginTop: 12 },

  footer: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: CARD },
  secondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
  },
  secondaryText: { color: TEXT, fontSize: 14, fontWeight: '700' },
  primary: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46,
    borderRadius: 10, backgroundColor: ORANGE,
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
