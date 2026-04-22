'use client';

import type { ObjectiveType } from '@keurzen/shared';

const typeColorVars: Record<ObjectiveType, string> = {
  completion: 'var(--color-sauge)',
  balance: 'var(--color-miel)',
  tlx: 'var(--color-prune)',
  streak: 'var(--color-terracotta)',
  maintenance: 'var(--color-sauge)',
};

interface ObjectiveProgressSectionProps {
  label: string;
  type: ObjectiveType;
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  progress: number;
  achieved: boolean;
}

export function ObjectiveProgressSection({
  label,
  type,
  currentValue,
  targetValue,
  baselineValue,
  progress,
  achieved,
}: ObjectiveProgressSectionProps) {
  const color = achieved ? 'var(--color-sauge)' : typeColorVars[type];
  const unit = type === 'completion' || type === 'balance' ? '%' : type === 'streak' ? 'j' : '';

  return (
    <div className="mt-3 border-t border-border-light pt-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span style={{ color }} className="text-sm font-bold">
          {achieved ? '✓' : '→'}
        </span>
        <span className="text-sm font-semibold text-text-primary truncate">
          {achieved ? 'Objectif atteint !' : label}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div className="mt-1 flex justify-between">
        <span className="text-[11px] text-text-muted">
          Sem. derniere : {Math.round(baselineValue)}{unit}
        </span>
        <span className="text-[11px] font-semibold" style={{ color }}>
          {achieved
            ? `${Math.round(currentValue)}${unit}`
            : `${Math.round(currentValue)} / ${Math.round(targetValue)}${unit}`}
        </span>
      </div>
    </div>
  );
}
