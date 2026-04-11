'use client';

import { useCurrentTlx, useWeeklyBalance } from '@keurzen/queries';

function getScoreLevelLabel(score: number): string {
  if (score >= 65) return 'Elevee';
  if (score >= 35) return 'Moderee';
  return 'Legere';
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const topMember = members[0];
  const levelLabel = getScoreLevelLabel(score);

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 pb-6 border border-v2-outline-variant flex flex-col mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant text-center mb-3">
        Charge mentale
      </p>

      <p className="text-2xl font-extrabold text-v2-on-surface text-center mb-1 tracking-tight">
        {score === 0 ? '—' : levelLabel}
      </p>

      <p className="text-xs text-v2-on-surface-variant text-center">
        {topMember
          ? `Focus sur ${topMember.name.split(' ')[0]} cette semaine`
          : 'Aucune donnee disponible'}
      </p>

      <div className="w-full mt-4 h-1.5 rounded-full bg-v2-surface-container overflow-hidden">
        <div
          className="h-full rounded-full bg-v2-primary transition-all duration-500"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
