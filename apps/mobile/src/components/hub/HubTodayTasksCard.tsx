import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { useTasks, useTodayTasks } from '@keurzen/queries';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/tokens';
import { AnimatedPressable } from '../ui/AnimatedPressable';

export function HubTodayTasksCard() {
  const router = useRouter();
  const tasksQ = useTasks();
  const today = useTodayTasks();

  const isLoading = !!tasksQ.isLoading;
  const visible = today.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Aujourd'hui</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonGroup}>
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>
      ) : visible.length === 0 ? (
        <Text style={styles.empty}>Journée libre ✨</Text>
      ) : (
        <View style={styles.list}>
          {visible.map((task, idx) => (
            <View key={task.id} style={styles.row}>
              <Text style={styles.index}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Voir toutes les tâches"
        onPress={() => router.push('/(app)/tasks' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR TOUTES LES TÂCHES</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
  },
  list: { gap: 14, marginTop: Spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  index: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.primary,
    width: 22,
  },
  rowTitle: {
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  empty: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
  skeletonGroup: { gap: Spacing.md, marginTop: Spacing.base },
  skeletonRow: {
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primarySurface,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.primary,
  },
});
