import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing } from '../../constants/tokens';
import type { ObjectiveType } from '../../types';

const typeColors: Record<ObjectiveType, string> = {
  completion: Colors.sauge,
  balance: Colors.miel,
  tlx: Colors.prune,
  streak: Colors.terracotta,
  maintenance: Colors.sauge,
};

interface ObjectiveProgressSectionProps {
  label: string;
  type: ObjectiveType;
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  progress: number;
  achieved: boolean;
}

export function ObjectiveProgressSection({
  label,
  type,
  currentValue,
  targetValue,
  baselineValue,
  progress,
  achieved,
}: ObjectiveProgressSectionProps) {
  const color = achieved ? Colors.sauge : typeColors[type];

  const displayCurrent = Math.round(currentValue);
  const displayTarget = Math.round(targetValue);
  const displayBaseline = Math.round(baselineValue);

  // Unit suffix varies by type
  const unit = type === 'completion' || type === 'balance' ? '%' : type === 'streak' ? 'j' : '';

  return (
    <View style={styles.container}>
      <View style={styles.separator} />

      {/* Label row */}
      <View style={styles.labelRow}>
        <Ionicons
          name={achieved ? 'checkmark-circle' : 'flag'}
          size={16}
          color={color}
        />
        <Text
          variant="bodySmall"
          weight="semibold"
          style={{ color: Colors.textPrimary, flex: 1 }}
          numberOfLines={1}
        >
          {achieved ? 'Objectif atteint !' : label}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Bottom labels */}
      <View style={styles.bottomRow}>
        <Text variant="caption" color="muted">
          Sem. derniere : {displayBaseline}{unit}
        </Text>
        <Text variant="caption" weight="semibold" style={{ color }}>
          {achieved
            ? `${displayCurrent}${unit}`
            : `${displayCurrent} / ${displayTarget}${unit}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});
