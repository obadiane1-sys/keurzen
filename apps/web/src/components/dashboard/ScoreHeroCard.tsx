'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAUGE_R = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Excellent equilibre cette semaine !';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Quelques desequilibres a surveiller.';
  return 'Attention, la charge est tres inegale.';
}

// ─── Component ────────────────────────────────────────────────────────────────

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
      className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push('/dashboard/analytics')}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-terracotta/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-rose/10 blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-text-primary">Score du Foyer</span>
          <span className="text-sm text-text-muted">ⓘ</span>
        </div>

        {/* Body */}
        <div className="flex items-center justify-between">
          {/* Left: score + message */}
          <div className="flex-1 pr-4">
            <div>
              <span className="font-heading text-4xl font-extrabold text-text-primary">
                {score}
              </span>
              <span className="text-xl text-text-muted">/100</span>
            </div>
            <p className="text-sm text-text-muted mt-3">{message}</p>
          </div>

          {/* Right: circular gauge */}
          <div className="relative" style={{ width: 112, height: 112 }}>
            <svg
              width={112}
              height={112}
              viewBox="0 0 100 100"
              className="-rotate-90"
            >
              {/* Track */}
              <circle
                cx={50}
                cy={50}
                r={GAUGE_R}
                fill="none"
                stroke="var(--color-border-light)"
                strokeWidth={STROKE}
              />
              {/* Fill */}
              <circle
                cx={50}
                cy={50}
                r={GAUGE_R}
                fill="none"
                stroke="var(--color-terracotta)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Center emoji */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl text-terracotta">⚖️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
