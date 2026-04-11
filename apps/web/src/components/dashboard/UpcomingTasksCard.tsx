'use client';

import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import { useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import type { Task } from '@keurzen/shared';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    cooking: '🍳', cleaning: '🧹', shopping: '🛒', linge: '👕', children: '👶',
  };
  return map[category] ?? '✅';
}

function formatDueDate(date: string | null): string {
  if (!date) return 'Pas de date';
  const d = dayjs(date);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('DD/MM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcomingTasks = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf();
    })
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant">
          A venir
        </p>
        <button
          className="text-sm font-bold text-v2-primary"
          onClick={() => router.push('/tasks')}
        >
          Voir tout
        </button>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 border border-v2-outline-variant text-center">
          <p className="text-sm text-v2-on-surface-variant">Aucune tache a venir</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-5 pb-7 border border-v2-outline-variant ml-2 -mr-2.5 space-y-3.5">
          {upcomingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={() => updateStatus({ id: task.id, status: 'done' })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const emoji = getCategoryEmoji(task.category);
  const dateLabel = formatDueDate(task.due_date);
  const assigneeName = task.assigned_profile?.full_name?.split(' ')[0];

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-[12px] bg-v2-surface-container flex items-center justify-center shrink-0">
        <span className="text-sm">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-v2-on-surface truncate">{task.title}</p>
        <p className="text-xs text-v2-on-surface-variant">
          {dateLabel}
          {assigneeName ? ` · ${assigneeName}` : ''}
        </p>
      </div>
      <button
        className="w-6 h-6 rounded-full border-2 border-v2-outline-variant hover:border-v2-primary transition-colors shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        aria-label="Marquer comme terminee"
      />
    </div>
  );
}
