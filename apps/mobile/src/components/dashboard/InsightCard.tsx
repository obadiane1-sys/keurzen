import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CoachingInsight } from '@keurzen/shared';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';

const typeStyles = {
  alert: {
    bg: `${Colors.rose}1A`,
    borderColor: `${Colors.rose}33`,
    iconColor: Colors.rose,
    ctaColor: Colors.rose,
  },
  conseil: {
    bg: Colors.backgroundCard,
    borderColor: Colors.border,
    iconColor: Colors.miel,
    ctaColor: Colors.terracotta,
  },
  wellbeing: {
    bg: Colors.backgroundCard,
    borderColor: Colors.border,
    iconColor: Colors.rose,
    ctaColor: Colors.terracotta,
  },
} as const;

interface InsightCardProps {
  insight: CoachingInsight;
  onPress?: () => void;
}

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const style = typeStyles[insight.type];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: style.bg, borderColor: style.borderColor },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={insight.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={style.iconColor}
        />
        <Text variant="caption" weight="bold" style={[styles.label, { color: style.iconColor }]}>
          {insight.label.toUpperCase()}
        </Text>
      </View>

      <Text variant="bodySmall" weight="semibold" style={styles.message}>
        {insight.message}
      </Text>

      {onPress && (
        <TouchableOpacity onPress={onPress} style={styles.ctaRow} hitSlop={8}>
          <Text variant="caption" weight="bold" style={{ color: style.ctaColor }}>
            {insight.cta_label}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={style.ctaColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1.2,
  },
  message: {
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
