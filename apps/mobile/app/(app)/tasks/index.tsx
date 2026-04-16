import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  SectionList,
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
import { TaskCard, CompletedTaskCard } from '../../../src/components/tasks/TaskCard';
import { MemberFilters } from '../../../src/components/tasks/MemberFilters';
import { TaskCompletionToast } from '../../../src/components/tasks/TaskCompletionToast';
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { useTasks, useUpdateTaskStatus, useDeleteTask } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { AnimatedScreen } from '../../../src/components/ui/AnimatedScreen';
import { TasksSkeleton } from '../../../src/components/ui/Skeleton';
import type { Task, TaskStatus, TaskType } from '../../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [taskTypeTab, setTaskTypeTab] = useState<TaskType>('household');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [completedTaskName, setCompletedTaskName] = useState<string | null>(null);
  const [ratingTask, setRatingTask] = useState<{ id: string; title: string } | null>(null);

  // ─── Member list for filters ──────────────────────────────────────────────

  const memberList = useMemo(
    () =>
      members.map((m) => ({
        userId: m.user_id,
        name: m.profile?.full_name?.split(' ')[0] ?? '',
        color: m.color ?? Colors.primary,
      })),
    [members],
  );

  // ─── Member color lookup ──────────────────────────────────────────────────

  const memberColorMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.user_id, m.color ?? Colors.primary])),
    [members],
  );

  // ─── Filter & split ───────────────────────────────────────────────────────

  const { todoTasks, doneTasks } = useMemo(() => {
    const now = dayjs();
    let filtered = tasks.filter((t) => (t.task_type ?? 'household') === taskTypeTab);

    if (selectedMemberId) {
      filtered = filtered.filter((t) => t.assigned_to === selectedMemberId);
    }

    const todo: Task[] = [];
    const done: Task[] = [];

    for (const t of filtered) {
      if (t.status === 'done') {
        done.push(t);
      } else {
        todo.push(t);
      }
    }

    // Sort todo: overdue first, then by due_date
    todo.sort((a, b) => {
      const aOverdue = a.due_date && dayjs(a.due_date).isBefore(now, 'day');
      const bOverdue = b.due_date && dayjs(b.due_date).isBefore(now, 'day');
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });

    // Sort done: most recent first
    done.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return { todoTasks: todo, doneTasks: done.slice(0, 5) };
  }, [tasks, taskTypeTab, selectedMemberId]);

  // ─── Sections for SectionList ─────────────────────────────────────────────

  const sections = useMemo(() => {
    const result: { key: string; title: string; count: number; isDone: boolean; data: Task[] }[] = [];
    if (todoTasks.length > 0 || doneTasks.length === 0) {
      result.push({ key: 'todo', title: 'À faire', count: todoTasks.length, isDone: false, data: todoTasks });
    }
    if (doneTasks.length > 0) {
      result.push({ key: 'done', title: 'Terminées', count: doneTasks.length, isDone: true, data: doneTasks });
    }
    return result;
  }, [todoTasks, doneTasks]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

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
        <TasksSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Tâches</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs Maison / Perso */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setTaskTypeTab('household')}
          style={[styles.tab, taskTypeTab === 'household' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabLabel,
              taskTypeTab === 'household' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Maison
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTaskTypeTab('personal')}
          style={[styles.tab, taskTypeTab === 'personal' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabLabel,
              taskTypeTab === 'personal' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Perso
          </Text>
        </TouchableOpacity>
      </View>

      {/* Member filters */}
      <View style={styles.filtersContainer}>
        <MemberFilters
          members={memberList}
          selectedMemberId={selectedMemberId}
          onMemberChange={setSelectedMemberId}
        />
      </View>

      {/* Task sections */}
      <AnimatedScreen>
      {todoTasks.length === 0 && doneTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          expression="normal"
          action={{ label: 'Ajouter une tâche', onPress: handleCreate }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, section.isDone && styles.sectionHeaderDone]}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={[styles.sectionBadge, section.isDone && styles.sectionBadgeDone]}>
                  <Text style={[styles.sectionBadgeText, section.isDone && styles.sectionBadgeTextDone]}>
                    {section.count}
                  </Text>
                </View>
              </View>
              {section.isDone && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              )}
            </View>
          )}
          renderItem={({ item, section }) =>
            section.isDone ? (
              <CompletedTaskCard
                task={item}
                memberColor={memberColorMap[item.assigned_to ?? '']}
              />
            ) : (
              <TaskCard
                task={item}
                onPress={() => handleTaskPress(item)}
                onToggleStatus={() => handleToggleStatus(item)}
                onDelete={() => handleDelete(item)}
                memberColor={memberColorMap[item.assigned_to ?? '']}
              />
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
      </AnimatedScreen>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreate}
        style={styles.fab}
        activeOpacity={0.85}
        accessibilityLabel="Créer une tâche"
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

  // ─── Header ─────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    height: 56,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },

  // ─── Tabs ───────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm + 2,
  },
  tabActive: {
    backgroundColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabLabel: {
    fontSize: Typography.fontSize.base,
  },
  tabLabelActive: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  tabLabelInactive: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },

  // ─── Filters ────────────────────────
  filtersContainer: {
    paddingHorizontal: Spacing.xl,
  },

  // ─── Sections ───────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  sectionHeaderDone: {
    opacity: 0.6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionBadgeDone: {
    backgroundColor: Colors.gray200,
  },
  sectionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  sectionBadgeTextDone: {
    color: Colors.textMuted,
  },

  // ─── List ──────────────────────────
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  separator: {
    height: Spacing.md,
  },

  // ─── FAB ──────────────────────────
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: BorderRadius.fab,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
