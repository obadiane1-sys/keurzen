'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useHouseholdStore } from '@keurzen/stores';
import type { BudgetCategory, BudgetExpense } from '@keurzen/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateExpenseModal } from '@/components/budget/CreateExpenseModal';
import { CATEGORY_CONFIG, formatCents } from '@/components/budget/constants';
import { useBudgetExpenses, useBudgetSummary, useDeleteExpense } from '@/hooks/useBudget';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

// ─── Page ───────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { currentHousehold } = useHouseholdStore();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [showCreate, setShowCreate] = useState(false);

  const { isLoading } = useBudgetExpenses(month);
  const { byMember, totalCents, expenses } = useBudgetSummary(month);
  const deleteExpense = useDeleteExpense();

  const monthLabel = dayjs(month).format('MMMM YYYY');
  const prevMonth = dayjs(month).subtract(1, 'month').format('YYYY-MM');
  const nextMonth = dayjs(month).add(1, 'month').format('YYYY-MM');
  const canGoNext = dayjs(nextMonth).isBefore(dayjs().add(1, 'month'), 'month');

  const handleDelete = useCallback((expense: BudgetExpense) => {
    if (window.confirm(`Supprimer ${formatCents(expense.amount)} ?`)) {
      deleteExpense.mutate(expense.id);
    }
  }, [deleteExpense]);

  if (!currentHousehold) {
    return (
      <EmptyState
        variant="household"
        subtitle="Creez ou rejoignez un foyer pour utiliser le budget."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-primary-surface" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-primary-surface" />
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-primary-surface" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-primary-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Budget</h1>
        <Button size="default" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      {/* Month navigation */}
      <div className="mb-5 flex items-center justify-center gap-6">
        <button
          onClick={() => setMonth(prevMonth)}
          className="rounded-[var(--radius-sm)] p-1.5 text-text-primary hover:bg-border-light transition-colors"
          aria-label="Mois precedent"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="min-w-[160px] text-center text-base font-semibold capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() => canGoNext && setMonth(nextMonth)}
          disabled={!canGoNext}
          className="rounded-[var(--radius-sm)] p-1.5 text-text-primary hover:bg-border-light transition-colors disabled:opacity-30"
          aria-label="Mois suivant"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Total + member summary */}
      <Card className="mb-6 text-center border border-border shadow-none">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
          Total du mois
        </p>
        <p className="font-heading text-3xl font-bold text-text-primary mt-1">
          {formatCents(totalCents)}
        </p>
        {byMember.length > 0 && (
          <div className="mt-3 flex justify-center gap-6">
            {byMember.map((m) => (
              <div key={m.userId} className="flex flex-col items-center gap-1">
                <Avatar name={m.name} src={m.avatarUrl} size={32} />
                <span className="text-xs text-text-secondary font-medium">
                  {formatCents(m.totalPaid)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <EmptyState
          variant="budget"
          action={{ label: 'Ajouter une depense', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const cat = CATEGORY_CONFIG[expense.category as BudgetCategory] ?? CATEGORY_CONFIG.other;
            const CatIcon = cat.icon;
            return (
              <Card key={expense.id} className="border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-joy/10">
                    <CatIcon size={18} className="text-joy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{cat.label}</p>
                    {expense.memo && (
                      <p className="text-xs text-text-muted truncate">{expense.memo}</p>
                    )}
                    <p className="text-xs text-text-muted">
                      {dayjs(expense.date).format('DD/MM')} — {expense.paid_by_profile?.full_name ?? 'Membre'}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums whitespace-nowrap">
                    {formatCents(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense)}
                    className="ml-1 rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:text-accent hover:bg-accent/8 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <CreateExpenseModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
