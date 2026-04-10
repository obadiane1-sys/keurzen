'use client';

import { useWeeklyBalance } from '@keurzen/queries';

// ─── Constants ────────────────────────────────────────────────────────────────

const DONUT_R = 35;
const DONUT_STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

const MEMBER_COLORS = [
  'var(--color-terracotta)',
  'var(--color-prune)',
  'var(--color-sauge)',
  'var(--color-miel)',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  return (
    <div className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <p className="text-sm font-bold text-text-primary text-center mb-4">
        Equite des Taches
      </p>

      {members.length < 2 ? (
        <p className="text-center text-sm text-text-muted py-4">
          Pas assez de donnees
        </p>
      ) : (
        <>
          {/* Donut chart */}
          <div className="flex justify-center mb-4">
            <svg
              width={96}
              height={96}
              viewBox="0 0 100 100"
              className="-rotate-90"
            >
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
                    cx={50}
                    cy={50}
                    r={DONUT_R}
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

          {/* Legend */}
          <div className="space-y-2 mt-auto">
            {members.map((member, i) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const pct = Math.round(member.tasksShare * 100);
              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-text-muted">
                      {member.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="font-bold text-text-primary">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
