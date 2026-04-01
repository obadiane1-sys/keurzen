import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

export type TaskViewMode = 'list' | 'member';

interface TaskViewToggleProps {
  mode: TaskViewMode;
  onModeChange: (mode: TaskViewMode) => void;
}

const OPTIONS: { value: TaskViewMode; label: string }[] = [
  { value: 'list', label: 'Liste' },
  { value: 'member', label: 'Par membre' },
];

export function TaskViewToggle({ mode, onModeChange }: TaskViewToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onModeChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              variant="bodySmall"
              weight="semibold"
              style={active ? styles.textActive : styles.textInactive}
            >
              {opt.label}
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
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  segmentActive: {
    backgroundColor: Colors.backgroundCard,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textActive: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  textInactive: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
});
