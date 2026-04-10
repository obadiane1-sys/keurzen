import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useCurrentTlx, useTlxDelta } from '../../lib/queries/tlx';

const TLX_DIMENSIONS = [
  { key: 'mental_demand', label: 'Exigence mentale' },
  { key: 'physical_demand', label: 'Exigence physique' },
  { key: 'temporal_demand', label: 'Pression temporelle' },
  { key: 'effort', label: 'Effort' },
  { key: 'frustration', label: 'Frustration' },
  { key: 'performance', label: 'Performance' },
] as const;

function getBarColor(value: number): string {
  if (value < 40) return Colors.sauge;
  if (value <= 70) return Colors.miel;
  return Colors.rose;
}

export function TlxDetailSection() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  if (!currentTlx) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Charge mentale (TLX)
        </Text>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color="muted" style={styles.emptyText}>
            Remplissez le TLX pour voir votre charge mentale
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(app)/dashboard/tlx')}
            activeOpacity={0.7}
          >
            <Text variant="label" weight="bold" style={styles.ctaText}>
              REMPLIR LE TLX
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const score = currentTlx.score;
  const scoreColor = getBarColor(score);

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Charge mentale (TLX)
      </Text>

      <View style={styles.scoreRow}>
        <Text variant="h2" weight="extrabold" style={[styles.scoreValue, { color: scoreColor }]}>
          {score}
        </Text>
        <Text variant="bodySmall" color="muted">/100</Text>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <View style={styles.deltaRow}>
            <Ionicons
              name={tlxDelta.delta > 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={tlxDelta.delta > 0 ? Colors.rose : Colors.sauge}
            />
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: tlxDelta.delta > 0 ? Colors.rose : Colors.sauge }}
            >
              {Math.abs(tlxDelta.delta)} pts
            </Text>
          </View>
        )}
      </View>

      <View style={styles.dimensions}>
        {TLX_DIMENSIONS.map(({ key, label }) => {
          const value = currentTlx[key];
          const barColor = getBarColor(value);
          return (
            <View key={key} style={styles.dimensionRow}>
              <Text variant="caption" color="secondary" style={styles.dimLabel}>
                {label}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${value}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text variant="caption" weight="semibold" style={styles.dimValue}>
                {value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  scoreValue: {
    fontSize: Typography.fontSize['3xl'],
    lineHeight: Typography.fontSize['3xl'] * 1.2,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
  },
  dimensions: {
    gap: Spacing.md,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dimLabel: {
    width: 110,
    fontSize: Typography.fontSize.xs,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  dimValue: {
    width: 28,
    textAlign: 'right',
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.base,
  },
  emptyText: {
    textAlign: 'center',
  },
  ctaButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.button,
  },
  ctaText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    letterSpacing: 1,
  },
});
