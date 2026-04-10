import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

const DONUT_SIZE = 96;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = DONUT_SIZE / 2;

// Fallback colors per index if member has no color
const MEMBER_COLORS = [
  Colors.terracotta,
  Colors.prune,
  Colors.sauge,
  Colors.miel,
  Colors.rose,
];

interface DonutSegment {
  color: string;
  share: number;
  dashArray: number;
  dashOffset: number;
}

function buildSegments(shares: number[], colors: string[]): DonutSegment[] {
  let cumulativeOffset = 0;
  return shares.map((share, i) => {
    const dashArray = share * CIRCUMFERENCE;
    // offset = CIRCUMFERENCE - cumulative arc so far (rotated -90 via transform)
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
    const colors = members.map((m, i) => m.color || MEMBER_COLORS[i % MEMBER_COLORS.length]);
    const shares = members.map((m) => m.tasksShare);
    return buildSegments(shares, colors);
  }, [members]);

  if (members.length < 2) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Equite des Taches
        </Text>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color="muted" style={styles.emptyText}>
            Pas assez de donnees
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Equite des Taches
      </Text>

      {/* Donut chart */}
      <View style={styles.donutContainer}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          {/* Background track */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={Colors.gray100}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Segments */}
          {segments.map((seg, index) => (
            <Circle
              key={index}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={seg.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${seg.dashArray} ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.dashOffset}
              rotation={-90}
              origin={`${CENTER}, ${CENTER}`}
              strokeLinecap="butt"
            />
          ))}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {members.map((member, i) => (
          <View key={member.userId} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: member.color || MEMBER_COLORS[i % MEMBER_COLORS.length] },
              ]}
            />
            <Text variant="caption" numberOfLines={1} style={styles.legendName}>
              {member.name}
            </Text>
            <Text variant="caption" color="muted">
              {Math.round(member.tasksShare * 100)}%
            </Text>
          </View>
        ))}
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
    marginBottom: Spacing.md,
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
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
});
