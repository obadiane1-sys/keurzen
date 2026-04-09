'use client';

import { useRouter } from 'next/navigation';
import { useCurrentTlx, useTlxDelta } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

export function TlxSummaryCard() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const score = currentTlx?.score ?? null;
  const delta = tlxDelta ?? null;

  const deltaColor = delta !== null && delta < 0
    ? 'var(--color-sauge)'
    : delta !== null && delta > 0
      ? 'var(--color-rose)'
      : 'var(--color-text-muted)';

  const deltaLabel = delta !== null
    ? `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)} pts`
    : null;

  if (score === null) {
    return (
      <DashboardCard
        accentColor="var(--color-prune)"
        onClick={() => router.push('/dashboard/tlx')}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-prune">
          CHARGE RESSENTIE
        </p>
        <p className="mt-4 text-center text-sm text-text-secondary py-3">
          Remplir le questionnaire TLX
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      accentColor="var(--color-prune)"
      onClick={() => router.push('/dashboard/tlx')}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-prune">
        CHARGE RESSENTIE
      </p>
      <p className="text-xs text-text-secondary mt-0.5">TLX moyen du foyer</p>

      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="font-heading text-[40px] font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-sm text-text-muted">/100</span>
        {deltaLabel && (
          <span className="ml-auto text-sm font-bold" style={{ color: deltaColor }}>
            {deltaLabel}
          </span>
        )}
      </div>

      <div className="mt-2.5 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-prune transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </DashboardCard>
  );
}
