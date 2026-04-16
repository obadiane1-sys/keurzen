'use client';

import type { MemberBalance } from '@keurzen/queries';

const MEMBER_COLORS = [
  'var(--color-primary)',
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-joy)',
  'var(--color-accent)',
];

function getDeltaClasses(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.10) return 'bg-success/10 text-success';
  if (abs < 0.20) return 'bg-joy/10 text-joy';
  return 'bg-accent/10 text-accent';
}

interface EquitySectionProps {
  title: string;
  members: MemberBalance[];
  shareKey: 'tasksShare' | 'minutesShare';
  deltaKey: 'tasksDelta' | 'minutesDelta';
}

export function EquitySection({ title, members, shareKey, deltaKey }: EquitySectionProps) {
  if (members.length < 2) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">{title}</p>
        <p className="text-sm text-text-muted text-center py-6">
          Pas assez de donnees cette semaine
        </p>
      </div>
    );
  }

  const expectedShare = 1 / members.length;

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">{title}</p>

      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {members.map((m, i) => {
          const share = m[shareKey];
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          if (share <= 0) return null;
          return (
            <div
              key={m.userId}
              style={{ flex: share, backgroundColor: color }}
            />
          );
        })}
      </div>

      <div className="space-y-2">
        {members.map((m, i) => {
          const share = m[shareKey];
          const delta = m[deltaKey];
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          const deltaSign = delta > 0 ? '+' : '';

          return (
            <div key={m.userId} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-text-primary truncate">
                {m.name.split(' ')[0]}
              </span>
              <span className="font-bold text-text-primary">
                {Math.round(share * 100)}%
              </span>
              <span className="text-xs text-text-muted">
                /{Math.round(expectedShare * 100)}%
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getDeltaClasses(delta)}`}>
                {deltaSign}{Math.round(delta * 100)}pp
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
