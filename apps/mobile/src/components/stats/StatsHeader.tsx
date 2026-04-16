import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/tokens';
import type { StatsScope, StatsPeriod } from '@keurzen/queries';

interface Props {
  scope: StatsScope;
  period: StatsPeriod;
  onScopeChange: (s: StatsScope) => void;
  onPeriodChange: (p: StatsPeriod) => void;
}

const SCOPE_OPTIONS: Array<{ value: StatsScope; label: string }> = [
  { value: 'me', label: 'Moi' },
  { value: 'household', label: 'Foyer' },
];

const PERIOD_OPTIONS: Array<{ value: StatsPeriod; label: string }> = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
];

export function StatsHeader({ scope, period, onScopeChange, onPeriodChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.scopeRow}>
        {SCOPE_OPTIONS.map((opt) => {
          const active = scope === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onScopeChange(opt.value)}
              style={[styles.scopePill, active && styles.scopePillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
            >
              <Text
                style={[
                  styles.scopeLabel,
                  { color: active ? Colors.textPrimary : Colors.textMuted },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((opt) => {
          const active = period === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onPeriodChange(opt.value)}
              style={[styles.periodTab, active && styles.periodTabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
            >
              <Text
                style={[
                  styles.periodLabel,
                  {
                    color: active ? Colors.textPrimary : Colors.textMuted,
                    fontFamily: active
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.semibold,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
  },
  scopeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  scopePill: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopePillActive: {
    backgroundColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scopeLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm + 2,
  },
  periodTabActive: {
    backgroundColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  periodLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
