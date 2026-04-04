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
  todo: { bg: Colors.miel + '30', text: Colors.blueStrong, label: 'À faire' },
  in_progress: { bg: Colors.prune + '30', text: Colors.prune, label: 'En cours' },
  done: { bg: Colors.sauge + '30', text: Colors.greenStrong, label: 'Terminé' },
  overdue: { bg: Colors.rose + '30', text: Colors.redStrong, label: 'En retard' },
};

const priorityConfig: Record<TaskPriority, { bg: string; text: string }> = {
  low: { bg: Colors.gray100, text: Colors.gray500 },
  medium: { bg: Colors.miel + '25', text: Colors.blueStrong },
  high: { bg: Colors.terracotta + '25', text: Colors.orangeStrong },
  urgent: { bg: Colors.redBgLight, text: Colors.redStrong },
};

const alertConfig: Record<AlertLevel, { bg: string; text: string; label: string }> = {
  balanced: { bg: Colors.sauge + '30', text: Colors.greenStrong, label: 'Équilibré' },
  watch: { bg: Colors.miel + '30', text: Colors.blueDeep, label: 'À surveiller' },
  unbalanced: { bg: Colors.rose + '30', text: Colors.redStrong, label: 'Déséquilibré' },
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
