import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { InsightCard } from './InsightCard';
import { Colors, Spacing } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightPress?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightPress }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={20} color={Colors.miel} style={styles.titleIcon} />
        <Text variant="h3" weight="bold">
          Insights & Actions
        </Text>
      </View>

      {/* Horizontal list */}
      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <InsightCard
            insight={item}
            onPress={() => onInsightPress?.(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  titleIcon: {
    marginRight: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  separator: {
    width: Spacing.md,
  },
});
