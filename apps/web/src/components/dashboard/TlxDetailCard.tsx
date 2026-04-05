'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CircularGauge } from './CircularGauge';
import type { TlxEntry } from '@keurzen/shared';

interface TlxDetailCardProps {
  currentTlx: TlxEntry | null | undefined;
  tlxDelta: { score: number; delta: number | null; hasComparison: boolean } | null | undefined;
}

export function TlxDetailCard({ currentTlx, tlxDelta }: TlxDetailCardProps) {
  const router = useRouter();

  if (!currentTlx) {
    return (
      <Card hoverable onClick={() => router.push('/dashboard/tlx')}>
        <div className="flex items-center gap-4">
          <Zap size={28} className="text-prune shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Evaluez votre charge mentale</p>
            <p className="text-xs text-text-muted">Remplissez le questionnaire TLX</p>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </div>
      </Card>
    );
  }

  const allValues = [
    currentTlx.mental_demand,
    currentTlx.physical_demand,
    currentTlx.temporal_demand,
    100 - currentTlx.performance,
    currentTlx.effort,
    currentTlx.frustration,
  ];
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const avgVal = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);

  return (
    <Card hoverable onClick={() => router.push('/dashboard/tlx')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-sauge shrink-0" />
        <span className="text-sm font-semibold flex-1">Score TLX cette semaine</span>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <span
            className="text-xs"
            style={{ color: tlxDelta.delta > 0 ? 'var(--color-rose)' : 'var(--color-sauge)' }}
          >
            {tlxDelta.delta > 0 ? '+' : ''}{tlxDelta.delta} pts
          </span>
        )}
        <ChevronRight size={14} className="text-text-muted shrink-0" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-center">
          <p className="text-xl font-extrabold text-rose">{maxVal}</p>
          <p className="text-[10px] text-text-muted">Max</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-sauge">{minVal}</p>
          <p className="text-[10px] text-text-muted">Min</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-miel">{avgVal}</p>
          <p className="text-[10px] text-text-muted">Moy.</p>
        </div>
        <CircularGauge
          value={currentTlx.score}
          max={100}
          color="var(--color-prune)"
          size={52}
          label=""
        />
      </div>

      {/* Energy bar */}
      <div className="flex items-center gap-2.5">
        <Zap size={16} className="text-miel shrink-0" />
        <div className="flex-1 h-2.5 rounded-full bg-[var(--color-gray-100)] overflow-hidden">
          <div
            className="h-full rounded-full bg-prune"
            style={{ width: `${Math.min(currentTlx.score, 100)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-prune">{currentTlx.score}%</span>
      </div>
    </Card>
  );
}
