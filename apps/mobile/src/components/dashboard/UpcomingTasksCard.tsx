import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import type { Task } from '../../types';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

interface CategoryConfig {
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  cuisine: { icon: 'restaurant-outline' },
  menage: { icon: 'sparkles-outline' },
  courses: { icon: 'cart-outline' },
  linge: { icon: 'shirt-outline' },
  enfants: { icon: 'people-outline' },
};

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_CONFIG[category.toLowerCase()]?.icon ?? 'checkbox-outline';
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = dayjs(dueDate);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const icon = getCategoryIcon(task.category);
  const assigneeName = task.assigned_profile?.full_name ?? null;
  const dateLabel = formatDueDate(task.due_date);

  return (
    <View style={styles.taskRow}>
      <View style={styles.categoryIcon}>
        <Ionicons name={icon} size={18} color={ColorsV2.onSurfaceVariant} />
      </View>
      <View style={styles.taskInfo}>
        <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskTitle}>
          {task.title}
        </Text>
        <Text variant="caption" style={styles.taskMeta} numberOfLines={1}>
          {[dateLabel, assigneeName].filter(Boolean).join(' · ')}
        </Text>
      </View>
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

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="overline" style={styles.overline}>A venir</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/tasks')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="bodySmall" weight="bold" style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {upcomingTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text variant="bodySmall" style={styles.emptyText}>Aucune tache a venir</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {upcomingTasks.map((task, index) => (
            <React.Fragment key={task.id}>
              <TaskRow task={task} onComplete={handleComplete} />
              {index < upcomingTasks.length - 1 && <View style={styles.spacer} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
  },
  seeAll: {
    color: ColorsV2.primary,
  },
  card: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    marginLeft: 8,
    marginRight: -10,
  },
  emptyCard: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: ColorsV2.onSurfaceVariant,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: ColorsV2.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: ColorsV2.onSurface,
    fontSize: Typography.fontSize.sm,
  },
  taskMeta: {
    color: ColorsV2.onSurfaceVariant,
    marginTop: 2,
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
    borderWidth: 2,
    borderColor: ColorsV2.outlineVariant,
  },
  spacer: {
    height: 14,
  },
});
