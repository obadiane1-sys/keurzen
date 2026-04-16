import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Alert, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { categoryEmoji, formatDueDate } from '@keurzen/shared';
import type { Task } from '../../types';
import dayjs from 'dayjs';

// ─── Labels ─────────────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  memberColor?: string;
}

export function TaskCard({ task, onPress, onToggleStatus, onDelete, memberColor }: TaskCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const checkScale = useRef(new Animated.Value(1)).current;

  const handleCheckPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
    onToggleStatus?.();
  }, [checkScale, onToggleStatus]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    Alert.alert(
      'Supprimer la tâche',
      `Voulez-vous supprimer « ${task.title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' as const },
        { text: 'Supprimer', style: 'destructive' as const, onPress: onDelete },
      ],
    );
  }, [task.title, onDelete]);

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
  const isOverdue = !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
  const emoji = categoryEmoji[task.category] ?? categoryEmoji.other;
  const dateLabel = formatDueDate(task.due_date);
  const avatarColor = memberColor ?? Colors.primary;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <AnimatedPressable
        onPress={onPress}
        style={[styles.card, isDone && styles.cardDone]}
        accessibilityLabel={task.title}
        accessibilityRole="button"
      >
        {/* Avatar */}
        <Avatar
          name={task.assigned_profile?.full_name}
          avatarUrl={task.assigned_profile?.avatar_url}
          color={avatarColor}
          size="md"
        />

        {/* Content */}
        <View style={styles.content}>
          <Text
            variant="label"
            numberOfLines={1}
            style={isDone ? styles.titleDone : styles.title}
          >
            {emoji} {task.title}
          </Text>
          {dateLabel && (
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? Colors.error : Colors.textMuted}
              />
              <Text
                variant="caption"
                style={[
                  styles.dateText,
                  isOverdue ? { color: Colors.error } : undefined,
                ]}
              >
                {dateLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Checkbox */}
        {!isDone && onToggleStatus && (
          <Pressable
            onPress={handleCheckPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Marquer comme terminée"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: false }}
          >
            <Animated.View style={[styles.checkbox, { transform: [{ scale: checkScale }] }]}>
              <Ionicons name="ellipse-outline" size={24} color={Colors.gray300} />
            </Animated.View>
          </Pressable>
        )}
      </AnimatedPressable>
    </Swipeable>
  );
}

// ─── Compact card for completed tasks ───────────────────────────────────────

interface CompletedTaskCardProps {
  task: Task;
  memberColor?: string;
}

export function CompletedTaskCard({ task, memberColor }: CompletedTaskCardProps) {
  const emoji = categoryEmoji[task.category] ?? categoryEmoji.other;

  return (
    <View style={styles.completedCard}>
      <Avatar
        name={task.assigned_profile?.full_name}
        avatarUrl={task.assigned_profile?.avatar_url}
        color={memberColor ?? Colors.gray300}
        size="sm"
      />
      <View style={styles.completedContent}>
        <Text variant="caption" style={styles.completedTitle}>
          {emoji} {task.title}
        </Text>
        <Text variant="caption" style={styles.completedDate}>
          Hier ✓
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Active card ────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardDone: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  titleDone: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
  },
  checkbox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Completed card ────────────────
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  completedContent: {
    flex: 1,
    gap: 1,
  },
  completedTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  completedDate: {
    fontSize: 10,
    color: Colors.gray400,
    fontFamily: Typography.fontFamily.regular,
  },

  // ─── Swipe delete ──────────────────
  deleteAction: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
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
