import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';
import { useWeeklyObjective } from '../../lib/queries/objectives';
import { ObjectiveProgressSection } from './ObjectiveProgressSection';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.sauge;
  if (score >= 40) return Colors.miel;
  return Colors.rose;
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Bon equilibre';
  if (score >= 40) return 'A surveiller';
  return 'Attention requise';
}

// ─── Ring constants ──────────────────────────────────────────────────────────

const RING_SIZE = 100;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Component ───────────────────────────────────────────────────────────────

interface HouseholdScoreCardProps {
  previousScore?: number | null;
}

export function HouseholdScoreCard({ previousScore }: HouseholdScoreCardProps) {
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();
  const { objective, progress, isAchieved } = useWeeklyObjective();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;

    // Max imbalance: largest absolute tasks_delta among members
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
    });
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const scoreColor = getScoreColor(scoreResult.total);
  const trend = previousScore != null ? scoreResult.total - previousScore : null;
  const trendColor = trend != null && trend >= 0 ? Colors.sauge : Colors.rose;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - scoreResult.total / 100);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={Colors.gray100}
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
          <View style={[styles.ringCenter, { width: RING_SIZE, height: RING_SIZE }]}>
            <Text
              variant="h2"
              weight="extrabold"
              style={{ color: scoreColor, fontSize: 28, lineHeight: 32 }}
            >
              {scoreResult.total}
            </Text>
          </View>
        </View>

        {/* Right side: label + trend */}
        <View style={styles.infoColumn}>
          <Text variant="h4" weight="bold" style={styles.title}>
            Score foyer
          </Text>
          <Text
            variant="bodySmall"
            weight="semibold"
            style={{ color: scoreColor }}
          >
            {getScoreLabel(scoreResult.total)}
          </Text>
          {trend !== null && (
            <View style={styles.trendRow}>
              <Ionicons
                name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={trendColor}
              />
              <Text variant="caption" weight="semibold" style={{ color: trendColor }}>
                {trend >= 0 ? '+' : ''}{trend} vs sem. prec.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.barsContainer}>
        {Object.values(scoreResult.dimensions).map((dim) => (
          <View key={dim.label} style={styles.barRow}>
            <Text variant="caption" color="secondary" style={styles.barLabel}>
              {dim.label}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${dim.value}%`,
                    backgroundColor: getScoreColor(dim.value),
                  },
                ]}
              />
            </View>
            <Text variant="caption" weight="semibold" color="secondary" style={styles.barValue}>
              {dim.value}
            </Text>
          </View>
        ))}
      </View>

      {objective && (
        <ObjectiveProgressSection
          label={objective.label}
          type={objective.type}
          currentValue={objective.current_value}
          targetValue={objective.target_value}
          baselineValue={objective.baseline_value}
          progress={progress}
          achieved={isAchieved}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  ringContainer: {
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  barsContainer: {
    gap: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  barValue: {
    width: 24,
    textAlign: 'right',
  },
});
