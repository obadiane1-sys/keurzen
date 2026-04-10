import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 12;
const RADIUS = 50;
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
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text variant="body" weight="bold" style={styles.title}>
          Score du Foyer
        </Text>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={Colors.textMuted}
        />
      </View>

      {/* Content row */}
      <View style={styles.contentRow}>
        {/* Left: score number + message */}
        <View style={styles.leftSection}>
          <View style={styles.scoreRow}>
            <Text
              variant="display"
              weight="extrabold"
              style={styles.scoreNumber}
            >
              {score}
            </Text>
            <Text
              variant="h3"
              weight="regular"
              color="muted"
              style={styles.scoreMax}
            >
              /100
            </Text>
          </View>
          <Text
            variant="bodySmall"
            color="muted"
            numberOfLines={2}
            style={styles.coachMessage}
          >
            {coachMessage}
          </Text>
        </View>

        {/* Right: circular gauge */}
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            {/* Track */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.gray100}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.terracotta}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
            />
          </Svg>
          {/* Centered icon */}
          <View style={styles.gaugeCenter}>
            <Ionicons name="scale-outline" size={28} color={Colors.terracotta} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  blob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  blobTopRight: {
    top: -30,
    right: -30,
    backgroundColor: `${Colors.terracotta}1A`,
  },
  blobBottomLeft: {
    bottom: -30,
    left: -30,
    backgroundColor: `${Colors.rose}1A`,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
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
    fontSize: Typography.fontSize['4xl'],
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize['4xl'] * 1.1,
  },
  scoreMax: {
    fontSize: Typography.fontSize.xl,
    marginBottom: 4,
    marginLeft: 2,
  },
  coachMessage: {
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
  },
  gaugeCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
