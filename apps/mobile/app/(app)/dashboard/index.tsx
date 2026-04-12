import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks, useUpdateTaskStatus } from '../../../src/lib/queries/tasks';
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

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { score: scoreResult } = useHouseholdScore();
  const { mutate: updateStatus } = useUpdateTaskStatus();

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
    updateStatus({ id: taskId, status: 'done' });
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
        <DreamHeader firstName={firstName} />

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
