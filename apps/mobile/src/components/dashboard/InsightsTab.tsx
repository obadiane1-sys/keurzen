import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
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
    <View style={{ gap: 32 }}>
      {/* 1. Insights carousel */}
      {insights.length > 0 && (
        <FlatList
          data={insights}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          renderItem={({ item }: { item: CoachingInsight }) => (
            <InsightCardV2 insight={item} />
          )}
        />
      )}

      {/* 2. Score du Foyer */}
      <View className="px-6">
        <ScoreCardV2 />
      </View>

      {/* 3. Upcoming Tasks */}
      <View className="px-6" style={{ gap: 16 }}>
        <View className="flex-row justify-between items-center">
          <Text
            className="text-lg"
            style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}
          >
            Taches a venir
          </Text>
          <Text
            className="uppercase tracking-widest"
            style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#00E5FF' }}
            onPress={() => router.push('/(app)/tasks')}
          >
            Voir tout
          </Text>
        </View>

        {upcomingTasks.length === 0 ? (
          <View className="bg-surface rounded-3xl p-8 shadow-soft border border-border items-center">
            <Text style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
              Aucune tache a venir
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {upcomingTasks.map((task) => (
              <TaskCardV2 key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
