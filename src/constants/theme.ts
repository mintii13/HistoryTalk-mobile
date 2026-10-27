/** Mau theo theme, mau thuong hieu va font cua app (bang mau goc o ./palette). */

import '@/global.css';

import { HistoryTalkColors } from './palette';

export const Colors = {
  light: {
    text: HistoryTalkColors.light.textPrimary,
    background: HistoryTalkColors.light.bgMain,
    backgroundElement: HistoryTalkColors.light.surface,
    backgroundSelected: HistoryTalkColors.light.border,
    textSecondary: HistoryTalkColors.light.textSecondary,
  },
  dark: {
    text: HistoryTalkColors.dark.textPrimary,
    background: HistoryTalkColors.dark.bgMain,
    backgroundElement: HistoryTalkColors.dark.surface,
    backgroundSelected: HistoryTalkColors.dark.border,
    textSecondary: HistoryTalkColors.dark.textSecondary,
  },
} as const;

export const BrandColors = {
  primary: HistoryTalkColors.light.accent,
  primarySoft: HistoryTalkColors.light.accentSoft,
  primaryMuted: 'rgba(184,50,31,0.08)',
  primarySubtle: 'rgba(184,50,31,0.15)',
  primaryFocus: 'rgba(184,50,31,0.25)',
  primaryBorder: 'rgba(184,50,31,0.28)',
  primaryStrongBorder: 'rgba(184,50,31,0.35)',
  overlay: 'rgba(0,0,0,0.28)',
  overlayMedium: 'rgba(0,0,0,0.45)',
  pageOverlay: 'rgba(9,9,11,0.55)',
  overlayStrong: 'rgba(9,9,11,0.72)',
  pageOverlayStrong: 'rgba(9,9,11,0.82)',
  white: '#ffffff',
  muted: HistoryTalkColors.light.textSecondary,
  borderSubtle: HistoryTalkColors.light.border,
  borderFaint: 'rgba(17,17,17,0.10)',
} as const;

// Cung bo font voi web: Inter (noi dung), Plus Jakarta Sans (tieu de), Big Shoulders (tieu de luu tru in hoa).
export const AppFonts = {
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  bodyExtraBold: 'Inter-ExtraBold',
  title: 'PlusJakartaSans-Bold',
  titleExtraBold: 'PlusJakartaSans-ExtraBold',
  display: 'BigShoulders-Bold',
  displayBlack: 'BigShoulders-ExtraBold',
} as const;

export const FontAssets = {
  [AppFonts.body]: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  [AppFonts.bodyMedium]: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  [AppFonts.bodySemiBold]: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  [AppFonts.bodyBold]: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  [AppFonts.bodyExtraBold]: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
  [AppFonts.title]: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  [AppFonts.titleExtraBold]: require('@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'),
  [AppFonts.display]: require('@expo-google-fonts/big-shoulders/700Bold/BigShoulders_700Bold.ttf'),
  [AppFonts.displayBlack]: require('@expo-google-fonts/big-shoulders/800ExtraBold/BigShoulders_800ExtraBold.ttf'),
} as const;

/**
 * Font tuy chinh khong tu doi theo fontWeight tren Android: chon dung file theo do dam.
 * Dung trong <Text>/<Heading> nen style `fontWeight: '800'` o man hinh van ra Inter ExtraBold.
 */
export function bodyFontFor(weight?: string | number) {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' ? 400 : weight ?? 400);
  if (w >= 800) return AppFonts.bodyExtraBold;
  if (w >= 700) return AppFonts.bodyBold;
  if (w >= 600) return AppFonts.bodySemiBold;
  if (w >= 500) return AppFonts.bodyMedium;
  return AppFonts.body;
}

// Bo goc theo web (--radius-sm/md/lg): the, o nhap, nut nho gon thay vi bo tron lon.
export const Radius = { sm: 8, md: 10, lg: 12, pill: 999 } as const;
