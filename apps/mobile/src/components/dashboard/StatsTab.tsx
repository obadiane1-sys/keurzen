import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2 - 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DONUT_SIZE = 120;
const DONUT_STROKE = 24;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const MEMBER_COLORS = ['#00E5FF', '#FFB6C1', '#FFD700', '#9F7AEA'];

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore ! Continuez sur cette voie.';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

function getLoadLevel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: 'Elevee', color: '#FF6B6B' };
  if (score >= 35) return { label: 'Moyenne', color: '#FFD700' };
  return { label: 'Faible', color: '#48BB78' };
}

export function StatsTab() {
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
  const scoreOffset = CIRCUMFERENCE * (1 - score / 100);
  const tlxScore = currentTlx?.score ?? 0;
  const loadLevel = getLoadLevel(tlxScore);

  const segments = useMemo(() => {
    if (balanceMembers.length < 2) return [];
    let cumulative = 0;
    return balanceMembers.map((m, i) => {
      const dashArray = m.tasksShare * DONUT_CIRCUMFERENCE;
      const dashOffset = DONUT_CIRCUMFERENCE - cumulative;
      cumulative += dashArray;
      return { color: MEMBER_COLORS[i % MEMBER_COLORS.length], dashArray, dashOffset, name: m.name, share: m.tasksShare };
    });
  }, [balanceMembers]);

  return (
    <View className="px-6" style={{ gap: 24 }}>
      {/* 1. Score Hero */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/dashboard/weekly-review')}
        activeOpacity={0.8}
        className="bg-surface rounded-3xl p-6 shadow-soft border border-border items-center"
      >
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Score du Foyer
        </Text>
        <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }} className="items-center justify-center mb-4">
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#E2E8F0" strokeWidth={STROKE_WIDTH} fill="none" />
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#00E5FF" strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={scoreOffset}
              strokeLinecap="round" />
          </Svg>
          <View className="absolute">
            <Text style={{ fontSize: 36, fontFamily: 'Nunito_800ExtraBold', color: '#2D3748' }}>{score}</Text>
          </View>
        </View>
        <Text className="text-sm text-center mb-4" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          {coachMessage}
        </Text>
        <Text
          className="uppercase tracking-widest"
          style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#00E5FF' }}
        >
          Voir le bilan hebdo
        </Text>
      </TouchableOpacity>

      {/* 2. Task Equity */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Repartition des taches
        </Text>
        {segments.length === 0 ? (
          <Text className="text-center py-4" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
            Pas assez de donnees
          </Text>
        ) : (
          <>
            <View className="items-center mb-4">
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                <Circle cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
                  stroke="#E2E8F0" strokeWidth={DONUT_STROKE} fill="none" />
                {segments.map((seg, i) => (
                  <Circle key={i} cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
                    stroke={seg.color} strokeWidth={DONUT_STROKE} fill="none"
                    strokeDasharray={`${seg.dashArray} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={seg.dashOffset} rotation={-90}
                    origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`} strokeLinecap="butt" />
                ))}
              </Svg>
            </View>
            <View style={{ gap: 8 }}>
              {balanceMembers.map((member, i) => (
                <View key={member.userId} className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
                  <Text className="flex-1 text-xs" style={{ fontFamily: 'Outfit_500Medium', color: '#2D3748' }}>{member.name}</Text>
                  <Text className="text-xs" style={{ fontFamily: 'Outfit_700Bold', color: '#2D3748' }}>{Math.round(member.tasksShare * 100)}%</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 3. Mental Load */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Charge mentale
        </Text>
        <Text className="text-center mb-2" style={{ fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: loadLevel.color }}>
          {tlxScore === 0 ? '\u2014' : loadLevel.label}
        </Text>
        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <View className="h-1.5 rounded-full" style={{ width: `${Math.min(tlxScore, 100)}%`, backgroundColor: loadLevel.color }} />
        </View>
        {balanceMembers.length >= 2 && (
          <View className="flex-row justify-between mt-4">
            {balanceMembers.slice(0, 2).map((member) => (
              <View key={member.userId} className="items-center flex-1">
                <Text className="text-xs mb-1" style={{ fontFamily: 'Outfit_500Medium', color: '#718096' }}>{member.name}</Text>
                <Text className="text-sm" style={{ fontFamily: 'Outfit_700Bold', color: '#2D3748' }}>{Math.abs(member.tasksDelta)} taches</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. Weekly Trend */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Tendance de la semaine
        </Text>
        <View className="flex-row items-end justify-between" style={{ height: 80, gap: 8 }}>
          {[65, 72, 78, score].map((val, i) => (
            <View key={i} className="flex-1 items-center">
              <View
                className="w-full rounded-t-xl"
                style={{ height: (val / 100) * 60, backgroundColor: i === 3 ? '#00E5FF' : '#E2E8F0' }}
              />
              <Text className="mt-2" style={{ fontSize: 10, fontFamily: 'Outfit_500Medium', color: '#718096' }}>
                {['S-3', 'S-2', 'S-1', 'Auj.'][i]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
