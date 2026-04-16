/**
 * Keurzen Design Tokens V2
 * Editorial Kawaii — "The Tactile Sanctuary"
 */

export const ColorsV2 = {
  // ─── Primary (Teal) ───
  primary: '#007261',
  primaryContainer: '#91eed9',
  onPrimary: '#ffffff',

  // ─── Secondary (Coral) ───
  secondary: '#9d4b53',
  onSecondary: '#ffffff',

  // ─── Tertiary (Violet) ───
  tertiary: '#cab4f3',
  tertiaryContainer: '#e8ddf5',

  // ─── Surfaces ───
  surface: '#fefcf4',
  surfaceContainer: '#f5f4eb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e9e9de',
  surfaceBright: '#fefcf4',

  // ─── Text ───
  onSurface: '#383833',
  onSurfaceVariant: '#6b6b63',

  // ─── Outline ───
  outlineVariant: 'rgba(156,143,128,0.15)',

  // ─── Semantic ───
  error: '#9d4b53',
  success: '#007261',
  warning: '#cab4f3',
} as const;

export const RadiusV2 = {
  sm: 12,
  md: 24,    // 1.5rem — cards, containers
  lg: 24,
  xl: 48,    // 3rem — pill buttons
  full: 9999,
} as const;

export const TypographyV2 = {
  display: {
    letterSpacing: -0.5, // -2%
  },
  body: {
    lineHeight: 1.6,
  },
} as const;

// No shadows in V2 — hierarchy by tonal layering only
export const ShadowsV2 = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type ColorV2Token = keyof typeof ColorsV2;
