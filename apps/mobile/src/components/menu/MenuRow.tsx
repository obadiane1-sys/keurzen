import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, BorderRadius, Spacing } from '../../constants/tokens';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  danger?: boolean;
  showDivider?: boolean;
}

export function MenuRow({ icon, label, onPress, color, danger, showDivider }: MenuRowProps) {
  const [hovered, setHovered] = useState(false);
  const webHoverProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  const accentColor = danger ? Colors.error : (color ?? Colors.terracotta);

  return (
    <>
      <TouchableOpacity
        style={[styles.row, hovered && styles.rowHover]}
        onPress={onPress}
        activeOpacity={0.7}
        {...webHoverProps}
      >
        <View style={[styles.iconBox, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text
          variant="body"
          style={[styles.label, danger && { color: Colors.error }]}
        >
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    minHeight: 52,
  },
  rowHover: {
    backgroundColor: Colors.gray50,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base + 40 + Spacing.md,
  },
});
