import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { WeeklyStat, AlertLevel } from '@keurzen/shared';
import { colors } from '@keurzen/shared';
import { getSupabaseClient } from '../client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

// ─── Constants ────────────────────────────────────────────────────────────────

export const IMBALANCE_THRESHOLD = 0.2; // 20% deviation from expected share
export const MIN_TASKS_SAMPLE = 8;
export const MIN_MINUTES_SAMPLE = 60;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const weeklyStatsKeys = {
  current: (householdId: string) => ['weekly-stats', householdId, 'current'] as const,
  history: (householdId: string) => ['weekly-stats', householdId, 'history'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCurrentWeekStats() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: weeklyStatsKeys.current(currentHousehold?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('weekly_stats')
        .select('*, profile:profiles(*)')
        .eq('household_id', currentHousehold!.id)
        .eq('week_start', weekStart)
        .order('tasks_share', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as WeeklyStat[]) ?? [];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Imbalance Level Computation ──────────────────────────────────────────────

export function computeImbalanceLevel(
  delta: number,
  totalTasks: number,
  totalMinutes: number
): AlertLevel {
  if (totalTasks < MIN_TASKS_SAMPLE || totalMinutes < MIN_MINUTES_SAMPLE) {
    return 'balanced';
  }

  const absDelta = Math.abs(delta);
  if (absDelta >= IMBALANCE_THRESHOLD * 1.5) return 'unbalanced';
  if (absDelta >= IMBALANCE_THRESHOLD) return 'watch';
  return 'balanced';
}

// ─── Weekly Balance Card Data ─────────────────────────────────────────────────

export interface MemberBalance {
  userId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  tasksShare: number;
  minutesShare: number;
  tasksDelta: number;
  minutesDelta: number;
  level: AlertLevel;
}

/**
 * Fallback: compute weekly balance on-the-fly from completed tasks
 * when the weekly_stats table has no data for the current week
 * (e.g. cron hasn't run yet).
 */
function useWeeklyBalanceFallback() {
  const { currentHousehold } = useHouseholdStore();
  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');
  const weekEnd = dayjs().startOf('isoWeek').add(7, 'day').format('YYYY-MM-DD');

  return useQuery({
    queryKey: ['weekly-balance-fallback', currentHousehold?.id ?? '', weekStart],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('assigned_to, assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)')
        .eq('household_id', currentHousehold!.id)
        .eq('status', 'done')
        .gte('completed_at', weekStart)
        .lt('completed_at', weekEnd);

      if (error) throw new Error(error.message);
      return tasks ?? [];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useWeeklyBalance(): { members: MemberBalance[]; isLoading: boolean } {
  const { data: stats = [], isLoading: statsLoading } = useCurrentWeekStats();
  const { data: fallbackTasks = [], isLoading: fallbackLoading } = useWeeklyBalanceFallback();
  const { members: householdMembers } = useHouseholdStore();

  // Use pre-computed stats if available
  if (stats.length > 0) {
    const members: MemberBalance[] = stats.map((s) => {
      const hMember = householdMembers.find((m) => m.user_id === s.user_id);
      return {
        userId: s.user_id,
        name: s.profile?.full_name ?? 'Membre',
        color: hMember?.color ?? colors.sauge.web,
        avatarUrl: s.profile?.avatar_url ?? null,
        tasksShare: s.tasks_share,
        minutesShare: s.minutes_share,
        tasksDelta: s.tasks_delta,
        minutesDelta: s.minutes_delta,
        level: computeImbalanceLevel(s.tasks_delta, s.total_tasks_week, s.total_minutes_week),
      };
    });
    return { members, isLoading: statsLoading };
  }

  // Fallback: compute from actual completed tasks
  const totalTasks = fallbackTasks.length;
  if (totalTasks === 0) {
    return { members: [], isLoading: statsLoading || fallbackLoading };
  }

  const tasksByUser = new Map<string, { count: number; name: string; avatarUrl: string | null }>();
  for (const t of fallbackTasks) {
    if (!t.assigned_to) continue;
    const existing = tasksByUser.get(t.assigned_to);
    if (existing) {
      existing.count++;
    } else {
      tasksByUser.set(t.assigned_to, {
        count: 1,
        name: (t.assigned_profile as any)?.full_name ?? 'Membre',
        avatarUrl: (t.assigned_profile as any)?.avatar_url ?? null,
      });
    }
  }

  const assignedTotal = Array.from(tasksByUser.values()).reduce((sum, v) => sum + v.count, 0);
  const nbMembers = Math.max(householdMembers.length, tasksByUser.size);
  const expectedShare = nbMembers > 0 ? 1 / nbMembers : 0;

  const members: MemberBalance[] = Array.from(tasksByUser.entries()).map(([userId, data]) => {
    const hMember = householdMembers.find((m) => m.user_id === userId);
    const tasksShare = assignedTotal > 0 ? data.count / assignedTotal : 0;
    return {
      userId,
      name: data.name,
      color: hMember?.color ?? colors.sauge.web,
      avatarUrl: data.avatarUrl,
      tasksShare,
      minutesShare: 0,
      tasksDelta: tasksShare - expectedShare,
      minutesDelta: 0,
      level: 'balanced' as AlertLevel,
    };
  });

  members.sort((a, b) => b.tasksShare - a.tasksShare);

  return { members, isLoading: statsLoading || fallbackLoading };
}
