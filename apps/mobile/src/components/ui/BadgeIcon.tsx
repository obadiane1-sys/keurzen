import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
  noShadow?: boolean;
  noBorder?: boolean;
}

export function BadgeIcon({
  name,
  size = 'lg',
  bgColor = '#FFFFFF',
  borderColor = '#E2E8F0',
  iconColor = '#2D3748',
  noShadow = false,
  noBorder = false,
}: BadgeIconProps) {
  const { container, icon } = SIZE_MAP[size];
  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          backgroundColor: bgColor,
          borderColor: noBorder ? 'transparent' : borderColor,
          borderWidth: noBorder ? 0 : 1,
        },
        noShadow && { shadowOpacity: 0, elevation: 0 },
      ]}
    >
      <MaterialCommunityIcons name={name} size={icon} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
});
