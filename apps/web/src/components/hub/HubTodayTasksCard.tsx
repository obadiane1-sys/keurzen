'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTasks, useTodayTasks } from '@keurzen/queries';

export function HubTodayTasksCard() {
  const router = useRouter();
  const tasksQ = useTasks();
  const today = useTodayTasks();
  const visible = today.slice(0, 3);

  return (
    <section className="flex min-h-[240px] flex-col justify-between rounded-2xl border border-border bg-background-card p-6">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h2 className="text-base font-bold text-primary">
          {"Aujourd'hui"}
        </h2>
      </div>

      {tasksQ.isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 rounded-lg bg-primary-surface" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="my-6 text-center text-sm font-semibold text-text-muted">
          Journée libre ✨
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {visible.map((task, idx) => (
            <li key={task.id} className="flex items-center gap-3">
              <span className="w-6 text-xs text-primary">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => router.push('/tasks')}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-primary hover:opacity-70 active:scale-[0.97] transition-all duration-150"
      >
        VOIR TOUTES LES TÂCHES
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
