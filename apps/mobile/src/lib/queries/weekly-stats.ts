import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import type { WeeklyStat, Alert, AlertLevel } from '../../types';
import { Colors } from '../../constants/tokens';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

// ─── Constants ────────────────────────────────────────────────────────────────

export const IMBALANCE_THRESHOLD = 0.20; // 20% deviation from expected share
export const MIN_TASKS_SAMPLE = 8;
export const MIN_MINUTES_SAMPLE = 60;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const weeklyStatsKeys = {
  current: (householdId: string) => ['weekly-stats', householdId, 'current'] as const,
  history: (householdId: string) => ['weekly-stats', householdId, 'history'] as const,
  alerts: (householdId: string) => ['alerts', householdId] as const,
};

// ─── Fetch Current Week Stats ─────────────────────────────────────────────────

export function useCurrentWeekStats() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: weeklyStatsKeys.current(currentHousehold?.id ?? ''),
    queryFn: async () => {
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

// ─── Fetch Alerts ─────────────────────────────────────────────────────────────

export function useAlerts() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: weeklyStatsKeys.alerts(currentHousehold?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('household_id', currentHousehold!.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data as Alert[]) ?? [];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 0, // Toujours refetch au focus — les alertes sont créées par un cron externe
  });
}

// ─── Imbalance Level Computation ──────────────────────────────────────────────

export function computeImbalanceLevel(
  delta: number,
  totalTasks: number,
  totalMinutes: number
): AlertLevel {
  // Not enough data → treat as balanced
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

export function useWeeklyBalance(): { members: MemberBalance[]; isLoading: boolean } {
  const { data: stats = [], isLoading } = useCurrentWeekStats();
  const { members: householdMembers } = useHouseholdStore();

  const members: MemberBalance[] = stats.map((s) => {
    const hMember = householdMembers.find((m) => m.user_id === s.user_id);
    return {
      userId: s.user_id,
      name: s.profile?.full_name ?? 'Membre',
      color: hMember?.color ?? Colors.sauge,
      avatarUrl: s.profile?.avatar_url ?? null,
      tasksShare: s.tasks_share,
      minutesShare: s.minutes_share,
      tasksDelta: s.tasks_delta,
      minutesDelta: s.minutes_delta,
      level: computeImbalanceLevel(s.tasks_delta, s.total_tasks_week, s.total_minutes_week),
    };
  });

  return { members, isLoading };
}
