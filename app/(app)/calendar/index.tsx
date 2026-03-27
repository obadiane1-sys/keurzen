import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTasks } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Card } from '../../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import type { Task, TaskStatus } from '../../../src/types';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/fr';

dayjs.extend(isoWeek);
dayjs.locale('fr');

type CalendarView = 'week' | 'month';

// ─── Week Header ──────────────────────────────────────────────────────────────

function WeekStrip({
  weekStart,
  selectedDate,
  onSelect,
  tasks,
}: {
  weekStart: dayjs.Dayjs;
  selectedDate: string;
  onSelect: (date: string) => void;
  tasks: Task[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  return (
    <View style={styles.weekStrip}>
      {days.map((day) => {
        const dateStr = day.format('YYYY-MM-DD');
        const isSelected = dateStr === selectedDate;
        const isToday = day.isSame(dayjs(), 'day');
        const hasTasks = tasks.some((t) => t.due_date === dateStr);

        return (
          <TouchableOpacity
            key={dateStr}
            onPress={() => onSelect(dateStr)}
            style={[
              styles.dayItem,
              isSelected && { backgroundColor: Colors.coral },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: isSelected ? Colors.textInverse : isToday ? Colors.coral : Colors.textMuted,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {day.format('ddd')[0]}
            </Text>
            <Text
              variant="label"
              style={{
                color: isSelected ? Colors.textInverse : isToday ? Colors.coral : Colors.textPrimary,
                fontWeight: isToday || isSelected ? '700' : '400',
              }}
            >
              {day.format('D')}
            </Text>
            {hasTasks && (
              <View
                style={[
                  styles.taskDot,
                  { backgroundColor: isSelected ? Colors.textInverse : Colors.coral },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Task Item in calendar ────────────────────────────────────────────────────

function CalendarTaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const { members } = useHouseholdStore();
  const memberColor = members.find((m) => m.user_id === task.assigned_to)?.color;
  const isOverdue =
    task.status !== 'done' &&
    task.due_date &&
    dayjs(task.due_date).isBefore(dayjs(), 'day');
  const effectiveStatus: TaskStatus = isOverdue ? 'overdue' : (task.status as TaskStatus);

  return (
    <TouchableOpacity
      style={styles.calTaskItem}
      onPress={() => router.push(`/(app)/tasks/${task.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.calTaskAccent, { backgroundColor: memberColor ?? Colors.mint }]} />
      <View style={styles.calTaskContent}>
        <Text variant="label" numberOfLines={1}>{task.title}</Text>
        <View style={styles.calTaskMeta}>
          {task.estimated_minutes && (
            <Text variant="caption" color="muted">{task.estimated_minutes} min</Text>
          )}
          <Badge label="" status={effectiveStatus} size="sm" dot />
        </View>
      </View>
      {task.assigned_profile && (
        <Avatar
          name={task.assigned_profile.full_name}
          color={memberColor}
          size="xs"
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthGrid({
  month,
  selectedDate,
  onSelect,
  tasks,
}: {
  month: dayjs.Dayjs;
  selectedDate: string;
  onSelect: (date: string) => void;
  tasks: Task[];
}) {
  const monthStart = month.startOf('month');
  const startOffset = monthStart.day(); // 0 = Sunday
  const daysInMonth = month.daysInMonth();

  // Build grid cells
  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      monthStart.add(i, 'day').format('YYYY-MM-DD')
    ),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const tasksByDate: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.due_date) {
      tasksByDate[t.due_date] = (tasksByDate[t.due_date] ?? 0) + 1;
    }
  });

  return (
    <View>
      {/* Day headers */}
      <View style={styles.monthDayHeaders}>
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <Text key={i} variant="caption" color="muted" style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.monthGrid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.monthCell} />;
          const isSelected = date === selectedDate;
          const isToday = date === dayjs().format('YYYY-MM-DD');
          const count = tasksByDate[date] ?? 0;

          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.monthCell,
                isSelected && { backgroundColor: Colors.coral, borderRadius: BorderRadius.full },
              ]}
              onPress={() => onSelect(date)}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: isSelected ? Colors.textInverse : isToday ? Colors.coral : Colors.textPrimary,
                  fontWeight: isToday || isSelected ? '700' : '400',
                  textAlign: 'center',
                }}
              >
                {dayjs(date).format('D')}
              </Text>
              {count > 0 && (
                <View style={[styles.monthDot, { backgroundColor: isSelected ? Colors.textInverse : Colors.coral }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { data: tasks = [], isLoading } = useTasks();
  const [view, setView] = useState<CalendarView>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const tasksForDate = useMemo(
    () => tasks.filter((t) => t.due_date === selectedDate),
    [tasks, selectedDate]
  );

  const prevPeriod = () => {
    if (view === 'week') setCurrentWeekStart((w) => w.subtract(1, 'week'));
    else setCurrentMonth((m) => m.subtract(1, 'month'));
  };

  const nextPeriod = () => {
    if (view === 'week') setCurrentWeekStart((w) => w.add(1, 'week'));
    else setCurrentMonth((m) => m.add(1, 'month'));
  };

  const periodLabel =
    view === 'week'
      ? `${currentWeekStart.format('D MMM')} – ${currentWeekStart.add(6, 'day').format('D MMM YYYY')}`
      : currentMonth.format('MMMM YYYY');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3">Calendrier</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, view === 'week' && styles.viewBtnActive]}
            onPress={() => setView('week')}
          >
            <Text variant="caption" style={{ color: view === 'week' ? Colors.coral : Colors.textMuted, fontWeight: '600' }}>
              Semaine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, view === 'month' && styles.viewBtnActive]}
            onPress={() => setView('month')}
          >
            <Text variant="caption" style={{ color: view === 'month' ? Colors.coral : Colors.textMuted, fontWeight: '600' }}>
              Mois
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Period navigation */}
      <View style={styles.periodNav}>
        <TouchableOpacity onPress={prevPeriod} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setSelectedDate(dayjs().format('YYYY-MM-DD'));
          setCurrentWeekStart(dayjs().startOf('isoWeek'));
          setCurrentMonth(dayjs().startOf('month'));
        }}>
          <Text variant="label" style={{ textAlign: 'center' }}>{periodLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextPeriod} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar view */}
        <Card style={{ margin: Spacing.base, marginBottom: 0 }}>
          {view === 'week' ? (
            <WeekStrip
              weekStart={currentWeekStart}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              tasks={tasks}
            />
          ) : (
            <MonthGrid
              month={currentMonth}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              tasks={tasks}
            />
          )}
        </Card>

        {/* Selected date tasks */}
        <View style={styles.dayTasks}>
          <Text variant="h4" style={styles.dayLabel}>
            {dayjs(selectedDate).isSame(dayjs(), 'day')
              ? "Aujourd'hui"
              : dayjs(selectedDate).format('dddd D MMMM')}
          </Text>

          {tasksForDate.length === 0 ? (
            <EmptyState
              variant="calendar"
              style={{ paddingVertical: Spacing['2xl'] }}
            />
          ) : (
            tasksForDate.map((task) => (
              <CalendarTaskItem key={task.id} task={task} />
            ))
          )}
        </View>
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 3,
    gap: 2,
  },
  viewBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnActive: {
    backgroundColor: Colors.backgroundCard,
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  navBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 2,
    minHeight: 64,
    justifyContent: 'center',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  monthDayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dayTasks: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  dayLabel: {
    textTransform: 'capitalize',
  },
  calTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    gap: Spacing.sm,
    ...{
      shadowColor: Colors.navy,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
  },
  calTaskAccent: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 52,
  },
  calTaskContent: {
    flex: 1,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  calTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
