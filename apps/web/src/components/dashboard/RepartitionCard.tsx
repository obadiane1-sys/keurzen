'use client';

import { useWeeklyBalance } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

export function RepartitionCard() {
  const { members: balanceMembers } = useWeeklyBalance();

  return (
    <DashboardCard accentColor="var(--color-miel)">
      <p className="text-[11px] font-bold uppercase tracking-wider text-miel">
        REPARTITION
      </p>
      <p className="text-xs text-text-secondary mt-0.5">Equilibre des taches</p>

      {balanceMembers.length > 0 ? (
        <div className="mt-4 space-y-3">
          {balanceMembers.map((m) => {
            const pct = Math.round(m.tasksShare * 100);
            return (
              <div key={m.userId}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-text-primary">
                    {m.name.split(' ')[0]}
                  </span>
                  <span className="text-sm font-bold text-text-primary">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 py-3 text-center text-sm text-text-muted">
          Pas assez de donnees cette semaine
        </p>
      )}
    </DashboardCard>
  );
}
