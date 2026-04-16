'use client';

import { useRouter } from 'next/navigation';
import { useCurrentTlx, useTlxDelta } from '@keurzen/queries';

const TLX_DIMENSIONS = [
  { key: 'mental_demand', label: 'Exigence mentale' },
  { key: 'physical_demand', label: 'Exigence physique' },
  { key: 'temporal_demand', label: 'Pression temporelle' },
  { key: 'effort', label: 'Effort' },
  { key: 'frustration', label: 'Frustration' },
  { key: 'performance', label: 'Performance' },
] as const;

function getBarColor(value: number): string {
  if (value < 40) return 'var(--color-success)';
  if (value <= 70) return 'var(--color-joy)';
  return 'var(--color-accent)';
}

export function TlxDetailSection() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  if (!currentTlx) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Charge mentale (TLX)
        </p>
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm text-text-muted">
            Remplissez le TLX pour voir votre charge mentale
          </p>
          <button
            onClick={() => router.push('/dashboard/tlx')}
            className="px-5 py-2 bg-primary text-text-inverse text-sm font-bold rounded-xl tracking-wide hover:opacity-90 transition-opacity"
          >
            REMPLIR LE TLX
          </button>
        </div>
      </div>
    );
  }

  const score = currentTlx.score;
  const scoreColor = getBarColor(score);

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">
        Charge mentale (TLX)
      </p>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="text-sm text-text-muted">/100</span>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <span
            className="ml-2 text-xs font-semibold"
            style={{ color: tlxDelta.delta > 0 ? 'var(--color-accent)' : 'var(--color-success)' }}
          >
            {tlxDelta.delta > 0 ? '▲' : '▼'} {Math.abs(tlxDelta.delta)} pts
          </span>
        )}
      </div>

      <div className="space-y-3">
        {TLX_DIMENSIONS.map(({ key, label }) => {
          const value = currentTlx[key as keyof typeof currentTlx] as number;
          const barColor = getBarColor(value);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-text-secondary w-[110px] shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border-light overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${value}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-xs font-semibold text-text-primary w-7 text-right">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
