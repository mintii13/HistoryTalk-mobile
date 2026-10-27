import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BarChart3, ChevronRight, History, MessageCircle, Sparkles } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, ORANGE, ORANGE_TINT, TEXT, TEXT2 } from '@/constants/palette';

const PERKS = [
  { icon: MessageCircle, text: 'Trò chuyện với nhân vật lịch sử bằng AI' },
  { icon: Sparkles, text: 'Làm quiz, nhận điểm và giữ chuỗi ngày học' },
  { icon: History, text: 'Lưu lịch sử hội thoại và kết quả luyện tập' },
  { icon: BarChart3, text: 'Theo dõi tiến độ học của bạn' },
];

/** Tab Hồ sơ khi chua dang nhap: van xem duoc noi dung cong khai, moi dang nhap/dang ky. */
export default function GuestProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Image source={require('@/assets/logo.png')} style={{ width: 56, height: 56 }} contentFit="contain" />
          <Text style={s.title}>Chào mừng đến HistoryTalk</Text>
          <Text style={s.desc}>
            Bạn đang xem với tư cách khách. Đăng nhập để dùng đầy đủ tính năng học tập.
          </Text>
        </View>

        <View style={s.card}>
          {PERKS.map(({ icon: Icon, text }) => (
            <View key={text} style={s.perk}>
              <View style={s.perkIcon}>
                <Icon size={16} color={ORANGE} />
              </View>
              <Text style={s.perkText}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primary} activeOpacity={0.85} onPress={() => router.push('/login')}>
          <Text style={s.primaryText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondary} activeOpacity={0.85} onPress={() => router.push('/register')}>
          <Text style={s.secondaryText}>Tạo tài khoản mới</Text>
          <ChevronRight size={16} color={ORANGE} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingTop: 24, paddingBottom: 8 },
  title: { color: TEXT, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  desc: { color: TEXT2, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
  card: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 14 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: ORANGE_TINT,
    alignItems: 'center', justifyContent: 'center',
  },
  perkText: { flex: 1, color: TEXT, fontSize: 14, fontWeight: '500' },
  primary: { backgroundColor: ORANGE, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondary: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  secondaryText: { color: ORANGE, fontSize: 14, fontWeight: '700' },
});
