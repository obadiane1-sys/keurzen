import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Colors } from '../../constants/tokens';

interface CircularGaugeProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  label: string;
  subtitle?: string;
}

export function CircularGauge({
  value,
  max,
  color,
  size = 80,
  label,
  subtitle,
}: CircularGaugeProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clampedValue / max : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.gray100}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[styles.centerLabel, { width: size, height: size }]}>
          <Text
            variant="h3"
            weight="extrabold"
            style={{ color, fontSize: size * 0.275, lineHeight: size * 0.3 }}
          >
            {max === 100 ? value : `${Math.round(progress * 100)}%`}
          </Text>
          {subtitle && (
            <Text variant="caption" color="muted" style={{ fontSize: size * 0.11 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Text
        variant="bodySmall"
        weight="semibold"
        color="secondary"
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
  },
});
