import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MessagesSquare } from 'lucide-react-native';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ARCHIVE, ArchiveTitle } from '@/components/archive';
import { Text } from '@/components/ui/text';
import { CARD, ORANGE } from '@/constants/palette';

// Ban rut gon cua HomeBanner ben web cho man hinh dien thoai: tieu de, 1 cau gioi thieu,
// dai nhan vat va nut bat dau — vua 1 man hinh. Cac loi vao khac nam o QuickActions ngay duoi.
// Anh chan dung da co ten in tren tranh, khong lap lai ten ben duoi (man hep se bi cat chu).
const HEROES = [
  { src: require('@/assets/images/heroes/ngo-quyen.jpg'), name: 'Ngô Quyền' },
  { src: require('@/assets/images/heroes/ly-thuong-kiet.jpg'), name: 'Lý Thường Kiệt' },
  { src: require('@/assets/images/heroes/le-loi.jpg'), name: 'Lê Lợi' },
  { src: require('@/assets/images/heroes/quang-trung.jpg'), name: 'Quang Trung' },
  { src: require('@/assets/images/heroes/vo-nguyen-giap.jpg'), name: 'Võ Nguyên Giáp' },
];

export function HomeBanner() {
  return (
    <View style={s.stage}>
      <ArchiveTitle accent="lát cắt lịch sử" size={26}>Gặp nhân vật, mở cả một</ArchiveTitle>
      <Text style={s.lede}>Trò chuyện với nhân vật, lần theo sự kiện và thử sức bằng câu đố.</Text>

      <View style={s.heroes}>
        {HEROES.map((h) => (
          <Pressable
            key={h.name}
            onPress={() => router.push('/characters')}
            style={({ pressed }) => [s.hero, pressed && { opacity: 0.8 }]}
            accessibilityLabel={`Trò chuyện với ${h.name}`}
          >
            <Image source={h.src} style={s.heroImage} contentFit="cover" contentPosition="top" />
          </Pressable>
        ))}
      </View>

      <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => router.push('/characters')}>
        <Text style={s.ctaText}>Bắt đầu trò chuyện</Text>
        <MessagesSquare size={17} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  stage: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ARCHIVE.hairline,
  },
  lede: { marginTop: 8, color: ARCHIVE.tertiary, fontSize: 14, lineHeight: 20 },
  heroes: { marginTop: 14, flexDirection: 'row', gap: 8 },
  hero: { flex: 1 },
  heroImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ARCHIVE.hairline,
  },
  cta: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
