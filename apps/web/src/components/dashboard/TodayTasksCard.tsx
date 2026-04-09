'use client';

import { useRouter } from 'next/navigation';
import { useTodayTasks } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

export function TodayTasksCard() {
  const router = useRouter();
  const todayTasks = useTodayTasks();

  return (
    <DashboardCard accentColor="var(--color-sauge)">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sauge">
          AUJOURD&apos;HUI
        </p>
        {todayTasks.length > 0 && (
          <button
            onClick={() => router.push('/tasks')}
            className="text-xs font-bold text-terracotta hover:underline"
          >
            Tout voir ›
          </button>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline gap-2 mb-3.5">
        <span className="font-heading text-[40px] font-extrabold leading-none text-text-primary">
          {todayTasks.length}
        </span>
        <span className="text-sm text-text-secondary">
          {todayTasks.length <= 1 ? 'tache restante' : 'taches restantes'}
        </span>
      </div>

      {todayTasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {todayTasks.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 rounded-[10px] bg-background px-3 py-2.5"
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: priorityColors[t.priority] || priorityColors.medium }}
              />
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">
                {t.title}
              </span>
              <span className="text-[11px] text-text-muted">
                {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-text-muted">
          Aucune tache aujourd&apos;hui
        </p>
      )}
    </DashboardCard>
  );
}
