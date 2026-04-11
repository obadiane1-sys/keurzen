'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

const GAUGE_R = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Excellent equilibre cette semaine !';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Quelques desequilibres a surveiller.';
  return 'Attention, la charge est tres inegale.';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance =
    members.length > 0
      ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
      : 0;
  const averageTlx = currentTlx?.score ?? 0;

  const { total: score } = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays: 0,
  });

  const message = getScoreMessage(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 pb-8 border border-v2-outline-variant cursor-pointer transition-colors hover:bg-white -ml-2.5 mr-5"
      onClick={() => router.push('/dashboard/analytics')}
    >
      {/* Soft glow blob */}
      <div className="absolute -top-10 -right-16 w-48 h-48 rounded-full bg-v2-primary-container opacity-12 blur-[60px]" />

      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant mb-4">
          Score du Foyer
        </p>

        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <div>
              <span className="text-[26px] font-extrabold text-v2-on-surface tracking-tight">
                {score}
              </span>
              <span className="text-xl text-v2-on-surface-variant">/100</span>
            </div>
            <p className="text-sm text-v2-on-surface-variant mt-3 leading-relaxed">{message}</p>
          </div>

          <div className="relative" style={{ width: 112, height: 112 }}>
            <svg width={112} height={112} viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx={50} cy={50} r={GAUGE_R}
                fill="none"
                stroke="var(--color-v2-surface-container)"
                strokeWidth={STROKE}
              />
              <circle
                cx={50} cy={50} r={GAUGE_R}
                fill="none"
                stroke="var(--color-v2-primary)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
