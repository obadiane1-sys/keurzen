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
    <section className="flex min-h-[240px] flex-col justify-between rounded-2xl border border-border bg-background-card p-6">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h2 className="text-base font-bold text-primary">
          Score du jour
        </h2>
      </div>

      {stats.isLoading ? (
        <div className="my-5 flex-1 rounded-xl bg-primary-surface" />
      ) : value == null ? (
        <div className="my-3 flex flex-col items-center gap-2">
          <p className="text-base font-bold text-text-primary">
            Ajoute ta première tâche
          </p>
          <p className="text-center text-xs text-text-muted">
            Ton score d&apos;équilibre apparaît dès que le foyer a des tâches suivies.
          </p>
          <button
            type="button"
            onClick={() => router.push('/tasks/create')}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-[10px] font-bold tracking-[2px] text-white hover:opacity-90 active:scale-[0.97] transition-all duration-150"
          >
            NOUVELLE TÂCHE
          </button>
        </div>
      ) : (
        <div className="flex items-end justify-center">
          <span className="text-[72px] font-bold leading-[80px] text-text-primary">
            {Math.round(value)}
          </span>
          <span className="mb-3 ml-1 text-xl text-text-muted">
            /100
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-primary hover:opacity-70 active:scale-[0.97] transition-all duration-150"
      >
        VOIR LE TABLEAU DE BORD
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
