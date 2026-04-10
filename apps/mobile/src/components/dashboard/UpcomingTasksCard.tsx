import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import type { Task } from '../../types';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  cuisine: { icon: 'restaurant-outline', color: Colors.miel },
  menage: { icon: 'sparkles-outline', color: Colors.rose },
  courses: { icon: 'cart-outline', color: Colors.terracotta },
  linge: { icon: 'shirt-outline', color: Colors.prune },
  enfants: { icon: 'people-outline', color: Colors.sauge },
};

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  icon: 'checkbox-outline',
  color: Colors.terracotta,
};

function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category.toLowerCase()] ?? DEFAULT_CATEGORY_CONFIG;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = dayjs(dueDate);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

// ─── Task row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
}

function TaskRow({ task, onComplete }: TaskRowProps) {
  const catConfig = getCategoryConfig(task.category);
  const assigneeName = task.assigned_profile?.full_name ?? null;
  const dateLabel = formatDueDate(task.due_date);

  return (
    <View style={styles.taskRow}>
      {/* Category icon circle */}
      <View
        style={[
          styles.categoryIcon,
          { backgroundColor: `${catConfig.color}1A` },
        ]}
      >
        <Ionicons name={catConfig.icon} size={18} color={catConfig.color} />
      </View>

      {/* Task info */}
      <View style={styles.taskInfo}>
        <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskTitle}>
          {task.title}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {[dateLabel, assigneeName].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => onComplete(task.id)}
        style={styles.checkbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.checkboxCircle} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function UpcomingTasksCard() {
  const router = useRouter();
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

  if (upcomingTasks.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color="muted" style={styles.emptyText}>
            Aucune tache a venir
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3" weight="bold">
          Taches a venir
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/tasks')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="bodySmall" weight="bold" style={styles.seeAll}>
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task list */}
      <View style={styles.taskList}>
        {upcomingTasks.map((task, index) => (
          <View key={task.id}>
            <TaskRow task={task} onComplete={handleComplete} />
            {index < upcomingTasks.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    color: Colors.terracotta,
  },
  taskList: {
    gap: 0,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
