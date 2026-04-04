import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@keurzen/shared';
import type { Task } from '@keurzen/shared';

interface RecentlyDoneProps {
  tasks: Task[];
}

export function RecentlyDone({ tasks }: RecentlyDoneProps) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Termine recemment
      </p>
      <Card>
        {tasks.length > 0 ? (
          <div className="divide-y divide-border-light">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                <CheckCircle size={16} className="text-sauge shrink-0" />
                <p className="flex-1 text-sm text-text-secondary truncate">{t.title}</p>
                {t.completed_at && (
                  <span className="text-xs text-text-muted shrink-0">
                    {formatDate(t.completed_at, 'DD/MM')}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-text-muted">
            Aucune tache terminee cette semaine
          </p>
        )}
      </Card>
    </div>
  );
}
