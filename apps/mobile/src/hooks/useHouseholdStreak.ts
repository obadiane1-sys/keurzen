import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { useHouseholdStore } from '../stores/household.store';
import dayjs from 'dayjs';

/**
 * Calculates the streak of consecutive days (going backwards from today)
 * where the household had at least 1 task completed.
 */

export const streakKeys = {
  household: (householdId: string) => ['household-streak', householdId] as const,
};

async function fetchStreak(householdId: string): Promise<number> {
  // Fetch completed_at dates for the last 30 days
  const since = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('household_id', householdId)
    .eq('status', 'done')
    .not('completed_at', 'is', null)
    .gte('completed_at', since)
    .order('completed_at', { ascending: false });

  if (error) throw new Error(error.message);

  const completedDates = new Set(
    (data ?? []).map((row) => dayjs(row.completed_at).format('YYYY-MM-DD')),
  );

  // Count consecutive days backwards from today
  let streak = 0;
  let day = dayjs();

  while (completedDates.has(day.format('YYYY-MM-DD'))) {
    streak++;
    day = day.subtract(1, 'day');
  }

  return streak;
}

export function useHouseholdStreak() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: streakKeys.household(currentHousehold?.id ?? ''),
    queryFn: () => fetchStreak(currentHousehold!.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5,
  });
}
