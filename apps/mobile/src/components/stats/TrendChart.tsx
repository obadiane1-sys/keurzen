import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import type { StatsTrendPoint } from '@keurzen/queries';
import { Colors, Typography, Spacing } from '../../constants/tokens';

interface Props {
  points: StatsTrendPoint[];
  title?: string;
}

const CHART_HEIGHT = 120;
const LABEL_HEIGHT = 24;
const BAR_RADIUS = 4;
const FONT_SIZE = 10;
const HORIZONTAL_PADDING = 48;

export function TrendChart({ points, title = 'Tendance' }: Props) {
  if (points.length === 0) return null;

  const containerWidth = Dimensions.get('window').width - Spacing.xl * 2;
  const svgWidth = containerWidth;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT;

  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const barAreaWidth = svgWidth - HORIZONTAL_PADDING;
  const barCount = points.length;
  const barSlotWidth = barAreaWidth / barCount;
  const barWidth = barSlotWidth * 0.6;
  const barGap = (barSlotWidth - barWidth) / 2;
  const chartLeft = HORIZONTAL_PADDING / 2;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={svgWidth} height={svgHeight}>
        {points.map((point, i) => {
          const barH = Math.max(4, (point.value / maxValue) * CHART_HEIGHT);
          const x = chartLeft + i * barSlotWidth + barGap;
          const y = CHART_HEIGHT - barH;
          const labelX = x + barWidth / 2;
          const labelY = svgHeight - FONT_SIZE / 4;

          return (
            <React.Fragment key={point.label}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill={Colors.primary}
              />
              <SvgText
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize={FONT_SIZE}
                fill={Colors.textMuted}
                fontFamily={Typography.fontFamily.medium}
              >
                {point.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: Spacing.base,
  },
});
