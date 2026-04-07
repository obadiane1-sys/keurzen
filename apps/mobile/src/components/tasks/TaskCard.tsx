import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextStyle, Alert, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { Task } from '../../types';
import dayjs from 'dayjs';

// ─── Category Color Map (inline to avoid cross-package import issues) ────────

const categoryColorMap: Record<string, string> = {
  cleaning: '#C4846C',
  cooking: '#8BA888',
  shopping: '#D4A959',
  admin: '#9B8AA8',
  children: '#D4807A',
  pets: '#8BA888',
  garden: '#8BA888',
  repairs: '#D4A959',
  health: '#D4807A',
  finances: '#9B8AA8',
  other: '#C4846C',
};

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
  onDelete?: () => void;
  onEdit?: () => void;
}

export function TaskCard({ task, onPress, onToggleStatus, onDelete, onEdit }: TaskCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    Alert.alert(
      'Supprimer la tâche',
      `Voulez-vous supprimer « ${task.title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [task.title, onDelete]);

  const handleLongPress = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });
      return (
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.85}
          style={styles.deleteAction}
        >
          <Animated.View style={[styles.deleteContent, { transform: [{ scale }] }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.deleteText}>Supprimer</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [handleDelete],
  );

  const isDone = task.status === 'done';
  const isOverdue =
    !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');

  const cat = categoryLabels[task.category] ?? categoryLabels.other;
  const tintColor = categoryColorMap[task.category] ?? categoryColorMap.other;
  const dueDateLabel = task.due_date
    ? dayjs(task.due_date).format('DD MMM')
    : null;
  const showPriorityBadge = task.priority === 'high' || task.priority === 'urgent';

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onEdit ? handleLongPress : undefined}
        delayLongPress={400}
        activeOpacity={0.85}
        style={[
          styles.card,
          { backgroundColor: tintColor + '0F' },
          isDone && styles.cardDone,
        ]}
        accessibilityLabel={task.title}
        accessibilityRole="button"
      >
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <Ionicons
            name={cat.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={Colors.textSecondary}
          />
          <Text variant="caption" color="secondary">
            {cat.label}
          </Text>
        </View>

        {/* Main row: checkbox + title */}
        <View style={styles.mainRow}>
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
              color={isDone ? Colors.sauge : Colors.gray300}
            />
          </TouchableOpacity>

          <Text
            variant="label"
            numberOfLines={1}
            style={[styles.title, isDone ? styles.titleDone as TextStyle : undefined]}
          >
            {task.title}
          </Text>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {dueDateLabel && (
            <View style={styles.metaChip}>
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
          {task.estimated_minutes != null && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text variant="caption" color="muted">
                {task.estimated_minutes} min
              </Text>
            </View>
          )}
          {showPriorityBadge && (
            <Badge
              label={priorityLabels[task.priority] ?? task.priority}
              priority={task.priority}
              size="sm"
            />
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
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardDone: {
    opacity: 0.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: Spacing.md,
    paddingLeft: 32,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.card,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    marginLeft: Spacing.sm,
  },
  deleteContent: {
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});
