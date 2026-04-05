import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';

interface NarrativeCardProps {
  doneTasks: number;
  overdueTasks: number;
  tlxDelta: number | null;
  hasTlx: boolean;
}

function getNarrative(props: NarrativeCardProps): { title: string; body: string; icon: string } {
  const { doneTasks, overdueTasks, tlxDelta, hasTlx } = props;

  if (!hasTlx) {
    return {
      title: 'Bienvenue',
      body: 'Remplis le questionnaire TLX pour suivre ta charge mentale cette semaine.',
      icon: 'hand-right-outline',
    };
  }

  if (tlxDelta !== null && tlxDelta < -5) {
    return {
      title: 'Belle semaine en cours',
      body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} et ta charge mentale a baisse de ${Math.abs(tlxDelta)} points.`,
      icon: 'sparkles-outline',
    };
  }

  if (tlxDelta !== null && tlxDelta > 5) {
    const suffix = overdueTasks > 0
      ? `Il reste ${overdueTasks} tache${overdueTasks > 1 ? 's' : ''} en retard.`
      : 'Prends un moment pour toi.';
    return {
      title: 'Semaine chargee',
      body: `Ta charge mentale a augmente de ${tlxDelta} points. ${suffix}`,
      icon: 'alert-circle-outline',
    };
  }

  return {
    title: 'En bonne voie',
    body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} cette semaine. Continue comme ca !`,
    icon: 'checkmark-circle-outline',
  };
}

export function NarrativeCard(props: NarrativeCardProps) {
  const { title, body, icon } = getNarrative(props);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.miel} />
        <Text variant="label" weight="bold" style={styles.title}>
          {title}
        </Text>
        <Ionicons
          name="expand-outline"
          size={16}
          color={Colors.textMuted}
          style={styles.expandIcon}
        />
      </View>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  body: {
    lineHeight: Typography.fontSize.sm * 1.6,
  },
});
