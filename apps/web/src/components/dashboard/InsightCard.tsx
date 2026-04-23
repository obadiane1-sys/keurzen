'use client';

import type { CoachingInsight } from '@keurzen/shared';

const typeStyles = {
  alert: {
    bg: 'bg-rose/10',
    border: 'border-rose/20',
    iconColor: 'text-rose',
    ctaColor: 'text-rose',
  },
  conseil: {
    bg: 'bg-background-card',
    border: 'border-border',
    iconColor: 'text-miel',
    ctaColor: 'text-terracotta',
  },
  wellbeing: {
    bg: 'bg-background-card',
    border: 'border-border',
    iconColor: 'text-rose',
    ctaColor: 'text-terracotta',
  },
} as const;

// Map Ionicon names (from the Edge Function) to inline glyphs for the web.
const iconMap: Record<string, string> = {
  'warning-outline': '⚠️',
  'chatbubble-outline': '💬',
  'heart-outline': '❤️',
};

interface InsightCardProps {
  insight: CoachingInsight;
  onClick?: () => void;
}

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const style = typeStyles[insight.type];

  return (
    <div
      className={`min-w-[280px] shrink-0 rounded-2xl p-4 border shadow-card flex flex-col justify-between ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-base ${style.iconColor}`}>
          {iconMap[insight.icon] ?? '💡'}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.iconColor}`}>
          {insight.label}
        </span>
      </div>

      <p className="text-sm font-semibold text-text-primary mb-3">
        {insight.message}
      </p>

      {onClick && (
        <button
          onClick={onClick}
          className={`text-xs font-bold flex items-center gap-1 self-start ${style.ctaColor} hover:opacity-80 transition-opacity`}
        >
          {insight.cta_label}
          <span className="text-sm">→</span>
        </button>
      )}
    </div>
  );
}
