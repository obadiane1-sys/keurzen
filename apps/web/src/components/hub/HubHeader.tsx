'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useAuthStore } from '@keurzen/stores';
import { useHouseholdStore } from '@keurzen/stores';
import { useNotifications } from '@keurzen/queries';
import type { InAppNotification } from '@keurzen/shared';

dayjs.locale('fr');

export function HubHeader() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();
  const { data: notifications = [] } = useNotifications();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const dateLabel = dayjs().format('dddd D MMMM').toUpperCase();
  const householdName = currentHousehold?.name ?? 'MON FOYER';
  const unreadCount = (notifications as InAppNotification[]).filter((n) => !n.read).length;
  const initial = firstName.slice(0, 1).toUpperCase() || '?';

  return (
    <header className="flex items-center gap-3 px-4 pt-3 pb-5 md:px-0">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => router.push('/notifications')}
        className="relative flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: '#F3F0FF' }}
      >
        <Bell size={20} color="#967BB6" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: '#967BB6' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="flex-1 text-center">
        <h1
          className="truncate text-2xl font-bold"
          style={{ color: '#5F5475', fontFamily: 'Nunito, sans-serif' }}
        >
          Bonjour {firstName || 'toi'}
        </h1>
        <p
          className="mt-1 truncate text-[10px] font-semibold"
          style={{
            color: 'rgba(95,84,117,0.7)',
            letterSpacing: 2,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {dateLabel} · {householdName.toUpperCase()}
        </p>
      </div>

      <button
        type="button"
        aria-label="Profil"
        onClick={() => router.push('/settings')}
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E5DBFF' }}
      >
        <span
          className="font-bold"
          style={{ color: '#5F5475', fontFamily: 'Nunito, sans-serif' }}
        >
          {initial}
        </span>
      </button>
    </header>
  );
}
