'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import type { Task } from '@keurzen/shared';

interface TodayTasksProps {
  tasks: Task[];
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

export function TodayTasks({ tasks }: TodayTasksProps) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Taches du jour
        </p>
        {tasks.length > 0 && (
          <button
            onClick={() => router.push('/tasks')}
            className="text-xs font-medium text-terracotta hover:underline"
          >
            Tout voir
          </button>
        )}
      </div>
      <Card>
        {tasks.length > 0 ? (
          <div className="divide-y divide-border-light">
            {tasks.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: priorityColors[t.priority] || priorityColors.medium,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-text-muted">
                    {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-text-muted">
            Aucune tache pour aujourd&apos;hui
          </p>
        )}
      </Card>
    </div>
  );
}
