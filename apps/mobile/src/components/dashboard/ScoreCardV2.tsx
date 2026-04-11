import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return "Votre repartition s'ameliore ! Continuez sur cette voie.";
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

function getTrend(score: number): { label: string; positive: boolean } {
  if (score >= 60) return { label: '+5% depuis la sem. derniere', positive: true };
  return { label: '-3% depuis la sem. derniere', positive: false };
}

export function ScoreCardV2() {
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
    return computeHouseholdScore({ completedTasks, totalTasks, maxImbalance, averageTlx, streakDays }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const coachMessage = getScoreMessage(score);
  const trend = getTrend(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Decorative circle */}
      <View style={styles.decorCircle} />

      {/* Header */}
      <View style={styles.header}>
        <RNText style={styles.title}>Score du Foyer</RNText>
        <BadgeIcon name="information-outline" size="md" />
      </View>

      {/* Content row */}
      <View style={styles.contentRow}>
        {/* Left: score + trend + message */}
        <View style={styles.leftSection}>
          <View style={styles.scoreRow}>
            <RNText style={styles.scoreNumber}>{score}</RNText>
            <RNText style={styles.scoreMax}>/100</RNText>
          </View>
          <View style={styles.trendRow}>
            <MaterialCommunityIcons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.positive ? '#48BB78' : '#FF6B6B'}
            />
            <RNText style={[styles.trendText, { color: trend.positive ? '#48BB78' : '#FF6B6B' }]}>
              {trend.label}
            </RNText>
          </View>
          <RNText style={styles.coachMessage}>{coachMessage}</RNText>
        </View>

        {/* Right: gauge */}
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#E2E8F0" strokeWidth={STROKE_WIDTH} fill="none" />
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#00E5FF" strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={offset}
              strokeLinecap="round" />
          </Svg>
          <View style={styles.gaugeCenter}>
            <BadgeIcon
              name="scale-balance"
              size="xl"
              bgColor="rgba(0, 229, 255, 0.1)"
              borderColor="rgba(0, 229, 255, 0.2)"
              iconColor="#00E5FF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#2D3748',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftSection: {
    flex: 1,
    paddingRight: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 40,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#2D3748',
  },
  scoreMax: {
    fontSize: 20,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
    marginBottom: 4,
    marginLeft: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },
  coachMessage: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#718096',
    marginTop: 12,
    lineHeight: 20,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
  },
});
