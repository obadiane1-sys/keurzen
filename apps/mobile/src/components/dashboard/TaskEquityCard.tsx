import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

const DONUT_SIZE = 96;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = DONUT_SIZE / 2;

const MEMBER_COLORS = [
  ColorsV2.primary,
  ColorsV2.secondary,
  ColorsV2.tertiary,
  ColorsV2.primaryContainer,
];

function buildSegments(shares: number[], colors: string[]) {
  let cumulativeOffset = 0;
  return shares.map((share, i) => {
    const dashArray = share * CIRCUMFERENCE;
    const dashOffset = CIRCUMFERENCE - cumulativeOffset;
    cumulativeOffset += dashArray;
    return {
      color: colors[i] ?? MEMBER_COLORS[i % MEMBER_COLORS.length],
      share,
      dashArray,
      dashOffset,
    };
  });
}

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = useMemo(() => {
    if (members.length < 2) return [];
    const colors = members.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]);
    const shares = members.map((m) => m.tasksShare);
    return buildSegments(shares, colors);
  }, [members]);

  if (members.length < 2) {
    return (
      <View style={styles.card}>
        <Text variant="overline" style={styles.title}>Repartition</Text>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" style={styles.emptyText}>Pas assez de donnees</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="overline" style={styles.title}>Repartition</Text>

      <View style={styles.donutContainer}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS}
            stroke={ColorsV2.surfaceContainerLowest}
            strokeWidth={STROKE_WIDTH} fill="none" />
          {segments.map((seg, index) => (
            <Circle key={index}
              cx={CENTER} cy={CENTER} r={RADIUS}
              stroke={seg.color} strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${seg.dashArray} ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.dashOffset}
              rotation={-90} origin={`${CENTER}, ${CENTER}`}
              strokeLinecap="butt" />
          ))}
        </Svg>
      </View>

      <View style={styles.legend}>
        {members.map((member, i) => (
          <View key={member.userId} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }]} />
            <Text variant="caption" numberOfLines={1} style={styles.legendName}>{member.name}</Text>
            <Text variant="caption" style={styles.legendPct}>{Math.round(member.tasksShare * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: ColorsV2.surfaceContainer,
    borderRadius: RadiusV2.md,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  donutContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  legend: {
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: ColorsV2.onSurface,
  },
  legendPct: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: ColorsV2.onSurface,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
  },
});
