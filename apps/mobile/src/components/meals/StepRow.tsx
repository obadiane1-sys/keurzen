import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

interface StepRowProps {
  stepNumber: number;
  text: string;
}

export function StepRow({ stepNumber, text }: StepRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{stepNumber}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: { fontSize: Typography.fontSize.xs, color: Colors.textInverse, fontWeight: '600' },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    flex: 1,
  },
});
