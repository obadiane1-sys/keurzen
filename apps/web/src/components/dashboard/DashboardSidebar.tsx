'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
} from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';
import { ScoreGauge } from './ScoreGauge';

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-sauge)';
  if (score >= 40) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

function getStatusLabel(score: number): string {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 60) return 'BON EQUILIBRE';
  if (score >= 40) return 'MOYEN';
  if (score >= 20) return 'A RISQUE';
  return 'FRAGILE';
}

export function DashboardSidebar() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta ?? 0)))
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

  const scoreColor = getScoreColor(score);
  const statusLabel = getStatusLabel(score);
  const doneTasks = allTasks.filter((t) => t.status === 'done');

  return (
    <aside className="w-80 shrink-0 max-lg:w-full">
      <div className="sticky top-8 rounded-[var(--radius-lg)] bg-background-card p-7 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          Score du foyer
        </p>
        <p className="text-xs text-text-secondary mt-1">Vue d&apos;ensemble</p>

        <div className="flex justify-center my-6">
          <ScoreGauge score={score} color={scoreColor} />
        </div>

        <div className="text-center mb-5">
          <span
            className="inline-block rounded-full px-3.5 py-1 text-xs font-bold"
            style={{ color: scoreColor, backgroundColor: `color-mix(in srgb, ${scoreColor} 12%, transparent)` }}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-background p-3.5 text-center">
            <span className="font-heading text-xl font-extrabold text-text-primary">
              {doneTasks.length}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">Taches faites</p>
          </div>
          <div className="flex-1 rounded-xl bg-background p-3.5 text-center">
            <span className="font-heading text-xl font-extrabold text-text-primary">
              {todayTasks.length}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">Aujourd&apos;hui</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/weekly-review')}
          className="mt-5 w-full rounded-xl bg-terracotta py-3 text-sm font-bold text-white transition-colors hover:bg-terracotta/90"
        >
          Voir le bilan hebdo
        </button>
      </div>
    </aside>
  );
}
