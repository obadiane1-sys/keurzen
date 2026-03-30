import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/tokens';
import { Text } from './Text';

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
};

const fontSizeMap = {
  xs: Typography.fontSize.xs,
  sm: Typography.fontSize.sm,
  md: Typography.fontSize.base,
  lg: Typography.fontSize.xl,
  xl: Typography.fontSize['3xl'],
};

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, avatarUrl, color, size = 'md', style }: AvatarProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const bgColor = color ?? Colors.mint;
  const initials = getInitials(name);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.base,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
          style as ImageStyle,
        ]}
        accessibilityLabel={name ? `Photo de ${name}` : 'Photo de profil'}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: bgColor + '40',
          borderColor: bgColor,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: bgColor,
          lineHeight: fontSize * 1.2,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
