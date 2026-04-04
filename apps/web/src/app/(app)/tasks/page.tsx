'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { useTasks } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { cn } from '@/lib/utils';
import type { Task } from '@keurzen/shared';
import dayjs from 'dayjs';

type Tab = 'all' | 'today' | 'overdue' | 'done';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'overdue', label: 'En retard' },
  { key: 'done', label: 'Faites' },
];

export default function TasksPage() {
  const { profile } = useAuthStore();
  const { data: tasks = [], isLoading } = useTasks();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const now = dayjs();
  const today = now.format('YYYY-MM-DD');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by tab
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
      default: // 'all'
        result = result.filter((t) => t.status !== 'done');
        break;
    }

    // Filter by search
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
      <PageHeader
        title="Taches"
        userName={profile?.full_name || undefined}
        avatarUrl={profile?.avatar_url}
        actions={
          <Button size="md" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Creer
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-border-light">
        {TABS.map(({ key, label }) => (
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
          </button>
        ))}
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
          {/* Task List */}
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
            />
          </div>

          {/* Detail Panel — desktop */}
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
