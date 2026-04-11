import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { InsightCard } from './InsightCard';
import { ColorsV2 } from '../../constants/tokensV2';
import { Spacing } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightPress?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightPress }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text
        variant="overline"
        style={styles.title}
      >
        Insights & Actions
      </Text>

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
  title: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  separator: {
    width: Spacing.md,
  },
});
