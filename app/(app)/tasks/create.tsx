import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
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
import { DatePicker } from '../../../src/components/ui/DatePicker';
import { useCreateTask } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { taskSchema } from '../../../src/utils/validation';
import { categoryLabels } from '../../../src/components/tasks/TaskCard';
import type { TaskFormValues, TaskCategory, TaskZone, TaskPriority, RecurrenceType } from '../../../src/types';

// ─── Option data ─────────────────────────────────────────────────────────────

const zoneLabels: Record<TaskZone, string> = {
  kitchen: 'Cuisine',
  bathroom: 'Salle de bain',
  bedroom: 'Chambre',
  living_room: 'Salon',
  garden: 'Jardin',
  garage: 'Garage',
  general: 'Général',
  outside: 'Extérieur',
  other: 'Autre',
};

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: Colors.gray400 },
  { value: 'medium', label: 'Moyenne', color: Colors.blue },
  { value: 'high', label: 'Haute', color: Colors.coral },
  { value: 'urgent', label: 'Urgente', color: Colors.error },
];

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Aucune' },
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuelle' },
  { value: 'monthly', label: 'Mensuelle' },
];

// ─── Chip Picker ─────────────────────────────────────────────────────────────

function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={chipStyles.container}>
      <Text variant="label" style={chipStyles.label}>
        {label}
      </Text>
      <View style={chipStyles.row}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[chipStyles.chip, active ? chipStyles.chipActive : undefined]}
              activeOpacity={0.8}
            >
              {opt.icon && (
                <Ionicons
                  name={opt.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={active ? Colors.textInverse : Colors.textSecondary}
                />
              )}
              <Text
                variant="bodySmall"
                weight="semibold"
                style={[
                  chipStyles.chipText,
                  active ? chipStyles.chipTextActive as TextStyle : undefined,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTask = useCreateTask();
  const { members } = useHouseholdStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'cleaning',
      zone: 'general',
      priority: 'medium',
      recurrence: 'none',
      assigned_to: '',
      due_date: '',
      estimated_minutes: undefined,
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    try {
      await createTask.mutateAsync(values);
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

  const categoryOptions = Object.entries(categoryLabels).map(([key, val]) => ({
    value: key as TaskCategory,
    label: val.label,
    icon: val.icon,
  }));

  const zoneOptions = Object.entries(zoneLabels).map(([key, val]) => ({
    value: key as TaskZone,
    label: val,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Nouvelle tâche" />

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Titre"
              placeholder="Ex: Passer l'aspirateur"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
              leftIcon="create-outline"
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description (optionnel)"
              placeholder="Détails supplémentaires..."
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
              error={errors.description?.message}
            />
          )}
        />

        {/* Category */}
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              label="Catégorie"
              options={categoryOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {/* Zone */}
        <Controller
          control={control}
          name="zone"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              label="Zone"
              options={zoneOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {/* Priority */}
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              label="Priorité"
              options={priorityOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {/* Assignee */}
        <Controller
          control={control}
          name="assigned_to"
          render={({ field: { onChange, value } }) => (
            <View style={chipStyles.container}>
              <Text variant="label" style={chipStyles.label}>
                Assigné à
              </Text>
              <View style={chipStyles.row}>
                <TouchableOpacity
                  onPress={() => onChange('')}
                  style={[chipStyles.chip, !value ? chipStyles.chipActive : undefined]}
                  activeOpacity={0.8}
                >
                  <Text
                    variant="bodySmall"
                    weight="semibold"
                    style={[chipStyles.chipText, !value ? chipStyles.chipTextActive as TextStyle : undefined]}
                  >
                    Personne
                  </Text>
                </TouchableOpacity>
                {members.map((m) => (
                  <TouchableOpacity
                    key={m.user_id}
                    onPress={() => onChange(m.user_id)}
                    style={[
                      chipStyles.chip,
                      value === m.user_id ? chipStyles.chipActive : undefined,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[chipStyles.dot, { backgroundColor: m.color }]}
                    />
                    <Text
                      variant="bodySmall"
                      weight="semibold"
                      style={[
                        chipStyles.chipText,
                        value === m.user_id ? chipStyles.chipTextActive as TextStyle : undefined,
                      ]}
                    >
                      {m.profile?.full_name ?? 'Membre'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        {/* Due date */}
        <Controller
          control={control}
          name="due_date"
          render={({ field: { onChange, value } }) => (
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" style={{ color: Colors.textSecondary }}>
                Date d'écheance (optionnel)
              </Text>
              <DatePicker
                value={value ? new Date(value) : null}
                onChange={(date) => onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                placeholder="Choisir une date"
              />
            </View>
          )}
        />

        {/* Estimated minutes */}
        <Controller
          control={control}
          name="estimated_minutes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Durée estimée en minutes (optionnel)"
              placeholder="Ex: 30"
              value={value?.toString() ?? ''}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                onChange(isNaN(num) ? undefined : num);
              }}
              keyboardType="numeric"
              leftIcon="time-outline"
              error={errors.estimated_minutes?.message}
            />
          )}
        />

        {/* Recurrence */}
        <Controller
          control={control}
          name="recurrence"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              label="Récurrence"
              options={recurrenceOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {/* Submit */}
        <Button
          label="Créer la tâche"
          onPress={handleSubmit(onSubmit)}
          isLoading={createTask.isPending}
          fullWidth
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
  container: {
    gap: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
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
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
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
