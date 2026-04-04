import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors, Spacing, BorderRadius, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { TaskCard } from '../../../src/components/tasks/TaskCard';
import { TaskFilters } from '../../../src/components/tasks/TaskFilters';
import { TaskCompletionToast } from '../../../src/components/tasks/TaskCompletionToast';
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { useTasks, useUpdateTaskStatus } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Task, TaskStatus } from '../../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();
  const updateStatus = useUpdateTaskStatus();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [completedTaskName, setCompletedTaskName] = useState<string | null>(null);
  const [ratingTask, setRatingTask] = useState<{ id: string; title: string } | null>(null);

  // ─── Filter & sort ─────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Compute overdue for filtering
    const now = dayjs();
    if (statusFilter === 'overdue') {
      result = result.filter(
        (t) => t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(now, 'day')
      );
    } else if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort: overdue first, then by due_date, then by created_at
    result.sort((a, b) => {
      const aOverdue = a.status !== 'done' && a.due_date && dayjs(a.due_date).isBefore(now, 'day');
      const bOverdue = b.status !== 'done' && b.due_date && dayjs(b.due_date).isBefore(now, 'day');
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Done tasks at the bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;

      // By due_date ascending (nulls last)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      // By created_at descending
      return b.created_at.localeCompare(a.created_at);
    });

    return result;
  }, [tasks, statusFilter]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleStatus = useCallback(
    (task: Task) => {
      if (task.status !== 'done' && (task.task_type ?? 'household') === 'household') {
        // Household task → open rating sheet instead of direct toggle
        setRatingTask({ id: task.id, title: task.title });
        return;
      }
      // Personal task or unchecking → direct toggle
      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      updateStatus.mutate({ id: task.id, status: newStatus });
      if (newStatus === 'done') {
        setCompletedTaskName(task.title);
      }
    },
    [updateStatus]
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/(app)/tasks/${task.id}`);
    },
    [router]
  );

  const handleCreate = useCallback(() => {
    router.push('/(app)/tasks/create');
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="household"
          title="Rejoignez un foyer"
          subtitle="Vous devez faire partie d'un foyer pour gerer les taches."
          action={{ label: 'Configurer mon foyer', onPress: () => router.push('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement des tâches..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Tâches</Text>
        <Text variant="bodySmall" color="secondary">
          {tasks.filter((t) => t.status !== 'done').length} en cours
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TaskFilters
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </View>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          expression="normal"
          action={{ label: 'Ajouter une tache', onPress: handleCreate }}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onToggleStatus={() => handleToggleStatus(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.terracotta}
              colors={[Colors.terracotta]}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreate}
        style={styles.fab}
        activeOpacity={0.85}
        accessibilityLabel="Creer une tache"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>

      {/* Completion rating sheet */}
      <CompletionRatingSheet
        visible={!!ratingTask}
        taskId={ratingTask?.id ?? ''}
        taskTitle={ratingTask?.title ?? ''}
        onComplete={() => {
          setCompletedTaskName(ratingTask?.title ?? '');
          setRatingTask(null);
        }}
      />

      {/* Completion celebration */}
      <TaskCompletionToast
        taskName={completedTaskName ?? ''}
        visible={!!completedTaskName}
        onDismiss={() => setCompletedTaskName(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    gap: 2,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.xl,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
    paddingTop: Spacing.sm,
  },
  separator: {
    height: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
