'use client';

import { useCurrentTlx, useWeeklyBalance } from '@keurzen/queries';

function getTlxLevel(score: number): {
  label: string;
  colorClass: string;
  barColor: string;
} {
  if (score >= 65) return { label: 'Elevee', colorClass: 'text-rose', barColor: 'var(--color-rose)' };
  if (score >= 35) return { label: 'Moyenne', colorClass: 'text-miel', barColor: 'var(--color-miel)' };
  return { label: 'Faible', colorClass: 'text-sauge', barColor: 'var(--color-sauge)' };
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const { label, colorClass, barColor } = getTlxLevel(score);

  const focusMember =
    members.length > 0
      ? members.reduce((a, b) => (Math.abs(b.tasksDelta) > Math.abs(a.tasksDelta) ? b : a))
      : null;

  return (
    <section className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <h3 className="text-sm font-bold text-text-primary text-center mb-2">
        Charge Mentale
      </h3>

      <div className="flex-1 flex flex-col justify-center items-center">
        <div className={`font-heading text-3xl font-extrabold mb-1 ${colorClass}`}>
          {score > 0 ? label : '\u2014'}
        </div>
        {focusMember && (
          <p className="text-xs text-text-muted text-center leading-tight">
            Focus sur {focusMember.name.split(' ')[0]} cette semaine
          </p>
        )}
        <div className="w-full mt-4 h-2.5 rounded-full bg-border-light overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </section>
  );
}
