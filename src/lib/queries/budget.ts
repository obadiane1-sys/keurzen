import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import type { BudgetExpense, BudgetExpenseFormValues } from '../../types';
import dayjs from 'dayjs';

export const budgetKeys = {
  all: (householdId: string) => ['budget', householdId] as const,
  month: (householdId: string, month: string) => ['budget', householdId, month] as const,
};

export function useBudgetExpenses(month?: string) {
  const { currentHousehold } = useHouseholdStore();
  const targetMonth = month ?? dayjs().format('YYYY-MM');

  return useQuery({
    queryKey: budgetKeys.month(currentHousehold?.id ?? '', targetMonth),
    queryFn: async () => {
      const startDate = dayjs(targetMonth).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(targetMonth).endOf('month').format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('budget_expenses')
        .select('*, paid_by_profile:profiles!budget_expenses_paid_by_fkey(id, full_name, avatar_url)')
        .eq('household_id', currentHousehold!.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as BudgetExpense[]) ?? [];
    },
    enabled: !!currentHousehold?.id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const currentMonth = dayjs().format('YYYY-MM');

  return useMutation({
    mutationFn: async (values: BudgetExpenseFormValues) => {
      const amountCents = Math.round(parseFloat(values.amount) * 100);

      const { data, error } = await supabase
        .from('budget_expenses')
        .insert({
          household_id: currentHousehold!.id,
          paid_by: values.paid_by,
          amount: amountCents,
          category: values.category,
          memo: values.memo ?? null,
          date: values.date,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BudgetExpense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.month(currentHousehold!.id, currentMonth) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const currentMonth = dayjs().format('YYYY-MM');

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_expenses').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.month(currentHousehold!.id, currentMonth) });
    },
  });
}

// ─── Budget Summary ───────────────────────────────────────────────────────────

export interface MemberBudgetSummary {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  totalPaid: number; // in cents
  share: number; // 0-1
}

export function useBudgetSummary(month?: string) {
  const { currentHousehold } = useHouseholdStore();
  const { data: expenses = [] } = useBudgetExpenses(month);
  const { members } = useHouseholdStore();

  const totalCents = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byMember: MemberBudgetSummary[] = members.map((member) => {
    const paid = expenses
      .filter((e) => e.paid_by === member.user_id)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      userId: member.user_id,
      name: member.profile?.full_name ?? 'Membre',
      avatarUrl: member.profile?.avatar_url ?? null,
      color: member.color,
      totalPaid: paid,
      share: totalCents > 0 ? paid / totalCents : 0,
    };
  });

  return { byMember, totalCents, expenses };
}
