'use client';

import type { CoachingInsight } from '@keurzen/shared';

const DOT_COLORS: Record<string, string> = {
  alert: 'bg-v2-secondary',
  conseil: 'bg-v2-primary',
  wellbeing: 'bg-v2-tertiary',
};

interface InsightCardProps {
  insight: CoachingInsight;
  onClick?: () => void;
}

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const dotColor = DOT_COLORS[insight.type] ?? DOT_COLORS.conseil;

  return (
    <div
      className="min-w-[280px] shrink-0 rounded-[var(--radius-v2-md)] bg-v2-surface-container p-5 flex flex-col justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant">
          {insight.label}
        </span>
      </div>

      <p className="text-sm font-semibold text-v2-on-surface mb-4 flex-1 leading-relaxed">
        {insight.message}
      </p>

      <button
        className="text-xs font-bold text-v2-primary flex items-center gap-1"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {insight.cta_label} →
      </button>
    </div>
  );
}
