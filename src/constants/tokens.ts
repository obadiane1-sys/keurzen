/**
 * Keurzen Design Tokens
 * Charte graphique Cafe Cosy — palette chaude et cocon
 */

export const Colors = {
  // ─── Brand palette (Cafe Cosy) ───
  terracotta: '#C4846C',   // Accent principal — CTA, FAB, liens actifs
  sauge: '#8BA888',         // Accent secondaire — succes, validation
  miel: '#D4A959',          // Accent tertiaire — warnings, highlights
  rose: '#D4807A',          // Alerte douce — retard, erreurs
  prune: '#9B8AA8',         // Charge mentale — TLX

  // ─── Text ───
  textPrimary: '#3D2C22',   // Brun profond
  textSecondary: '#7A6B5D', // Brun moyen
  textMuted: '#A89888',     // Brun clair
  textInverse: '#FFFDF9',   // Blanc casse

  // ─── Background ───
  background: '#FAF6F1',       // Creme
  backgroundCard: '#FFFDF9',   // Blanc casse
  backgroundElevated: '#FFFDF9',

  // ─── Border ───
  border: '#E8DFD5',        // Sable
  borderLight: '#F0EAE2',   // Sable clair
  borderFocus: '#C4846C',   // Terracotta

  // ─── Feedback ───
  success: '#8BA888',   // Sauge
  warning: '#D4A959',   // Miel
  error: '#D4807A',     // Rose
  info: '#D4A959',      // Miel

  // ─── Member colors ───
  memberColors: [
    '#D4807A',
    '#8BA888',
    '#7EB3C4',
    '#9B8AA8',
    '#D4A959',
    '#C4846C',
    '#C48BA0',
    '#6BA08F',
  ],

  // ─── Gray scale (warm) ───
  gray50: '#FAF6F1',
  gray100: '#F0EAE2',
  gray200: '#E8DFD5',
  gray300: '#B8A99A',
  gray400: '#A89888',
  gray500: '#7A6B5D',
  gray600: '#5C4A3D',
  gray700: '#4A3B30',
  gray800: '#3D2C22',
  gray900: '#2A1D14',

  // ─── Badge text (strong contrast variants) ───
  blueStrong: '#C4846C',
  greenStrong: '#6B8F60',
  redStrong: '#B5584E',
  orangeStrong: '#C4846C',
  blueDeep: '#C4846C',
  redBgLight: '#D4807A1F',

  // ─── Transparent overlays ───
  overlay: 'rgba(61, 44, 34, 0.35)',
  overlayLight: 'rgba(61, 44, 34, 0.08)',

  // ─── Component-specific ───
  inputFocusedBg: '#FFFDF9',
  backgroundSubtle: '#F0EAE2',
  placeholder: '#B8A99A',

  // ─── DEPRECATED aliases (remove after full migration) ───
  mint: '#8BA888',       // → use sauge or terracotta
  coral: '#D4807A',      // → use rose
  blue: '#D4A959',       // → use miel
  lavender: '#9B8AA8',   // → use prune
  navy: '#3D2C22',       // → use textPrimary
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  input: 12,
  lg: 16,
  card: 16,
  xl: 16,
  button: 12,
  '2xl': 24,
  fab: 16,
  full: 9999,
} as const;

export const Typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  spring: {
    gentle: { damping: 20, stiffness: 200 },
    bouncy: { damping: 10, stiffness: 300 },
    stiff: { damping: 30, stiffness: 400 },
  },
} as const;

// Minimum touch target size (accessibility)
export const TouchTarget = {
  min: 44,
} as const;

export type ColorToken = keyof typeof Colors;
export type SpacingToken = keyof typeof Spacing;
