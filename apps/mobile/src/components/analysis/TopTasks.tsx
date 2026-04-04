import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, BorderRadius } from '../../constants/tokens';

interface TopTask {
  title: string;
  estimatedMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeName: string;
  assigneeColor: string;
  assigneeAvatarUrl?: string | null;
}

interface TopTasksProps {
  tasks: TopTask[];
}

const priorityColors: Record<string, string> = {
  urgent: Colors.error,
  high: Colors.rose,
  medium: '#FFD166',
  low: Colors.sauge,
};

export function TopTasks({ tasks }: TopTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="time-outline" size={20} color={Colors.terracotta} />
        </View>
        <Text variant="h4" weight="semibold" style={styles.title}>
          Tâches les plus lourdes
        </Text>
      </View>

      <View style={styles.list}>
        {tasks.map((task, i) => (
          <View
            key={i}
            style={[styles.row, i < tasks.length - 1 && styles.rowBorder]}
          >
            <View
              style={[styles.priorityDot, { backgroundColor: priorityColors[task.priority] }]}
            />
            <View style={styles.taskInfo}>
              <Text
                variant="body"
                weight="medium"
                style={{ color: Colors.textPrimary, fontSize: 16 }}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <Text variant="caption" style={{ color: Colors.textMuted, fontSize: 13 }}>
                {task.estimatedMinutes} min · {task.assigneeName}
              </Text>
            </View>
            {task.assigneeAvatarUrl ? (
              <Image
                source={{ uri: task.assigneeAvatarUrl }}
                style={[styles.avatar, { borderColor: task.assigneeColor }]}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: task.assigneeColor }]}>
                <Text variant="caption" weight="bold" style={styles.avatarText}>
                  {task.assigneeName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.terracotta + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: Colors.textInverse,
  },
});
