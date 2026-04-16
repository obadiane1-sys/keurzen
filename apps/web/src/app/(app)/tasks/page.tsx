'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useTasks, useDeleteTask } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { AnimatedPage } from '@/components/ui/AnimatedPage';
import { TasksSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Task, TaskType } from '@keurzen/shared';
import dayjs from 'dayjs';

export default function TasksPage() {
  const { members } = useHouseholdStore();
  const { data: tasks = [], isLoading } = useTasks();
  const { mutate: deleteTask } = useDeleteTask();
  const [taskTypeTab, setTaskTypeTab] = useState<TaskType>('household');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ─── Member list ────────────────────────────────────────────────────────

  const memberList = useMemo(
    () =>
      members.map((m) => ({
        userId: m.user_id,
        name: m.profile?.full_name?.split(' ')[0] ?? '',
        color: m.color ?? '#967BB6',
      })),
    [members],
  );

  // ─── Filter & split ─────────────────────────────────────────────────────

  const { todoTasks, doneTasks } = useMemo(() => {
    const now = dayjs();
    let filtered = tasks.filter((t) => (t.task_type ?? 'household') === taskTypeTab);

    if (selectedMemberId) {
      filtered = filtered.filter((t) => t.assigned_to === selectedMemberId);
    }

    const todo: Task[] = [];
    const done: Task[] = [];

    for (const t of filtered) {
      if (t.status === 'done') {
        done.push(t);
      } else {
        todo.push(t);
      }
    }

    todo.sort((a, b) => {
      const aOverdue = a.due_date && dayjs(a.due_date).isBefore(now, 'day');
      const bOverdue = b.due_date && dayjs(b.due_date).isBefore(now, 'day');
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });

    done.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return { todoTasks: todo, doneTasks: done.slice(0, 5) };
  }, [tasks, taskTypeTab, selectedMemberId]);

  const handleDelete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
      deleteTask(id);
      if (selectedTaskId === id) setSelectedTaskId(null);
    },
    [tasks, deleteTask, selectedTaskId],
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  if (isLoading) {
    return <TasksSkeleton />;
  }

  return (
    <AnimatedPage>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-2 pb-4">
        <h1 className="text-xl font-bold text-text-primary">Tâches</h1>
        <Button size="default" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Créer
        </Button>
      </div>

      {/* Tabs Maison / Perso */}
      <div className="mb-4 flex rounded-xl bg-primary-surface p-1">
        <button
          onClick={() => { setTaskTypeTab('household'); setSelectedTaskId(null); }}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 text-center',
            taskTypeTab === 'household'
              ? 'bg-white text-text-primary font-bold shadow-sm'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          Maison
        </button>
        <button
          onClick={() => { setTaskTypeTab('personal'); setSelectedTaskId(null); }}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 text-center',
            taskTypeTab === 'personal'
              ? 'bg-white text-text-primary font-bold shadow-sm'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          Perso
        </button>
      </div>

      {/* Member filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedMemberId(null)}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
            selectedMemberId === null
              ? 'bg-primary text-white'
              : 'bg-background-card text-text-primary hover:bg-border-light',
          )}
        >
          Tous
        </button>
        {memberList.map((member) => (
          <button
            key={member.userId}
            onClick={() => setSelectedMemberId(member.userId)}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
              selectedMemberId === member.userId
                ? 'bg-primary text-white'
                : 'bg-background-card text-text-primary hover:bg-border-light',
            )}
          >
            {member.name}
          </button>
        ))}
      </div>

      {/* Task sections */}
      {todoTasks.length === 0 && doneTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          action={{ label: 'Créer une tâche', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="flex gap-4">
          <div
            className={cn(
              'flex-1 min-w-0',
              selectedTask && 'hidden lg:block lg:max-w-[50%]',
            )}
          >
            <TaskList
              todoTasks={todoTasks}
              doneTasks={doneTasks}
              selectedId={selectedTaskId}
              onSelect={setSelectedTaskId}
              onDelete={handleDelete}
            />
          </div>

          {selectedTask && (
            <div className="hidden lg:block lg:flex-1 lg:min-w-0">
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile: Detail Modal (< lg) */}
      {selectedTask && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] bg-background-card p-6 shadow-lg">
            <TaskDetail
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </AnimatedPage>
  );
}
