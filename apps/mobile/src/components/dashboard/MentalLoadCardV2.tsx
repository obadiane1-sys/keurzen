import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

interface LevelStyle {
  label: string;
  color: string;
}

function getLoadLevel(score: number): LevelStyle {
  if (score >= 65) return { label: 'Elevee', color: Colors.rose };
  if (score >= 35) return { label: 'Moyenne', color: Colors.miel };
  return { label: 'Faible', color: Colors.sauge };
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const levelStyle = getLoadLevel(score);

  // Pick the member with the highest abs(tasksDelta)
  const focusMember = useMemo(() => {
    if (members.length === 0) return null;
    return members.reduce((prev, curr) =>
      Math.abs(curr.tasksDelta) > Math.abs(prev.tasksDelta) ? curr : prev
    );
  }, [members]);

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Charge Mentale
      </Text>

      {/* Large level text */}
      <Text
        variant="display"
        weight="extrabold"
        style={[styles.levelText, { color: levelStyle.color }]}
      >
        {levelStyle.label}
      </Text>

      {/* Focus subtitle */}
      {focusMember && (
        <Text variant="bodySmall" color="muted" style={styles.subtitle} numberOfLines={2}>
          Focus sur {focusMember.name} cette semaine
        </Text>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${score}%`,
              backgroundColor: levelStyle.color,
            },
          ]}
        />
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
  levelText: {
    fontSize: Typography.fontSize['3xl'],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
});
