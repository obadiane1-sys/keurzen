# Tasks Page Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the tasks page into a premium "Cafe Cosy" experience with category-tinted immersive cards, a contextual hero header, and enriched filter pills — on both mobile and web.

**Architecture:** Add a shared `categoryColorMap` utility in `packages/shared`. Refactor mobile `TaskCard`, `TaskFilters`, and tasks screen. Refactor web `TaskRow` and tasks page. No backend changes. No new dependencies.

**Tech Stack:** React Native (Expo SDK 55), React (Next.js), TypeScript strict, tokens from `src/constants/tokens.ts` and CSS variables.

**Spec:** `docs/superpowers/specs/2026-04-07-tasks-page-premium-redesign.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/shared/src/utils/taskCategoryColors.ts` | Category → color mapping (shared) |
| Modify | `packages/shared/src/utils/index.ts` | Re-export new utility |
| Modify | `apps/mobile/src/components/tasks/TaskFilters.tsx` | Pills with icons + counters |
| Modify | `apps/mobile/src/components/tasks/TaskCard.tsx` | Tinted background, category header, restructured meta row |
| Modify | `apps/mobile/app/(app)/tasks/index.tsx` | Hero header, fixed layout, "all" = non-done |
| Modify | `apps/web/src/components/tasks/TaskRow.tsx` | Tinted background per category |
| Modify | `apps/web/src/app/(app)/tasks/page.tsx` | Hero header, tab counters, "all" = non-done |

---

## Task 1: Create shared category color map

**Files:**
- Create: `packages/shared/src/utils/taskCategoryColors.ts`
- Modify: `packages/shared/src/utils/index.ts`

- [ ] **Step 1: Create the category color map utility**

```typescript
// packages/shared/src/utils/taskCategoryColors.ts
import type { TaskCategory } from '../types';

/**
 * Maps each task category to a brand color hex.
 * Used by both mobile (RN) and web (CSS) to tint TaskCard backgrounds.
 * The consuming platform applies the color at ~6% opacity.
 */
export const categoryColorMap: Record<TaskCategory, string> = {
  cleaning: '#C4846C',   // terracotta
  cooking: '#8BA888',    // sauge
  shopping: '#D4A959',   // miel
  admin: '#9B8AA8',      // prune
  children: '#D4807A',   // rose
  pets: '#8BA888',       // sauge
  garden: '#8BA888',     // sauge
  repairs: '#D4A959',    // miel
  health: '#D4807A',     // rose
  finances: '#9B8AA8',   // prune
  other: '#C4846C',      // terracotta
};
```

- [ ] **Step 2: Re-export from utils index**

Add to `packages/shared/src/utils/index.ts`:

```typescript
export { categoryColorMap } from './taskCategoryColors';
```

- [ ] **Step 3: Verify build**

Run: `cd packages/shared && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/utils/taskCategoryColors.ts packages/shared/src/utils/index.ts
git commit -m "feat(shared): add task category color map for premium card tinting"
```

---

## Task 2: Redesign mobile TaskFilters with icons and counters

**Files:**
- Modify: `apps/mobile/src/components/tasks/TaskFilters.tsx`

The current `TaskFilters` receives `selectedStatus` and `onStatusChange`. We need to add a `counts` prop so the parent can pass pre-computed counts.

- [ ] **Step 1: Update TaskFilters component**

Replace the entire content of `apps/mobile/src/components/tasks/TaskFilters.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { TaskStatus } from '../../types';

interface FilterCounts {
  all: number;
  todo: number;
  done: number;
  overdue: number;
}

const statusOptions: {
  value: TaskStatus | 'all';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'all', label: 'Toutes', icon: 'list-outline' },
  { value: 'todo', label: 'À faire', icon: 'ellipse-outline' },
  { value: 'done', label: 'Faites', icon: 'checkmark-circle-outline' },
  { value: 'overdue', label: 'Retard', icon: 'alert-circle-outline' },
];

interface TaskFiltersProps {
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  counts: FilterCounts;
}

export function TaskFilters({ selectedStatus, onStatusChange, counts }: TaskFiltersProps) {
  return (
    <View style={styles.container}>
      {statusOptions.map((opt) => {
        const active = selectedStatus === opt.value;
        const count = counts[opt.value as keyof FilterCounts] ?? 0;
        const isOverdueInactive = opt.value === 'overdue' && !active && count > 0;

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onStatusChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={active ? Colors.textInverse : Colors.textSecondary}
            />
            <Text
              variant="caption"
              weight="semibold"
              style={[
                styles.chipLabel,
                active && styles.chipLabelActive,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              variant="caption"
              style={[
                styles.chipCount,
                active && styles.chipCountActive,
                isOverdueInactive && styles.chipCountOverdue,
              ]}
            >
              {count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
  chipLabelActive: {
    color: Colors.textInverse,
  },
  chipCount: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
  },
  chipCountActive: {
    color: Colors.textInverse,
  },
  chipCountOverdue: {
    color: Colors.rose,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors about missing `counts` prop in `tasks/index.tsx` (expected — we fix this in Task 4).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/tasks/TaskFilters.tsx
git commit -m "feat(mobile): redesign TaskFilters with icons and counters"
```

---

## Task 3: Redesign mobile TaskCard with tinted background

**Files:**
- Modify: `apps/mobile/src/components/tasks/TaskCard.tsx`

- [ ] **Step 1: Update TaskCard component**

Replace the entire content of `apps/mobile/src/components/tasks/TaskCard.tsx`:

```typescript
import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextStyle, Alert, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { categoryColorMap } from '@keurzen/shared';
import type { Task } from '../../types';
import dayjs from 'dayjs';

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const categoryLabels: Record<string, { label: string; icon: string }> = {
  cleaning: { label: 'Ménage', icon: 'sparkles-outline' },
  cooking: { label: 'Cuisine', icon: 'restaurant-outline' },
  shopping: { label: 'Courses', icon: 'cart-outline' },
  admin: { label: 'Admin', icon: 'document-text-outline' },
  children: { label: 'Enfants', icon: 'people-outline' },
  pets: { label: 'Animaux', icon: 'paw-outline' },
  garden: { label: 'Jardin', icon: 'leaf-outline' },
  repairs: { label: 'Bricolage', icon: 'hammer-outline' },
  health: { label: 'Santé', icon: 'heart-outline' },
  finances: { label: 'Finances', icon: 'wallet-outline' },
  other: { label: 'Autre', icon: 'ellipsis-horizontal-outline' },
};

export const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function TaskCard({ task, onPress, onToggleStatus, onDelete, onEdit }: TaskCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    Alert.alert(
      'Supprimer la tâche',
      `Voulez-vous supprimer « ${task.title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [task.title, onDelete]);

  const handleLongPress = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });
      return (
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.85}
          style={styles.deleteAction}
        >
          <Animated.View style={[styles.deleteContent, { transform: [{ scale }] }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.deleteText}>Supprimer</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [handleDelete],
  );

  const isDone = task.status === 'done';
  const isOverdue =
    !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');

  const cat = categoryLabels[task.category] ?? categoryLabels.other;
  const tintColor = categoryColorMap[task.category] ?? categoryColorMap.other;
  const dueDateLabel = task.due_date
    ? dayjs(task.due_date).format('DD MMM')
    : null;
  const showPriorityBadge = task.priority === 'high' || task.priority === 'urgent';

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onEdit ? handleLongPress : undefined}
        delayLongPress={400}
        activeOpacity={0.85}
        style={[
          styles.card,
          { backgroundColor: tintColor + '0F' }, // ~6% opacity
          isDone && styles.cardDone,
        ]}
        accessibilityLabel={task.title}
        accessibilityRole="button"
      >
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <Ionicons
            name={cat.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={Colors.textSecondary}
          />
          <Text variant="caption" color="secondary">
            {cat.label}
          </Text>
        </View>

        {/* Main row: checkbox + title */}
        <View style={styles.mainRow}>
          <TouchableOpacity
            onPress={onToggleStatus}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.checkbox}
            accessibilityLabel={isDone ? 'Marquer comme a faire' : 'Marquer comme termine'}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
          >
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isDone ? Colors.sauge : Colors.gray300}
            />
          </TouchableOpacity>

          <Text
            variant="label"
            numberOfLines={1}
            style={[styles.title, isDone ? styles.titleDone as TextStyle : undefined]}
          >
            {task.title}
          </Text>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {dueDateLabel && (
            <View style={styles.metaChip}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? Colors.error : Colors.textMuted}
              />
              <Text
                variant="caption"
                color={isOverdue ? 'error' : 'muted'}
              >
                {dueDateLabel}
              </Text>
            </View>
          )}
          {task.estimated_minutes != null && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text variant="caption" color="muted">
                {task.estimated_minutes} min
              </Text>
            </View>
          )}
          {showPriorityBadge && (
            <Badge
              label={priorityLabels[task.priority] ?? task.priority}
              priority={task.priority}
              size="sm"
            />
          )}
          <View style={{ flex: 1 }} />
          {task.assigned_profile && (
            <Avatar
              name={task.assigned_profile.full_name}
              avatarUrl={task.assigned_profile.avatar_url}
              size="xs"
            />
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardDone: {
    opacity: 0.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingLeft: 32, // align with title (24px icon + 8px gap)
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.card,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    marginLeft: Spacing.sm,
  },
  deleteContent: {
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -20`
Expected: May show errors about `@keurzen/shared` import — verify the package alias exists.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/tasks/TaskCard.tsx
git commit -m "feat(mobile): redesign TaskCard with category tint and immersive layout"
```

---

## Task 4: Redesign mobile tasks screen with hero header and fixed layout

**Files:**
- Modify: `apps/mobile/app/(app)/tasks/index.tsx`

- [ ] **Step 1: Update tasks screen**

Replace the entire content of `apps/mobile/app/(app)/tasks/index.tsx`:

```typescript
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
        todoCount++; // overdue tasks are also "non-done"
      } else {
        todoCount++;
      }
    }

    return {
      all: todoCount, // "Toutes" = all non-done
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
        <Text
          style={styles.heroGreeting}
        >
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only unrelated pre-existing ones).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/tasks/index.tsx
git commit -m "feat(mobile): add hero header, fixed layout, and filter counts to tasks screen"
```

---

## Task 5: Add category tint to web TaskRow

**Files:**
- Modify: `apps/web/src/components/tasks/TaskRow.tsx`

- [ ] **Step 1: Update TaskRow with category tint**

Replace the entire content of `apps/web/src/components/tasks/TaskRow.tsx`:

```typescript
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useUpdateTaskStatus } from '@keurzen/queries';
import { categoryColorMap } from '@keurzen/shared';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  cleaning: { label: 'Ménage', icon: '✨' },
  cooking: { label: 'Cuisine', icon: '🍳' },
  shopping: { label: 'Courses', icon: '🛒' },
  admin: { label: 'Admin', icon: '📄' },
  children: { label: 'Enfants', icon: '👨‍👩‍👧' },
  pets: { label: 'Animaux', icon: '🐾' },
  garden: { label: 'Jardin', icon: '🌿' },
  repairs: { label: 'Bricolage', icon: '🔨' },
  health: { label: 'Santé', icon: '❤️' },
  finances: { label: 'Finances', icon: '💰' },
  other: { label: 'Autre', icon: '…' },
};

export function TaskRow({ task, isSelected, onClick, onEdit, onDelete }: TaskRowProps) {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const isDone = task.status === 'done';
  const tintColor = categoryColorMap[task.category] ?? categoryColorMap.other;
  const cat = categoryLabels[task.category] ?? categoryLabels.other;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus({
      id: task.id,
      status: isDone ? 'todo' : 'done',
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={cn(
        'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
        isSelected && 'ring-1 ring-terracotta/20',
      )}
      style={{ backgroundColor: `${tintColor}0F` }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isDone
            ? 'border-sauge bg-sauge text-white'
            : 'border-border hover:border-terracotta',
        )}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor:
            priorityColors[task.priority] || priorityColors.medium,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isDone && 'line-through text-text-muted',
            )}
          >
            {task.title}
          </p>
          <span className="text-[11px] text-text-muted shrink-0">
            {cat.icon} {cat.label}
          </span>
        </div>
        {task.due_date && (
          <p className="text-xs text-text-muted">
            {dayjs(task.due_date).format('DD MMM')}
          </p>
        )}
      </div>

      {/* Assignee */}
      {task.assigned_profile && (
        <Avatar
          name={task.assigned_profile.full_name || undefined}
          src={task.assigned_profile.avatar_url}
          size={24}
        />
      )}

      {/* Hover actions */}
      {(onEdit || onDelete) && (
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-terracotta/10 hover:text-terracotta transition-colors"
              aria-label="Modifier la tache"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-rose/10 hover:text-rose transition-colors"
              aria-label="Supprimer la tache"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tasks/TaskRow.tsx
git commit -m "feat(web): add category tint background to TaskRow"
```

---

## Task 6: Redesign web tasks page with hero header and tab counters

**Files:**
- Modify: `apps/web/src/app/(app)/tasks/page.tsx`

- [ ] **Step 1: Update web tasks page**

Replace the entire content of `apps/web/src/app/(app)/tasks/page.tsx`:

```typescript
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { useTasks, useDeleteTask } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { cn } from '@/lib/utils';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

type Tab = 'all' | 'today' | 'overdue' | 'done';

export default function TasksPage() {
  const { profile } = useAuthStore();
  const { data: tasks = [], isLoading } = useTasks();
  const { mutate: deleteTask } = useDeleteTask();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // ─── Counts ──────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    let allCount = 0;
    let todayCount = 0;
    let overdueCount = 0;
    let doneCount = 0;

    for (const t of tasks) {
      if (t.status === 'done') {
        doneCount++;
        continue;
      }
      allCount++;
      if (t.due_date === today) todayCount++;
      if (t.due_date && dayjs(t.due_date).isBefore(now, 'day')) overdueCount++;
    }

    return { all: allCount, today: todayCount, overdue: overdueCount, done: doneCount };
  }, [tasks, today, now]);

  // ─── Hero message ────────────────────────────────────────────────────────

  const heroMessage = useMemo(() => {
    if (counts.all === 0 && counts.done > 0) return 'Tout est fait, beau travail !';
    const parts: string[] = [];
    if (counts.overdue > 0) parts.push(`${counts.overdue} en retard`);
    if (counts.today > 0) parts.push(`${counts.today} pour aujourd'hui`);
    if (parts.length === 0) return `${counts.all} tâche${counts.all > 1 ? 's' : ''} en cours`;
    return parts.join(' · ');
  }, [counts]);

  // ─── Tabs definition ────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: counts.all },
    { key: 'today', label: "Aujourd'hui", count: counts.today },
    { key: 'overdue', label: 'En retard', count: counts.overdue },
    { key: 'done', label: 'Faites', count: counts.done },
  ];

  const filteredTasks = useMemo(() => {
    let result = tasks;

    switch (activeTab) {
      case 'today':
        result = result.filter(
          (t) => t.due_date === today && t.status !== 'done',
        );
        break;
      case 'overdue':
        result = result.filter(
          (t) =>
            t.status !== 'done' &&
            t.due_date &&
            dayjs(t.due_date).isBefore(now, 'day'),
        );
        break;
      case 'done':
        result = result.filter((t) => t.status === 'done');
        break;
      default: // 'all' — non-done only
        result = result.filter((t) => t.status !== 'done');
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assigned_profile?.full_name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, activeTab, search, today, now]);

  const handleDelete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
      deleteTask(id);
      if (selectedTaskId === id) setSelectedTaskId(null);
    },
    [tasks, deleteTask, selectedTaskId],
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Hero Header */}
      <div className="flex items-center justify-between px-1 pt-2 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Bonjour {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {heroMessage}
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Creer
        </Button>
      </div>

      {/* Tabs with counters */}
      <div className="mb-4 flex items-center gap-1 border-b border-border-light">
        {TABS.map(({ key, label, count }) => {
          const isOverdueTab = key === 'overdue' && activeTab !== key && count > 0;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setSelectedTaskId(null);
              }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {label}
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  activeTab === key ? 'text-terracotta' : isOverdueTab ? 'text-rose' : 'text-text-muted',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-background-card pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-terracotta focus:outline-none"
        />
      </div>

      {/* Split View */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Aucune tache"
          subtitle={
            activeTab === 'done'
              ? 'Rien de termine pour le moment'
              : 'Creez votre premiere tache'
          }
          action={
            activeTab !== 'done'
              ? { label: 'Creer une tache', onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      ) : (
        <div className="flex gap-4">
          <div
            className={cn(
              'flex-1 min-w-0',
              selectedTask && 'hidden lg:block lg:max-w-[50%]',
            )}
          >
            <TaskList
              tasks={filteredTasks}
              selectedId={selectedTaskId}
              onSelect={setSelectedTaskId}
              onDelete={handleDelete}
            />
          </div>

          {selectedTask && (
            <div className="hidden lg:block lg:flex-1 lg:min-w-0">
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile: Detail Modal (< lg) */}
      {selectedTask && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] bg-background-card p-6 shadow-lg">
            <TaskDetail
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(app)/tasks/page.tsx
git commit -m "feat(web): add hero header, tab counters, and non-done default filter to tasks page"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run lint on both platforms**

```bash
cd /Users/ouss/Keurzen && npm run lint 2>&1 | tail -20
```

Expected: No new errors.

- [ ] **Step 2: Run tests if any exist for tasks**

```bash
cd /Users/ouss/Keurzen && npm run test -- --passWithNoTests 2>&1 | tail -20
```

Expected: All pass or no relevant tests.

- [ ] **Step 3: Visual check list**

Verify manually:
- **Mobile:** Hero header shows first name + contextual message, filters show icons + counters, task cards have tinted backgrounds per category, "Toutes" hides done tasks, FAB has stronger shadow
- **Web:** Hero header with greeting + create button, tabs show counters, overdue count in rose, TaskRows have tinted backgrounds, "Toutes" hides done tasks

- [ ] **Step 4: Final commit if lint fixes needed**

```bash
git add -A && git commit -m "fix: lint fixes for tasks page redesign"
```
