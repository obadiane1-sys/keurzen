import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { useStats } from '@keurzen/queries';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { AnimatedPressable } from '../ui/AnimatedPressable';

export function HubScoreCard() {
  const router = useRouter();
  const stats = useStats({ scope: 'household', period: 'day' });

  const isLoading = stats.isLoading;
  const scoreValue = stats.score?.total ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Score du jour</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeleton} />
      ) : scoreValue == null ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ajoute ta première tâche</Text>
          <Text style={styles.emptyBody}>
            Ton score d'équilibre apparaît dès que le foyer a des tâches suivies.
          </Text>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/tasks/create' as never)}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>NOUVELLE TÂCHE</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{Math.round(scoreValue)}</Text>
          <Text style={styles.valueUnit}>/100</Text>
        </View>
      )}

      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => router.push('/(app)/dashboard' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR LE TABLEAU DE BORD</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    minHeight: 240,
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
  },
  skeleton: {
    flex: 1,
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  value: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 72,
    color: Colors.textPrimary,
    lineHeight: 80,
  },
  valueUnit: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  emptyWrap: {
    marginVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cta: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textInverse,
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.primary,
  },
});
