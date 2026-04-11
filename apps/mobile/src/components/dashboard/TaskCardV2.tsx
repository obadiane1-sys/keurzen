import React from 'react';
import { View, TouchableOpacity } from 'react-native';
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
  bgClassName: string;
  iconColor: string;
}> = {
  courses: { icon: 'cart', bgClassName: 'bg-primary/10 border-0', iconColor: '#00E5FF' },
  menage: { icon: 'broom', bgClassName: 'bg-secondary/10 border-0', iconColor: '#FFB6C1' },
  cuisine: { icon: 'silverware-fork-knife', bgClassName: 'bg-tertiary/10 border-0', iconColor: '#FFD700' },
  linge: { icon: 'tshirt-crew', bgClassName: 'bg-purple/10 border-0', iconColor: '#9F7AEA' },
  enfants: { icon: 'human-child', bgClassName: 'bg-info/10 border-0', iconColor: '#4299E1' },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category.toLowerCase()] ?? {
    icon: 'checkbox-marked-circle-outline' as const,
    bgClassName: 'bg-gray-100 border-0',
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
    <View className="bg-surface p-4 rounded-3xl shadow-soft border border-border/50 flex-row items-center justify-between">
      {/* Left: icon + info */}
      <View className="flex-row items-center flex-1" style={{ gap: 16 }}>
        <BadgeIcon
          name={config.icon}
          size="xl"
          bgClassName={config.bgClassName}
          iconColor={config.iconColor}
        />
        <View className="flex-1">
          <Text
            className="text-sm"
            style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text
            className="uppercase tracking-wider mt-0.5"
            style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#718096' }}
            numberOfLines={1}
          >
            {meta}
          </Text>
        </View>
      </View>

      {/* Right: checkbox */}
      <TouchableOpacity
        onPress={() => onComplete(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-10 h-10 items-center justify-center rounded-2xl bg-gray-50 shadow-badge border border-border"
      >
        <MaterialCommunityIcons name="circle-outline" size={24} color="#CBD5E0" />
      </TouchableOpacity>
    </View>
  );
}
