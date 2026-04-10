'use client';

import type { CoachingInsight } from '@keurzen/shared';

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  'warning-outline': '⚠️',
  'chatbubble-outline': '💬',
  'heart-outline': '❤️',
};

function getEmoji(icon: string): string {
  return ICON_MAP[icon] ?? '💡';
}

// ─── Type styles ──────────────────────────────────────────────────────────────

type TypeStyle = {
  cardClass: string;
  accentClass: string;
  ctaClass: string;
};

const TYPE_STYLES: Record<string, TypeStyle> = {
  alert: {
    cardClass: 'bg-rose/10 border-rose/20',
    accentClass: 'text-rose',
    ctaClass: 'text-rose',
  },
  conseil: {
    cardClass: 'bg-background-card border-border',
    accentClass: 'text-miel',
    ctaClass: 'text-terracotta',
  },
  wellbeing: {
    cardClass: 'bg-background-card border-border',
    accentClass: 'text-rose',
    ctaClass: 'text-terracotta',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: CoachingInsight;
  onClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const styles = TYPE_STYLES[insight.type] ?? TYPE_STYLES.conseil;
  const emoji = getEmoji(insight.icon);

  return (
    <div
      className={`min-w-[280px] shrink-0 rounded-2xl p-4 border shadow-card flex flex-col justify-between ${styles.cardClass}`}
      onClick={onClick}
    >
      {/* Icon + label */}
      <div className={`flex items-center gap-2 mb-2 ${styles.accentClass}`}>
        <span className="text-base">{emoji}</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${styles.accentClass}`}
        >
          {insight.label}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm font-semibold text-text-primary mb-3 flex-1">
        {insight.message}
      </p>

      {/* CTA */}
      <button
        className={`text-xs font-bold flex items-center gap-1 ${styles.ctaClass}`}
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
