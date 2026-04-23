import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const categoryIcons: Record<string, { icon: string; bg: string; color: string }> = {
  cuisine: { icon: 'restaurant-outline', bg: `${Colors.miel}1A`, color: Colors.miel },
  menage: { icon: 'sparkles-outline', bg: `${Colors.rose}1A`, color: Colors.rose },
  courses: { icon: 'cart-outline', bg: `${Colors.terracotta}1A`, color: Colors.terracotta },
  linge: { icon: 'shirt-outline', bg: `${Colors.prune}1A`, color: Colors.prune },
  enfants: { icon: 'people-outline', bg: `${Colors.sauge}1A`, color: Colors.sauge },
  default: { icon: 'checkbox-outline', bg: `${Colors.terracotta}1A`, color: Colors.terracotta },
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'Sans date';
  const d = dayjs(dateStr);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcoming = allTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf())
    .slice(0, 5);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Taches a venir
        </Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={8}>
          <Text variant="bodySmall" weight="bold" style={styles.seeAll}>
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      {upcoming.length > 0 ? (
        <View style={styles.taskList}>
          {upcoming.map((task) => {
            const cat = categoryIcons[task.category] ?? categoryIcons.default;
            const assigneeName = task.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne';
            return (
              <View key={task.id} style={styles.taskRow}>
                <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={cat.color}
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text
                    variant="bodySmall"
                    weight="semibold"
                    numberOfLines={1}
                    style={styles.taskTitle}
                  >
                    {task.title}
                  </Text>
                  <Text variant="caption" color="muted">
                    {formatDueDate(task.due_date)} • {assigneeName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateStatus({ id: task.id, status: 'done' })}
                  hitSlop={8}
                  accessibilityLabel={`Marquer ${task.title} comme terminee`}
                >
                  <View style={styles.checkbox} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text variant="body" color="muted" style={styles.emptyText}>
            Aucune tache a venir
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
  },
  seeAll: {
    color: Colors.terracotta,
  },
  taskList: {
    gap: Spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginLeft: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});
