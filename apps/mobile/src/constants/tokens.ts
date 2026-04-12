/**
 * Keurzen Design Tokens
 * Charte graphique Dreamy — palette douce et rêveuse
 */

export const Colors = {
  // ─── Brand palette (Dreamy) ───
  primary: '#90CAF9',
  accent: '#F4C2C2',
  joy: '#FFF9C4',

  // ─── Text ───
  textPrimary: '#4A5568',
  textSecondary: '#5A6A85',
  textMuted: '#A0AEC0',
  textInverse: '#FFFFFF',

  // ─── Background ───
  background: '#FAFCFF',
  backgroundCard: '#F7F9FC',
  backgroundCardEnd: '#EFF3F6',
  backgroundElevated: '#FFFFFF',

  // ─── Border ───
  border: '#E5E9EC',
  borderLight: '#EDF2F7',
  borderFocus: '#90CAF9',

  // ─── Feedback ───
  success: '#81C784',
  warning: '#FFF9C4',
  error: '#F4C2C2',
  info: '#90CAF9',

  // ─── Member colors ───
  memberColors: [
    '#90CAF9', '#F4C2C2', '#B39DDB', '#80CBC4',
    '#FFE082', '#FFAB91', '#A5D6A7', '#CE93D8',
  ],

  // ─── Gray scale (cool) ───
  gray50: '#FAFCFF',
  gray100: '#EDF2F7',
  gray200: '#E5E9EC',
  gray300: '#CBD5E0',
  gray400: '#A0AEC0',
  gray500: '#5A6A85',
  gray600: '#4A5568',
  gray700: '#2D3748',
  gray800: '#1A202C',
  gray900: '#171923',

  // ─── Transparent overlays ───
  overlay: 'rgba(45, 55, 72, 0.35)',
  overlayLight: 'rgba(45, 55, 72, 0.08)',

  // ─── Component-specific ───
  inputFocusedBg: '#FFFFFF',
  backgroundSubtle: '#EDF2F7',
  placeholder: '#A0AEC0',
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
  card: 24,
  xl: 24,
  button: 16,
  '2xl': 32,
  '3xl': 40,
  fab: 24,
  full: 9999,
} as const;

export const Typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
    title: 'FredokaOne_400Regular',
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
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
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
