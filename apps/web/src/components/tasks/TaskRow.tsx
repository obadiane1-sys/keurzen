import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useUpdateTaskStatus } from '@keurzen/queries';
import { categoryColorMap } from '@keurzen/shared';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  cleaning: { label: 'Ménage', icon: '✨' },
  cooking: { label: 'Cuisine', icon: '🍳' },
  shopping: { label: 'Courses', icon: '🛒' },
  admin: { label: 'Admin', icon: '📄' },
  children: { label: 'Enfants', icon: '👨‍👩‍👧' },
  pets: { label: 'Animaux', icon: '🐾' },
  garden: { label: 'Jardin', icon: '🌿' },
  repairs: { label: 'Bricolage', icon: '🔨' },
  health: { label: 'Santé', icon: '❤️' },
  finances: { label: 'Finances', icon: '💰' },
  other: { label: 'Autre', icon: '…' },
};

export function TaskRow({ task, isSelected, onClick, onEdit, onDelete }: TaskRowProps) {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const isDone = task.status === 'done';
  const tintColor = categoryColorMap[task.category] ?? categoryColorMap.other;
  const cat = categoryLabels[task.category] ?? categoryLabels.other;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus({
      id: task.id,
      status: isDone ? 'todo' : 'done',
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={cn(
        'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
        isSelected && 'ring-1 ring-terracotta/20',
      )}
      style={{ backgroundColor: `${tintColor}0F` }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isDone
            ? 'border-sauge bg-sauge text-white'
            : 'border-border hover:border-terracotta',
        )}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor:
            priorityColors[task.priority] || priorityColors.medium,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isDone && 'line-through text-text-muted',
            )}
          >
            {task.title}
          </p>
          <span className="text-[11px] text-text-muted shrink-0">
            {cat.icon} {cat.label}
          </span>
        </div>
        {task.due_date && (
          <p className="text-xs text-text-muted">
            {dayjs(task.due_date).format('DD MMM')}
          </p>
        )}
      </div>

      {/* Assignee */}
      {task.assigned_profile && (
        <Avatar
          name={task.assigned_profile.full_name || undefined}
          src={task.assigned_profile.avatar_url}
          size={24}
        />
      )}

      {/* Hover actions */}
      {(onEdit || onDelete) && (
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-terracotta/10 hover:text-terracotta transition-colors"
              aria-label="Modifier la tache"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-rose/10 hover:text-rose transition-colors"
              aria-label="Supprimer la tache"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
