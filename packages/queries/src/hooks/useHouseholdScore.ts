import { useTasks } from './useTasks';
import { useWeeklyBalance } from './useWeeklyStats';
import { useCurrentTlx } from './useTlx';
import { computeHouseholdScore, type HouseholdScoreResult } from '@keurzen/shared';

/**
 * Computes the household score from tasks, weekly balance, and TLX data.
 * Shared between mobile and web dashboard pages.
 */
export function useHouseholdScore(): { score: HouseholdScoreResult; isLoading: boolean } {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { members, isLoading: balanceLoading } = useWeeklyBalance();
  const { data: tlxEntry, isLoading: tlxLoading } = useCurrentTlx();

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance = members.length > 0
    ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
    : 0;
  const averageTlx = tlxEntry?.score ?? 0;
  const streakDays = 3; // TODO: compute from real data

  const score = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays,
  });

  return {
    score,
    isLoading: tasksLoading || balanceLoading || tlxLoading,
  };
}
