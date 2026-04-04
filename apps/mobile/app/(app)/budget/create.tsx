import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCreateExpense } from '../../../src/lib/queries/budget';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useAuthStore } from '../../../src/stores/auth.store';
import { budgetExpenseSchema } from '../../../src/utils/validation';
import type { BudgetExpenseFormValues, BudgetCategory } from '../../../src/types';

const categoryOptions: { value: BudgetCategory; label: string; icon: string }[] = [
  { value: 'housing', label: 'Logement', icon: 'home-outline' },
  { value: 'energy', label: 'Energie', icon: 'flash-outline' },
  { value: 'groceries', label: 'Courses', icon: 'cart-outline' },
  { value: 'children', label: 'Enfants', icon: 'people-outline' },
  { value: 'transport', label: 'Transport', icon: 'car-outline' },
  { value: 'health', label: 'Sante', icon: 'heart-outline' },
  { value: 'leisure', label: 'Loisirs', icon: 'game-controller-outline' },
  { value: 'subscriptions', label: 'Abonnements', icon: 'repeat-outline' },
  { value: 'savings', label: 'Epargne', icon: 'wallet-outline' },
  { value: 'other', label: 'Autre', icon: 'ellipsis-horizontal-outline' },
];

export default function CreateExpenseScreen() {
  const router = useRouter();
  const createExpense = useCreateExpense();
  const { members } = useHouseholdStore();
  const { user } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = async (values: BudgetExpenseFormValues) => {
    try {
      await createExpense.mutateAsync(values);
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Nouvelle depense" />

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Montant (EUR)"
              placeholder="0,00"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
              error={errors.amount?.message}
            />
          )}
        />

        {/* Category */}
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View style={chipStyles.container}>
              <Text variant="label" style={chipStyles.label}>Categorie</Text>
              <View style={chipStyles.row}>
                {categoryOptions.map((opt) => {
                  const active = value === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => onChange(opt.value)}
                      style={[chipStyles.chip, active ? chipStyles.chipActive : undefined]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={opt.icon as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color={active ? Colors.textInverse : Colors.textSecondary}
                      />
                      <Text
                        variant="bodySmall"
                        weight="semibold"
                        style={[chipStyles.chipText, active ? chipStyles.chipTextActive as TextStyle : undefined]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        {/* Paid by */}
        <Controller
          control={control}
          name="paid_by"
          render={({ field: { onChange, value } }) => (
            <View style={chipStyles.container}>
              <Text variant="label" style={chipStyles.label}>Paye par</Text>
              <View style={chipStyles.row}>
                {members.map((m) => {
                  const active = value === m.user_id;
                  return (
                    <TouchableOpacity
                      key={m.user_id}
                      onPress={() => onChange(m.user_id)}
                      style={[chipStyles.chip, active ? chipStyles.chipActive : undefined]}
                      activeOpacity={0.8}
                    >
                      <View style={[chipStyles.dot, { backgroundColor: m.color }]} />
                      <Text
                        variant="bodySmall"
                        weight="semibold"
                        style={[chipStyles.chipText, active ? chipStyles.chipTextActive as TextStyle : undefined]}
                      >
                        {m.profile?.full_name ?? 'Membre'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        {/* Memo */}
        <Controller
          control={control}
          name="memo"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Note (optionnel)"
              placeholder="Ex: Courses Carrefour"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.memo?.message}
            />
          )}
        />

        {/* Date */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              leftIcon="calendar-outline"
              error={errors.date?.message}
            />
          )}
        />

        <Button
          label="Ajouter la depense"
          onPress={handleSubmit(onSubmit)}
          isLoading={createExpense.isPending}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});

const chipStyles = StyleSheet.create({
  container: { gap: Spacing.sm },
  label: { color: Colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
