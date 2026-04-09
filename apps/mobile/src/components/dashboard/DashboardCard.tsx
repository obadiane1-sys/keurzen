import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';

interface DashboardCardProps {
  accentColor: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}

export function DashboardCard({ accentColor, children, onPress, style }: DashboardCardProps) {
  const content = (
    <View style={[styles.card, { borderLeftColor: accentColor }, style]}>
      {children}
      {onPress && (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  chevron: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.base,
  },
});
