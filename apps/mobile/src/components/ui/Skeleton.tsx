import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height = 16, borderRadius = BorderRadius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: Colors.primarySurface,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={skStyles.container}>
      {/* Header */}
      <View style={skStyles.row}>
        <View style={skStyles.headerText}>
          <Skeleton width={100} height={12} />
          <Skeleton width={180} height={24} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Score card */}
      <View style={skStyles.card}>
        <View style={skStyles.row}>
          <View style={skStyles.headerText}>
            <Skeleton width={100} height={10} />
            <Skeleton width={80} height={48} style={{ marginTop: 8 }} />
            <Skeleton width={72} height={24} borderRadius={12} style={{ marginTop: 12 }} />
          </View>
          <Skeleton width={112} height={112} borderRadius={56} />
        </View>
      </View>

      {/* Equity bar */}
      <View style={skStyles.card}>
        <Skeleton width={120} height={10} />
        <Skeleton height={32} borderRadius={16} style={{ marginTop: 16 }} />
        <View style={[skStyles.row, { marginTop: 16 }]}>
          <Skeleton width={60} height={10} />
          <Skeleton width={60} height={10} />
        </View>
      </View>

      {/* Tasks */}
      <View>
        <Skeleton width={100} height={10} style={{ marginBottom: 12 }} />
        <View style={skStyles.taskList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={skStyles.taskRow}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={skStyles.headerText}>
                <Skeleton width="75%" height={12} />
                <Skeleton width="40%" height={10} style={{ marginTop: 6 }} />
              </View>
              <Skeleton width={32} height={32} borderRadius={16} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function TasksSkeleton() {
  return (
    <View style={skStyles.tasksContainer}>
      <View style={skStyles.row}>
        <Skeleton width={80} height={20} />
        <Skeleton width={72} height={32} borderRadius={BorderRadius.md} />
      </View>
      <View style={[skStyles.row, { marginTop: 16, gap: 8 }]}>
        <Skeleton width={60} height={36} borderRadius={9999} />
        <Skeleton width={72} height={36} borderRadius={9999} />
        <Skeleton width={72} height={36} borderRadius={9999} />
      </View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[skStyles.taskRow, { marginTop: i === 0 ? 24 : 12 }]}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={skStyles.headerText}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  tasksContainer: {
    paddingHorizontal: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  card: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    padding: 20,
  },
  taskList: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
});
