import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, TEXT } from '@/constants/palette';

/** Nut vuong 40x40 tren thanh tieu de (quay lai, lich su...). */
export function HeaderIconButton({ onPress, label, children }: { onPress: () => void; label: string; children: ReactNode }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.iconBtn} accessibilityLabel={label}>
      {children}
    </TouchableOpacity>
  );
}

/**
 * Thanh tieu de dung chung: nut quay lai (ve `fallbackHref` neu khong con lich su
 * dieu huong, vd. mo thang tu thong bao), tieu de giua, phan tu tuy chon ben phai.
 */
export function ScreenHeader({ title, back = true, right, fallbackHref = '/' }: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  fallbackHref?: string;
}) {
  const router = useRouter();
  return (
    <View style={s.headerBar}>
      {back ? (
        <HeaderIconButton
          label="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref as never))}
        >
          <ArrowLeft size={20} color={TEXT} strokeWidth={2} />
        </HeaderIconButton>
      ) : (
        <View style={s.spacer} />
      )}
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      {right ?? <View style={s.spacer} />}
    </View>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: CARD,
  },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 17, fontWeight: '700' },
  spacer: { width: 40 },
});
