'use client';

import { useMemo } from 'react';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

const GAUGE_R = 56;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const SVG_SIZE = (GAUGE_R + STROKE) * 2;

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-joy)';
  return 'var(--color-accent)';
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Equilibre';
  if (score >= 40) return 'A surveiller';
  return 'Fragile';
}

const DIMENSIONS = [
  { key: 'completion', label: 'Taches', emoji: '✅' },
  { key: 'balance', label: 'Equilibre', emoji: '⚖️' },
  { key: 'tlx', label: 'Charge mentale', emoji: '🧠' },
  { key: 'streak', label: 'Regularite', emoji: '🔥' },
] as const;

export function ScoreBreakdownCard() {
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const scoreResult = useMemo(() => {
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
    });
  }, [allTasks, balanceMembers, currentTlx]);

  const scoreColor = getScoreColor(scoreResult.total);
  const dashOffset = CIRCUMFERENCE * (1 - scoreResult.total / 100);

  return (
    <div className="rounded-2xl bg-background-card p-6 shadow-card flex flex-col items-center">
      <div className="relative mb-4">
        <svg width={SVG_SIZE} height={SVG_SIZE} className="-rotate-90">
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={GAUGE_R}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={GAUGE_R}
            fill="none"
            stroke={scoreColor}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-text-primary">
            {scoreResult.total}
          </span>
          <span className="text-xs text-text-muted">/100</span>
        </div>
      </div>

      <p className="text-lg font-bold mb-5" style={{ color: scoreColor }}>
        {getScoreLevel(scoreResult.total)}
      </p>

      <div className="grid grid-cols-4 gap-3 w-full">
        {DIMENSIONS.map(({ key, label, emoji }) => {
          const dim = scoreResult.dimensions[key];
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-base">{emoji}</span>
              <span className="text-lg font-bold text-text-primary">
                {dim.value}
              </span>
              <span className="text-xs text-text-muted text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
