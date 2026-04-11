import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskCardV2 } from './TaskCardV2';
import { TaskSummaryPills } from './TaskSummaryPills';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

interface TaskGroup {
  label: string;
  tasks: Array<import('../../types').Task>;
}

function groupTasks(tasks: Array<import('../../types').Task>): TaskGroup[] {
  const today: TaskGroup = { label: "Aujourd'hui", tasks: [] };
  const tomorrow: TaskGroup = { label: 'Demain', tasks: [] };
  const thisWeek: TaskGroup = { label: 'Cette semaine', tasks: [] };

  for (const task of tasks) {
    if (!task.due_date) {
      thisWeek.tasks.push(task);
      continue;
    }
    const d = dayjs(task.due_date);
    if (d.isToday()) today.tasks.push(task);
    else if (d.isTomorrow()) tomorrow.tasks.push(task);
    else thisWeek.tasks.push(task);
  }

  return [today, tomorrow, thisWeek].filter((g) => g.tasks.length > 0);
}

export function TasksTab() {
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const pendingTasks = useMemo(
    () => allTasks.filter((t) => t.status !== 'done').sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }),
    [allTasks],
  );

  const overdueCount = useMemo(
    () => pendingTasks.filter((t) => t.due_date && dayjs(t.due_date).isBefore(dayjs(), 'day')).length,
    [pendingTasks],
  );

  const completedCount = useMemo(
    () => allTasks.filter((t) => t.status === 'done').length,
    [allTasks],
  );

  const groups = useMemo(() => groupTasks(pendingTasks), [pendingTasks]);

  function handleComplete(id: string) {
    updateStatus({ id, status: 'done' });
  }

  return (
    <View style={{ gap: 24 }}>
      {/* Summary pills */}
      <TaskSummaryPills
        todoCount={pendingTasks.length}
        overdueCount={overdueCount}
        completedCount={completedCount}
      />

      {/* Task list or empty state */}
      {pendingTasks.length === 0 ? (
        <View className="px-6 items-center py-16">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
            <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#00E5FF" />
          </View>
          <Text className="text-base mb-2" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
            Aucune tache a venir
          </Text>
          <Text className="text-sm text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
            Ajoutez une tache avec le bouton +
          </Text>
        </View>
      ) : (
        <View className="px-6" style={{ gap: 24 }}>
          {groups.map((group) => (
            <View key={group.label} style={{ gap: 12 }}>
              {/* Group header */}
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Text
                  className="uppercase tracking-widest"
                  style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#718096' }}
                >
                  {group.label}
                </Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* Task cards */}
              <View style={{ gap: 12 }}>
                {group.tasks.map((task) => (
                  <TaskCardV2 key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
