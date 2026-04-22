import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useTodayTasks } from '../../lib/queries/tasks';

const priorityColors: Record<string, string> = {
  high: Colors.rose,
  urgent: Colors.rose,
  medium: Colors.miel,
  low: Colors.sauge,
};

export function TodayTasksCard() {
  const router = useRouter();
  const todayTasks = useTodayTasks();

  return (
    <DashboardCard accentColor={Colors.sauge}>
      <View style={styles.header}>
        <Text variant="overline" style={styles.overline}>{"AUJOURD'HUI"}</Text>
        {todayTasks.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="caption" weight="bold" style={styles.link}>Tout voir ›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.numberRow}>
        <Text variant="display" weight="extrabold" style={styles.bigNumber}>
          {todayTasks.length}
        </Text>
        <Text variant="body" color="secondary" style={styles.unit}>
          {todayTasks.length <= 1 ? 'tache restante' : 'taches restantes'}
        </Text>
      </View>

      {todayTasks.length > 0 ? (
        <View style={styles.taskList}>
          {todayTasks.slice(0, 3).map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <View style={[styles.prioDot, { backgroundColor: priorityColors[t.priority] || Colors.miel }]} />
              <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskName}>
                {t.title}
              </Text>
              <Text variant="caption" color="muted">
                {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assign\u00e9'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="body" color="muted" style={styles.emptyText}>
          {"Aucune tache aujourd'hui"}
        </Text>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: {
    color: Colors.sauge,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
  },
  link: {
    color: Colors.terracotta,
    fontSize: Typography.fontSize.xs,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  bigNumber: {
    fontSize: 40,
    lineHeight: 46,
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.fontSize.base,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskName: {
    flex: 1,
    color: Colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
