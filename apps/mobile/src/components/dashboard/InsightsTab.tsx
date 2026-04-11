import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { InsightCardV2 } from './InsightCardV2';
import { ScoreCardV2 } from './ScoreCardV2';
import { TaskCardV2 } from './TaskCardV2';
import { useCoachingInsights } from '@keurzen/queries';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import type { CoachingInsight } from '@keurzen/shared';

export function InsightsTab() {
  const router = useRouter();
  const { data: insights = [] } = useCoachingInsights();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcomingTasks = useMemo(() => {
    return allTasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      })
      .slice(0, 5);
  }, [allTasks]);

  function handleComplete(id: string) {
    updateStatus({ id, status: 'done' });
  }

  return (
    <View style={styles.container}>
      {/* 1. Insights carousel */}
      {insights.length > 0 && (
        <FlatList
          data={insights}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item }: { item: CoachingInsight }) => (
            <InsightCardV2 insight={item} />
          )}
        />
      )}

      {/* 2. Score du Foyer */}
      <View style={styles.section}>
        <ScoreCardV2 />
      </View>

      {/* 3. Upcoming Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Taches a venir</Text>
          <Text style={styles.seeAll} onPress={() => router.push('/(app)/tasks')}>
            Voir tout
          </Text>
        </View>

        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune tache a venir</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {upcomingTasks.map((task) => (
              <TaskCardV2 key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#2D3748',
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
    paddingBottom: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    color: '#718096',
  },
  taskList: {
    gap: 16,
  },
});
