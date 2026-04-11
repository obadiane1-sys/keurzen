'use client';

import type { CoachingInsight } from '@keurzen/shared';
import { InsightCard } from './InsightCard';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightClick?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightClick }: InsightsCarouselProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant mb-4">
        Insights & Actions
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={() => onInsightClick?.(insight)}
          />
        ))}
      </div>
    </div>
  );
}
