import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ARCHIVE } from '@/components/archive';
import { Mascot, type MascotAccessory } from '@/components/mascot/mascot';
import { Text } from '@/components/ui/text';
import { CARD, ORANGE, TEXT } from '@/constants/palette';
import { formatDayMonth, getOnThisDay } from '@/data/on-this-day';
import { getSeason, SEASON_GREETING, type Season } from '@/lib/season';

const SEASON_ACCESSORY: Record<Season, MascotAccessory> = {
  tet: 'mai',
  reunification: 'flag',
  national: 'flag',
  'mid-autumn': 'lantern',
  teacher: 'flowers',
};

/**
 * "Ngày này năm xưa" + loi chao ngay le, do mascot dong ho cat dan — noi dung giong
 * MascotCompanion ben web, nhung dat thanh the tren trang chu thay vi noi o goc man hinh
 * (tren dien thoai nut noi de che thanh tab va nut bam).
 */
export function OnThisDayCard() {
  const { entries, daysAway, season } = useMemo(() => ({ ...getOnThisDay(), season: getSeason() }), []);
  const entry = entries[0];
  if (!entry) return null;

  const when = daysAway === 0 ? `Hôm nay · ${formatDayMonth(entry.date)}` : `Sắp tới · ${formatDayMonth(entry.date)} (còn ${daysAway} ngày)`;
  const href = entry.href as Href | undefined;

  return (
    <View style={s.card}>
      <View style={s.mascot}>
        <Mascot size={64} mood={daysAway === 0 ? 'happy' : 'idle'} accessory={season ? SEASON_ACCESSORY[season] : null} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.when}>{when.toUpperCase()}</Text>
        <Text style={s.text}>
          <Text style={s.year}>{entry.year}</Text> — {entry.text}
        </Text>
        {season ? <Text style={s.greeting}>{SEASON_GREETING[season]}</Text> : null}
        {href ? (
          <TouchableOpacity onPress={() => router.push(href)} style={s.link} activeOpacity={0.7}>
            <Text style={s.linkText}>Xem bối cảnh</Text>
            <ChevronRight size={14} color={TEXT} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ARCHIVE.hairline,
  },
  mascot: { width: 64, alignItems: 'center', justifyContent: 'flex-end' },
  when: { color: ORANGE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  text: { marginTop: 6, color: '#2E2C29', fontSize: 14, lineHeight: 20 },
  year: { color: TEXT, fontSize: 14, fontWeight: '800' },
  greeting: { marginTop: 8, color: ARCHIVE.tertiary, fontSize: 13, lineHeight: 18 },
  link: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  linkText: { color: TEXT, fontSize: 13, fontWeight: '600' },
});
