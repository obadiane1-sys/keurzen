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
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return "Votre repartition s'ameliore ! Continuez sur cette voie.";
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

  const score = scoreResult.total;
  const offset = CIRCUMFERENCE * (1 - score / 100);
  // TODO: wire delta vs previous week — placeholder for now.
  const delta = 0;
  const deltaPositive = delta >= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
    >
      <View style={styles.card}>
        {/* Decorative blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text variant="body" weight="bold" style={styles.title}>
            Score du Foyer
          </Text>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
        </View>

        {/* Content: left text + right gauge */}
        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <View style={styles.scoreRow}>
              <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
                {score}
              </Text>
              <Text variant="h3" weight="regular" style={styles.scoreMax}>
                /100
              </Text>
            </View>

            {delta !== 0 && (
              <View style={styles.trendRow}>
                <Ionicons
                  name={deltaPositive ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={deltaPositive ? Colors.sauge : Colors.rose}
                />
                <Text
                  variant="bodySmall"
                  weight="medium"
                  style={{ color: deltaPositive ? Colors.sauge : Colors.rose }}
                >
                  {deltaPositive ? '+' : ''}
                  {delta}% depuis la sem. derniere
                </Text>
              </View>
            )}

            <Text variant="bodySmall" color="muted" style={styles.coachMessage}>
              {getScoreMessage(score)}
            </Text>
          </View>

          {/* Circular gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
              <Circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS}
                stroke={Colors.gray100}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
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
            <View style={styles.gaugeIcon}>
              <Ionicons name="scale-outline" size={28} color={Colors.terracotta} />
            </View>
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
    position: 'relative',
    ...Shadows.card,
  },
  blobTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.terracotta}1A`,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.rose}1A`,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
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
  leftCol: {
    flex: 1,
    paddingRight: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: Typography.fontSize['4xl'],
    lineHeight: 38,
    color: Colors.textPrimary,
  },
  scoreMax: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  coachMessage: {
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
  },
  gaugeIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
