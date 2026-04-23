'use client';

import { useWeeklyBalance } from '@keurzen/queries';

const DONUT_R = 35;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;
const MEMBER_COLORS = [
  'var(--color-terracotta)',
  'var(--color-prune)',
  'var(--color-sauge)',
  'var(--color-miel)',
];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = members.map((m, i) => ({
    name: m.name.split(' ')[0],
    share: m.tasksShare,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  const donutSegments = segments.reduce<
    Array<(typeof segments)[number] & { dashLength: number; offset: number }>
  >((acc, seg) => {
    const dashLength = seg.share * CIRCUMFERENCE;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength : 0;
    acc.push({ ...seg, dashLength, offset });
    return acc;
  }, []);

  return (
    <section className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <h3 className="text-sm font-bold text-text-primary text-center mb-4">
        Equite des Taches
      </h3>

      {segments.length >= 2 ? (
        <>
          <div className="flex justify-center mb-4">
            <svg width="96" height="96" className="-rotate-90">
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="48" cy="48" r={DONUT_R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
                  strokeDashoffset={-seg.offset}
                />
              ))}
            </svg>
          </div>

          <div className="space-y-2 mt-auto">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-text-muted">{seg.name}</span>
                </div>
                <span className="font-bold text-text-primary">{Math.round(seg.share * 100)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-text-muted">Pas assez de donnees</p>
      )}
    </section>
  );
}
