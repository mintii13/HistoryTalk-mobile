import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Coins, Sparkles, Star, Trophy } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AMBER, BORDER, CARD, GREEN, MUTED, ORANGE, RED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import { useAuthStore } from '@/features/auth/store';
import { ERA_LABELS, type CharacterEra } from '@/features/characters/types';
import { useCustomerDashboard } from '@/features/dashboard/hooks/use-customer-dashboard';
import { useMyDashboard } from '@/features/dashboard/hooks/use-my-dashboard';
import { useQuizResults } from '@/features/quiz/hooks/use-quiz-results';

/**
 * Tiến độ học tập của Customer — bản mobile của trang /grades bên web
 * (CustomerGrades): GET /users/me/dashboard + GET /quizzes/results/me,
 * GET /customer/dashboard bổ sung hạn gói, tổng tin nhắn AI, lịch sử thanh toán.
 */

const ERA_ORDER = ['ANCIENT', 'MEDIEVAL', 'MODERN', 'CONTEMPORARY'];
const MEN_LAM = '#2F5D8A';

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Đã thanh toán', color: GREEN },
  PENDING: { label: 'Chờ thanh toán', color: AMBER },
  CANCELLED: { label: 'Đã huỷ', color: RED },
  EXPIRED: { label: 'Hết hạn', color: RED },
};

function scoreColor(pct: number) {
  return pct >= 85 ? GREEN : pct >= 70 ? AMBER : pct >= 40 ? MEN_LAM : RED;
}

function formatNumber(n: number) {
  return n.toLocaleString('vi-VN');
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function eraLabel(era: string) {
  return ERA_LABELS[era.toUpperCase() as CharacterEra] ?? era;
}

function Tile({ icon: Icon, color, label, value, sub }: {
  icon: typeof Star;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={s.tile}>
      <View style={[s.tileIcon, { backgroundColor: color }]}>
        <Icon size={20} color="#fff" strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.tileLabel}>{label}</Text>
        <Text style={s.tileValue}>{value}</Text>
        {sub ? <Text style={s.tileSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={s.meterTrack}>
      <View style={[s.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {description ? <Text style={s.sectionDesc}>{description}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

export default function ProgressScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyDashboard();
  const results = useQuizResults(0, 10);
  const customer = useCustomerDashboard();
  const isCustomer = useAuthStore((st) => st.user?.role === 'CUSTOMER');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), results.refetch(), isCustomer ? customer.refetch() : null]);
    } finally {
      setRefreshing(false);
    }
  }

  const header = (
    <View style={s.headerBar}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.iconBtn}>
        <ArrowLeft size={20} color={TEXT} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Tiến độ học tập</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {header}
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 96, borderRadius: 16 }} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {header}
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Không tải được tiến độ học tập</Text>
          <Text style={s.emptyDesc}>Vui lòng thử lại sau ít phút.</Text>
          <TouchableOpacity onPress={() => void refetch()} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { learning, aiUsage } = data;
  const eras = Object.entries(learning.eraDistribution ?? {}).sort(
    ([a], [b]) => ERA_ORDER.indexOf(a.toUpperCase()) - ERA_ORDER.indexOf(b.toUpperCase()),
  );
  const eraMax = Math.max(1, ...eras.map(([, n]) => n));
  const recent = results.data?.content?.length
    ? results.data.content
    : learning.recentQuizzes.map((q) => ({ ...q, score: undefined, totalQuestions: undefined }));
  const tierSub = [
    aiUsage.tier ? `Gói ${aiUsage.tier}` : null,
    customer.data?.tierExpiresAt ? `hết hạn ${formatDate(customer.data.tierExpiresAt)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      {header}
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={ORANGE} />}
      >
        <View style={{ gap: 10 }}>
          <Tile
            icon={Star}
            color={AMBER}
            label="Điểm trung bình"
            value={learning.totalQuizzesAttempted ? `${Math.round(learning.averageScorePercentage)}%` : '—'}
            sub="Trên tất cả bài quiz đã làm"
          />
          <Tile
            icon={Trophy}
            color={MEN_LAM}
            label="Bài quiz đã làm"
            value={formatNumber(learning.totalQuizzesAttempted)}
          />
          <Tile
            icon={Coins}
            color={ORANGE}
            label="Token còn lại"
            value={formatNumber(aiUsage.currentBalance)}
            sub={tierSub || undefined}
          />
        </View>

        <Section title="Kết quả gần đây" description="Các lần làm quiz mới nhất của bạn.">
          {recent.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={s.emptyDesc}>Làm thử một bộ câu đố để bắt đầu theo dõi tiến độ.</Text>
              <TouchableOpacity onPress={() => router.push('/quiz')} style={s.primaryBtn}>
                <Text style={s.primaryBtnText}>Làm quiz</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {recent.map((r, i) => (
                <TouchableOpacity
                  key={r.sessionId}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/quiz/result', params: { sessionId: r.sessionId } })}
                  style={[s.row, i > 0 && s.rowDivider]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{r.quizTitle}</Text>
                    <Text style={s.rowMeta}>
                      {formatDate(r.completedAt)}
                      {typeof r.score === 'number' && r.totalQuestions ? ` · ${r.score}/${r.totalQuestions} câu đúng` : ''}
                    </Text>
                  </View>
                  <Text style={[s.score, { color: scoreColor(r.percentage) }]}>{Math.round(r.percentage)}%</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => router.push('/quiz')} style={s.linkRow}>
                <Text style={s.link}>Luyện thêm quiz</Text>
                <ChevronRight size={14} color={ORANGE} />
              </TouchableOpacity>
            </View>
          )}
        </Section>

        <Section title="Phân bố theo thời kỳ" description="Số bài quiz bạn đã làm ở từng thời kỳ lịch sử.">
          {eras.length === 0 ? (
            <Text style={s.emptyDesc}>Chưa có dữ liệu.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {eras.map(([era, n]) => (
                <View key={era} style={s.eraRow}>
                  <Text style={s.eraLabel} numberOfLines={1}>{eraLabel(era)}</Text>
                  <View style={{ flex: 1 }}>
                    <Meter value={n} max={eraMax} color={MEN_LAM} />
                  </View>
                  <Text style={s.eraCount}>{n}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Token đã sử dụng" description="Mức dùng AI khi trò chuyện với nhân vật.">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Sparkles size={16} color={ORANGE} />
            <Text style={s.bigNumber}>{formatNumber(aiUsage.totalTokensUsed)}</Text>
            <Text style={s.rowMeta}>token tổng cộng</Text>
          </View>
          {customer.data ? (
            <Text style={[s.rowMeta, { marginTop: 6 }]}>
              <Text style={s.strong}>{formatNumber(customer.data.totalAiMessages)}</Text> tin nhắn đã gửi cho nhân vật
            </Text>
          ) : null}
          {aiUsage.totalTokensUsed > 0 ? (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.rowMeta}>Prompt</Text>
                <Text style={s.strong}>{formatNumber(aiUsage.promptTokens)}</Text>
                <Meter value={aiUsage.promptTokens} max={aiUsage.totalTokensUsed} color={AMBER} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.rowMeta}>Completion</Text>
                <Text style={s.strong}>{formatNumber(aiUsage.completionTokens)}</Text>
                <Meter value={aiUsage.completionTokens} max={aiUsage.totalTokensUsed} color={ORANGE} />
              </View>
            </View>
          ) : null}
          {aiUsage.topCharacters.length > 0 ? (
            <View style={s.topChars}>
              <Text style={s.tileLabel}>Nhân vật trò chuyện nhiều nhất</Text>
              {aiUsage.topCharacters.slice(0, 3).map((c) => (
                <TouchableOpacity
                  key={c.characterId}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/characters/${c.characterId}`)}
                  style={s.topCharRow}
                >
                  <Text style={s.rowTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.rowMeta}>
                    {formatNumber(c.messageCount)} tin nhắn · {formatNumber(c.tokenUsed)} token
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Section>

        {isCustomer ? (
          <Section title="Lịch sử thanh toán" description="Các giao dịch nâng cấp gói gần đây.">
            {customer.isLoading ? (
              <Text style={s.emptyDesc}>Đang tải...</Text>
            ) : customer.isError ? (
              <Text style={s.emptyDesc}>Không tải được lịch sử thanh toán.</Text>
            ) : (customer.data?.paymentHistory.length ?? 0) === 0 ? (
              <Text style={s.emptyDesc}>Chưa có giao dịch.</Text>
            ) : (
              <View>
                {customer.data!.paymentHistory.map((p, i) => {
                  const status = PAYMENT_STATUS[p.status] ?? { label: p.status, color: MUTED };
                  return (
                    <View key={p.orderCode} style={[s.row, i > 0 && s.rowDivider]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.rowTitle, { textTransform: 'capitalize' }]} numberOfLines={1}>Gói {p.tierName}</Text>
                        <Text style={s.rowMeta}>{formatDate(p.createdAt)} · #{p.orderCode}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.strong}>{formatNumber(p.amount)}đ</Text>
                        <Text style={[s.rowMeta, { color: status.color, fontWeight: '700' }]}>{status.label}</Text>
                      </View>
                    </View>
                  );
                })}
                <TouchableOpacity onPress={() => router.push('/payment/history')} style={s.linkRow}>
                  <Text style={s.link}>Xem tất cả giao dịch</Text>
                  <ChevronRight size={14} color={ORANGE} />
                </TouchableOpacity>
              </View>
            )}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: CARD,
  },
  headerTitle: { color: TEXT, fontSize: 17, fontWeight: '700' },

  tile: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: MUTED, fontSize: 12, fontWeight: '700' },
  tileValue: { color: TEXT, fontSize: 26, fontWeight: '900', lineHeight: 30 },
  tileSub: { color: MUTED, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },

  section: {
    backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16,
  },
  sectionTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  sectionDesc: { color: MUTED, fontSize: 12, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: '600' },
  rowMeta: { color: MUTED, fontSize: 12 },
  score: { fontSize: 20, fontWeight: '900' },
  strong: { color: TEXT, fontSize: 14, fontWeight: '800' },
  bigNumber: { color: TEXT, fontSize: 26, fontWeight: '900' },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700' },

  eraRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eraLabel: { width: 84, color: TEXT, fontSize: 13, fontWeight: '600' },
  eraCount: { width: 28, textAlign: 'right', color: TEXT, fontSize: 13, fontWeight: '800' },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 4 },

  topChars: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER, gap: 8 },
  topCharRow: { gap: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { color: TEXT2, fontSize: 13, textAlign: 'center' },
  primaryBtn: {
    marginTop: 4, backgroundColor: ORANGE, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
