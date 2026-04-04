/**
 * Dashboard-specific design tokens
 * Matches the premium JSX reference design exactly
 */

export const DCOLORS = {
  // Primaires
  mint: '#88D4A9',
  mintLight: '#E1F5EE',
  mintDark: '#7ECEC1',
  coral: '#FFA69E',
  coralLight: '#FAECE7',
  coralDark: '#E8937A',
  blue: '#AFCBFF',
  blueLight: '#E8F0FF',
  lavender: '#BCA7FF',
  lavenderLight: '#EEEDFE',
  navy: '#212E44',
  navyMid: '#2C3A4F',

  // Neutres
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  background: '#F5EFE0',
  surface: '#FFFFFF',
  border: '#E8EDF2',
  cream: '#FFF8F0',
  warmGray: '#F0EDE6',
} as const;

export const DFONT = {
  display: { size: 30, weight: '800' as const },
  title: { size: 22, weight: '600' as const },
  subtitle: { size: 18, weight: '600' as const },
  body: { size: 16, weight: '400' as const },
  bodyMd: { size: 16, weight: '500' as const },
  caption: { size: 14, weight: '400' as const },
  label: { size: 13, weight: '600' as const },
  small: { size: 12, weight: '500' as const },
} as const;
