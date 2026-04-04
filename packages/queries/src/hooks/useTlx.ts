import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import type { TlxEntry, TlxFormValues } from '@keurzen/shared';
import { computeTlxScore, getCurrentWeekStart, getPreviousWeekStart } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const tlxKeys = {
  all: (userId: string) => ['tlx', userId] as const,
  currentWeek: (userId: string) => ['tlx', userId, 'current'] as const,
  history: (userId: string, householdId: string) =>
    ['tlx', userId, householdId, 'history'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCurrentTlx() {
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: tlxKeys.currentWeek(user?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const weekStart = getCurrentWeekStart();

      const { data, error } = await supabase
        .from('tlx_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('household_id', currentHousehold!.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as TlxEntry | null;
    },
    enabled: !!user?.id && !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTlxHistory(limit = 12) {
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: tlxKeys.history(user?.id ?? '', currentHousehold?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('tlx_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('household_id', currentHousehold!.id)
        .order('week_start', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data as TlxEntry[]) ?? [];
    },
    enabled: !!user?.id && !!currentHousehold?.id,
  });
}

export function useSubmitTlx() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (values: TlxFormValues) => {
      const supabase = getSupabaseClient();
      const weekStart = getCurrentWeekStart();
      const score = computeTlxScore(values);

      const { data, error } = await supabase
        .from('tlx_entries')
        .upsert(
          {
            user_id: user!.id,
            household_id: currentHousehold!.id,
            week_start: weekStart,
            ...values,
            score,
          },
          { onConflict: 'user_id,household_id,week_start' }
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as TlxEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tlxKeys.currentWeek(user!.id) });
      qc.invalidateQueries({
        queryKey: tlxKeys.history(user!.id, currentHousehold!.id),
      });
    },
  });
}

export function useTlxDelta() {
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: ['tlx', user?.id, 'delta'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const currentWeek = getCurrentWeekStart();
      const prevWeek = getPreviousWeekStart();

      const { data, error } = await supabase
        .from('tlx_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('household_id', currentHousehold!.id)
        .in('week_start', [currentWeek, prevWeek])
        .order('week_start', { ascending: false });

      if (error) throw new Error(error.message);
      const entries = (data as TlxEntry[]) ?? [];

      const current = entries.find((e) => e.week_start === currentWeek);
      const previous = entries.find((e) => e.week_start === prevWeek);

      if (!current) return null;
      if (!previous) return { score: current.score, delta: null, hasComparison: false };

      const delta = current.score - previous.score;
      return { score: current.score, delta, hasComparison: true };
    },
    enabled: !!user?.id && !!currentHousehold?.id,
  });
}
