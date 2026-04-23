import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

const DONUT_SIZE = 96;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MEMBER_COLORS = [Colors.terracotta, Colors.prune, Colors.sauge, Colors.miel];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = members.map((m, i) => ({
    name: m.name.split(' ')[0],
    share: m.tasksShare,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  // Precompute donut offsets via reduce (no in-place mutation during render).
  const donutSegments = segments.reduce<
    Array<(typeof segments)[number] & { dashLength: number; offset: number }>
  >((acc, seg) => {
    const dashLength = seg.share * CIRCUMFERENCE;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength : 0;
    acc.push({ ...seg, dashLength, offset });
    return acc;
  }, []);

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Equite des Taches
      </Text>

      {segments.length >= 2 ? (
        <>
          <View style={styles.donutWrap}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              {donutSegments.map((seg, i) => (
                <Circle
                  key={i}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={RADIUS}
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
                  strokeDashoffset={-seg.offset}
                  rotation={-90}
                  origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
                />
              ))}
            </Svg>
          </View>

          <View style={styles.legend}>
            {segments.map((seg, i) => (
              <View key={i} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text variant="caption" color="muted">
                    {seg.name}
                  </Text>
                </View>
                <Text variant="caption" weight="bold" style={styles.pct}>
                  {Math.round(seg.share * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text variant="bodySmall" color="muted" style={styles.empty}>
          Pas assez de donnees
        </Text>
      )}
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
    marginBottom: Spacing.base,
  },
  donutWrap: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  legend: {
    gap: Spacing.sm,
    marginTop: 'auto' as unknown as number,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pct: {
    color: Colors.textPrimary,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
