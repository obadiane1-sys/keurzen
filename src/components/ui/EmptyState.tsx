import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from './Text';
import { Button } from './Button';
import { Mascot } from './Mascot';

type EmptyStateVariant = 'tasks' | 'calendar' | 'tlx' | 'budget' | 'dashboard' | 'household' | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

const variantDefaults: Record<EmptyStateVariant, { title: string; subtitle: string; ctaLabel?: string }> = {
  tasks: {
    title: 'Aucune tâche pour l\'instant',
    subtitle: 'Commencez à organiser votre foyer en ajoutant votre première tâche.',
    ctaLabel: 'Ajouter une tâche',
  },
  calendar: {
    title: 'Pas d\'événements cette semaine',
    subtitle: 'Votre calendrier est libre. Profitez-en !',
  },
  tlx: {
    title: 'Pas encore de bilan',
    subtitle: 'Enregistrez votre charge mentale chaque semaine pour suivre votre équilibre.',
    ctaLabel: 'Faire mon bilan',
  },
  budget: {
    title: 'Aucune dépense enregistrée',
    subtitle: 'Commencez à suivre vos dépenses pour voir la répartition budgétaire.',
    ctaLabel: 'Ajouter une dépense',
  },
  dashboard: {
    title: 'Bienvenue dans Keurzen !',
    subtitle: 'Votre tableau de bord se remplira au fil de vos activités.',
    ctaLabel: 'Ajouter une tâche',
  },
  household: {
    title: 'Aucun foyer',
    subtitle: 'Créez votre foyer ou rejoignez celui d\'un proche pour commencer.',
    ctaLabel: 'Créer un foyer',
  },
  generic: {
    title: 'Rien ici pour l\'instant',
    subtitle: 'Les données apparaîtront bientôt.',
  },
};

export function EmptyState({
  variant = 'generic',
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const displayTitle = title ?? defaults.title;
  const displaySubtitle = subtitle ?? defaults.subtitle;
  const displayCta = ctaLabel ?? defaults.ctaLabel;

  return (
    <View style={[styles.container, style]}>
      <Mascot size={120} expression="calm" />
      <Text variant="h4" style={styles.title}>
        {displayTitle}
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        {displaySubtitle}
      </Text>
      {displayCta && onCta && (
        <Button
          label={displayCta}
          onPress={onCta}
          variant="secondary"
          style={styles.cta}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: Spacing.sm,
  },
});
