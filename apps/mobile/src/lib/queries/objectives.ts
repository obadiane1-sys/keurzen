import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import type { WeeklyObjective } from '../../types';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export const objectiveKeys = {
  current: (householdId: string) => ['weekly-objective', householdId, 'current'] as const,
};

async function fetchAndRefreshObjective(householdId: string): Promise<WeeklyObjective | null> {
  // Refresh progress first
  // @ts-expect-error refresh_objective_progress RPC not in linked types yet (migration 023 pending push)
  await supabase.rpc('refresh_objective_progress');

  // Then fetch the updated objective
  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

  const { data, error } = await supabase
    // @ts-expect-error weekly_objectives table not in linked types yet (migration 023 pending push)
    .from('weekly_objectives')
    .select('*')
    // @ts-expect-error weekly_objectives column types unavailable (migration 023 pending push)
    .eq('household_id', householdId)
    // @ts-expect-error weekly_objectives column types unavailable (migration 023 pending push)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as WeeklyObjective | null;
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

  // Compute progress 0–100
  let progress = 0;
  if (objective) {
    if (objective.achieved) {
      progress = 100;
    } else if (objective.type === 'balance' || objective.type === 'tlx') {
      // Inverted: lower is better. Progress = how far from baseline toward target.
      const range = objective.baseline_value - objective.target_value;
      if (range > 0) {
        progress = Math.min(100, Math.max(0,
          Math.round(((objective.baseline_value - objective.current_value) / range) * 100)
        ));
      }
    } else {
      // Normal: higher is better
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
