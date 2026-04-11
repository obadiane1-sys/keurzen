'use client';

import { useWeeklyBalance } from '@keurzen/queries';

const DONUT_R = 35;
const DONUT_STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

const MEMBER_COLORS = [
  'var(--color-v2-primary)',
  'var(--color-v2-secondary)',
  'var(--color-v2-tertiary)',
  'var(--color-v2-primary-container)',
];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-container p-5 pb-7 flex flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant text-center mb-4">
        Repartition
      </p>

      {members.length < 2 ? (
        <p className="text-center text-sm text-v2-on-surface-variant py-4">
          Pas assez de donnees
        </p>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <svg width={96} height={96} viewBox="0 0 100 100" className="-rotate-90">
              {members.map((member, i) => {
                const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
                const share = member.tasksShare;
                const dashArray = CIRCUMFERENCE * share;
                const dashOffset =
                  -CIRCUMFERENCE *
                  members.slice(0, i).reduce((sum, m) => sum + m.tasksShare, 0);

                return (
                  <circle
                    key={member.userId}
                    cx={50} cy={50} r={DONUT_R}
                    fill="none"
                    stroke={color}
                    strokeWidth={DONUT_STROKE}
                    strokeDasharray={`${dashArray} ${CIRCUMFERENCE - dashArray}`}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-2 mt-auto">
            {members.map((member, i) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const pct = Math.round(member.tasksShare * 100);
              return (
                <div key={member.userId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-v2-on-surface-variant">{member.name.split(' ')[0]}</span>
                  </div>
                  <span className="font-bold text-v2-on-surface">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
