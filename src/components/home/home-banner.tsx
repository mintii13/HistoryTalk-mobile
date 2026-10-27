import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList, Landmark, MessagesSquare, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ARCHIVE, ArchiveLabel, ArchiveTitle } from '@/components/archive';
import { Text } from '@/components/ui/text';
import { CARD, ORANGE, TEXT } from '@/constants/palette';
import { AppFonts } from '@/constants/theme';

// Cung noi dung voi HomeBanner ben web (components/home/home-banner.tsx), bo cuc doc cho dien thoai.
const HEROES = [
  { src: require('@/assets/images/heroes/ly-thuong-kiet.jpg'), name: 'Lý Thường Kiệt' },
  { src: require('@/assets/images/heroes/ngo-quyen.jpg'), name: 'Ngô Quyền' },
  { src: require('@/assets/images/heroes/quang-trung.jpg'), name: 'Quang Trung' },
  { src: require('@/assets/images/heroes/le-loi.jpg'), name: 'Lê Lợi' },
  { src: require('@/assets/images/heroes/vo-nguyen-giap.jpg'), name: 'Võ Nguyên Giáp' },
];

const FEATURES: { href: Href; icon: typeof UserRound; title: string; description: string }[] = [
  { href: '/characters', icon: UserRound, title: 'Chọn nhân vật', description: 'Gặp gỡ nhân vật lịch sử và bắt đầu cuộc trò chuyện của riêng bạn.' },
  { href: '/context', icon: Landmark, title: 'Mở bối cảnh', description: 'Khám phá sự kiện và tư liệu liên quan đến câu chuyện của nhân vật.' },
  { href: '/quiz', icon: ClipboardList, title: 'Thử thách trí nhớ', description: 'Làm câu đố để ôn lại nhân vật, sự kiện và những điều vừa khám phá.' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function HomeBanner() {
  const [active, setActive] = useState(2);
  const hero = HEROES[active];
  const move = (d: -1 | 1) => setActive((i) => (i + d + HEROES.length) % HEROES.length);

  return (
    <View style={s.stage}>
      <ArchiveTitle accent="lát cắt lịch sử" size={32}>Gặp nhân vật, mở cả một</ArchiveTitle>
      <Text style={s.lede}>
        Bắt đầu bằng một cuộc trò chuyện, rồi lần theo bối cảnh, sự kiện và thử thách để hiểu vì sao lịch sử đã rẽ
        sang hướng đó.
      </Text>

      <View style={s.features}>
        {FEATURES.map(({ href, icon: Icon, title, description }, i) => (
          <Pressable
            key={title}
            onPress={() => router.push(href)}
            style={({ pressed }) => [s.feature, pressed && { backgroundColor: 'rgba(184,50,31,0.04)' }]}
            accessibilityRole="link"
          >
            <Text style={s.featureIndex}>{pad(i + 1)}</Text>
            <View style={s.featureTitleRow}>
              <Icon size={17} color={ORANGE} strokeWidth={1.8} />
              <Text style={s.featureTitle}>{title}</Text>
              <ArrowUpRight size={16} color={ARCHIVE.tertiary} style={{ marginLeft: 'auto' }} />
            </View>
            <Text style={s.featureDesc}>{description}</Text>
          </Pressable>
        ))}
      </View>

      {/* Nhan vat noi bat: chan dung lon + dai chon nhan vat */}
      <View style={s.spotlight}>
        <View style={s.portraitFrame}>
          <Image source={hero.src} style={s.portrait} contentFit="cover" contentPosition="top" transition={200} />
        </View>
        <View style={s.caption}>
          <Text style={s.heroName}>{hero.name}</Text>
          <ArchiveLabel>{`${pad(active + 1)} / ${pad(HEROES.length)}`}</ArchiveLabel>
        </View>
      </View>

      <View style={s.picker}>
        <TouchableOpacity onPress={() => move(-1)} style={s.arrow} accessibilityLabel="Nhân vật trước">
          <ChevronLeft size={18} color={TEXT} />
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {HEROES.map((h, i) => {
            const isActive = i === active;
            return (
              <Pressable
                key={h.name}
                onPress={() => setActive(i)}
                style={[s.thumb, isActive && s.thumbActive]}
                accessibilityLabel={`Chọn ${h.name}`}
                accessibilityState={{ selected: isActive }}
              >
                <Image source={h.src} style={s.thumbImage} contentFit="cover" contentPosition="top" />
                <Text style={[s.thumbName, isActive && { color: '#fff' }]} numberOfLines={2}>
                  {h.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={() => move(1)} style={s.arrow} accessibilityLabel="Nhân vật tiếp theo">
          <ChevronRight size={18} color={TEXT} />
        </TouchableOpacity>
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
    marginBottom: 24,
    padding: 16,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ARCHIVE.strong,
  },
  lede: { marginTop: 12, color: '#2E2C29', fontSize: 14, lineHeight: 21 },
  features: { marginTop: 16, borderTopWidth: 1, borderTopColor: TEXT },
  feature: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: ARCHIVE.hairline },
  featureIndex: { color: ARCHIVE.brass, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  featureTitleRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureTitle: { fontFamily: AppFonts.display, color: TEXT, fontSize: 20, lineHeight: 23 },
  featureDesc: { marginTop: 4, color: ARCHIVE.tertiary, fontSize: 13, lineHeight: 19 },
  spotlight: { marginTop: 18, alignItems: 'center' },
  portraitFrame: {
    width: '72%',
    aspectRatio: 3 / 4,
    padding: 6,
    borderWidth: 1,
    borderColor: ARCHIVE.strong,
    borderRadius: 10,
    backgroundColor: ARCHIVE.elevated,
  },
  portrait: { flex: 1, borderRadius: 6 },
  caption: { marginTop: 10, alignItems: 'center', gap: 4 },
  heroName: { fontFamily: AppFonts.title, color: TEXT, fontSize: 18, lineHeight: 23 },
  picker: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ARCHIVE.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: 62, padding: 3, borderRadius: 8, borderWidth: 1, borderColor: ARCHIVE.hairline, alignItems: 'center' },
  thumbActive: { backgroundColor: TEXT, borderColor: TEXT },
  thumbImage: { width: '100%', aspectRatio: 84 / 99, borderRadius: 5 },
  thumbName: { marginTop: 4, color: TEXT, fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
  cta: {
    marginTop: 16,
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
