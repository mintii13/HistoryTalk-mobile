/**
 * HistoryTalk mobile palette aligned with the website design system.
 * Legacy export names are kept so existing screens inherit the new colors.
 */
export const HistoryTalkColors = {
  light: {
    accent: '#B8321F',
    accentSoft: '#9A2A18',
    bgMain: '#ECE7DC',
    surface: '#F5F2EA',
    textPrimary: '#111111',
    textSecondary: '#5F5B55',
    border: 'rgba(17,17,17,0.14)',
  },
  dark: {
    accent: '#EA7A0A',
    accentSoft: '#e2c77a',
    bgMain: '#0e1a2b',
    surface: '#1a2436',
    textPrimary: '#f7f1e8',
    textSecondary: '#dfdab5',
    border: 'rgba(231,221,200,0.12)',
  },
  toast: {
    success: '#3F6B45',
    error: '#C9620E',
    warning: '#B7791F',
    info: '#B8321F',
    default: '#B8321F',
  },
} as const;

export const BG = HistoryTalkColors.light.bgMain;
export const CARD = HistoryTalkColors.light.surface;
export const SURFACE = HistoryTalkColors.light.surface;
export const BORDER = HistoryTalkColors.light.border;

export const ORANGE = HistoryTalkColors.light.accent;
export const ORANGE_DARK = HistoryTalkColors.light.accentSoft;
export const ORANGE_TINT_FAINT = 'rgba(184,50,31,0.08)';
export const ORANGE_TINT_SOFT = 'rgba(184,50,31,0.10)';
export const ORANGE_TINT_MUTED = 'rgba(184,50,31,0.12)';
export const ORANGE_TINT = 'rgba(184,50,31,0.15)';
export const ORANGE_TINT_STRONG = 'rgba(184,50,31,0.28)';
export const ORANGE_TINT_SOLID = 'rgba(184,50,31,0.78)';
export const ORANGE_BORDER_SOFT = 'rgba(184,50,31,0.22)';
export const ORANGE_BORDER_MUTED = 'rgba(184,50,31,0.25)';
export const ORANGE_BORDER = 'rgba(184,50,31,0.35)';
export const ORANGE_BORDER_MEDIUM = 'rgba(184,50,31,0.30)';
export const ORANGE_BORDER_STRONG = 'rgba(184,50,31,0.40)';
export const ORANGE_BORDER_FOCUS = 'rgba(184,50,31,0.50)';

export const TEXT = HistoryTalkColors.light.textPrimary;
export const TEXT2 = HistoryTalkColors.light.textSecondary;
export const MUTED = HistoryTalkColors.light.textSecondary;
export const TEXT_TINT_FAINT = 'rgba(17,17,17,0.04)';
export const TEXT_TINT_SOFT = 'rgba(17,17,17,0.05)';

export const GREEN = HistoryTalkColors.toast.success;
export const RED = HistoryTalkColors.toast.error;
export const AMBER = HistoryTalkColors.toast.warning;

// Mau phu theo bo nhan dien web: men lam (quiz), ngoc (boi canh/doc), vang dong (nhan vat/canh bao).
export const MEN_LAM = '#1F4E9C';
export const JADE = '#1E8A6E';
export const GOLD = '#C9961F';

export const FontSize = {
  xs: 11,   // micro labels, timestamps, hints
  sm: 12,   // pills, badges, metadata, captions
  md: 14,   // body text, inputs, list items
  lg: 15,   // card titles, item titles
  xl: 17,   // section headers, prominent numbers
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;
