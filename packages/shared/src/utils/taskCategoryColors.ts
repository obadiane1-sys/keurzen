import type { TaskCategory } from '../types';

/**
 * Maps each task category to a brand color hex.
 * Used by both mobile (RN) and web (CSS) to tint TaskCard backgrounds.
 * The consuming platform applies the color at ~6% opacity.
 */
export const categoryColorMap: Record<TaskCategory, string> = {
  cleaning: '#C4846C',   // terracotta
  cooking: '#8BA888',    // sauge
  shopping: '#D4A959',   // miel
  admin: '#9B8AA8',      // prune
  children: '#D4807A',   // rose
  pets: '#8BA888',       // sauge
  garden: '#8BA888',     // sauge
  repairs: '#D4A959',    // miel
  health: '#D4807A',     // rose
  finances: '#9B8AA8',   // prune
  other: '#C4846C',      // terracotta
};
