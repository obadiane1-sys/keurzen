import { Avatar } from '@/components/ui/Avatar';
import { labelForBalanceLevel } from '@keurzen/shared';
import type { MemberBalance } from '@keurzen/queries';

interface Props {
  members: MemberBalance[];
}

export function MemberBalanceList({ members }: Props) {
  return (
    <section className="px-6 pt-6">
      <h2 className="pb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-primary)]">
        Repartition
      </h2>
      <div className="h-px bg-[var(--color-border)]/50" />
      <ul className="mt-6 space-y-6">
        {members.map((m) => {
          const pct = Math.round(m.tasksShare * 100);
          const label = labelForBalanceLevel(m.level);
          return (
            <li key={m.userId} className="flex items-center gap-4">
              <Avatar src={m.avatarUrl} name={m.name} size={48} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {m.name}
                  </span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">
                    {pct}%
                  </span>
                </div>
                <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--color-primary-surface)]">
                  <div
                    className="h-full"
                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: label.color }}
                  />
                </div>
                <div
                  className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: label.color }}
                >
                  {label.text}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
