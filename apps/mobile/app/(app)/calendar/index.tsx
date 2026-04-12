import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { Colors, Spacing, BorderRadius, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { useTasks } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Task } from '../../../src/types';

dayjs.extend(isoWeek);

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Recurrence expansion (virtual, client-side) ───────────────────────────

const RECURRENCE_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * Expands recurring tasks into virtual occurrences for a given date range.
 * Returns an array of tasks (original + virtual copies) that fall within the range.
 * Virtual copies share the same `id` as the original but with an adjusted `due_date`.
 */
function expandRecurringTasks(
  tasks: Task[],
  rangeStart: string,
  rangeEnd: string,
): Task[] {
  const result: Task[] = [];
  const start = dayjs(rangeStart);
  const end = dayjs(rangeEnd);

  for (const task of tasks) {
    // Non-recurring tasks: include if they have a due_date in range
    if (!task.recurrence || task.recurrence === 'none') {
      if (task.due_date) {
        const d = dayjs(task.due_date);
        if ((d.isSame(start, 'day') || d.isAfter(start, 'day')) &&
            (d.isSame(end, 'day') || d.isBefore(end, 'day'))) {
          result.push(task);
        }
      }
      continue;
    }

    // Recurring tasks: expand from due_date forward
    if (!task.due_date) continue;
    const taskStart = dayjs(task.due_date);
    if (taskStart.isAfter(end, 'day')) continue;

    const interval = task.recurrence === 'monthly' ? null : RECURRENCE_DAYS[task.recurrence];

    let current = taskStart;
    // Fast-forward to the range start
    if (interval) {
      const diff = start.diff(taskStart, 'day');
      if (diff > 0) {
        const skip = Math.floor(diff / interval);
        current = taskStart.add(skip * interval, 'day');
      }
    } else {
      // Monthly: fast-forward by months
      if (current.isBefore(start, 'day')) {
        const monthsDiff = start.diff(current, 'month');
        current = taskStart.add(monthsDiff, 'month');
        if (current.isBefore(start, 'day')) current = current.add(1, 'month');
      }
    }

    // Generate occurrences within range (max 31 to avoid infinite loops)
    let count = 0;
    while ((current.isSame(end, 'day') || current.isBefore(end, 'day')) && count < 31) {
      if (current.isSame(start, 'day') || current.isAfter(start, 'day')) {
        const dateStr = current.format('YYYY-MM-DD');
        // Don't duplicate the original due_date entry
        if (dateStr === task.due_date) {
          result.push(task);
        } else {
          result.push({ ...task, due_date: dateStr });
        }
      }
      if (interval) {
        current = current.add(interval, 'day');
      } else {
        current = current.add(1, 'month');
      }
      count++;
    }
  }

  return result;
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const weekStart = dayjs(selectedDate).startOf('isoWeek');
  const weekEnd = weekStart.add(6, 'day');

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = weekStart.add(i, 'day');
      return {
        key: date.format('YYYY-MM-DD'),
        dayName: DAYS[i],
        dayNum: date.format('D'),
        isToday: date.isSame(dayjs(), 'day'),
        isSelected: date.format('YYYY-MM-DD') === selectedDate,
      };
    });
  }, [weekStart, selectedDate]);

  // Expand recurring tasks for the visible week
  const expandedTasks = useMemo(() => {
    return expandRecurringTasks(
      tasks.filter(t => t.status !== 'done'),
      weekStart.format('YYYY-MM-DD'),
      weekEnd.format('YYYY-MM-DD'),
    );
  }, [tasks, weekStart, weekEnd]);

  // Also include completed tasks (non-expanded) for the selected date
  const completedOnDate = useMemo(() => {
    return tasks.filter(t => t.status === 'done' && t.due_date === selectedDate);
  }, [tasks, selectedDate]);

  // Tasks for selected date
  const dayTasks = useMemo(() => {
    const active = expandedTasks.filter(t => t.due_date === selectedDate);
    return [...active, ...completedOnDate].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return 0;
    });
  }, [expandedTasks, completedOnDate, selectedDate]);

  // Tasks without a date (shown in a separate section)
  const undatedTasks = useMemo(() => {
    return tasks.filter(t => !t.due_date && t.status !== 'done');
  }, [tasks]);

  // Tasks count per day for dots (from expanded tasks)
  const tasksPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of expandedTasks) {
      if (t.due_date) {
        map[t.due_date] = (map[t.due_date] ?? 0) + 1;
      }
    }
    return map;
  }, [expandedTasks]);

  const handlePrevWeek = () => {
    setSelectedDate(weekStart.subtract(1, 'week').format('YYYY-MM-DD'));
  };

  const handleNextWeek = () => {
    setSelectedDate(weekStart.add(1, 'week').format('YYYY-MM-DD'));
  };

  const handleToday = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="household"
          title="Rejoignez un foyer"
          subtitle="Vous devez faire partie d'un foyer pour voir l'agenda."
          action={{ label: 'Configurer mon foyer', onPress: () => router.push('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Agenda</Text>
        <TouchableOpacity onPress={handleToday} style={styles.todayBtn} accessibilityLabel="Revenir a aujourd'hui" accessibilityRole="button">
          <Text variant="bodySmall" color="terracotta" weight="semibold">
            Aujourd'hui
          </Text>
        </TouchableOpacity>
      </View>

      {/* Week nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.weekNavBtn} accessibilityLabel="Semaine precedente" accessibilityRole="button">
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="label">
          {weekStart.format('DD MMM')} - {weekStart.add(6, 'day').format('DD MMM YYYY')}
        </Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.weekNavBtn} accessibilityLabel="Semaine suivante" accessibilityRole="button">
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Week days */}
      <View style={styles.daysRow}>
        {weekDays.map((day) => {
          const hasTask = (tasksPerDay[day.key] ?? 0) > 0;
          return (
            <TouchableOpacity
              key={day.key}
              onPress={() => setSelectedDate(day.key)}
              style={[
                styles.dayCell,
                day.isSelected ? styles.dayCellSelected : undefined,
                day.isToday && !day.isSelected ? styles.dayCellToday : undefined,
              ]}
              activeOpacity={0.8}
              accessibilityLabel={`${day.dayName} ${day.dayNum}${day.isToday ? ", aujourd'hui" : ''}${hasTask ? ', taches en attente' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: day.isSelected }}
            >
              <Text
                variant="caption"
                color={day.isSelected || (day.isToday && !day.isSelected) ? 'inverse' : 'muted'}
              >
                {day.dayName}
              </Text>
              <Text
                variant="label"
                weight="bold"
                style={day.isSelected || (day.isToday && !day.isSelected) ? { color: Colors.textInverse } : undefined}
              >
                {day.dayNum}
              </Text>
              {hasTask && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: day.isSelected ? Colors.textInverse : Colors.accent },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day tasks */}
      <ScrollView
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Text variant="overline" color="muted" style={styles.dayLabel}>
          {dayjs(selectedDate).format('dddd D MMMM')}
        </Text>

        {dayTasks.length === 0 ? (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text variant="body" color="muted" style={styles.emptyDayText}>
              Rien de prevu ce jour
            </Text>
          </View>
        ) : (
          dayTasks.map((task, i) => {
            const isOverdue = task.status !== 'done' && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
            return (
            <Card
              key={`${task.id}-${task.due_date}-${i}`}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}
              padding="sm"
              border
              style={styles.taskCard}
            >
              <View style={styles.taskRow}>
                <View style={[styles.taskChip, { backgroundColor: isOverdue ? Colors.accent : Colors.success }]} />
                <Ionicons
                  name={task.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={task.status === 'done' ? Colors.success : Colors.gray300}
                />
                <View style={styles.taskContent}>
                  <Text
                    variant="label"
                    numberOfLines={1}
                    style={task.status === 'done' ? styles.taskDone : undefined}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    {task.estimated_minutes ? (
                      <Text variant="caption" color="muted">
                        {task.estimated_minutes} min
                      </Text>
                    ) : null}
                    {task.recurrence && task.recurrence !== 'none' && (
                      <View style={styles.recurrenceBadge}>
                        <Ionicons name="repeat-outline" size={11} color={Colors.primary} />
                      </View>
                    )}
                  </View>
                </View>
                <Badge
                  label=""
                  priority={task.priority}
                  size="sm"
                  dot
                />
              </View>
            </Card>
            );
          })
        )}

        {/* Undated tasks */}
        {undatedTasks.length > 0 && (
          <>
            <Text variant="overline" color="muted" style={styles.undatedLabel}>
              Sans date ({undatedTasks.length})
            </Text>
            {undatedTasks.map((task) => (
              <Card
                key={task.id}
                onPress={() => router.push(`/(app)/tasks/${task.id}`)}
                padding="sm"
                border
                style={styles.taskCard}
              >
                <View style={styles.taskRow}>
                  <Ionicons name="ellipse-outline" size={20} color={Colors.gray300} />
                  <View style={styles.taskContent}>
                    <Text variant="label" numberOfLines={1}>{task.title}</Text>
                    {task.estimated_minutes ? (
                      <Text variant="caption" color="muted">{task.estimated_minutes} min</Text>
                    ) : null}
                  </View>
                  <Badge label="" priority={task.priority} size="sm" dot />
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
  },
  todayBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}18`,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  weekNavBtn: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    minWidth: TouchTarget.min,
  },
  daysRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.textPrimary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  taskList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.sm,
  },
  dayLabel: {
    marginBottom: Spacing.sm,
    textTransform: 'capitalize',
  },
  taskCard: {
    marginBottom: Spacing.xs,
    shadowOpacity: 0,
    elevation: 0,
  },
  taskChip: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  taskDone: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textMuted,
  },
  recurrenceBadge: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyDayText: {
    textAlign: 'center' as const,
  },
  undatedLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
