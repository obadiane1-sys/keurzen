import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import type { TlxEntry } from '../../types';

interface TlxDetailCardProps {
  currentTlx: TlxEntry | null | undefined;
  tlxDelta: { score: number; delta: number | null; hasComparison: boolean } | null | undefined;
}

function MiniGauge({ value, size = 52 }: { value: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
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
          stroke={Colors.prune}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.miniGaugeCenter, { width: size, height: size }]}>
        <Text variant="label" weight="extrabold" style={{ color: Colors.prune, fontSize: 14 }}>
          {value}
        </Text>
        <Text variant="caption" color="muted" style={{ fontSize: 8 }}>
          Moy
        </Text>
      </View>
    </View>
  );
}

export function TlxDetailCard({ currentTlx, tlxDelta }: TlxDetailCardProps) {
  const router = useRouter();

  if (!currentTlx) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/(app)/dashboard/tlx')}
        activeOpacity={0.85}
      >
        <View style={styles.ctaRow}>
          <Ionicons name="pulse-outline" size={28} color={Colors.prune} />
          <View style={{ flex: 1 }}>
            <Text variant="label">Evaluez votre charge mentale</Text>
            <Text variant="bodySmall" color="muted">
              Remplissez le questionnaire TLX
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  const allValues = [
    currentTlx.mental_demand,
    currentTlx.physical_demand,
    currentTlx.temporal_demand,
    100 - currentTlx.performance,
    currentTlx.effort,
    currentTlx.frustration,
  ];
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const avgVal = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(app)/dashboard/tlx')}
      activeOpacity={0.85}
    >
      <View style={styles.headerRow}>
        <View style={styles.statusDot} />
        <Text variant="bodySmall" weight="semibold" style={{ flex: 1 }}>
          Score TLX cette semaine
        </Text>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <Text
            variant="caption"
            style={{ color: tlxDelta.delta > 0 ? Colors.rose : Colors.sauge }}
          >
            {tlxDelta.delta > 0 ? '+' : ''}{tlxDelta.delta} pts
          </Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.rose }}>
            {maxVal}
          </Text>
          <Text variant="caption" color="muted">Max</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.sauge }}>
            {minVal}
          </Text>
          <Text variant="caption" color="muted">Min</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.miel }}>
            {avgVal}
          </Text>
          <Text variant="caption" color="muted">Moy.</Text>
        </View>
        <MiniGauge value={currentTlx.score} />
      </View>

      <View style={styles.energyRow}>
        <Ionicons name="flash" size={16} color={Colors.miel} />
        <View style={styles.energyBarBg}>
          <View
            style={[
              styles.energyBarFill,
              { width: `${Math.min(currentTlx.score, 100)}%` },
            ]}
          />
        </View>
        <Text variant="bodySmall" weight="bold" style={{ color: Colors.prune }}>
          {currentTlx.score}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sauge,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  energyBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.prune,
  },
  miniGaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
