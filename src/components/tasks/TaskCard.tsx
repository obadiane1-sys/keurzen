import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { Task } from '../../types';
import dayjs from 'dayjs';

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const categoryLabels: Record<string, { label: string; icon: string }> = {
  cleaning: { label: 'Ménage', icon: 'sparkles-outline' },
  cooking: { label: 'Cuisine', icon: 'restaurant-outline' },
  shopping: { label: 'Courses', icon: 'cart-outline' },
  admin: { label: 'Admin', icon: 'document-text-outline' },
  children: { label: 'Enfants', icon: 'people-outline' },
  pets: { label: 'Animaux', icon: 'paw-outline' },
  garden: { label: 'Jardin', icon: 'leaf-outline' },
  repairs: { label: 'Bricolage', icon: 'hammer-outline' },
  health: { label: 'Santé', icon: 'heart-outline' },
  finances: { label: 'Finances', icon: 'wallet-outline' },
  other: { label: 'Autre', icon: 'ellipsis-horizontal-outline' },
};

export const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleStatus?: () => void;
}

export function TaskCard({ task, onPress, onToggleStatus }: TaskCardProps) {
  const isDone = task.status === 'done';
  const isOverdue =
    !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
  const displayStatus = isOverdue ? 'overdue' : task.status;

  const cat = categoryLabels[task.category] ?? categoryLabels.other;
  const dueDateLabel = task.due_date
    ? dayjs(task.due_date).format('DD MMM')
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, isDone && styles.cardDone]}
      accessibilityLabel={task.title}
      accessibilityRole="button"
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggleStatus}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.checkbox}
        accessibilityLabel={isDone ? 'Marquer comme a faire' : 'Marquer comme termine'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
      >
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isDone ? Colors.mint : Colors.gray300}
        />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            variant="label"
            numberOfLines={1}
            style={[styles.title, isDone ? styles.titleDone as TextStyle : undefined]}
          >
            {task.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Badge label="" status={displayStatus} size="sm" dot />
          <Badge label={priorityLabels[task.priority] ?? task.priority} priority={task.priority} size="sm" />
          <View style={styles.categoryChip}>
            <Ionicons
              name={cat.icon as keyof typeof Ionicons.glyphMap}
              size={12}
              color={Colors.textSecondary}
            />
            <Text variant="caption" color="secondary">
              {cat.label}
            </Text>
          </View>
        </View>

        {/* Bottom row: due date + assignee */}
        <View style={styles.bottomRow}>
          {dueDateLabel && (
            <View style={styles.dueDateChip}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? Colors.error : Colors.textMuted}
              />
              <Text
                variant="caption"
                color={isOverdue ? 'error' : 'muted'}
              >
                {dueDateLabel}
              </Text>
            </View>
          )}
          {task.estimated_minutes && (
            <View style={styles.dueDateChip}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text variant="caption" color="muted">
                {task.estimated_minutes} min
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {task.assigned_profile && (
            <Avatar
              name={task.assigned_profile.full_name}
              avatarUrl={task.assigned_profile.avatar_url}
              size="xs"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardDone: {
    opacity: 0.6,
  },
  checkbox: {
    paddingTop: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  content: {
    flex: 1,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dueDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
