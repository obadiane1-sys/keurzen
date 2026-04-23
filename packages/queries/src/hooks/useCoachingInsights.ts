import { useQuery } from '@tanstack/react-query';
import type { CoachingInsight } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

export const insightKeys = {
  all: (householdId: string) => ['coaching-insights', householdId] as const,
};

export function useCoachingInsights(householdId: string | undefined) {
  return useQuery<CoachingInsight[]>({
    queryKey: insightKeys.all(householdId ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('get-coaching-insights');
      if (error) throw error;
      return (data as CoachingInsight[]) ?? [];
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
