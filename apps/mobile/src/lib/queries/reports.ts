import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { getCurrentWeekStart } from './tlx';
import type { WeeklyReport } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  current: (householdId: string) => ['reports', householdId, 'current'] as const,
};

// ─── Fetch Current Week Report ────────────────────────────────────────────────

export function useWeeklyReport() {
  const { currentHousehold } = useHouseholdStore();
  const weekStart = useMemo(() => getCurrentWeekStart(), []);

  return useQuery({
    queryKey: reportKeys.current(currentHousehold?.id ?? ''),
    queryFn: async () => {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Regenerate Report ────────────────────────────────────────────────────────

export function useRegenerateReport() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Non authentifié');
      if (!currentHousehold) throw new Error('Aucun foyer');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/generate-weekly-report`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ household_id: currentHousehold.id }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.error ?? `Erreur ${res.status}`);
        }
        return payload;
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error('Délai dépassé — réessayez');
        }
        throw err;
      }
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

// ─── Weekly Review — Full Report with Metrics ────────────────────────────────

export function useWeeklyReview(weekStart?: string) {
  const { currentHousehold } = useHouseholdStore();
  const defaultWeek = useMemo(() => getCurrentWeekStart(), []);
  const week = weekStart ?? defaultWeek;

  return useQuery({
    queryKey: ['weekly-review', currentHousehold?.id ?? '', week] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('household_id', currentHousehold!.id)
        .eq('week_start', week)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as WeeklyReport | null;
    },
    enabled: !!currentHousehold?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Weekly Review History ───────────────────────────────────────────────────

export interface WeeklyReviewSummary {
  id: string;
  week_start: string;
  balance_score: number | null;
  total_tasks_completed: number;
  generated_at: string;
}

export function useWeeklyReviewHistory(limit = 8) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: ['weekly-review-history', currentHousehold?.id ?? '', limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, week_start, balance_score, total_tasks_completed, generated_at')
        .eq('household_id', currentHousehold!.id)
        .order('week_start', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as WeeklyReviewSummary[];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 5 * 60 * 1000,
  });
}
