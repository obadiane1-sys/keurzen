'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useCoachingInsights } from '@keurzen/queries';
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '@/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '@/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '@/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';

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
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-card shadow-card">
            <span className="text-xl">🏠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Bonjour,{' '}
              <span className="text-terracotta">{firstName}</span>
            </h1>
            <p className="text-sm text-text-muted">
              Prête à équilibrer votre quotidien ?
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/notifications')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background-card shadow-card transition-colors hover:bg-border-light"
          aria-label="Notifications"
        >
          <span className="text-lg">🔔</span>
        </button>
      </div>

      {/* Insights Carousel */}
      <InsightsCarousel insights={insights} />

      {/* Score Hero */}
      <ScoreHeroCard />

      {/* Equity + Mental Load — 2 columns */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <TaskEquityCard />
        <MentalLoadCardV2 />
      </div>

      {/* Upcoming Tasks */}
      <UpcomingTasksCard />
    </div>
  );
}
