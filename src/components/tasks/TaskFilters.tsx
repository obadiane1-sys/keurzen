import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { TaskStatus } from '../../types';

// ─── Status filter ───────────────────────────────────────────────────────────

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminées' },
  { value: 'overdue', label: 'En retard' },
];

interface TaskFiltersProps {
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
}

export function TaskFilters({ selectedStatus, onStatusChange }: TaskFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {statusOptions.map((opt) => {
        const active = selectedStatus === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onStatusChange(opt.value)}
            style={[styles.chip, active ? styles.chipActive : undefined]}
            activeOpacity={0.8}
          >
            <Text
              variant="bodySmall"
              weight="semibold"
              style={[styles.chipText, active ? styles.chipTextActive as TextStyle : undefined]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
});
