import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import type { Task } from '../../types';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const CATEGORY_CONFIG: Record<string, {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  bgColor: string;
  iconColor: string;
}> = {
  courses: { icon: 'cart', bgColor: 'rgba(0, 229, 255, 0.1)', iconColor: '#00E5FF' },
  menage: { icon: 'broom', bgColor: 'rgba(255, 182, 193, 0.1)', iconColor: '#FFB6C1' },
  cuisine: { icon: 'silverware-fork-knife', bgColor: 'rgba(255, 215, 0, 0.1)', iconColor: '#FFD700' },
  linge: { icon: 'tshirt-crew', bgColor: 'rgba(159, 122, 234, 0.1)', iconColor: '#9F7AEA' },
  enfants: { icon: 'human-child', bgColor: 'rgba(66, 153, 225, 0.1)', iconColor: '#4299E1' },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category.toLowerCase()] ?? {
    icon: 'checkbox-marked-circle-outline' as const,
    bgColor: '#F7FAFC',
    iconColor: '#718096',
  };
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = dayjs(dueDate);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

interface TaskCardV2Props {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskCardV2({ task, onComplete }: TaskCardV2Props) {
  const config = getCategoryConfig(task.category);
  const assigneeName = task.assigned_profile?.full_name ?? null;
  const dateLabel = formatDueDate(task.due_date);
  const meta = [dateLabel, assigneeName].filter(Boolean).join(' \u00B7 ');

  return (
    <View style={styles.card}>
      {/* Left: icon + info */}
      <View style={styles.leftRow}>
        <BadgeIcon
          name={config.icon}
          size="xl"
          bgColor={config.bgColor}
          iconColor={config.iconColor}
          noBorder
        />
        <View style={styles.textColumn}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          <Text style={styles.taskMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>

      {/* Right: checkbox */}
      <TouchableOpacity
        onPress={() => onComplete(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.checkbox}
      >
        <MaterialCommunityIcons name="circle-outline" size={24} color="#CBD5E0" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F7FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  textColumn: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#2D3748',
  },
  taskMeta: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  checkbox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
});
