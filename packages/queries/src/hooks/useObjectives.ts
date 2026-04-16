import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { WeeklyObjective } from '@keurzen/shared';
import { getSupabaseClient } from '../client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export const objectiveKeys = {
  current: (householdId: string) => ['weekly-objective', householdId, 'current'] as const,
};

async function fetchAndRefreshObjective(householdId: string): Promise<WeeklyObjective | null> {
  const supabase = getSupabaseClient();

  // Refresh progress first
  await supabase.rpc('refresh_objective_progress');

  // Then fetch the updated objective
  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('weekly_objectives')
    .select('*')
    .eq('household_id', householdId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as WeeklyObjective | null;
}

export function useWeeklyObjective() {
  const { currentHousehold } = useHouseholdStore();
  const householdId = currentHousehold?.id ?? '';

  const query = useQuery({
    queryKey: objectiveKeys.current(householdId),
    queryFn: () => fetchAndRefreshObjective(householdId),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 min — refreshed on pull-to-refresh anyway
  });

  const objective = query.data ?? null;

  let progress = 0;
  if (objective) {
    if (objective.achieved) {
      progress = 100;
    } else if (objective.type === 'balance' || objective.type === 'tlx') {
      const range = objective.baseline_value - objective.target_value;
      if (range > 0) {
        progress = Math.min(100, Math.max(0,
          Math.round(((objective.baseline_value - objective.current_value) / range) * 100)
        ));
      }
    } else {
      if (objective.target_value > 0) {
        progress = Math.min(100, Math.max(0,
          Math.round((objective.current_value / objective.target_value) * 100)
        ));
      }
    }
  }

  return {
    objective,
    isLoading: query.isLoading,
    isAchieved: objective?.achieved ?? false,
    progress,
  };
}
