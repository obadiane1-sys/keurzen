'use client';

import type { CoachingInsight } from '@keurzen/shared';
import { InsightCard } from './InsightCard';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightClick?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightClick }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary mb-4">
        <span className="text-terracotta">💡</span>
        Insights & Actions
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={onInsightClick ? () => onInsightClick(insight) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
