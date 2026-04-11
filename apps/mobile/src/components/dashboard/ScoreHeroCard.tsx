import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 12;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore !';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
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
    }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const coachMessage = getScoreMessage(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Soft glow blob */}
      <View style={styles.glowBlob} />

      {/* Overline label */}
      <Text variant="overline" style={styles.overline}>
        Score du Foyer
      </Text>

      {/* Content row */}
      <View style={styles.contentRow}>
        <View style={styles.leftSection}>
          <View style={styles.scoreRow}>
            <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
              {score}
            </Text>
            <Text variant="h3" weight="regular" style={styles.scoreMax}>
              /100
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.coachMessage} numberOfLines={2}>
            {coachMessage}
          </Text>
        </View>

        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={ColorsV2.surfaceContainer}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={ColorsV2.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
            />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    overflow: 'hidden',
    marginLeft: -10,
    marginRight: 20,
  },
  glowBlob: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: ColorsV2.primaryContainer,
    opacity: 0.12,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 26,
    color: ColorsV2.onSurface,
    letterSpacing: -1,
    lineHeight: 30,
  },
  scoreMax: {
    fontSize: Typography.fontSize.xl,
    color: ColorsV2.onSurfaceVariant,
    marginBottom: 2,
    marginLeft: 2,
  },
  coachMessage: {
    color: ColorsV2.onSurfaceVariant,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
});
