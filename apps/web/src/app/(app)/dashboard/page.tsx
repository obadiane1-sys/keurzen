'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useTasks } from '@keurzen/queries';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TlxSummaryCard } from '@/components/dashboard/TlxSummaryCard';
import { TodayTasksCard } from '@/components/dashboard/TodayTasksCard';
import { RepartitionCard } from '@/components/dashboard/RepartitionCard';
import { WeeklyTipCard } from '@/components/dashboard/WeeklyTipCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isLoading } = useTasks();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] gap-8 px-6 py-8 max-lg:flex-col">
      {/* Sticky sidebar with score */}
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <h1 className="mb-6 font-heading text-[22px] font-extrabold text-text-primary">
          Tableau de bord
        </h1>

        {/* TLX + Repartition — 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
          <TlxSummaryCard />
          <RepartitionCard />
        </div>

        {/* Today tasks — full width */}
        <div className="mb-4">
          <TodayTasksCard />
        </div>

        {/* Weekly tip — full width */}
        <WeeklyTipCard />
      </main>
    </div>
  );
}
