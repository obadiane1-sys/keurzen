import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors, Spacing, BorderRadius, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import {
  useBudgetExpenses,
  useBudgetSummary,
  useDeleteExpense,
} from '../../../src/lib/queries/budget';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { BudgetExpense } from '../../../src/types';

// ─── Category config ─────────────────────────────────────────────────────────

const categoryLabels: Record<string, { label: string; icon: string }> = {
  housing: { label: 'Logement', icon: 'home-outline' },
  energy: { label: 'Energie', icon: 'flash-outline' },
  groceries: { label: 'Courses', icon: 'cart-outline' },
  children: { label: 'Enfants', icon: 'people-outline' },
  transport: { label: 'Transport', icon: 'car-outline' },
  health: { label: 'Sante', icon: 'heart-outline' },
  leisure: { label: 'Loisirs', icon: 'game-controller-outline' },
  subscriptions: { label: 'Abonnements', icon: 'repeat-outline' },
  savings: { label: 'Epargne', icon: 'wallet-outline' },
  other: { label: 'Autre', icon: 'ellipsis-horizontal-outline' },
};

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' \u20AC';
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));

  const { data: expenses = [], isLoading, refetch, isRefetching } = useBudgetExpenses(month);
  const { byMember, totalCents } = useBudgetSummary(month);
  const deleteExpense = useDeleteExpense();

  const monthLabel = dayjs(month).format('MMMM YYYY');
  const prevMonth = dayjs(month).subtract(1, 'month').format('YYYY-MM');
  const nextMonth = dayjs(month).add(1, 'month').format('YYYY-MM');
  const canGoNext = dayjs(nextMonth).isBefore(dayjs().add(1, 'month'), 'month');

  const handleDelete = useCallback((expense: BudgetExpense) => {
    const doDelete = () => deleteExpense.mutate(expense.id);

    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer ${formatCents(expense.amount)} ?`)) doDelete();
    } else {
      Alert.alert('Supprimer', `Supprimer ${formatCents(expense.amount)} ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [deleteExpense]);

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState variant="household" />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Budget</Text>
      </View>

      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setMonth(prevMonth)} hitSlop={8} accessibilityLabel="Mois precedent" accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="label" style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => canGoNext && setMonth(nextMonth)}
          hitSlop={8}
          disabled={!canGoNext}
          accessibilityLabel="Mois suivant"
          accessibilityRole="button"
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoNext ? Colors.textPrimary : Colors.gray300}
          />
        </TouchableOpacity>
      </View>

      {/* Total + summary */}
      <Card padding="md" style={styles.totalCard}>
        <Text variant="caption" color="muted">Total du mois</Text>
        <Text variant="h2" color="navy">{formatCents(totalCents)}</Text>
        {byMember.length > 0 && (
          <View style={styles.membersRow}>
            {byMember.map((m) => (
              <View key={m.userId} style={styles.memberChip}>
                <Avatar name={m.name} avatarUrl={m.avatarUrl} size="xs" color={m.color} />
                <Text variant="caption" color="secondary">
                  {formatCents(m.totalPaid)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <EmptyState
          variant="budget"
          onCta={() => router.push('/(app)/budget/create')}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const cat = categoryLabels[item.category] ?? categoryLabels.other;
            return (
              <Card padding="sm" style={styles.expenseCard}>
                <TouchableOpacity
                  style={styles.expenseRow}
                  onLongPress={() => handleDelete(item)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.catIcon, { backgroundColor: Colors.blue + '18' }]}>
                    <Ionicons
                      name={cat.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={Colors.blue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{cat.label}</Text>
                    {item.memo && (
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {item.memo}
                      </Text>
                    )}
                    <Text variant="caption" color="muted">
                      {dayjs(item.date).format('DD/MM')} - {item.paid_by_profile?.full_name ?? 'Membre'}
                    </Text>
                  </View>
                  <Text variant="label" weight="bold">
                    {formatCents(item.amount)}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.mint}
              colors={[Colors.mint]}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/budget/create')}
        style={styles.fab}
        activeOpacity={0.85}
        accessibilityLabel="Ajouter une depense"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xl,
  },
  monthLabel: {
    textTransform: 'capitalize',
    minWidth: 140,
    textAlign: 'center',
  },
  totalCard: {
    marginHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  membersRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  memberChip: {
    alignItems: 'center',
    gap: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  separator: {
    height: Spacing.sm,
  },
  expenseCard: {
    // styled by Card
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
