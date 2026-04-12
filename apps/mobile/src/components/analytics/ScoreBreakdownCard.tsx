import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const RING_SIZE = 160;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.success;
  if (score >= 40) return Colors.joy;
  return Colors.accent;
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Equilibre';
  if (score >= 40) return 'A surveiller';
  return 'Fragile';
}

const DIMENSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  completion: 'checkmark-circle-outline',
  balance: 'scale-outline',
  tlx: 'brain-outline',
  streak: 'flame-outline',
};

const DIMENSION_LABELS: Record<string, string> = {
  completion: 'Taches',
  balance: 'Equilibre',
  tlx: 'Charge mentale',
  streak: 'Regularite',
};

export function ScoreBreakdownCard() {
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance =
      balanceMembers.length > 0
        ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
        : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays,
    });
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const scoreColor = getScoreColor(scoreResult.total);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - scoreResult.total / 100);

  return (
    <View style={styles.card}>
      <View style={styles.gaugeContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.gray100} stopOpacity="1" />
              <Stop offset="1" stopColor={Colors.borderLight} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#bgGrad)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={scoreColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
            {scoreResult.total}
          </Text>
          <Text variant="caption" color="muted">/100</Text>
        </View>
      </View>

      <Text variant="h3" weight="bold" style={[styles.levelLabel, { color: scoreColor }]}>
        {getScoreLevel(scoreResult.total)}
      </Text>

      <View style={styles.dimensionsRow}>
        {Object.entries(scoreResult.dimensions).map(([key, dim]) => (
          <View key={key} style={styles.dimensionItem}>
            <Ionicons
              name={DIMENSION_ICONS[key] ?? 'ellipse-outline'}
              size={20}
              color={Colors.textSecondary}
            />
            <Text variant="h3" weight="bold" style={styles.dimensionValue}>
              {dim.value}
            </Text>
            <Text variant="caption" color="muted" style={styles.dimensionLabel}>
              {DIMENSION_LABELS[key] ?? dim.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  gaugeContainer: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  scoreNumber: {
    fontSize: 44,
    lineHeight: 52,
    color: Colors.textPrimary,
  },
  levelLabel: {
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.xl,
  },
  dimensionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dimensionItem: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  dimensionValue: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  dimensionLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
});
