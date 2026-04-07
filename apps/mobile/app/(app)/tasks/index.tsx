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

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { TaskCard } from '../../../src/components/tasks/TaskCard';
import { TaskFilters } from '../../../src/components/tasks/TaskFilters';
import { TaskCompletionToast } from '../../../src/components/tasks/TaskCompletionToast';
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { useTasks, useUpdateTaskStatus, useDeleteTask } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useCurrentUser } from '../../../src/hooks/useAuth';
import type { Task, TaskStatus } from '../../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const { profile } = useCurrentUser();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [completedTaskName, setCompletedTaskName] = useState<string | null>(null);
  const [ratingTask, setRatingTask] = useState<{ id: string; title: string } | null>(null);

  // ─── Counts ────────────────────────────────────────────────────────────────

  const now = dayjs();
  const today = now.format('YYYY-MM-DD');

  const counts = useMemo(() => {
    let todoCount = 0;
    let doneCount = 0;
    let overdueCount = 0;

    for (const t of tasks) {
      if (t.status === 'done') {
        doneCount++;
      } else if (t.due_date && dayjs(t.due_date).isBefore(now, 'day')) {
        overdueCount++;
        todoCount++;
      } else {
        todoCount++;
      }
    }

    return {
      all: todoCount,
      todo: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length - overdueCount,
      done: doneCount,
      overdue: overdueCount,
    };
  }, [tasks, now]);

  // ─── Hero message ──────────────────────────────────────────────────────────

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const heroMessage = useMemo(() => {
    if (counts.all === 0 && counts.done > 0) return 'Tout est fait, beau travail !';
    const parts: string[] = [];
    if (counts.overdue > 0) parts.push(`${counts.overdue} en retard`);
    const todayCount = tasks.filter(
      (t) => t.status !== 'done' && t.due_date === today,
    ).length;
    if (todayCount > 0) parts.push(`${todayCount} pour aujourd'hui`);
    if (parts.length === 0) return `${counts.all} tâche${counts.all > 1 ? 's' : ''} en cours`;
    return parts.join(' · ');
  }, [counts, tasks, today]);

  // ─── Filter & sort ─────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (statusFilter === 'overdue') {
      result = result.filter(
        (t) => t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(now, 'day'),
      );
    } else if (statusFilter === 'done') {
      result = result.filter((t) => t.status === 'done');
    } else if (statusFilter === 'todo') {
      result = result.filter(
        (t) => t.status !== 'done' && !(t.due_date && dayjs(t.due_date).isBefore(now, 'day')),
      );
    } else {
      // 'all' — show all non-done
      result = result.filter((t) => t.status !== 'done');
    }

    // Sort: overdue first, then by due_date, then by created_at
    result.sort((a, b) => {
      const aOverdue = a.status !== 'done' && a.due_date && dayjs(a.due_date).isBefore(now, 'day');
      const bOverdue = b.status !== 'done' && b.due_date && dayjs(b.due_date).isBefore(now, 'day');
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;

      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      return b.created_at.localeCompare(a.created_at);
    });

    return result;
  }, [tasks, statusFilter, now]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleStatus = useCallback(
    (task: Task) => {
      if (task.status !== 'done' && (task.task_type ?? 'household') === 'household') {
        setRatingTask({ id: task.id, title: task.title });
        return;
      }
      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      updateStatus.mutate({ id: task.id, status: newStatus });
      if (newStatus === 'done') {
        setCompletedTaskName(task.title);
      }
    },
    [updateStatus],
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/(app)/tasks/${task.id}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      deleteTask.mutate(task.id);
    },
    [deleteTask],
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
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <Text style={styles.heroGreeting}>
          Bonjour {firstName}
        </Text>
        <Text variant="body" color="secondary">
          {heroMessage}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TaskFilters
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          counts={counts}
        />
      </View>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          expression="normal"
          action={statusFilter === 'done' ? undefined : { label: 'Ajouter une tache', onPress: handleCreate }}
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
              onDelete={() => handleDelete(item)}
              onEdit={() => handleTaskPress(item)}
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
  heroHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  heroGreeting: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
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
    borderRadius: BorderRadius.fab,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
