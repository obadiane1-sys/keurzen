'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import { useCoachingInsights } from '@keurzen/queries';
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '@/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '@/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '@/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();
  const { data: insights = [] } = useCoachingInsights(currentHousehold?.id);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-background-card shadow-card flex items-center justify-center">
            <span className="text-2xl">🏠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Bonjour, <span className="text-terracotta">{firstName}</span>
            </h1>
            <p className="text-sm text-text-muted">
              Prete a equilibrer votre quotidien ?
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-background-card shadow-card flex items-center justify-center text-text-primary hover:bg-border-light transition-colors"
          aria-label="Notifications"
        >
          🔔
        </button>
      </header>

      {/* Insights */}
      <InsightsCarousel insights={insights} />

      {/* Score */}
      <ScoreHeroCard />

      {/* Grid: Equity + Mental Load */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <TaskEquityCard />
        <MentalLoadCardV2 />
      </div>

      {/* Upcoming Tasks */}
      <UpcomingTasksCard />
    </div>
  );
}
