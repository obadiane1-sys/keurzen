import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useUpdateTaskStatus } from '@keurzen/queries';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

export function TaskRow({ task, isSelected, onClick }: TaskRowProps) {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const isDone = task.status === 'done';

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
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-border-light/50 cursor-pointer',
        isSelected && 'bg-terracotta/5',
      )}
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
        <p
          className={cn(
            'text-sm font-medium truncate',
            isDone && 'line-through text-text-muted',
          )}
        >
          {task.title}
        </p>
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
    </div>
  );
}
