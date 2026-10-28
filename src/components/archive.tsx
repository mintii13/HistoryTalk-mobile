import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { BG, ORANGE, TEXT } from '@/constants/palette';
import { AppFonts } from '@/constants/theme';

// Ban mobile cua cac "archive primitives" ben web (src/styles/archive.css):
// giay – muc – do son, goc vuong, net muc mong, chu tieu de co hep.

export const ARCHIVE = {
  brass: '#9A7426',
  tertiary: '#5F5B55',
  hairline: 'rgba(17,17,17,0.12)',
  strong: 'rgba(17,17,17,0.32)',
  elevated: '#FAF8F3',
} as const;

/** .archive-heading: tieu de trang (Plus Jakarta, viet thuong), 1 dong mo ta, hanh dong ben phai. */
export function PageHeading({
  title,
  description,
  label,
  right,
  style,
}: {
  title: string;
  description?: string;
  label?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.heading, style]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? <ArchiveLabel style={{ marginBottom: 6 }}>{label}</ArchiveLabel> : null}
        <Text style={s.headingTitle}>{title}</Text>
        {description ? (
          <Text style={s.headingDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** .archive-label: nhan chi muc in hoa trong ngoac — [ BỐI CẢNH ]. */
export function ArchiveLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, style]}>{`[ ${children.toUpperCase()} ]`}</Text>;
}

/** .archive-title: tieu de trung bay Big Shoulders in hoa; `accent` to do son mot phan (the <em> ben web). */
export function ArchiveTitle({
  children,
  accent,
  size = 34,
  style,
}: {
  children: string;
  accent?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[s.display, { fontSize: size, lineHeight: Math.round(size * 1.15) }, style]}>
      {children.toUpperCase()}
      {accent ? <Text style={[s.display, { fontSize: size, color: ORANGE }]}>{` ${accent.toUpperCase()}`}</Text> : null}
    </Text>
  );
}

/** Duong ke muc mong ngan cach cac muc (thay cho khung the). */
export function InkRule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[s.rule, style]} />;
}

/**
 * Hang chip cuon ngang co lop mo dan o mep phai: bao cho nguoi dung biet con chip phia sau
 * (truoc day chip bi cat ngang ma khong co dau hieu cuon).
 */
export function ChipScroller({
  children,
  paddingHorizontal = 20,
  style,
}: {
  children: ReactNode;
  paddingHorizontal?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal, gap: 8 }}
      >
        {children}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(236,231,220,0)', BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.fade}
      />
    </View>
  );
}

const s = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingTitle: {
    fontFamily: AppFonts.title,
    color: TEXT,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
  },
  headingDesc: { marginTop: 4, color: ARCHIVE.tertiary, fontSize: 14, lineHeight: 21 },
  label: {
    fontFamily: AppFonts.bodySemiBold,
    color: ARCHIVE.brass,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
  },
  display: {
    fontFamily: AppFonts.displayBlack,
    color: TEXT,
    // Big Shoulders rat hep: can gian chu ro de chu hoa khong dinh nhau tren man nho.
    letterSpacing: 1,
  },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: TEXT, opacity: 0.85 },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 28 },
});
