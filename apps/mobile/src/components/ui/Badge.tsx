import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/tokens';
import { Text } from './Text';
import type { TaskStatus, TaskPriority, AlertLevel } from '../../types';

type BadgeVariant = 'status' | 'priority' | 'alert' | 'custom';

interface BadgeProps {
  label: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  alertLevel?: AlertLevel;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

const statusConfig: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  todo: { bg: Colors.joy + '30', text: Colors.primary, label: 'À faire' },
  in_progress: { bg: Colors.primary + '30', text: Colors.primary, label: 'En cours' },
  done: { bg: Colors.success + '30', text: Colors.success, label: 'Terminé' },
  overdue: { bg: Colors.accent + '30', text: Colors.accent, label: 'En retard' },
};

const priorityConfig: Record<TaskPriority, { bg: string; text: string }> = {
  low: { bg: Colors.gray100, text: Colors.gray500 },
  medium: { bg: Colors.joy + '25', text: Colors.primary },
  high: { bg: Colors.primary + '25', text: Colors.primary },
  urgent: { bg: 'rgba(244, 194, 194, 0.12)', text: Colors.accent },
};

const alertConfig: Record<AlertLevel, { bg: string; text: string; label: string }> = {
  balanced: { bg: Colors.success + '30', text: Colors.success, label: 'Équilibré' },
  watch: { bg: Colors.joy + '30', text: Colors.primary, label: 'À surveiller' },
  unbalanced: { bg: Colors.accent + '30', text: Colors.accent, label: 'Déséquilibré' },
};

export function Badge({
  label,
  status,
  priority,
  alertLevel,
  color,
  textColor,
  size = 'sm',
  style,
  dot = false,
}: BadgeProps) {
  let bg = color ?? Colors.gray100;
  let text = textColor ?? Colors.textSecondary;
  let displayLabel = label;

  if (status) {
    const cfg = statusConfig[status];
    bg = cfg.bg;
    text = cfg.text;
    displayLabel = label || cfg.label;
  } else if (priority) {
    const cfg = priorityConfig[priority];
    bg = cfg.bg;
    text = cfg.text;
  } else if (alertLevel) {
    const cfg = alertConfig[alertLevel];
    bg = cfg.bg;
    text = cfg.text;
    displayLabel = label || cfg.label;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[styles.dot, { backgroundColor: text }]}
        />
      )}
      <Text
        style={{
          fontSize: isSmall ? Typography.fontSize.xs : Typography.fontSize.sm,
          fontWeight: '600',
          color: text,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
