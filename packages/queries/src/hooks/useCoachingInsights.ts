import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { CoachingInsight } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const coachingInsightsKeys = {
  all: (householdId: string) => ['coaching-insights', householdId] as const,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCoachingInsights() {
  const { currentHousehold } = useHouseholdStore();
  const householdId = currentHousehold?.id ?? '';

  return useQuery<CoachingInsight[]>({
    queryKey: coachingInsightsKeys.all(householdId),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.functions.invoke('get-coaching-insights');

      if (error) throw new Error(error.message);
      return (data as CoachingInsight[]) ?? [];
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
