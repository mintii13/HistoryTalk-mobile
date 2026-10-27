import { CheckCircle2, Clock, ReceiptText, XCircle } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import {
  AMBER,
  BORDER,
  CARD,
  GREEN,
  MUTED,
  ORANGE,
  RED,
  TEXT,
} from '@/constants/palette';
import { useMyOrders } from '@/features/payment/hooks/use-my-orders';
import type { OrderStatus, PaymentHistoryItem } from '@/features/payment/types';
import { formatCurrency, formatDateTime } from '@/lib/format';

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Đã thanh toán', color: GREEN, icon: CheckCircle2 },
  PENDING: { label: 'Chờ thanh toán', color: AMBER, icon: Clock },
  CANCELLED: { label: 'Đã huỷ', color: RED, icon: XCircle },
  EXPIRED: { label: 'Hết hạn', color: RED, icon: XCircle },
};



export default function PaymentHistoryScreen() {
  const { data, isLoading, refetch, isRefetching } = useMyOrders();

  function renderItem({ item }: { item: PaymentHistoryItem }) {
    const cfg = STATUS_CFG[item.status];
    const Icon = cfg.icon;
    return (
      <View style={s.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ReceiptText size={15} color={MUTED} />
            <Text style={s.orderCode}>#{item.orderCode}</Text>
          </View>
          <View style={[s.statusBadge, { borderColor: cfg.color + '55', backgroundColor: cfg.color + '14' }]}>
            <Icon size={12} color={cfg.color} />
            <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={s.tierTitle}>{item.tierTitle ? `Gói ${item.tierTitle}` : 'Gói dịch vụ'}</Text>
        <Text style={s.amount}>{formatCurrency(item.amount)}</Text>

        <View style={s.metaRow}>
          <Text style={s.metaText}>Tạo: {formatDateTime(item.createdAt)}</Text>
          {item.paidAt && <Text style={s.metaText}>Thanh toán: {formatDateTime(item.paidAt)}</Text>}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title="Lịch sử thanh toán" />

      {isLoading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 120, borderRadius: 12 }} />)}
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.orderId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          ListEmptyComponent={
            <EmptyState title="Bạn chưa có đơn hàng nào" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({

  card: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16,
  },
  orderCode: { color: TEXT, fontSize: 13, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4,
  },
  tierTitle: { color: TEXT, fontSize: 15, fontWeight: '800', marginTop: 10, textTransform: 'capitalize' },
  amount: { color: ORANGE, fontSize: 16, fontWeight: '800', marginTop: 2 },
  metaRow: { marginTop: 10, gap: 2 },
  metaText: { color: MUTED, fontSize: 11 },
});
