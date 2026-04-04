import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, BorderRadius } from '../../constants/tokens';

interface KPIPill {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  dotColor?: string;
}

interface KPIPillsProps {
  pills: KPIPill[];
}

export function KPIPills({ pills }: KPIPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {pills.map((pill, i) => (
        <View key={i} style={styles.pill}>
          <View style={[styles.iconBox, { backgroundColor: pill.color + '18' }]}>
            <Ionicons name={pill.icon} size={16} color={pill.color} />
          </View>
          <View style={styles.textCol}>
            <Text variant="caption" style={styles.label}>{pill.label}</Text>
            <View style={styles.valueRow}>
              {pill.dotColor && <View style={[styles.dot, { backgroundColor: pill.dotColor }]} />}
              <Text variant="body" weight="bold" style={styles.value}>{pill.value}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    gap: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
