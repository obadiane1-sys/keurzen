import type { TaskCategory } from '../../types';

/**
 * Dreamy dashboard local constants
 */

// Category → icon mapping (MaterialCommunityIcons names)
export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  cleaning: 'broom',
  cooking: 'silverware-fork-knife',
  shopping: 'basket-outline',
  admin: 'file-document-outline',
  children: 'human-male-child',
  pets: 'paw',
  garden: 'flower-outline',
  repairs: 'hammer-wrench',
  health: 'heart-pulse',
  finances: 'wallet-outline',
  other: 'dots-horizontal',
};

// Alternating colors for task row blob icons
export const BLOB_COLORS = ['#90CAF9', '#F4C2C2'] as const;

// Mock alert data
export interface MockAlert {
  id: string;
  type: 'alert' | 'plan' | 'social';
  icon: string;
  label: string;
  title: string;
  actionLabel: string;
  color: string;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: 'alert-1',
    type: 'alert',
    icon: 'alert-outline',
    label: 'Alert',
    title: 'Ta charge mentale semble augmenter (+15%).',
    actionLabel: 'Mesures',
    color: '#F4C2C2',
  },
  {
    id: 'plan-1',
    type: 'plan',
    icon: 'calendar-refresh-outline',
    label: 'Plan',
    title: 'Prenez 15 minutes ce soir pour planifier.',
    actionLabel: 'Détails',
    color: '#90CAF9',
  },
  {
    id: 'social-1',
    type: 'social',
    icon: 'hand-heart-outline',
    label: 'Social',
    title: 'Thomas a complété 5 tâches.\nRemerciez-le !',
    actionLabel: 'Envoyer',
    color: '#90CAF9',
  },
];
