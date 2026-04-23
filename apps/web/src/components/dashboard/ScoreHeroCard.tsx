'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

const GAUGE_R = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

function getScoreMessage(score: number): string {
  if (score >= 80) return "Votre repartition s'ameliore ! Continuez sur cette voie.";
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance =
      balanceMembers.length > 0
        ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
        : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays: 0,
    }).total;
  }, [allTasks, balanceMembers, currentTlx]);

  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push('/dashboard/weekly-review')}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-terracotta/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-rose/10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">Score du Foyer</h2>
          <span className="text-text-muted text-sm">ⓘ</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <p className="text-text-primary">
              <span className="font-heading text-4xl font-extrabold">{score}</span>
              <span className="text-xl text-text-muted font-normal">/100</span>
            </p>
            <p className="text-sm text-text-muted mt-3">
              {getScoreMessage(score)}
            </p>
          </div>

          {/* Circular gauge */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={GAUGE_R}
                fill="none"
                stroke="var(--color-border-light)"
                strokeWidth={STROKE}
              />
              <circle
                cx="50" cy="50" r={GAUGE_R}
                fill="none"
                stroke="var(--color-terracotta)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl text-terracotta">⚖️</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
