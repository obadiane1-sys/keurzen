'use client';

import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import { useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import type { Task } from '@keurzen/shared';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    cooking: '🍳',
    cleaning: '🧹',
    shopping: '🛒',
    linge: '👕',
    children: '👶',
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

// ─── Component ────────────────────────────────────────────────────────────────

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">Taches a venir</h2>
        <button
          className="text-sm font-bold text-terracotta"
          onClick={() => router.push('/tasks')}
        >
          Voir tout
        </button>
      </div>

      {/* Task list */}
      {upcomingTasks.length === 0 ? (
        <div className="rounded-2xl bg-background-card p-6 shadow-sm text-center">
          <p className="text-sm text-text-muted">Aucune tache a venir</p>
        </div>
      ) : (
        <div className="space-y-3">
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

// ─── Task Row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  onComplete: () => void;
}

function TaskRow({ task, onComplete }: TaskRowProps) {
  const emoji = getCategoryEmoji(task.category);
  const dateLabel = formatDueDate(task.due_date);
  const assigneeName = task.assigned_profile?.full_name?.split(' ')[0];

  return (
    <div className="flex items-center justify-between rounded-2xl bg-background-card p-4 shadow-sm border border-border-light">
      {/* Left: icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0">
          <span className="text-base">{emoji}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{task.title}</p>
          <p className="text-xs text-text-muted">
            {dateLabel}
            {assigneeName ? ` · ${assigneeName}` : ''}
          </p>
        </div>
      </div>

      {/* Right: checkbox */}
      <button
        className="w-6 h-6 rounded-full border-2 border-border hover:border-terracotta transition-colors shrink-0 ml-3"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        aria-label="Marquer comme terminee"
      />
    </div>
  );
}
