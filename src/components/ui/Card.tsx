import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'md' | 'lg' | 'xl' | '2xl';
  elevated?: boolean;
  border?: boolean;
  onPress?: () => void;
}

const paddingMap = {
  none: 0,
  sm: Spacing.md,
  md: Spacing.base,
  lg: Spacing.xl,
};

export function Card({
  children,
  style,
  padding = 'md',
  radius = 'xl',
  elevated = false,
  border = false,
  onPress,
}: CardProps) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      padding: paddingMap[padding],
      borderRadius: BorderRadius[radius],
      borderWidth: border ? 1 : 0,
      borderColor: border ? Colors.border : undefined,
    },
    elevated ? Shadows.lg : Shadows.card,
    ...(Array.isArray(style) ? style : [style]),
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.backgroundCard,
  },
});
