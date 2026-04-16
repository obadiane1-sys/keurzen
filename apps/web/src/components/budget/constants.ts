import {
  Home, Zap, ShoppingCart, Users, Car,
  Heart, Gamepad2, Repeat, Wallet, MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BudgetCategory } from '@keurzen/shared';

export const CATEGORY_CONFIG: Record<BudgetCategory, { label: string; icon: LucideIcon }> = {
  housing: { label: 'Logement', icon: Home },
  energy: { label: 'Energie', icon: Zap },
  groceries: { label: 'Courses', icon: ShoppingCart },
  children: { label: 'Enfants', icon: Users },
  transport: { label: 'Transport', icon: Car },
  health: { label: 'Sante', icon: Heart },
  leisure: { label: 'Loisirs', icon: Gamepad2 },
  subscriptions: { label: 'Abonnements', icon: Repeat },
  savings: { label: 'Epargne', icon: Wallet },
  other: { label: 'Autre', icon: MoreHorizontal },
};

export const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(
  ([value, config]) => ({ value: value as BudgetCategory, ...config }),
);

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' \u20AC';
}
