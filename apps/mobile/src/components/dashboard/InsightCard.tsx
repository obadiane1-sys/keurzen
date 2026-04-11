import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightCardProps {
  insight: CoachingInsight;
  onPress?: () => void;
}

const DOT_COLORS: Record<string, string> = {
  alert: ColorsV2.secondary,
  conseil: ColorsV2.primary,
  wellbeing: ColorsV2.tertiary,
};

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const dotColor = DOT_COLORS[insight.type] ?? DOT_COLORS.conseil;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.card}
    >
      {/* Dot + label */}
      <View style={styles.topRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text variant="overline" style={[styles.label, { color: ColorsV2.onSurfaceVariant }]}>
          {insight.label}
        </Text>
      </View>

      {/* Message */}
      <Text
        variant="bodySmall"
        weight="semibold"
        style={styles.message}
        numberOfLines={3}
      >
        {insight.message}
      </Text>

      {/* CTA */}
      <View style={styles.ctaRow}>
        <Text variant="bodySmall" weight="bold" style={styles.ctaText}>
          {insight.cta_label}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={ColorsV2.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: RadiusV2.md,
    backgroundColor: ColorsV2.surfaceContainer,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 2,
  },
  message: {
    color: ColorsV2.onSurface,
    marginBottom: Spacing.md,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    fontSize: Typography.fontSize.sm,
    color: ColorsV2.primary,
  },
});
