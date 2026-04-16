'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { KeurzenMascot, type MascotExpression } from './KeurzenMascot';

type EmptyStateVariant = 'tasks' | 'calendar' | 'budget' | 'stats' | 'household' | 'lists' | 'generic';

const VARIANT_DEFAULTS: Record<EmptyStateVariant, {
  expression: MascotExpression;
  title: string;
  subtitle: string;
}> = {
  tasks: {
    expression: 'normal',
    title: 'Aucune tache pour le moment',
    subtitle: 'Creez votre premiere tache pour commencer a organiser votre foyer.',
  },
  calendar: {
    expression: 'happy',
    title: 'Journee libre !',
    subtitle: 'Aucun evenement prevu. Profitez-en !',
  },
  budget: {
    expression: 'normal',
    title: 'Pas encore de depenses',
    subtitle: 'Ajoutez vos premieres depenses pour suivre votre budget.',
  },
  stats: {
    expression: 'tired',
    title: 'Pas encore de donnees',
    subtitle: 'Completez quelques taches et vos statistiques apparaitront ici.',
  },
  household: {
    expression: 'surprised',
    title: 'Votre foyer vous attend',
    subtitle: 'Creez un foyer ou rejoignez-en un avec un code d\'invitation.',
  },
  lists: {
    expression: 'normal',
    title: 'Aucune liste',
    subtitle: 'Creez une liste pour organiser vos achats ou vos idees.',
  },
  generic: {
    expression: 'normal',
    title: 'Rien a afficher',
    subtitle: 'Il n\'y a rien ici pour le moment.',
  },
};

interface EmptyStateProps {
  icon?: LucideIcon;
  variant?: EmptyStateVariant;
  expression?: MascotExpression;
  title?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  variant,
  expression,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  const defaults = variant ? VARIANT_DEFAULTS[variant] : null;
  const resolvedExpression = expression ?? defaults?.expression ?? 'normal';
  const resolvedTitle = title ?? defaults?.title ?? 'Rien a afficher';
  const resolvedSubtitle = subtitle ?? defaults?.subtitle;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-5">
        {Icon && !variant ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-surface">
            <Icon size={24} className="text-primary" />
          </div>
        ) : (
          <KeurzenMascot expression={resolvedExpression} size={100} />
        )}
      </div>
      <h3 className="font-heading text-lg font-semibold text-text-primary">{resolvedTitle}</h3>
      {resolvedSubtitle && (
        <p className="mt-1.5 max-w-xs text-sm text-text-secondary leading-relaxed">
          {resolvedSubtitle}
        </p>
      )}
      {action && (
        <Button size="default" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
