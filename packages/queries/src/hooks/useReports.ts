import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import { getCurrentWeekStart } from '@keurzen/shared';
import type { WeeklyReport } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  current: (householdId: string) => ['reports', householdId, 'current'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWeeklyReport() {
  const { currentHousehold } = useHouseholdStore();
  const weekStart = useMemo(() => getCurrentWeekStart(), []);

  return useQuery({
    queryKey: reportKeys.current(currentHousehold?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('household_id', currentHousehold!.id)
        .eq('week_start', weekStart)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows = no report yet
        throw new Error(error.message);
      }
      return data as WeeklyReport;
    },
    enabled: !!currentHousehold?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegenerateReport() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Non authentifié');
      if (!currentHousehold) throw new Error('Aucun foyer');

      // Get the Supabase URL from the client's internal config
      // We use the functions.invoke approach for consistency
      const { data, error } = await supabase.functions.invoke('generate-weekly-report', {
        body: { household_id: currentHousehold.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message);

      const payload = data as { success?: boolean; error?: string } | null;
      if (payload && !payload.success) {
        throw new Error(payload.error ?? 'Erreur inconnue');
      }

      return payload;
    },
    onSuccess: () => {
      if (currentHousehold) {
        qc.invalidateQueries({
          queryKey: reportKeys.current(currentHousehold.id),
        });
      }
    },
  });
}
