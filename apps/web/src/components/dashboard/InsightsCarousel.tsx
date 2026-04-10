'use client';

import type { CoachingInsight } from '@keurzen/shared';
import { InsightCard } from './InsightCard';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightClick?: (insight: CoachingInsight) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InsightsCarousel({ insights, onInsightClick }: InsightsCarouselProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-4">
        💡 Insights &amp; Actions
      </h2>
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
