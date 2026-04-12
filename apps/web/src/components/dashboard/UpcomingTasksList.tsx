'use client';

import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import 'dayjs/locale/fr';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale('fr');

interface Task {
  id: string;
  title: string;
  category: string;
  status: string;
  due_date: string | null;
  assigned_profile?: { full_name?: string } | null;
}

interface UpcomingTasksListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  cleaning: '🧹',
  cooking: '🍳',
  shopping: '🛒',
  admin: '📄',
  children: '👶',
  pets: '🐾',
  garden: '🌱',
  repairs: '🔧',
  health: '❤️',
  finances: '💰',
  other: '📌',
};

const BLOB_COLORS = ['text-primary', 'text-accent'] as const;

export function UpcomingTasksList({ tasks, onToggleStatus }: UpcomingTasksListProps) {
  const router = useRouter();

  const upcoming = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center px-1 mb-3">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-[2px] font-heading">
          Tâches à venir
        </h2>
        <button
          onClick={() => router.push('/tasks')}
          className="text-[10px] font-bold text-primary uppercase font-heading border-b-2 border-primary/20"
        >
          Voir tout
        </button>
      </div>

      <div className="bg-background-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        {upcoming.map((task, index) => {
          const emoji = CATEGORY_EMOJI[task.category] ?? '📌';
          const colorClass = BLOB_COLORS[index % BLOB_COLORS.length];
          const assignee = task.assigned_profile?.full_name?.split(' ')[0] ?? '';
          const dateLabel = task.due_date
            ? dayjs(task.due_date).isToday()
              ? "Aujourd'hui"
              : dayjs(task.due_date).isTomorrow()
                ? 'Demain'
                : dayjs(task.due_date).format('D MMM')
            : '';

          return (
            <div
              key={task.id}
              className={`p-4 flex items-center justify-between hover:bg-white/40 transition-colors ${
                index < upcoming.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center ${colorClass}`}>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{task.title}</h4>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">
                    {dateLabel}{assignee ? ` · ${assignee}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onToggleStatus(task.id)}
                className="w-8 h-8 border-2 border-primary/20 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                aria-label={`Marquer ${task.title} comme terminée`}
              >
                <div className="w-2 h-2 rounded-full bg-primary/20" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
