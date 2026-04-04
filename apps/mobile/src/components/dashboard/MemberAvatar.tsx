import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { DCOLORS } from './constants';

interface MemberAvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function MemberAvatar({ name, color, size = 42 }: MemberAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        variant="body"
        weight="bold"
        style={{ color: 'white', fontSize: size * 0.42 }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: DCOLORS.surface,
  },
});
