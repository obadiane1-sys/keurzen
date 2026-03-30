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

import { Colors, Spacing, BorderRadius, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { useTasks } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Task, TaskStatus } from '../../../src/types';

dayjs.extend(isoWeek);

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const weekStart = dayjs(selectedDate).startOf('isoWeek');

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

  // Tasks for selected date
  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.due_date === selectedDate)
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return 0;
      });
  }, [tasks, selectedDate]);

  // Tasks count per day for dots
  const tasksPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.due_date && t.status !== 'done') {
        map[t.due_date] = (map[t.due_date] ?? 0) + 1;
      }
    }
    return map;
  }, [tasks]);

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
          <Text variant="bodySmall" color="mint" weight="semibold">
            Aujourd'hui
          </Text>
        </TouchableOpacity>
      </View>

      {/* Week nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={handlePrevWeek} hitSlop={8} accessibilityLabel="Semaine precedente" accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="label">
          {weekStart.format('DD MMM')} - {weekStart.add(6, 'day').format('DD MMM YYYY')}
        </Text>
        <TouchableOpacity onPress={handleNextWeek} hitSlop={8} accessibilityLabel="Semaine suivante" accessibilityRole="button">
          <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
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
                color={day.isSelected ? 'inverse' : 'muted'}
              >
                {day.dayName}
              </Text>
              <Text
                variant="label"
                weight="bold"
                style={day.isSelected ? { color: Colors.textInverse } : undefined}
              >
                {day.dayNum}
              </Text>
              {hasTask && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: day.isSelected ? Colors.textInverse : Colors.coral },
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
            tintColor={Colors.mint}
            colors={[Colors.mint]}
          />
        }
      >
        <Text variant="overline" color="muted" style={styles.dayLabel}>
          {dayjs(selectedDate).format('dddd D MMMM')}
        </Text>

        {dayTasks.length === 0 ? (
          <EmptyState
            variant="calendar"
            expression="normal"
            title="Aucun historique pour l'instant"
            subtitle="Les taches completees apparaitront ici."
          />
        ) : (
          dayTasks.map((task) => (
            <Card
              key={task.id}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}
              padding="sm"
              style={styles.taskCard}
            >
              <View style={styles.taskRow}>
                <Ionicons
                  name={task.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={task.status === 'done' ? Colors.mint : Colors.gray300}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="label"
                    numberOfLines={1}
                    style={task.status === 'done' ? { textDecorationLine: 'line-through', color: Colors.textMuted } : undefined}
                  >
                    {task.title}
                  </Text>
                  {task.estimated_minutes && (
                    <Text variant="caption" color="muted">
                      {task.estimated_minutes} min
                    </Text>
                  )}
                </View>
                <Badge
                  label=""
                  priority={task.priority}
                  size="sm"
                  dot
                />
              </View>
            </Card>
          ))
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.mint + '18',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
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
    backgroundColor: Colors.navy,
  },
  dayCellToday: {
    backgroundColor: Colors.mint + '18',
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
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
