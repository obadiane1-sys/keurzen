import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

function getTlxLevel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: 'Elevee', color: Colors.rose };
  if (score >= 35) return { label: 'Moyenne', color: Colors.miel };
  return { label: 'Faible', color: Colors.sauge };
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const { label, color } = getTlxLevel(score);

  // Member with the biggest workload delta (positive or negative).
  const focusMember =
    members.length > 0
      ? members.reduce((a, b) => (Math.abs(b.tasksDelta) > Math.abs(a.tasksDelta) ? b : a))
      : null;

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Charge Mentale
      </Text>

      <View style={styles.center}>
        <Text variant="display" weight="extrabold" style={[styles.levelText, { color }]}>
          {score > 0 ? label : '—'}
        </Text>

        {focusMember && (
          <Text variant="caption" color="muted" style={styles.subtitle}>
            Focus sur {focusMember.name.split(' ')[0]} cette semaine
          </Text>
        )}

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: Typography.fontSize['3xl'],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 16,
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: Spacing.base,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
});
