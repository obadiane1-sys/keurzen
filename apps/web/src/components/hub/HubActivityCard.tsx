'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import { useRecentActivity } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import type { ActivityItem } from '@keurzen/queries';
import type { HouseholdMember } from '@keurzen/shared';

dayjs.extend(relativeTime);
dayjs.locale('fr');

function memberLabel(memberId: string | null, members: HouseholdMember[]) {
  if (!memberId) return { initial: '?', name: "Quelqu'un" };
  const m = members.find((x) => x.user_id === memberId);
  const name = m?.profile?.full_name?.split(' ')[0] ?? 'Membre';
  return { initial: name.slice(0, 1).toUpperCase(), name };
}

export function HubActivityCard() {
  const router = useRouter();
  const { items, isLoading } = useRecentActivity(3);
  const { members } = useHouseholdStore();

  return (
    <section className="flex min-h-[240px] flex-col justify-between rounded-2xl border border-border bg-background-card p-6">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h2 className="text-base font-bold text-primary">
          Activité récente
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-primary-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="my-6 text-center text-sm font-semibold text-text-muted">
          Aucune activité récente
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {items.map((it: ActivityItem) => {
            const { initial, name } = memberLabel(it.memberId, members);
            const verb = it.kind === 'completed' ? 'a terminé' : 'a ajouté';
            return (
              <li key={it.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-surface text-xs font-bold text-primary">
                  {initial}
                </div>
                <div className="flex-1">
                  <p className="truncate text-xs text-text-primary">
                    <span className="font-bold">{name}</span> {verb} {it.taskTitle}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold tracking-[1.5px] text-text-muted">
                    {dayjs(it.timestamp).fromNow().toUpperCase()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
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
