import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
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
  if (score >= 80) return 'Votre repartition s\'ameliore ! Continuez sur cette voie.';
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
    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays,
    }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const coachMessage = getScoreMessage(score);
  const trend = getTrend(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
      activeOpacity={0.8}
      className="bg-surface rounded-3xl p-6 shadow-soft border border-border relative overflow-hidden"
    >
      {/* Decorative blur circle */}
      <View
        className="absolute bg-primary/5 rounded-full"
        style={{ top: -40, right: -40, width: 128, height: 128 }}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 z-10">
        <Text
          className="text-lg"
          style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}
        >
          Score du Foyer
        </Text>
        <BadgeIcon name="information-outline" size="md" />
      </View>

      {/* Content row */}
      <View className="flex-row justify-between items-center z-10">
        {/* Left: score + trend + message */}
        <View className="flex-1 pr-4">
          <View className="flex-row items-end">
            <Text style={{ fontSize: 40, fontFamily: 'Nunito_800ExtraBold', color: '#2D3748' }}>
              {score}
            </Text>
            <Text
              style={{ fontSize: 20, fontFamily: 'Nunito_400Regular', color: '#718096', marginBottom: 4, marginLeft: 2 }}
            >
              /100
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.positive ? '#48BB78' : '#FF6B6B'}
            />
            <Text
              className="ml-1 text-sm"
              style={{
                fontFamily: 'Outfit_500Medium',
                color: trend.positive ? '#48BB78' : '#FF6B6B',
              }}
            >
              {trend.label}
            </Text>
          </View>
          <Text
            className="text-sm mt-3 leading-relaxed"
            style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}
          >
            {coachMessage}
          </Text>
        </View>

        {/* Right: gauge */}
        <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }} className="items-center justify-center">
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#E2E8F0"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#00E5FF"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute">
            <BadgeIcon
              name="scale-balance"
              size="xl"
              bgClassName="bg-primary/10 border-primary/20"
              iconColor="#00E5FF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
