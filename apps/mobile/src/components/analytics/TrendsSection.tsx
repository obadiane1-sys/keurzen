import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useAnalyticsTrends } from '@keurzen/queries';
import type { WeekTrend } from '@keurzen/queries';

const CHART_W = 280;
const CHART_H = 100;
const PAD_X = 24;
const PAD_TOP = 8;
const PAD_BOTTOM = 20;

function buildPoints(
  data: WeekTrend[],
  accessor: (d: WeekTrend) => number | null,
): string {
  const validData = data.filter((d) => accessor(d) !== null);
  if (validData.length < 2) return '';

  const n = data.length;
  const usableW = CHART_W - PAD_X * 2;
  const usableH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const values = data.map((d) => accessor(d) ?? 0);
  const max = Math.max(...values, 1);

  return data
    .map((d, i) => {
      const v = accessor(d) ?? 0;
      const x = PAD_X + (i / (n - 1)) * usableW;
      const y = PAD_TOP + usableH - (v / max) * usableH;
      return `${x},${y}`;
    })
    .join(' ');
}

interface MiniChartProps {
  title: string;
  data: WeekTrend[];
  accessor: (d: WeekTrend) => number | null;
  color: string;
  unit?: string;
}

function MiniChart({ title, data, accessor, color, unit = '' }: MiniChartProps) {
  const points = buildPoints(data, accessor);
  const n = data.length;
  const usableW = CHART_W - PAD_X * 2;

  return (
    <View style={chartStyles.chartCard}>
      <Text variant="caption" weight="semibold" style={chartStyles.chartTitle}>
        {title}
      </Text>
      <Svg width={CHART_W} height={CHART_H}>
        {[0, 0.5, 1].map((pct) => {
          const y = PAD_TOP + (CHART_H - PAD_TOP - PAD_BOTTOM) * (1 - pct);
          return (
            <Line
              key={pct}
              x1={PAD_X}
              y1={y}
              x2={CHART_W - PAD_X}
              y2={y}
              stroke={Colors.borderLight}
              strokeWidth={1}
            />
          );
        })}
        {points ? (
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {data.map((d, i) => {
          const v = accessor(d);
          if (v === null) return null;
          const values = data.map((dd) => accessor(dd) ?? 0);
          const max = Math.max(...values, 1);
          const usableH = CHART_H - PAD_TOP - PAD_BOTTOM;
          const x = PAD_X + (i / (n - 1)) * usableW;
          const y = PAD_TOP + usableH - (v / max) * usableH;
          return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
        {data.map((d, i) => {
          const x = PAD_X + (i / (n - 1)) * usableW;
          return (
            <SvgText
              key={i}
              x={x}
              y={CHART_H - 4}
              fontSize={10}
              fill={Colors.textMuted}
              textAnchor="middle"
            >
              {d.weekLabel}
            </SvgText>
          );
        })}
      </Svg>
      {data.length > 0 && accessor(data[data.length - 1]) !== null && (
        <Text variant="caption" color="muted" style={chartStyles.currentValue}>
          Cette semaine : {accessor(data[data.length - 1])}{unit}
        </Text>
      )}
    </View>
  );
}

export function TrendsSection() {
  const { data: trends = [], isLoading } = useAnalyticsTrends(4);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Evolution sur 4 semaines
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Chargement...
        </Text>
      </View>
    );
  }

  const hasEnoughData = trends.filter((t) => t.totalTasks > 0).length >= 2;

  if (!hasEnoughData) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Evolution sur 4 semaines
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Les tendances apparaitront apres 2 semaines d'utilisation
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Evolution sur 4 semaines
      </Text>
      <MiniChart
        title="Taches completees"
        data={trends}
        accessor={(d) => d.totalTasks}
        color={Colors.terracotta}
      />
      <MiniChart
        title="Charge mentale (TLX)"
        data={trends}
        accessor={(d) => d.avgTlxScore}
        color={Colors.prune}
      />
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
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});

const chartStyles = StyleSheet.create({
  chartCard: {
    marginBottom: Spacing.base,
    alignItems: 'center',
  },
  chartTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  currentValue: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
  },
});
