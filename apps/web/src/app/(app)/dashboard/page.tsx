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

/** Fallback: compute equity from all assigned tasks when weekly stats are empty */
function computeEquityFromTasks(tasks: any[]) {
  const assigned = tasks.filter((t) => t.assigned_to);
  if (assigned.length === 0) return [];

  const byUser = new Map<string, { name: string; count: number }>();
  for (const t of assigned) {
    const existing = byUser.get(t.assigned_to);
    if (existing) {
      existing.count++;
    } else {
      byUser.set(t.assigned_to, {
        name: t.assigned_profile?.full_name ?? 'Membre',
        count: 1,
      });
    }
  }

  const total = assigned.length;
  const expectedShare = 1 / byUser.size;

  return Array.from(byUser.entries()).map(([userId, data]) => {
    const tasksShare = data.count / total;
    return { userId, name: data.name, tasksShare, tasksDelta: tasksShare - expectedShare };
  }).sort((a, b) => b.tasksShare - a.tasksShare);
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: tasks = [] } = useTasks();
  const { members: weeklyMembers } = useWeeklyBalance();
  const members = weeklyMembers.length >= 2 ? weeklyMembers : computeEquityFromTasks(tasks);
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
      <DreamHeader firstName={firstName} avatarUrl={profile?.avatar_url ?? null} />
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
