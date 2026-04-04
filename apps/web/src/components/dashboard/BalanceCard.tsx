import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { MemberBalance } from '@keurzen/queries';

interface BalanceCardProps {
  members: MemberBalance[];
}

export function BalanceCard({ members }: BalanceCardProps) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Repartition cette semaine
      </p>
      <Card>
        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name.split(' ')[0]}</p>
                  <ProgressBar value={Math.round(m.tasksShare * 100)} color={m.color} />
                </div>
                <span className="text-sm font-medium tabular-nums min-w-[36px] text-right">
                  {Math.round(m.tasksShare * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-text-muted">
            Pas encore de donnees cette semaine
          </p>
        )}
      </Card>
    </div>
  );
}
