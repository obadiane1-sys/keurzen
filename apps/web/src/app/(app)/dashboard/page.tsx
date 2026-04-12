'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useWeeklyBalance, useCurrentTlx, useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';
import { DreamHeader } from '@/components/dashboard/DreamHeader';
import { HouseholdScoreCard } from '@/components/dashboard/HouseholdScoreCard';
import { TaskEquityBar } from '@/components/dashboard/TaskEquityBar';
import { AlertCard, MOCK_ALERTS } from '@/components/dashboard/AlertCard';
import { UpcomingTasksList } from '@/components/dashboard/UpcomingTasksList';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { data: tlxEntry } = useCurrentTlx();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // Compute score
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance = members.length > 0
    ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
    : 0;
  const averageTlx = tlxEntry?.score ?? 0;
  const streakDays = 3;

  const scoreResult = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays,
  });

  const trend = 5;

  const handleToggle = (id: string) => {
    updateStatus({ id, status: 'done' });
  };

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

      <UpcomingTasksList tasks={tasks} onToggleStatus={handleToggle} />
    </div>
  );
}
