import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

function getLoadLevel(score: number): string {
  if (score >= 65) return 'Elevee';
  if (score >= 35) return 'Moyenne';
  return 'Faible';
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const levelLabel = getLoadLevel(score);

  const focusMember = useMemo(() => {
    if (members.length === 0) return null;
    return members.reduce((prev, curr) =>
      Math.abs(curr.tasksDelta) > Math.abs(prev.tasksDelta) ? curr : prev
    );
  }, [members]);

  return (
    <View style={styles.card}>
      <Text variant="overline" style={styles.title}>Charge mentale</Text>

      <Text variant="display" weight="extrabold" style={styles.levelText}>
        {score === 0 ? '—' : levelLabel}
      </Text>

      {focusMember && (
        <Text variant="bodySmall" style={styles.subtitle} numberOfLines={2}>
          Focus sur {focusMember.name} cette semaine
        </Text>
      )}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(score, 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    marginTop: 8,
  },
  title: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  levelText: {
    fontSize: Typography.fontSize['2xl'],
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: ColorsV2.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: ColorsV2.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    backgroundColor: ColorsV2.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ColorsV2.primary,
  },
});
