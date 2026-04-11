import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type BadgeIconSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<BadgeIconSize, { container: number; icon: number }> = {
  sm: { container: 24, icon: 14 },
  md: { container: 32, icon: 18 },
  lg: { container: 40, icon: 22 },
  xl: { container: 48, icon: 26 },
};

interface BadgeIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: BadgeIconSize;
  bgClassName?: string;
  iconColor?: string;
}

export function BadgeIcon({
  name,
  size = 'lg',
  bgClassName = 'bg-white border-border',
  iconColor = '#2D3748',
}: BadgeIconProps) {
  const { container, icon } = SIZE_MAP[size];
  return (
    <View
      className={`items-center justify-center rounded-2xl border shadow-badge ${bgClassName}`}
      style={{ width: container, height: container }}
    >
      <MaterialCommunityIcons name={name} size={icon} color={iconColor} />
    </View>
  );
}
