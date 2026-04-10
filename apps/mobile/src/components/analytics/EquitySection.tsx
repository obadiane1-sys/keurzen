import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import type { MemberBalance } from '@keurzen/queries';

const MEMBER_COLORS = [
  Colors.terracotta,
  Colors.prune,
  Colors.sauge,
  Colors.miel,
  Colors.rose,
];

function getDeltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.10) return Colors.sauge;
  if (abs < 0.20) return Colors.miel;
  return Colors.rose;
}

interface EquitySectionProps {
  title: string;
  members: MemberBalance[];
  shareKey: 'tasksShare' | 'minutesShare';
  deltaKey: 'tasksDelta' | 'minutesDelta';
}

export function EquitySection({
  title,
  members,
  shareKey,
  deltaKey,
}: EquitySectionProps) {
  if (members.length < 2) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Pas assez de donnees cette semaine
        </Text>
      </View>
    );
  }

  const expectedShare = 1 / members.length;

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        {title}
      </Text>

      <View style={styles.stackedBar}>
        {members.map((m, i) => {
          const share = m[shareKey];
          const color = m.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
          if (share <= 0) return null;
          return (
            <View
              key={m.userId}
              style={[styles.barSegment, { flex: share, backgroundColor: color }]}
            />
          );
        })}
      </View>

      <View style={styles.memberList}>
        {members.map((m, i) => {
          const share = m[shareKey];
          const delta = m[deltaKey];
          const color = m.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
          const deltaColor = getDeltaColor(delta);
          const deltaSign = delta > 0 ? '+' : '';

          return (
            <View key={m.userId} style={styles.memberRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text variant="bodySmall" style={styles.memberName} numberOfLines={1}>
                {m.name.split(' ')[0]}
              </Text>
              <Text variant="bodySmall" weight="bold" style={styles.memberPct}>
                {Math.round(share * 100)}%
              </Text>
              <Text variant="caption" color="muted" style={styles.memberExpected}>
                /{Math.round(expectedShare * 100)}%
              </Text>
              <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '1A' }]}>
                <Text
                  variant="caption"
                  weight="semibold"
                  style={[styles.deltaText, { color: deltaColor }]}
                >
                  {deltaSign}{Math.round(delta * 100)}pp
                </Text>
              </View>
            </View>
          );
        })}
      </View>
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
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  barSegment: {
    height: '100%',
  },
  memberList: {
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  memberPct: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    minWidth: 32,
    textAlign: 'right',
  },
  memberExpected: {
    fontSize: Typography.fontSize.xs,
    minWidth: 32,
  },
  deltaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  deltaText: {
    fontSize: Typography.fontSize.xs,
  },
});
