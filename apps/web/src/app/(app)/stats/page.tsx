'use client';

import { useState } from 'react';
import { useStats, type StatsScope, type StatsPeriod } from '@keurzen/queries';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { ScoreHero } from '@/components/stats/ScoreHero';
import { KpiGrid } from '@/components/stats/KpiGrid';
import { MemberBalanceList } from '@/components/stats/MemberBalanceList';
import { AnimatedPage } from '@/components/ui/AnimatedPage';
import { StatsSkeleton } from '@/components/ui/Skeleton';

export default function StatsPage() {
  const [scope, setScope] = useState<StatsScope>('me');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const stats = useStats({ scope, period });

  const showHouseholdBlocks = scope === 'household';

  return (
    <AnimatedPage>
    <main className="mx-auto w-full max-w-xl bg-white pb-24">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold italic text-[var(--color-text-primary)]">
          Statistiques
        </h1>
      </div>

      <StatsHeader
        scope={scope}
        period={period}
        onScopeChange={setScope}
        onPeriodChange={setPeriod}
      />

      {stats.isLoading ? (
        <StatsSkeleton />
      ) : stats.isEmpty ? (
        <EmptyState
          variant="stats"
        />
      ) : (
        <>
          {showHouseholdBlocks && stats.score && (
            <ScoreHero
              score={stats.score.total}
              delta={stats.scoreDelta}
              coachMessage={stats.coachMessage}
            />
          )}
          <KpiGrid kpis={stats.kpis} />
          {showHouseholdBlocks && stats.members.length > 0 && (
            <MemberBalanceList members={stats.members} />
          )}
        </>
      )}
    </main>
    </AnimatedPage>
  );
}
