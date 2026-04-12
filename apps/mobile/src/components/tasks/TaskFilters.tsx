import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { TaskStatus } from '../../types';

interface FilterCounts {
  all: number;
  todo: number;
  done: number;
  overdue: number;
}

const statusOptions: {
  value: TaskStatus | 'all';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'all', label: 'Toutes', icon: 'list-outline' },
  { value: 'todo', label: 'À faire', icon: 'ellipse-outline' },
  { value: 'done', label: 'Faites', icon: 'checkmark-circle-outline' },
  { value: 'overdue', label: 'Retard', icon: 'alert-circle-outline' },
];

interface TaskFiltersProps {
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  counts: FilterCounts;
}

export function TaskFilters({ selectedStatus, onStatusChange, counts }: TaskFiltersProps) {
  return (
    <View style={styles.container}>
      {statusOptions.map((opt) => {
        const active = selectedStatus === opt.value;
        const count = counts[opt.value as keyof FilterCounts] ?? 0;
        const isOverdueInactive = opt.value === 'overdue' && !active && count > 0;

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onStatusChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={active ? Colors.textInverse : Colors.textSecondary}
            />
            <Text
              variant="caption"
              weight="semibold"
              style={[
                styles.chipLabel,
                active ? styles.chipLabelActive : undefined,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              variant="caption"
              style={[
                styles.chipCount,
                active ? styles.chipCountActive : undefined,
                isOverdueInactive ? styles.chipCountOverdue : undefined,
              ]}
            >
              {count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
  chipLabelActive: {
    color: Colors.textInverse,
  },
  chipCount: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
  },
  chipCountActive: {
    color: Colors.textInverse,
  },
  chipCountOverdue: {
    color: Colors.accent,
  },
});
