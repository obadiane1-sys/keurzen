'use client';

import { useRouter } from 'next/navigation';
import { CalendarCheck, AlertTriangle, ListChecks, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import {
  useTasks,
  useOverdueTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
  useTlxDelta,
  useUnreadCount,
} from '@keurzen/queries';
import { getGreeting } from '@keurzen/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { TlxCard } from '@/components/dashboard/TlxCard';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { RecentlyDone } from '@/components/dashboard/RecentlyDone';
import { WeeklyReportSection } from '@/components/dashboard/WeeklyReportSection';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: allTasks = [], isLoading } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();
  const { data: unreadCount = 0 } = useUnreadCount();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const greeting = getGreeting();
  const activeTasks = allTasks.filter((t) => t.status !== 'done');
  const doneTasks = allTasks.filter((t) => t.status === 'done');

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
        title={`${greeting}, ${firstName}`}
        userName={profile?.full_name || undefined}
        avatarUrl={profile?.avatar_url}
        unreadCount={unreadCount}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-sm:grid-cols-1">
        <StatCard
          label="Aujourd'hui"
          value={todayTasks.length.toString()}
          icon={CalendarCheck}
          color="var(--color-sauge)"
          onClick={() => router.push('/tasks')}
        />
        <StatCard
          label="En retard"
          value={overdueTasks.length.toString()}
          icon={AlertTriangle}
          color={overdueTasks.length > 0 ? 'var(--color-rose)' : 'var(--color-text-muted)'}
          onClick={() => router.push('/tasks')}
        />
        <StatCard
          label="Total actif"
          value={activeTasks.length.toString()}
          icon={ListChecks}
          color="var(--color-miel)"
          onClick={() => router.push('/tasks')}
        />
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <Card
          hoverable
          onClick={() => router.push('/tasks')}
          className="mb-6 flex items-center gap-3 border border-rose/20 bg-rose/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-rose/15">
            <AlertTriangle size={18} className="text-rose" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {overdueTasks.length} tache{overdueTasks.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs text-text-muted truncate">
              {overdueTasks
                .slice(0, 2)
                .map((t) => t.title)
                .join(', ')}
              {overdueTasks.length > 2 ? '...' : ''}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </Card>
      )}

      {/* Balance + TLX — 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <BalanceCard members={balanceMembers} />
        <TlxCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
      </div>

      {/* Today Tasks + Recently Done — 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <TodayTasks tasks={todayTasks} />
        <RecentlyDone tasks={doneTasks} />
      </div>

      {/* Weekly Report — full width */}
      <WeeklyReportSection />
    </>
  );
}
