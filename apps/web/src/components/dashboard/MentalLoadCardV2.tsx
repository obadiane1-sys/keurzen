'use client';

import { useCurrentTlx, useWeeklyBalance } from '@keurzen/queries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreLevelColor(score: number): string {
  if (score >= 65) return 'text-rose';
  if (score >= 35) return 'text-miel';
  return 'text-sauge';
}

function getScoreLevelLabel(score: number): string {
  if (score >= 65) return 'Elevee';
  if (score >= 35) return 'Moderee';
  return 'Legere';
}

function getProgressColor(score: number): string {
  if (score >= 65) return 'var(--color-rose)';
  if (score >= 35) return 'var(--color-miel)';
  return 'var(--color-sauge)';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const topMember = members[0];
  const levelColorClass = getScoreLevelColor(score);
  const levelLabel = getScoreLevelLabel(score);
  const progressColor = getProgressColor(score);

  return (
    <div className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <p className="text-sm font-bold text-text-primary text-center mb-2">
        Charge Mentale
      </p>

      {/* Score level */}
      <p className={`font-heading text-3xl font-extrabold text-center mb-1 ${levelColorClass}`}>
        {score === 0 ? '—' : levelLabel}
      </p>

      {/* Subtitle */}
      <p className="text-xs text-text-muted text-center">
        {topMember
          ? `Focus sur ${topMember.name.split(' ')[0]} cette semaine`
          : 'Aucune donnee disponible'}
      </p>

      {/* Progress bar */}
      <div className="w-full mt-4 h-2.5 rounded-full bg-border-light overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(score, 100)}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>
    </div>
  );
}
