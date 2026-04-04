import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { IconCalendar } from './Icons';
import { MemberAvatar } from './MemberAvatar';
import { DCOLORS, DFONT } from './constants';

export interface UpcomingTask {
  title: string;
  assignee: string;
  assigneeColor: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
}

interface UpcomingTasksProps {
  tasks: UpcomingTask[];
  onViewAll?: () => void;
  onPressTask?: (task: UpcomingTask) => void;
}

const priorityDot: Record<string, string> = {
  high: DCOLORS.coral,
  medium: '#FFD166',
  low: DCOLORS.mint,
};

function TaskRow({
  task,
  isLast,
  onPress,
}: {
  task: UpcomingTask;
  isLast: boolean;
  onPress?: (task: UpcomingTask) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const webHoverProps = Platform.OS === 'web'
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  return (
    <TouchableOpacity
      style={[
        styles.taskRow,
        !isLast && styles.taskRowBorder,
        hovered && styles.taskRowHover,
      ]}
      activeOpacity={0.7}
      onPress={() => onPress?.(task)}
      {...webHoverProps}
    >
      <View
        style={[
          styles.priorityDot,
          { backgroundColor: priorityDot[task.priority] },
        ]}
      />
      <View style={styles.taskContent}>
        <Text
          variant="body"
          weight="medium"
          style={{ color: DCOLORS.navy, fontSize: DFONT.body.size }}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <Text
          variant="caption"
          style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size }}
        >
          {task.assignee} · {task.due}
        </Text>
      </View>
      <MemberAvatar
        name={task.assignee}
        color={task.assigneeColor}
        size={30}
      />
    </TouchableOpacity>
  );
}

export function UpcomingTasks({ tasks, onViewAll, onPressTask }: UpcomingTasksProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <IconCalendar size={22} color={DCOLORS.blue} />
          </View>
          <Text
            variant="h4"
            weight="semibold"
            style={{ color: DCOLORS.navy, fontSize: DFONT.subtitle.size }}
          >
            À venir
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ fontSize: DFONT.caption.size, color: DCOLORS.mintDark }}
          >
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tasksList}>
        {tasks.map((task, i) => (
          <TaskRow
            key={i}
            task={task}
            isLast={i === tasks.length - 1}
            onPress={onPressTask}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DCOLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DCOLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  tasksList: {
    gap: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DCOLORS.border,
  },
  taskRowHover: {
    backgroundColor: DCOLORS.warmGray,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskContent: {
    flex: 1,
  },
});
