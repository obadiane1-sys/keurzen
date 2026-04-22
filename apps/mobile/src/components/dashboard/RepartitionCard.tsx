import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

export function RepartitionCard() {
  const { members: balanceMembers } = useWeeklyBalance();

  return (
    <DashboardCard accentColor={Colors.miel}>
      <Text variant="overline" style={styles.overline}>REPARTITION</Text>
      <Text variant="caption" color="secondary">Equilibre des taches</Text>

      {balanceMembers.length > 0 ? (
        <View style={styles.members}>
          {balanceMembers.map((m) => {
            const pct = Math.round(m.tasksShare * 100);
            return (
              <View key={m.userId} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text variant="bodySmall" weight="bold">{m.name.split(' ')[0]}</Text>
                  <Text variant="bodySmall" weight="bold">{pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text variant="body" color="muted" style={styles.emptyText}>
          Pas assez de donnees cette semaine
        </Text>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.miel,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  members: {
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  memberRow: {},
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
});
