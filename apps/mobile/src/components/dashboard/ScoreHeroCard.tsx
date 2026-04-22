import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 140;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.sauge;
  if (score >= 40) return Colors.miel;
  return Colors.rose;
}

function getStatusLabel(score: number): string {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 60) return 'BON EQUILIBRE';
  if (score >= 40) return 'MOYEN';
  if (score >= 20) return 'A RISQUE';
  return 'FRAGILE';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
      : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays,
    }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const scoreColor = getScoreColor(score);
  const statusLabel = getStatusLabel(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <DashboardCard
      accentColor={Colors.terracotta}
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
    >
      <Text variant="overline" style={styles.overline}>SCORE DU FOYER</Text>
      <Text variant="caption" color="secondary">Cette semaine</Text>

      <View style={styles.gaugeWrap}>
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={Colors.border} strokeWidth={STROKE_WIDTH} fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={scoreColor} strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              strokeLinecap="round" rotation={-90}
              origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.gaugeCenter}>
            <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
              {score}
            </Text>
            <Text variant="caption" color="muted" style={styles.scoreMax}>/100</Text>
          </View>
        </View>
      </View>

      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: `${scoreColor}1F` }]}>
          <Text variant="caption" weight="bold" style={{ color: scoreColor, fontSize: 11, letterSpacing: 0.8 }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.terracotta,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  gaugeWrap: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  gaugeContainer: {
    position: 'relative',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  gaugeCenter: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    lineHeight: 42,
    color: Colors.textPrimary,
  },
  scoreMax: {
    marginTop: -2,
  },
  badgeWrap: {
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
});
