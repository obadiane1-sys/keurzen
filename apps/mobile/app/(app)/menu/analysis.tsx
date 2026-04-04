import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { useWeeklyBalance } from '../../../src/lib/queries/weekly-stats';
import { useTasks } from '../../../src/lib/queries/tasks';
import { useTlxDelta, useTlxHistory } from '../../../src/lib/queries/tlx';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { KPIPills } from '../../../src/components/analysis/KPIPills';
import { MemberBreakdown } from '../../../src/components/analysis/MemberBreakdown';
import { TlxSparkline } from '../../../src/components/analysis/TlxSparkline';
import { TopTasks } from '../../../src/components/analysis/TopTasks';

dayjs.extend(isoWeek);

// ─── Staggered fade-in ─────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    })),
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 400,
          delay: i * 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 400,
          delay: i * 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, []);

  return anims;
}

function FadeSection({
  anim,
  style,
  children,
}: {
  anim: { opacity: Animated.Value; translateY: Animated.Value };
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={[
        style,
        { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBalanceLabel(members: { tasksShare: number }[]): { label: string; color: string } {
  if (members.length < 2) return { label: 'N/A', color: Colors.textMuted };
  const shares = members.map((m) => m.tasksShare);
  const max = Math.max(...shares);
  const min = Math.min(...shares);
  const diff = max - min;
  if (diff < 0.2) return { label: 'Équilibré', color: Colors.sauge };
  if (diff < 0.4) return { label: 'Léger écart', color: Colors.miel };
  return { label: 'Déséquilibre', color: Colors.rose };
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const { members: balanceMembers, isLoading: balanceLoading } = useWeeklyBalance();
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: tlxDelta } = useTlxDelta();
  const { data: tlxHistory = [] } = useTlxHistory(12);

  const fadeAnims = useStaggeredFadeIn(5);

  const isLoading = balanceLoading || tasksLoading;

  if (isLoading) {
    return <Loader fullScreen />;
  }

  // Week label
  const weekStart = dayjs().startOf('isoWeek');
  const weekEnd = weekStart.add(6, 'day');
  const weekLabel = `Semaine du ${weekStart.format('D MMM')} au ${weekEnd.format('D MMM')}`;

  // KPI data
  const doneTasks = allTasks.filter((t) => t.status === 'done');
  const balance = getBalanceLabel(balanceMembers);
  const totalMinutes = balanceMembers.reduce(
    (sum, m) => sum + Math.round(m.minutesShare * 100),
    0,
  );

  // KPI pills
  const pills = [
    {
      label: 'Équilibre',
      value: balance.label,
      icon: 'scale-outline' as const,
      color: balance.color,
      dotColor: balance.color,
    },
    {
      label: 'Tâches',
      value: `${doneTasks.length}/${allTasks.length}`,
      icon: 'checkmark-circle-outline' as const,
      color: Colors.sauge,
    },
    {
      label: 'Temps',
      value: `${Math.round(totalMinutes / 60)}h`,
      icon: 'time-outline' as const,
      color: Colors.miel,
    },
    {
      label: 'TLX',
      value: tlxDelta
        ? `${Math.round(tlxDelta.score)}${tlxDelta.hasComparison ? (tlxDelta.delta >= 0 ? ' ↑' : ' ↓') : ''}`
        : '—',
      icon: 'pulse-outline' as const,
      color: Colors.prune,
    },
  ];

  // TLX sparkline data
  const tlxWeeks = tlxHistory.map((entry) => ({
    weekLabel: `S${dayjs(entry.week_start).isoWeek()}`,
    score: entry.score,
  }));

  // Top tasks by estimated_minutes
  const topTasks = [...allTasks]
    .filter((t) => (t.status === 'done' || t.status === 'in_progress') && t.estimated_minutes > 0)
    .sort((a, b) => b.estimated_minutes - a.estimated_minutes)
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      estimatedMinutes: t.estimated_minutes,
      priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
      assigneeName: t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigné',
      assigneeColor: Colors.sauge,
      assigneeAvatarUrl: t.assigned_profile?.avatar_url,
    }));

  // Member breakdown
  const breakdownMembers = balanceMembers.map((m) => ({
    name: m.name,
    color: m.color,
    avatarUrl: m.avatarUrl,
    tasksShare: m.tasksShare,
    minutesShare: m.minutesShare,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Analyse" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Week subtitle */}
        <FadeSection anim={fadeAnims[0]} style={styles.section}>
          <Text variant="caption" style={styles.weekLabel}>
            {weekLabel}
          </Text>
        </FadeSection>

        {/* KPI Pills */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <KPIPills pills={pills} />
        </FadeSection>

        {/* Member Breakdown */}
        {breakdownMembers.length > 0 && (
          <FadeSection anim={fadeAnims[2]} style={styles.section}>
            <MemberBreakdown members={breakdownMembers} totalMinutes={totalMinutes} />
          </FadeSection>
        )}

        {/* TLX Sparkline */}
        <FadeSection anim={fadeAnims[3]} style={styles.section}>
          <TlxSparkline weeks={tlxWeeks} />
        </FadeSection>

        {/* Top Tasks */}
        {topTasks.length > 0 && (
          <FadeSection anim={fadeAnims[4]} style={styles.sectionLast}>
            <TopTasks tasks={topTasks} />
          </FadeSection>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  weekLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionLast: {
    marginBottom: 0,
  },
});
