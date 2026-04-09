import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useCurrentTlx, useTlxDelta } from '../../lib/queries/tlx';

export function TlxSummaryCard() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const score = currentTlx?.score ?? null;
  const delta = tlxDelta ?? null;

  const deltaColor = delta !== null && delta < 0 ? Colors.sauge : delta !== null && delta > 0 ? Colors.rose : Colors.textMuted;
  const deltaLabel = delta !== null
    ? `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)} pts`
    : null;

  if (score === null) {
    return (
      <DashboardCard
        accentColor={Colors.prune}
        onPress={() => router.push('/(app)/dashboard/tlx')}
      >
        <Text variant="overline" style={styles.overline}>CHARGE RESSENTIE</Text>
        <Text variant="body" color="secondary" style={styles.emptyText}>
          Remplir le questionnaire TLX
        </Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      accentColor={Colors.prune}
      onPress={() => router.push('/(app)/dashboard/tlx')}
    >
      <Text variant="overline" style={styles.overline}>CHARGE RESSENTIE</Text>
      <Text variant="caption" color="secondary">TLX moyen du foyer</Text>

      <View style={styles.numberRow}>
        <Text variant="display" weight="extrabold" style={styles.bigNumber}>{score}</Text>
        <Text variant="body" color="muted" style={styles.unit}>/100</Text>
        {deltaLabel && (
          <Text variant="bodySmall" weight="bold" style={[styles.delta, { color: deltaColor }]}>
            {deltaLabel}
          </Text>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: Colors.prune }]} />
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.prune,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.base,
    gap: 6,
  },
  bigNumber: {
    fontSize: 40,
    lineHeight: 46,
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.fontSize.base,
  },
  delta: {
    marginLeft: 'auto',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
