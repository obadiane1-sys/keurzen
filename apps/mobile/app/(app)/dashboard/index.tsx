import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks } from '../../../src/lib/queries/tasks';
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { useWeeklyBalance, useHouseholdScore } from '@keurzen/queries';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { DreamHeader } from '../../../src/components/dashboard/DreamHeader';
import { HouseholdScoreCard } from '../../../src/components/dashboard/HouseholdScoreCard';
import { TaskEquityBar } from '../../../src/components/dashboard/TaskEquityBar';
import { AlertCard } from '../../../src/components/dashboard/AlertCard';
import { UpcomingTasksList } from '../../../src/components/dashboard/UpcomingTasksList';
import { MOCK_ALERTS } from '../../../src/components/dashboard/constants';
import { Colors } from '../../../src/constants/tokens';
import type { Task } from '../../../src/types';

/** Fallback: compute equity from all assigned tasks when weekly stats are empty */
function computeEquityFromTasks(tasks: Task[]) {
  const assigned = tasks.filter((t) => t.assigned_to);
  if (assigned.length === 0) return [];

  const byUser = new Map<string, { name: string; count: number }>();
  for (const t of assigned) {
    const userId = t.assigned_to!;
    const existing = byUser.get(userId);
    if (existing) {
      existing.count++;
    } else {
      const name = (t as any).assigned_profile?.full_name ?? 'Membre';
      byUser.set(userId, { name, count: 1 });
    }
  }

  const total = assigned.length;
  const expectedShare = 1 / byUser.size;

  return Array.from(byUser.entries()).map(([userId, data]) => {
    const tasksShare = data.count / total;
    return {
      userId,
      name: data.name,
      tasksShare,
      tasksDelta: tasksShare - expectedShare,
    };
  }).sort((a, b) => b.tasksShare - a.tasksShare);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: tasks = [] } = useTasks();
  const { members: weeklyMembers } = useWeeklyBalance();
  const { score: scoreResult } = useHouseholdScore();
  const members = weeklyMembers.length >= 2 ? weeklyMembers : computeEquityFromTasks(tasks);
  const [ratingTask, setRatingTask] = useState<{ id: string; title: string } | null>(null);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Mascot size={44} expression="calm" />
        </View>
        <EmptyState
          variant="household"
          expression="normal"
          title="Votre foyer vous attend"
          subtitle="Creez un foyer ou rejoignez-en un avec un code d'invitation."
          action={{ label: 'Creer un foyer', onPress: () => router.navigate('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  const trend = 5; // Mock trend for now

  const handleToggleStatus = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setRatingTask({ id: task.id, title: task.title });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <DreamHeader firstName={firstName} avatarUrl={profile?.avatar_url ?? null} />

        <View style={styles.gap} />
        <HouseholdScoreCard score={scoreResult.total} trend={trend} />

        <View style={styles.gap} />
        <TaskEquityBar members={members} />

        {/* Alert cards grid */}
        <View style={styles.alertGrid}>
          <View style={styles.alertRow}>
            <View style={styles.alertHalf}>
              <AlertCard alert={MOCK_ALERTS[0]} />
            </View>
            <View style={styles.alertHalf}>
              <AlertCard alert={MOCK_ALERTS[1]} />
            </View>
          </View>
          <AlertCard alert={MOCK_ALERTS[2]} fullWidth />
        </View>

        <View style={styles.gap} />
        <UpcomingTasksList tasks={tasks} onToggleStatus={handleToggleStatus} />
      </ScrollView>

      <CompletionRatingSheet
        visible={ratingTask !== null}
        taskId={ratingTask?.id ?? ''}
        taskTitle={ratingTask?.title ?? ''}
        onComplete={() => setRatingTask(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  gap: {
    height: 24,
  },
  alertGrid: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 16,
  },
  alertHalf: {
    flex: 1,
  },
});
