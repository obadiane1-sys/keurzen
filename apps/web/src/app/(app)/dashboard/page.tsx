'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useWeeklyBalance, useTasks, useHouseholdScore } from '@keurzen/queries';
import { DreamHeader } from '@/components/dashboard/DreamHeader';
import { HouseholdScoreCard } from '@/components/dashboard/HouseholdScoreCard';
import { TaskEquityBar } from '@/components/dashboard/TaskEquityBar';
import { AlertCard, MOCK_ALERTS } from '@/components/dashboard/AlertCard';
import { UpcomingTasksList } from '@/components/dashboard/UpcomingTasksList';
import { CompletionRatingDialog } from '@/components/dashboard/CompletionRatingDialog';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { score: scoreResult } = useHouseholdScore();
  const [ratingTask, setRatingTask] = useState<{ id: string; title: string } | null>(null);

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const trend = 5; // Mock trend for now

  function handleToggle(id: string) {
    const task = tasks.find((t: any) => t.id === id);
    if (task) {
      setRatingTask({ id: (task as any).id, title: (task as any).title });
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">
      <DreamHeader firstName={firstName} />
      <HouseholdScoreCard score={scoreResult.total} trend={trend} />
      <TaskEquityBar members={members} />

      {/* Alert cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AlertCard alert={MOCK_ALERTS[0]} />
          <AlertCard alert={MOCK_ALERTS[1]} />
        </div>
        <AlertCard alert={MOCK_ALERTS[2]} fullWidth />
      </div>

      <UpcomingTasksList tasks={tasks as any} onToggleStatus={handleToggle} />

      {ratingTask && (
        <CompletionRatingDialog
          taskId={ratingTask.id}
          taskTitle={ratingTask.title}
          onClose={() => setRatingTask(null)}
        />
      )}
    </div>
  );
}
