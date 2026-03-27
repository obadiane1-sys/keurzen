import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/tokens';
import { Text } from './Text';

interface LoaderProps {
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function Loader({
  label,
  size = 'large',
  color = Colors.mint,
  fullScreen = false,
  style,
}: LoaderProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={color} />
      {label && (
        <Text variant="bodySmall" color="muted" style={styles.label}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  label: {
    marginTop: Spacing.sm,
  },
});
