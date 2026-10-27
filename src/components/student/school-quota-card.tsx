import { Coins } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { localDateKey, todayQuota, useMyTokenRequests, useStudentDashboard } from '@/features/classroom/hooks';
import { TOKEN_BOOST_STATUS } from '@/features/classroom/types';

import { Meter, Pill } from './student-ui';
import { TokenBoostModal } from './token-boost-modal';

const fmt = (n: number) => n.toLocaleString('vi-VN');

/**
 * Han muc token AI hom nay cua hoc sinh (giong web SchoolQuotaCard): truong dat
 * han muc moi ngay, het han muc chi khoa tro chuyen AI. `showHistory` hien them
 * lich su yeu cau xin token (dung o trang Ho so).
 */
export function SchoolQuotaCard({ showHistory = false }: { showHistory?: boolean }) {
  const dashboard = useStudentDashboard();
  const requests = useMyTokenRequests();
  const [boostOpen, setBoostOpen] = useState(false);
  const quota = todayQuota(dashboard.data);

  const today = localDateKey();
  const pendingToday = (requests.data ?? []).some(
    (r) => r.requestDate === today && (r.status === 'PENDING' || r.status === 'PENDING_ADMIN'),
  );

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.icon}>
          <Coins size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Token AI hôm nay</Text>
          <Text style={s.sub} numberOfLines={1}>
            {dashboard.data?.schoolName ? `Tài khoản trường · ${dashboard.data.schoolName}` : 'Tài khoản Học sinh'}
          </Text>
        </View>
      </View>

      {dashboard.isLoading ? (
        <Text style={s.sub}>Đang tải hạn mức...</Text>
      ) : !quota ? (
        <Text style={s.sub}>Không tải được hạn mức token.</Text>
      ) : (
        <>
          <Text style={s.remaining}>
            Còn dùng được hôm nay: <Text style={s.strong}>{fmt(quota.remaining)}</Text> token
          </Text>
          <Meter value={quota.used} max={quota.quota} color={quota.remaining <= 0 ? '#C9620E' : ORANGE} />
          <Text style={s.sub}>
            Đã dùng {fmt(quota.used)} / {fmt(quota.quota)} token
            {quota.bonus > 0 ? ` (gồm ${fmt(quota.bonus)} token thầy cô duyệt thêm)` : ''} · Làm mới lúc 00:00
          </Text>
        </>
      )}

      <Text style={s.note}>
        Hạn mức do nhà trường đặt. Khi hết hạn mức chỉ khóa trò chuyện AI; quiz, tư liệu và bài tập vẫn dùng bình thường.
      </Text>

      <TouchableOpacity
        onPress={() => setBoostOpen(true)}
        activeOpacity={0.8}
        style={[s.btn, pendingToday && s.btnDisabled]}
      >
        <Text style={[s.btnText, pendingToday && { color: MUTED }]}>
          {pendingToday ? 'Yêu cầu hôm nay đang chờ thầy cô duyệt' : 'Xin thêm token hôm nay'}
        </Text>
      </TouchableOpacity>

      {showHistory ? (
        <View style={s.history}>
          <Text style={s.historyTitle}>Yêu cầu xin thêm token</Text>
          {(requests.data ?? []).length === 0 ? (
            <Text style={s.sub}>Bạn chưa gửi yêu cầu nào.</Text>
          ) : (
            (requests.data ?? []).slice(0, 10).map((r) => {
              const status = TOKEN_BOOST_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
              return (
                <View key={r.id} style={s.historyRow}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={s.strong}>
                      {fmt(r.requestedTokens)} token · {r.requestDate}
                      {r.approvedTokens != null && r.approvedTokens !== r.requestedTokens ? ` · duyệt ${fmt(r.approvedTokens)}` : ''}
                    </Text>
                    <Text style={s.sub} numberOfLines={2}>{r.reason}</Text>
                    {r.reviewNote ? (
                      <Text style={s.sub} numberOfLines={2}>{r.reviewedByName ?? 'Thầy cô'}: {r.reviewNote}</Text>
                    ) : null}
                  </View>
                  <Pill label={status.label} tone={status.tone} />
                </View>
              );
            })
          )}
        </View>
      ) : null}

      <TokenBoostModal visible={boostOpen} onClose={() => setBoostOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  title: { color: TEXT, fontSize: 15, fontWeight: '800' },
  sub: { color: MUTED, fontSize: 12, lineHeight: 17 },
  remaining: { color: TEXT2, fontSize: 14 },
  strong: { color: TEXT, fontSize: 14, fontWeight: '800' },
  note: { color: TEXT2, fontSize: 12, lineHeight: 17 },
  btn: {
    minHeight: 44, borderRadius: 12, borderWidth: 1.5, borderColor: ORANGE,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12,
  },
  btnDisabled: { borderColor: BORDER },
  btnText: { color: ORANGE, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  history: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, gap: 10 },
  historyTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
