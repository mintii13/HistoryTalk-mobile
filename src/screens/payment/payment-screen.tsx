import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  BadgeCheck, Check, Clock, Crown, History, ShieldCheck, Sparkles, XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import {
  AMBER,
  BORDER,
  CARD,
  GREEN,
  MUTED,
  ORANGE,
  ORANGE_BORDER,
  ORANGE_BORDER_STRONG,
  ORANGE_TINT_MUTED,
  RED,
  TEXT,
  TEXT_TINT_FAINT,
  TEXT2,
} from '@/constants/palette';
import { useMe } from '@/features/auth/hooks/use-me';
import { LOGIN_PROMPTS, useLoginPromptStore } from '@/features/auth/login-prompt';
import { useAuthStore } from '@/features/auth/store';
import { useCreateOrder } from '@/features/payment/hooks/use-create-order';
import { useMyOrders } from '@/features/payment/hooks/use-my-orders';
import { useNotifyPayosReturn } from '@/features/payment/hooks/use-notify-payos-return';
import { useTiers } from '@/features/payment/hooks/use-tiers';
import {
  formatVnd,
  groupThousands,
  groupTierPlans,
  hasYearlyPlans,
  tierForCycle,
  yearlySavingPercent,
  type BillingCycle,
} from '@/features/payment/tier-plans';
import type { OrderStatus, Tier } from '@/features/payment/types';

// Phai khop scheme "mobilehistorytalk" dang ky trong app.json — BE dung gia
// tri nay lam returnUrl/cancelUrl khi tao PayOS checkout link (platform: 'mobile').
const PAYOS_REDIRECT_URL = Linking.createURL('payment/result');


function tierFeatureSummary(title: string): string {
  const v = title.toLowerCase();
  if (v.includes('pro')) return 'Nội dung, chat, call, video call, quiz';
  if (v.includes('plus')) return 'Nội dung, chat, call, quiz';
  return 'Nội dung, chat, quiz';
}

const RESULT_LABEL: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Thanh toán thành công! Gói đã được kích hoạt.', color: GREEN, icon: BadgeCheck },
  PENDING: { label: 'PayOS đang xử lý. Hãy kiểm tra lại sau ít phút.', color: AMBER, icon: Clock },
  CANCELLED: { label: 'Giao dịch đã bị hủy.', color: RED, icon: XCircle },
  EXPIRED: { label: 'Liên kết thanh toán đã hết hạn.', color: RED, icon: XCircle },
};

export default function PaymentScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showLoginPrompt = useLoginPromptStore((s) => s.show);
  const { data: profile, refetch: refetchMe } = useMe();
  const { data: tiers, isLoading, refetch: refetchTiers } = useTiers();
  const createOrder = useCreateOrder();
  const notifyReturn = useNotifyPayosReturn();
  const { refetch: refetchOrders } = useMyOrders();
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetchMe(), refetchTiers()]);
    } finally {
      setRefreshing(false);
    }
  }

  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<OrderStatus | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('month');

  const plans = groupTierPlans(tiers ?? []);
  const showCycleToggle = hasYearlyPlans(plans);
  const maxSaving = Math.max(0, ...plans.map((p) => yearlySavingPercent(p) ?? 0));

  // openAuthSessionAsync mo checkout trong trinh duyet trong app va tu dong
  // dong + resolve ngay khi PayOS redirect ve PAYOS_REDIRECT_URL (deep link
  // "mobilehistorytalk://payment/result") — khac voi openBrowserAsync truoc day
  // chi resolve khi nguoi dung tu tay dong trinh duyet.
  async function handleCheckout(tier: Tier) {
    if (tier.amount <= 0) return;
    if (!isAuthenticated) {
      showLoginPrompt(LOGIN_PROMPTS.generic);
      return;
    }
    setResultStatus(null);
    setLoadingTierId(tier.tierId);
    try {
      const order = await createOrder.mutateAsync(tier.tierId);
      const result = await WebBrowser.openAuthSessionAsync(order.checkoutUrl, PAYOS_REDIRECT_URL);

      let resolvedStatus: OrderStatus | undefined;
      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        const orderCodeNum = Number(queryParams?.orderCode ?? order.orderCode);
        if (orderCodeNum) {
          try {
            const returned = await notifyReturn.mutateAsync({
              code: String(queryParams?.code ?? ''),
              id: String(queryParams?.id ?? ''),
              cancel: queryParams?.cancel === 'true',
              status: String(queryParams?.status ?? ''),
              orderCode: orderCodeNum,
            });
            resolvedStatus = returned.resolvedStatus;
          } catch {
            // Webhook van la nguon su that chinh — bo qua loi, roi xuong doan
            // doi chieu qua lich su thanh toan ben duoi.
          }
        }
      }

      const [{ data: history }] = await Promise.all([refetchOrders(), refetchMe(), refetchTiers()]);
      if (!resolvedStatus) {
        const matched = history?.find((o) => o.orderCode === order.orderCode);
        resolvedStatus = matched?.status ?? 'PENDING';
      }
      setResultStatus(resolvedStatus);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể tạo đơn thanh toán. Vui lòng thử lại.');
    } finally {
      setLoadingTierId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader
        title="Nâng cấp gói"
        right={
          <HeaderIconButton label="Lịch sử thanh toán" onPress={() => router.push('/payment/history')}>
            <History size={19} color={TEXT} strokeWidth={2} />
          </HeaderIconButton>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={ORANGE} />
        }
      >
        {resultStatus && (
          <View style={[s.resultBanner, { borderColor: RESULT_LABEL[resultStatus].color + '55' }]}>
            {(() => {
              const Icon = RESULT_LABEL[resultStatus].icon;
              return <Icon size={20} color={RESULT_LABEL[resultStatus].color} />;
            })()}
            <Text style={{ color: RESULT_LABEL[resultStatus].color, flex: 1, fontSize: 13, fontWeight: '600' }}>
              {RESULT_LABEL[resultStatus].label}
            </Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 16 }}>
          <Text style={{ color: TEXT2, fontSize: 13, lineHeight: 19 }}>
            Chọn gói phù hợp để mở khóa toàn bộ tính năng HistoryTalk. Thanh toán an toàn qua PayOS — chuyển khoản ngân hàng & QR.
          </Text>
        </View>

        {isLoading && (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 180, borderRadius: 12 }} />)}
          </View>
        )}

        {showCycleToggle && (
          <View style={s.cycleToggle} accessibilityRole="radiogroup">
            {([
              ['month', 'Theo tháng'],
              ['year', maxSaving > 0 ? `Theo năm · -${maxSaving}%` : 'Theo năm'],
            ] as const).map(([value, label]) => {
              const active = cycle === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setCycle(value)}
                  activeOpacity={0.85}
                  style={[s.cycleOption, active && s.cycleOptionActive]}
                >
                  <Text style={{ color: active ? '#fff' : TEXT2, fontWeight: '700', fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {plans.map((plan, index) => {
            const tier = tierForCycle(plan, cycle)!;
            const isFree = plan.isFree;
            const isYearly = tier.noMonth >= 12;
            const saving = isYearly ? yearlySavingPercent(plan) : null;
            // The account's subscription may be either the monthly or the yearly row of this plan.
            const isCurrent = !!profile?.tierId
              && (profile.tierId === plan.monthly?.tierId || profile.tierId === plan.yearly?.tierId);
            const isFeatured = index === plans.length - 1 && !isFree;
            const isBusy = loadingTierId === tier.tierId;

            return (
              <View key={plan.key} style={[s.tierCard, isFeatured && s.tierCardFeatured]}>
                <View style={s.tierHead}>
                  <Crown size={18} color={isFeatured ? ORANGE : MUTED} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.tierTitle}>{plan.title}</Text>
                    <Text style={s.tierSub}>
                      {isFree ? 'Miễn phí' : saving ? `Tiết kiệm ${saving}% so với trả theo tháng` : `${tier.noMonth} tháng sử dụng`}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
                  <Text style={s.tierPrice}>{formatVnd(tier.amount)}</Text>
                  {!isFree && <Text style={s.tierPriceUnit}>{isYearly ? '/năm' : '/tháng'}</Text>}
                </View>

                <View style={{ marginTop: 16, gap: 8 }}>
                  <View style={s.featureRow}>
                    {isFeatured ? <Sparkles size={14} color={ORANGE} /> : <Check size={14} color={MUTED} />}
                    <Text style={s.featureText}>Token AI: {groupThousands(plan.dailyTokens)}/ngày</Text>
                  </View>
                  <View style={s.featureRow}>
                    {isFeatured ? <Sparkles size={14} color={ORANGE} /> : <Check size={14} color={MUTED} />}
                    <Text style={s.featureText}>{tierFeatureSummary(plan.key)}</Text>
                  </View>
                </View>

                {isCurrent ? (
                  <View style={[s.actionBtn, s.actionBtnCurrent]}>
                    <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 14 }}>Gói hiện tại</Text>
                  </View>
                ) : isFree ? (
                  // Goi mien phi khi KHONG phai goi dang dung: khong co luong
                  // tu ha cap qua nut nay (tu dong ap dung lai khi goi tra phi
                  // het han — xem subscription.service.ts ben BE), nen chi hien
                  // trang thai mo nhat thay vi mot nut "Dang ky ngay" vo nghia.
                  <View style={[s.actionBtn, s.actionBtnDisabled]}>
                    <Text style={{ color: MUTED, fontWeight: '700', fontSize: 14 }}>Gói mặc định</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleCheckout(tier)}
                    disabled={isBusy}
                    activeOpacity={0.85}
                    style={[s.actionBtn, isFeatured ? s.actionBtnFeatured : s.actionBtnDefault]}
                  >
                    {isBusy
                      ? <ActivityIndicator color={isFeatured ? '#fff' : ORANGE} />
                      : <Text style={{ color: isFeatured ? '#fff' : ORANGE, fontWeight: '700', fontSize: 14 }}>Đăng ký ngay</Text>}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={s.footNote}>
          <ShieldCheck size={14} color={MUTED} />
          <Text style={{ color: MUTED, fontSize: 11 }}>Thanh toán an toàn qua PayOS</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({

  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 16, padding: 14,
    borderRadius: 10, borderWidth: 1, backgroundColor: CARD,
  },

  cycleToggle: {
    flexDirection: 'row', alignSelf: 'center', marginBottom: 16, padding: 3,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  cycleOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cycleOptionActive: { backgroundColor: ORANGE },

  tierCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 18,
  },
  tierCardFeatured: { borderColor: ORANGE_BORDER_STRONG },
  tierHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tierTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  tierSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  tierPrice: { color: TEXT, fontSize: 24, fontWeight: '800' },
  tierPriceUnit: { color: MUTED, fontSize: 12 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: TEXT2, fontSize: 13 },

  actionBtn: {
    marginTop: 18, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDefault: { backgroundColor: ORANGE_TINT_MUTED, borderWidth: 1, borderColor: ORANGE_BORDER },
  actionBtnFeatured: { backgroundColor: ORANGE },
  actionBtnCurrent: { backgroundColor: TEXT_TINT_FAINT, borderWidth: 1, borderColor: BORDER },
  actionBtnDisabled: { backgroundColor: TEXT_TINT_FAINT, borderWidth: 1, borderColor: BORDER, opacity: 0.6 },

  footNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 24,
  },
});
