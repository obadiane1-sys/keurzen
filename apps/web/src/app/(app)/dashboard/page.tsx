'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useCoachingInsights } from '@keurzen/queries';
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '@/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '@/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '@/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';
import { HomeHeartCard } from '@/components/dashboard/HomeHeartCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: insights = [] } = useCoachingInsights();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-secondary mb-1">
            Bonjour
          </p>
          <h1 className="text-[28px] font-bold text-v2-on-surface tracking-tight">
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-v2-surface-container transition-colors hover:bg-v2-surface-highest"
          aria-label="Notifications"
        >
          <span className="text-base">🔔</span>
        </button>
      </div>

      {/* Insights Carousel */}
      <InsightsCarousel insights={insights} />

      {/* Score Hero */}
      <ScoreHeroCard />

      {/* Equity + Mental Load — asymmetric grid */}
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 max-md:grid-cols-1">
        <TaskEquityCard />
        <MentalLoadCardV2 />
      </div>

      {/* Upcoming Tasks */}
      <UpcomingTasksCard />

      {/* Home Heart */}
      <HomeHeartCard />
    </div>
  );
}
