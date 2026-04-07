'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { useTasks, useDeleteTask } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { cn } from '@/lib/utils';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

type Tab = 'all' | 'today' | 'overdue' | 'done';

export default function TasksPage() {
  const { profile } = useAuthStore();
  const { data: tasks = [], isLoading } = useTasks();
  const { mutate: deleteTask } = useDeleteTask();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // ─── Counts ──────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    let allCount = 0;
    let todayCount = 0;
    let overdueCount = 0;
    let doneCount = 0;

    for (const t of tasks) {
      if (t.status === 'done') {
        doneCount++;
        continue;
      }
      allCount++;
      if (t.due_date === today) todayCount++;
      if (t.due_date && dayjs(t.due_date).isBefore(now, 'day')) overdueCount++;
    }

    return { all: allCount, today: todayCount, overdue: overdueCount, done: doneCount };
  }, [tasks, today, now]);

  // ─── Hero message ────────────────────────────────────────────────────────

  const heroMessage = useMemo(() => {
    if (counts.all === 0 && counts.done > 0) return 'Tout est fait, beau travail !';
    const parts: string[] = [];
    if (counts.overdue > 0) parts.push(`${counts.overdue} en retard`);
    if (counts.today > 0) parts.push(`${counts.today} pour aujourd'hui`);
    if (parts.length === 0) return `${counts.all} tâche${counts.all > 1 ? 's' : ''} en cours`;
    return parts.join(' · ');
  }, [counts]);

  // ─── Tabs definition ────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: counts.all },
    { key: 'today', label: "Aujourd'hui", count: counts.today },
    { key: 'overdue', label: 'En retard', count: counts.overdue },
    { key: 'done', label: 'Faites', count: counts.done },
  ];

  const filteredTasks = useMemo(() => {
    let result = tasks;

    switch (activeTab) {
      case 'today':
        result = result.filter(
          (t) => t.due_date === today && t.status !== 'done',
        );
        break;
      case 'overdue':
        result = result.filter(
          (t) =>
            t.status !== 'done' &&
            t.due_date &&
            dayjs(t.due_date).isBefore(now, 'day'),
        );
        break;
      case 'done':
        result = result.filter((t) => t.status === 'done');
        break;
      default: // 'all' — non-done only
        result = result.filter((t) => t.status !== 'done');
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assigned_profile?.full_name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, activeTab, search, today, now]);

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
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Hero Header */}
      <div className="flex items-center justify-between px-1 pt-2 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Bonjour {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {heroMessage}
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Creer
        </Button>
      </div>

      {/* Tabs with counters */}
      <div className="mb-4 flex items-center gap-1 border-b border-border-light">
        {TABS.map(({ key, label, count }) => {
          const isOverdueTab = key === 'overdue' && activeTab !== key && count > 0;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setSelectedTaskId(null);
              }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {label}
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  activeTab === key ? 'text-terracotta' : isOverdueTab ? 'text-rose' : 'text-text-muted',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-background-card pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-terracotta focus:outline-none"
        />
      </div>

      {/* Split View */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Aucune tache"
          subtitle={
            activeTab === 'done'
              ? 'Rien de termine pour le moment'
              : 'Creez votre premiere tache'
          }
          action={
            activeTab !== 'done'
              ? { label: 'Creer une tache', onClick: () => setShowCreate(true) }
              : undefined
          }
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
              tasks={filteredTasks}
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
    </>
  );
}
