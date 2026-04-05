import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Shadows, Typography } from '../../constants/tokens';

interface StatusPillProps {
  label: string;
  dot?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'alert';
}

export function StatusPill({ label, dot, icon, variant = 'default' }: StatusPillProps) {
  const isAlert = variant === 'alert';

  return (
    <View
      style={[
        styles.pill,
        isAlert && styles.alertPill,
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: dot }]} />
      )}
      {icon}
      <Text
        variant="caption"
        style={[
          styles.text,
          isAlert && { color: Colors.rose },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...Shadows.sm,
  },
  alertPill: {
    backgroundColor: Colors.rose + '12',
    borderWidth: 1,
    borderColor: Colors.rose + '30',
    shadowColor: 'transparent',
    elevation: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
});
