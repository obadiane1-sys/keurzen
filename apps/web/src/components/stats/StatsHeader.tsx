'use client';

import { cn } from '@/lib/utils';
import type { StatsScope, StatsPeriod } from '@keurzen/queries';

interface Props {
  scope: StatsScope;
  period: StatsPeriod;
  onScopeChange: (s: StatsScope) => void;
  onPeriodChange: (p: StatsPeriod) => void;
}

const SCOPE_OPTIONS: Array<{ value: StatsScope; label: string }> = [
  { value: 'me', label: 'Moi' },
  { value: 'household', label: 'Foyer' },
];

const PERIOD_OPTIONS: Array<{ value: StatsPeriod; label: string }> = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
];

export function StatsHeader({ scope, period, onScopeChange, onPeriodChange }: Props) {
  return (
    <div className="px-6 pt-4 space-y-4">
      {/* Scope pills */}
      <div className="flex rounded-xl bg-primary-surface p-1">
        {SCOPE_OPTIONS.map((opt) => {
          const active = scope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onScopeChange(opt.value)}
              aria-pressed={active}
              className={cn(
                'flex-1 rounded-lg py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200',
                active
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Period pills */}
      <div className="flex rounded-xl bg-primary-surface p-1">
        {PERIOD_OPTIONS.map((opt) => {
          const active = period === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPeriodChange(opt.value)}
              aria-pressed={active}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-[10px] uppercase tracking-[0.15em] transition-all duration-200',
                active
                  ? 'bg-white font-bold text-text-primary shadow-sm'
                  : 'font-semibold text-text-muted hover:text-text-secondary',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
