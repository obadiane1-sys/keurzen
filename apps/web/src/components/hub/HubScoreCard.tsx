'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStats } from '@keurzen/queries';

export function HubScoreCard() {
  const router = useRouter();
  const stats = useStats({ scope: 'household', period: 'day' });
  const value = stats.score?.total ?? null;

  return (
    <section
      className="flex min-h-[240px] flex-col justify-between rounded-2xl border p-6"
      style={{ backgroundColor: '#F9F8FD', borderColor: '#DCD7E8' }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#967BB6' }} />
        <h2 className="text-base font-bold" style={{ color: '#967BB6' }}>
          Score du jour
        </h2>
      </div>

      {stats.isLoading ? (
        <div className="my-5 flex-1 rounded-xl" style={{ backgroundColor: '#F3F0FF' }} />
      ) : value == null ? (
        <div className="my-3 flex flex-col items-center gap-2">
          <p className="text-base font-bold" style={{ color: '#5F5475' }}>
            Ajoute ta première tâche
          </p>
          <p className="text-center text-xs" style={{ color: 'rgba(95,84,117,0.7)' }}>
            Ton score d&apos;équilibre apparaît dès que le foyer a des tâches suivies.
          </p>
          <button
            type="button"
            onClick={() => router.push('/tasks/create')}
            className="mt-2 rounded-full px-4 py-2 text-[10px] font-bold text-white"
            style={{ backgroundColor: '#967BB6', letterSpacing: 2 }}
          >
            NOUVELLE TÂCHE
          </button>
        </div>
      ) : (
        <div className="flex items-end justify-center">
          <span className="text-[72px] font-bold leading-[80px]" style={{ color: '#5F5475' }}>
            {Math.round(value)}
          </span>
          <span className="mb-3 ml-1 text-xl" style={{ color: 'rgba(95,84,117,0.6)' }}>
            /100
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold"
        style={{ color: '#967BB6', letterSpacing: 2 }}
      >
        VOIR LE TABLEAU DE BORD
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
