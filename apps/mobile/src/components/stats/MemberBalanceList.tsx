import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { labelForBalanceLevel } from '@keurzen/shared';
import type { MemberBalance } from '@keurzen/queries';

interface Props {
  members: MemberBalance[];
}

export function MemberBalanceList({ members }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Repartition</Text>
      <View style={styles.divider} />
      <View style={styles.list}>
        {members.map((m) => {
          const pct = Math.round(m.tasksShare * 100);
          const label = labelForBalanceLevel(m.level);
          return (
            <View key={m.userId} style={styles.row}>
              <Avatar name={m.name} avatarUrl={m.avatarUrl} size="lg" color={label.color} />
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={styles.pct}>{pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, pct)}%`, backgroundColor: label.color },
                    ]}
                  />
                </View>
                <Text style={[styles.stateLabel, { color: label.color }]}>{label.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    paddingBottom: Spacing.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  list: {
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  pct: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.primarySurface,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  stateLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
});
