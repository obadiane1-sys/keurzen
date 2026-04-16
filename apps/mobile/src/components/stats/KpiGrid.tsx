import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import type { StatsKpi } from '@keurzen/queries';

interface Props {
  kpis: StatsKpi[];
}

export function KpiGrid({ kpis }: Props) {
  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => (
        <View key={kpi.key} style={styles.cell}>
          <Text style={styles.label}>{kpi.label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{kpi.value}</Text>
            {kpi.unit && <Text style={styles.unit}>{kpi.unit}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  cell: {
    width: '50%',
    marginBottom: Spacing['2xl'],
    paddingRight: Spacing.base,
  },
  label: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.sm,
  },
  value: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: Typography.fontSize['4xl'],
    color: Colors.textPrimary,
  },
  unit: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
});
