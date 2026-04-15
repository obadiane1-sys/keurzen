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
    <section
      className="flex min-h-[240px] flex-col justify-between rounded-2xl border p-6"
      style={{ backgroundColor: '#F9F8FD', borderColor: '#DCD7E8' }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#967BB6' }} />
        <h2 className="text-base font-bold" style={{ color: '#967BB6' }}>
          {"Aujourd'hui"}
        </h2>
      </div>

      {tasksQ.isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 rounded-lg" style={{ backgroundColor: '#F3F0FF' }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p
          className="my-6 text-center text-sm font-semibold"
          style={{ color: 'rgba(95,84,117,0.6)' }}
        >
          Journée libre ✨
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {visible.map((task, idx) => (
            <li key={task.id} className="flex items-center gap-3">
              <span className="w-6 text-xs" style={{ color: '#967BB6' }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 truncate text-sm font-semibold" style={{ color: '#5F5475' }}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => router.push('/tasks')}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold"
        style={{ color: '#967BB6', letterSpacing: 2 }}
      >
        VOIR TOUTES LES TÂCHES
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
