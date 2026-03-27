import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/tokens';
import { Text } from './Text';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
  color?: string;
}

export function Divider({ label, style, color = Colors.border }: DividerProps) {
  if (label) {
    return (
      <View style={[styles.row, style]}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <Text variant="caption" color="muted" style={styles.label}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.simple, { backgroundColor: color }, style]} />
  );
}

const styles = StyleSheet.create({
  simple: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    paddingHorizontal: Spacing.xs,
  },
});
