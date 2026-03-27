/**
 * Keurzen Design Tokens
 * Charte graphique premium pastel / kawaii doux
 */

export const Colors = {
  // Brand palette
  mint: '#88D4A9',
  blue: '#AFCBFF',
  coral: '#FFA69E',
  lavender: '#BCA7FF',
  navy: '#212E44',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Background
  background: '#F7F9FC',
  backgroundCard: '#FFFFFF',
  backgroundElevated: '#FFFFFF',

  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Feedback
  success: '#88D4A9',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#AFCBFF',

  // Member colors (assigned per household member)
  memberColors: [
    '#FFA69E', // coral
    '#88D4A9', // mint
    '#AFCBFF', // blue
    '#BCA7FF', // lavender
    '#FCD34D', // amber
    '#6EE7B7', // emerald
    '#F9A8D4', // pink
    '#93C5FD', // sky blue
  ],

  // Gray scale
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Transparent overlays
  overlay: 'rgba(33, 46, 68, 0.5)',
  overlayLight: 'rgba(33, 46, 68, 0.1)',

  // Component-specific semantic tokens
  inputFocusedBg: '#FAFCFF',
  backgroundSubtle: '#F1F5F9',
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
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
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
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
