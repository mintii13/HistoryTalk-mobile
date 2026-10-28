import { router, type Href } from 'expo-router';
import { BarChart3, ClipboardList, GitCommitHorizontal, Map as MapIcon, MessageCircle, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ARCHIVE } from '@/components/archive';
import { Text } from '@/components/ui/text';
import { CARD, ORANGE, TEXT } from '@/constants/palette';

interface QuickAction {
  label: string;
  href: Href;
  icon: LucideIcon;
}

// Hang chip mong (khong phai o lon): nguoi dung luot nhieu hon bam, khong chiem cho cua noi dung ben duoi.
// Nhung muc menu web co ma thanh tab mobile khong chua het (ban do, lich su chat, tien do).
const SIGNED_IN: QuickAction[] = [
  { label: 'Bản đồ', href: '/map', icon: MapIcon },
  { label: 'Lịch sử chat', href: '/chat/history', icon: MessageCircle },
  { label: 'Tiến độ', href: '/grades', icon: BarChart3 },
];

const GUEST: QuickAction[] = [
  { label: 'Bản đồ', href: '/map', icon: MapIcon },
  { label: 'Dòng thời gian', href: '/context', icon: GitCommitHorizontal },
  { label: 'Câu đố', href: '/quiz', icon: ClipboardList },
];

export function QuickActions({ signedIn }: { signedIn: boolean }) {
  return (
    <View style={s.row}>
      {(signedIn ? SIGNED_IN : GUEST).map(({ label, href, icon: Icon }) => (
        <Pressable
          key={label}
          onPress={() => router.push(href)}
          style={({ pressed }) => [s.tile, pressed && s.tilePressed]}
          accessibilityRole="link"
        >
          <Icon size={15} color={ORANGE} strokeWidth={2} />
          <Text style={s.label} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 20 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ARCHIVE.hairline,
    backgroundColor: CARD,
  },
  tilePressed: { backgroundColor: 'rgba(184,50,31,0.05)' },
  label: { color: TEXT, fontSize: 13, fontWeight: '600' },
});
