import { CheckCircle2 } from 'lucide-react';
import { TaskRow, CompletedTaskRow } from './TaskRow';
import type { Task } from '@keurzen/shared';

interface TaskListProps {
  todoTasks: Task[];
  doneTasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskList({ todoTasks, doneTasks, selectedId, onSelect, onDelete }: TaskListProps) {
  return (
    <div className="space-y-8">
      {/* À faire section */}
      {(todoTasks.length > 0 || doneTasks.length === 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-text-primary">À faire</h2>
            <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
              {todoTasks.length}
            </span>
          </div>
          <div className="divide-y divide-border-light rounded-[var(--radius-lg)] border border-border bg-background-card shadow-card overflow-hidden">
            {todoTasks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-muted text-center">Aucune tâche à faire</p>
            ) : (
              todoTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedId}
                  onClick={() => onSelect(task.id)}
                  onDelete={onDelete ? () => onDelete(task.id) : undefined}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Terminées section */}
      {doneTasks.length > 0 && (
        <section className="opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">Terminées</h2>
              <span className="bg-gray-200 text-text-muted px-2.5 py-0.5 rounded-full text-xs font-bold">
                {doneTasks.length}
              </span>
            </div>
            <CheckCircle2 size={20} className="text-success" />
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <CompletedTaskRow
                key={task.id}
                task={task}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
