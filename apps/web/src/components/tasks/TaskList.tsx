import { TaskRow } from './TaskRow';
import type { Task } from '@keurzen/shared';

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskList({ tasks, selectedId, onSelect }: TaskListProps) {
  return (
    <div className="divide-y divide-border-light rounded-[var(--radius-lg)] border border-border bg-background-card shadow-card overflow-hidden">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          isSelected={task.id === selectedId}
          onClick={() => onSelect(task.id)}
        />
      ))}
    </div>
  );
}
