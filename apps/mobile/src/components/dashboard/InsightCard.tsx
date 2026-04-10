import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightCardProps {
  insight: CoachingInsight;
  onPress?: () => void;
}

interface InsightTypeStyle {
  bg: string;
  border: string;
  iconColor: string;
  ctaColor: string;
}

function getTypeStyle(type: CoachingInsight['type']): InsightTypeStyle {
  switch (type) {
    case 'alert':
      return {
        bg: `${Colors.rose}1A`,
        border: `${Colors.rose}33`,
        iconColor: Colors.rose,
        ctaColor: Colors.rose,
      };
    case 'wellbeing':
      return {
        bg: Colors.backgroundCard,
        border: Colors.border,
        iconColor: Colors.rose,
        ctaColor: Colors.terracotta,
      };
    case 'conseil':
    default:
      return {
        bg: Colors.backgroundCard,
        border: Colors.border,
        iconColor: Colors.miel,
        ctaColor: Colors.terracotta,
      };
  }
}

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const typeStyle = getTypeStyle(insight.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: typeStyle.bg,
          borderColor: typeStyle.border,
        },
      ]}
    >
      {/* Top row: icon + label */}
      <View style={styles.topRow}>
        <Ionicons
          name={insight.icon as keyof typeof Ionicons.glyphMap}
          size={16}
          color={typeStyle.iconColor}
          style={styles.topIcon}
        />
        <Text
          variant="overline"
          style={[styles.label, { color: typeStyle.iconColor }]}
        >
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
        <Text
          variant="bodySmall"
          weight="bold"
          style={[styles.ctaText, { color: typeStyle.ctaColor }]}
        >
          {insight.cta_label}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={typeStyle.ctaColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  topIcon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
  },
  message: {
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    fontSize: Typography.fontSize.sm,
  },
});
