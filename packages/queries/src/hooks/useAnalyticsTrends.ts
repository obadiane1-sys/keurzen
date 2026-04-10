// packages/queries/src/hooks/useAnalyticsTrends.ts
import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { WeeklyStat, TlxEntry } from '@keurzen/shared';
import { getSupabaseClient } from '../client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export interface WeekTrend {
  weekStart: string;
  weekLabel: string;
  totalTasks: number;
  totalMinutes: number;
  avgTlxScore: number | null;
}

export const analyticsTrendsKeys = {
  trends: (householdId: string, weeks: number) =>
    ['analytics-trends', householdId, weeks] as const,
};

export function useAnalyticsTrends(weeks = 4) {
  const { currentHousehold } = useHouseholdStore();
  const householdId = currentHousehold?.id ?? '';

  return useQuery<WeekTrend[]>({
    queryKey: analyticsTrendsKeys.trends(householdId, weeks),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const currentWeekStart = dayjs().startOf('isoWeek');
      const startDate = currentWeekStart
        .subtract(weeks - 1, 'week')
        .format('YYYY-MM-DD');

      const { data: stats, error: statsErr } = await supabase
        .from('weekly_stats')
        .select('week_start, tasks_count, minutes_total, user_id')
        .eq('household_id', householdId)
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });

      if (statsErr) throw new Error(statsErr.message);

      const { data: tlxEntries, error: tlxErr } = await supabase
        .from('tlx_entries')
        .select('week_start, score, user_id')
        .eq('household_id', householdId)
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });

      if (tlxErr) throw new Error(tlxErr.message);

      const weekMap = new Map<string, WeekTrend>();

      for (let i = 0; i < weeks; i++) {
        const ws = currentWeekStart.subtract(weeks - 1 - i, 'week');
        const wsStr = ws.format('YYYY-MM-DD');
        const weekLabel = `S${ws.isoWeek()}`;
        weekMap.set(wsStr, {
          weekStart: wsStr,
          weekLabel,
          totalTasks: 0,
          totalMinutes: 0,
          avgTlxScore: null,
        });
      }

      const seenUsers = new Map<string, Set<string>>();
      for (const s of (stats as WeeklyStat[]) ?? []) {
        const entry = weekMap.get(s.week_start);
        if (!entry) continue;
        if (!seenUsers.has(s.week_start)) seenUsers.set(s.week_start, new Set());
        const users = seenUsers.get(s.week_start)!;
        if (users.has(s.user_id)) continue;
        users.add(s.user_id);
        entry.totalTasks += s.tasks_count;
        entry.totalMinutes += s.minutes_total;
      }

      const tlxByWeek = new Map<string, number[]>();
      for (const t of (tlxEntries as TlxEntry[]) ?? []) {
        if (!tlxByWeek.has(t.week_start)) tlxByWeek.set(t.week_start, []);
        tlxByWeek.get(t.week_start)!.push(t.score);
      }
      for (const [ws, scores] of tlxByWeek) {
        const entry = weekMap.get(ws);
        if (entry && scores.length > 0) {
          entry.avgTlxScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
        }
      }

      return Array.from(weekMap.values());
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });
}
