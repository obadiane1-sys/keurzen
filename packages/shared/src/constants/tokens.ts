/**
 * Keurzen Design Tokens — Platform agnostic
 * Web and Mobile each consume these raw values through their own theming system.
 */

export const colors = {
  terracotta: { mobile: '#C4846C', web: '#C07A62' },
  sauge: { mobile: '#8BA888', web: '#82A47E' },
  miel: { mobile: '#D4A959', web: '#CFA24F' },
  rose: { mobile: '#D4807A', web: '#CF7B74' },
  prune: { mobile: '#9B8AA8', web: '#9585A3' },

  textPrimary: { mobile: '#3D2C22', web: '#2D1F17' },
  textSecondary: { mobile: '#7A6B5D', web: '#6B5D50' },
  textMuted: { mobile: '#A89888', web: '#9E8F80' },
  textInverse: '#FFFDF9',

  background: { mobile: '#FAF6F1', web: '#FDFBF8' },
  backgroundCard: { mobile: '#FFFDF9', web: '#FFFFFF' },

  border: { mobile: '#E8DFD5', web: '#EBE5DD' },
  borderLight: { mobile: '#F0EAE2', web: '#F3EDE6' },

  success: { mobile: '#8BA888', web: '#82A47E' },
  warning: { mobile: '#D4A959', web: '#CFA24F' },
  error: { mobile: '#D4807A', web: '#CF7B74' },

  memberColors: [
    '#D4807A', '#8BA888', '#7EB3C4', '#9B8AA8',
    '#D4A959', '#C4846C', '#C48BA0', '#6BA08F',
  ],
} as const;

export const spacing = {
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

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
