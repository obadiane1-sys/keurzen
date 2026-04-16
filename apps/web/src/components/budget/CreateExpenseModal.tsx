'use client';

import { useState } from 'react';
import { useHouseholdStore, useAuthStore } from '@keurzen/stores';
import type { BudgetCategory } from '@keurzen/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useCreateExpense } from '@/hooks/useBudget';
import { CATEGORIES } from './constants';

// ─── Component ──────────────────────────────────────────────────────────────

interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateExpenseModal({ open, onClose }: CreateExpenseModalProps) {
  const createExpense = useCreateExpense();
  const { members } = useHouseholdStore();
  const { user } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('groceries');
  const [paidBy, setPaidBy] = useState(user?.id ?? '');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const resetForm = () => {
    setAmount('');
    setCategory('groceries');
    setPaidBy(user?.id ?? '');
    setMemo('');
    setDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Montant invalide');
      return;
    }
    if (!paidBy) {
      setError('Selectionnez qui a paye');
      return;
    }

    try {
      await createExpense.mutateAsync({
        amount: String(parsed),
        category,
        paid_by: paidBy,
        memo: memo || undefined,
        date,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle depense">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <Input
          label="Montant (EUR)"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          autoFocus
        />

        {/* Category chips */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Categorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'border-text-primary bg-text-primary text-text-inverse'
                      : 'border-border bg-background-card text-text-secondary hover:bg-border-light',
                  )}
                >
                  <cat.icon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid by */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Paye par</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = paidBy === m.user_id;
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setPaidBy(m.user_id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'border-text-primary bg-text-primary text-text-inverse'
                      : 'border-border bg-background-card text-text-secondary hover:bg-border-light',
                  )}
                >
                  <Avatar
                    name={m.profile?.full_name ?? 'M'}
                    size={18}
                  />
                  {m.profile?.full_name ?? 'Membre'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Memo */}
        <Input
          label="Note (optionnel)"
          placeholder="Ex: Courses Carrefour"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Error */}
        {error && <p className="text-sm text-accent">{error}</p>}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createExpense.isPending}
        >
          Ajouter la depense
        </Button>
      </form>
    </Modal>
  );
}
