import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';
import { CATEGORY_ICONS, BLOB_COLORS } from './constants';
import type { Task } from '../../types';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import 'dayjs/locale/fr';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale('fr');

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const date = dayjs(dueDate);
  if (date.isToday()) return "Aujourd'hui";
  if (date.isTomorrow()) return 'Demain';
  return date.format('D MMM');
}

interface UpcomingTasksListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
}

export function UpcomingTasksList({ tasks, onToggleStatus }: UpcomingTasksListProps) {
  const router = useRouter();

  const upcoming = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tâches à venir</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tasks')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {upcoming.map((task, index) => {
          const iconName = CATEGORY_ICONS[task.category] ?? 'dots-horizontal';
          const blobColor = BLOB_COLORS[index % BLOB_COLORS.length];
          const assigneeName = (task as any).assigned_profile?.full_name?.split(' ')[0] ?? '';
          const dateLabel = formatDueDate(task.due_date);

          return (
            <View
              key={task.id}
              style={[
                styles.taskRow,
                index < upcoming.length - 1 && styles.taskRowBorder,
              ]}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.blobIcon, { backgroundColor: blobColor + '30' }]}>
                  <MaterialCommunityIcons
                    name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={blobColor}
                  />
                </View>
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {dateLabel}{assigneeName ? ` · ${assigneeName}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onToggleStatus(task.id)}
                activeOpacity={0.7}
                accessibilityLabel={`Marquer ${task.title} comme terminée`}
              >
                <View style={styles.checkboxInner} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  seeAll: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(150, 123, 182, 0.2)',
  },
  list: {
    borderRadius: 32,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  blobIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  taskMeta: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(150, 123, 182, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(150, 123, 182, 0.2)',
  },
});
