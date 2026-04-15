// packages/shared/src/constants/hubTiles.ts

export type HubTileIcon =
  | 'grid'
  | 'basket'
  | 'cash'
  | 'settings'
  | 'pulse'
  | 'calendar'
  | 'chat';

export interface HubTileConfig {
  key: string;
  label: string;
  route: string;
  icon: HubTileIcon;
  accent?: boolean;
}

export const HUB_TILES: readonly HubTileConfig[] = [
  { key: 'dashboard', label: 'Tableau de bord', route: '/(app)/dashboard',     icon: 'grid', accent: true },
  { key: 'lists',     label: 'Liste de course', route: '/(app)/lists',         icon: 'basket' },
  { key: 'budget',    label: 'Budget',          route: '/(app)/budget',        icon: 'cash' },
  { key: 'settings',  label: 'Réglages',        route: '/(app)/settings',      icon: 'settings' },
  { key: 'tlx',       label: 'Charge mentale',  route: '/(app)/dashboard/tlx', icon: 'pulse' },
  { key: 'calendar',  label: 'Calendrier',      route: '/(app)/calendar',      icon: 'calendar' },
  { key: 'messages',  label: 'Messages',        route: '/(app)/messages',      icon: 'chat' },
] as const;
