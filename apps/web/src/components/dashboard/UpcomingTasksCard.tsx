'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const categoryIcons: Record<string, string> = {
  cuisine: '🍳',
  menage: '🧹',
  courses: '🛒',
  linge: '👕',
  enfants: '👶',
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'Sans date';
  const d = dayjs(dateStr);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcoming = allTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf())
    .slice(0, 5);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">Taches a venir</h2>
        <button
          onClick={() => router.push('/tasks')}
          className="text-sm font-bold text-terracotta hover:opacity-80 transition-opacity"
        >
          Voir tout
        </button>
      </div>

      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((task) => {
            const icon = categoryIcons[task.category] ?? '✅';
            const assigneeName =
              task.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne';
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl bg-background-card p-4 shadow-sm border border-border-light"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{task.title}</h4>
                    <p className="text-xs text-text-muted">
                      {formatDueDate(task.due_date)} • {assigneeName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateStatus({ id: task.id, status: 'done' })}
                  className="w-6 h-6 rounded-full border-2 border-border shrink-0 hover:border-terracotta transition-colors"
                  aria-label={`Marquer ${task.title} comme terminee`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-background-card p-6 shadow-sm text-center">
          <p className="text-sm text-text-muted">Aucune tache a venir</p>
        </div>
      )}
    </section>
  );
}
