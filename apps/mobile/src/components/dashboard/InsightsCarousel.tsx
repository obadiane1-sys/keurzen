import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CoachingInsight } from '@keurzen/shared';

import { Text } from '../ui/Text';
import { Colors, Spacing } from '../../constants/tokens';
import { InsightCard } from './InsightCard';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightPress?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightPress }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <View>
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={22} color={Colors.terracotta} />
        <Text variant="h3" weight="bold" style={styles.title}>
          Insights & Actions
        </Text>
      </View>
      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.base }} />}
        renderItem={({ item }) => (
          <InsightCard
            insight={item}
            onPress={onInsightPress ? () => onInsightPress(item) : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
});
