import { Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useUpdateTaskStatus } from '@keurzen/queries';
import { categoryEmoji, formatDueDate } from '@keurzen/shared';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function TaskRow({ task, isSelected, onClick, onDelete }: TaskRowProps) {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const isDone = task.status === 'done';
  const isOverdue = !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
  const emoji = categoryEmoji[task.category] ?? categoryEmoji.other;
  const dateLabel = formatDueDate(task.due_date);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus({ id: task.id, status: isDone ? 'todo' : 'done' });
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
        'group flex w-full items-center gap-4 px-4 py-3 text-left transition-all duration-200 cursor-pointer hover:bg-background-card/80 hover:shadow-sm',
        isSelected && 'ring-1 ring-primary/20',
      )}
    >
      {/* Avatar */}
      <Avatar
        name={task.assigned_profile?.full_name || undefined}
        src={task.assigned_profile?.avatar_url}
        size={40}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            isDone && 'line-through text-text-muted',
          )}
        >
          {emoji} {task.title}
        </p>
        {dateLabel && (
          <p className={cn(
            'text-xs mt-0.5 flex items-center gap-1',
            isOverdue ? 'text-accent' : 'text-text-muted',
          )}>
            <Calendar size={12} />
            {dateLabel}
          </p>
        )}
      </div>

      {/* Checkbox / Delete */}
      {!isDone ? (
        <button
          onClick={handleToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border hover:border-primary hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all duration-150"
          aria-label="Marquer comme terminée"
        />
      ) : onDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-accent/10 hover:text-accent transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}

// ─── Compact row for completed tasks ────────────────────────────────────────

interface CompletedTaskRowProps {
  task: Task;
}

export function CompletedTaskRow({ task }: CompletedTaskRowProps) {
  const emoji = categoryEmoji[task.category] ?? categoryEmoji.other;

  return (
    <div className="flex items-center gap-4 px-4 py-3 border border-border-light rounded-[var(--radius-md)] bg-white">
      <Avatar
        name={task.assigned_profile?.full_name || undefined}
        src={task.assigned_profile?.avatar_url}
        size={32}
        className="opacity-60"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-muted line-through truncate">
          {emoji} {task.title}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">Hier ✓</p>
      </div>
    </div>
  );
}
