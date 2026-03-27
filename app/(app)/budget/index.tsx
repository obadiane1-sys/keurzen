import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBudgetExpenses, useCreateExpense, useDeleteExpense, useBudgetSummary } from '../../../src/lib/queries/budget';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { budgetExpenseSchema } from '../../../src/utils/validation';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { Ionicons } from '@expo/vector-icons';
import type { BudgetCategory, BudgetExpenseFormValues } from '../../../src/types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const CATEGORIES: { label: string; value: BudgetCategory; icon: string }[] = [
  { label: 'Logement', value: 'housing', icon: '🏠' },
  { label: 'Énergie', value: 'energy', icon: '⚡' },
  { label: 'Courses', value: 'groceries', icon: '🛒' },
  { label: 'Enfants', value: 'children', icon: '👶' },
  { label: 'Transports', value: 'transport', icon: '🚌' },
  { label: 'Santé', value: 'health', icon: '💊' },
  { label: 'Loisirs', value: 'leisure', icon: '🎯' },
  { label: 'Abonnements', value: 'subscriptions', icon: '📱' },
  { label: 'Épargne', value: 'savings', icon: '💰' },
  { label: 'Autre', value: 'other', icon: '📌' },
];

function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}
function categoryIcon(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.icon ?? '📌';
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────

function AddExpenseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { members } = useHouseholdStore();
  const { user } = useAuthStore();
  const { showToast } = useUiStore();
  const createExpense = useCreateExpense();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetExpenseFormValues>({
    resolver: zodResolver(budgetExpenseSchema),
    defaultValues: {
      amount: '',
      category: 'groceries',
      paid_by: user?.id ?? '',
      memo: '',
      date: dayjs().format('YYYY-MM-DD'),
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: BudgetExpenseFormValues) => {
    try {
      await createExpense.mutateAsync(values);
      showToast('Dépense ajoutée !', 'success');
      handleClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text variant="h4" style={styles.sheetTitle}>Nouvelle dépense</Text>

            <ScrollView contentContainerStyle={{ gap: Spacing.base }} keyboardShouldPersistTaps="handled">
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Montant (€) *"
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                    leftIcon="cash-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.amount?.message}
                  />
                )}
              />

              <View>
                <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>Catégorie</Text>
                <Controller
                  control={control}
                  name="category"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.chipGrid}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.value}
                          onPress={() => onChange(cat.value)}
                          style={[
                            styles.catChip,
                            value === cat.value && { backgroundColor: Colors.blue + '20', borderColor: Colors.blue },
                          ]}
                        >
                          <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                          <Text variant="caption" style={{ color: value === cat.value ? Colors.blue : Colors.textSecondary }}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>

              <View>
                <Text variant="label" color="secondary" style={{ marginBottom: Spacing.sm }}>Payé par</Text>
                <Controller
                  control={control}
                  name="paid_by"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.memberRow}>
                      {members.map((member) => (
                        <TouchableOpacity
                          key={member.user_id}
                          onPress={() => onChange(member.user_id)}
                          style={[
                            styles.memberChip,
                            value === member.user_id && { borderColor: member.color, backgroundColor: member.color + '20' },
                          ]}
                        >
                          <Avatar name={member.profile?.full_name} color={member.color} size="xs" />
                          <Text variant="caption" style={{ color: value === member.user_id ? member.color : Colors.textMuted }}>
                            {member.profile?.full_name?.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
                {errors.paid_by && <Text variant="caption" color="error">{errors.paid_by.message}</Text>}
              </View>

              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Date"
                    placeholder="YYYY-MM-DD"
                    leftIcon="calendar-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.date?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="memo"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mémo (optionnel)"
                    placeholder="Note..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Button label="Ajouter la dépense" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} fullWidth size="lg" />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const { data: expenses = [], isLoading } = useBudgetExpenses();
  const { byMember, totalCents } = useBudgetSummary();
  const deleteExpense = useDeleteExpense();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3">Budget</Text>
        <Button label="+ Dépense" variant="primary" size="sm" onPress={() => setShowAdd(true)} />
      </View>

      {isLoading ? (
        <Loader label="Chargement..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Total */}
          <Card style={styles.totalCard}>
            <Text variant="overline" color="muted">Total ce mois</Text>
            <Text variant="h1" color="navy">{formatCents(totalCents)}</Text>
          </Card>

          {/* Member split */}
          {byMember.length > 0 && totalCents > 0 && (
            <Card>
              <Text variant="h4" style={{ marginBottom: Spacing.base }}>Répartition</Text>
              {byMember.map((m) => (
                <View key={m.userId} style={styles.splitRow}>
                  <Avatar name={m.name} avatarUrl={m.avatarUrl} color={m.color} size="sm" />
                  <Text variant="label" style={styles.splitName} numberOfLines={1}>
                    {m.name.split(' ')[0]}
                  </Text>
                  <View style={styles.splitBar}>
                    <View style={[styles.splitFill, { width: `${m.share * 100}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text variant="label" style={{ minWidth: 64, textAlign: 'right', color: m.color, fontWeight: '700' }}>
                    {formatCents(m.totalPaid)}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Expense list */}
          {expenses.length === 0 ? (
            <EmptyState variant="budget" onCta={() => setShowAdd(true)} />
          ) : (
            <Card>
              <Text variant="h4" style={{ marginBottom: Spacing.base }}>Dépenses</Text>
              {expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseIcon}>
                    <Text style={{ fontSize: 20 }}>{categoryIcon(expense.category)}</Text>
                  </View>
                  <View style={styles.expenseContent}>
                    <Text variant="label">{categoryLabel(expense.category)}</Text>
                    <Text variant="caption" color="muted">
                      {dayjs(expense.date).format('D MMM')} • {expense.paid_by_profile?.full_name?.split(' ')[0]}
                      {expense.memo && ` • ${expense.memo}`}
                    </Text>
                  </View>
                  <Text variant="label" style={{ color: Colors.textPrimary, fontWeight: '700' }}>
                    {formatCents(expense.amount)}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}

      <AddExpenseModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
    backgroundColor: Colors.navy,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  splitName: { width: 60 },
  splitBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  splitFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseContent: { flex: 1, gap: 2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['3xl'],
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  sheetTitle: { marginBottom: Spacing.base },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 36,
  },
  memberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 36,
  },
});
