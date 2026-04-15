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
    <section
      className="flex min-h-[240px] flex-col justify-between rounded-2xl border p-6"
      style={{ backgroundColor: '#F9F8FD', borderColor: '#DCD7E8' }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#967BB6' }} />
        <h2 className="text-base font-bold" style={{ color: '#967BB6' }}>
          Activité récente
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 rounded-lg" style={{ backgroundColor: '#F3F0FF' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p
          className="my-6 text-center text-sm font-semibold"
          style={{ color: 'rgba(95,84,117,0.6)' }}
        >
          Aucune activité récente
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {items.map((it: ActivityItem) => {
            const { initial, name } = memberLabel(it.memberId, members);
            const verb = it.kind === 'completed' ? 'a terminé' : 'a ajouté';
            return (
              <li key={it.id} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#F3F0FF', color: '#967BB6' }}
                >
                  {initial}
                </div>
                <div className="flex-1">
                  <p className="truncate text-xs" style={{ color: '#5F5475' }}>
                    <span className="font-bold">{name}</span> {verb} {it.taskTitle}
                  </p>
                  <p
                    className="mt-0.5 text-[9px] font-semibold"
                    style={{ color: 'rgba(95,84,117,0.5)', letterSpacing: 1.5 }}
                  >
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
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold"
        style={{ color: '#967BB6', letterSpacing: 2 }}
      >
        VOIR LE TABLEAU DE BORD
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
