import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateTask } from '../../lib/queries/tasks';
import { useHouseholdStore } from '../../stores/household.store';
import { useUiStore } from '../../stores/ui.store';
import { taskSchema } from '../../utils/validation';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import type { TaskFormValues, TaskCategory, TaskPriority, RecurrenceType } from '../../types';
import dayjs from 'dayjs';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: TaskCategory; icon: string }[] = [
  { label: 'Nettoyage', value: 'cleaning', icon: '🧹' },
  { label: 'Cuisine', value: 'cooking', icon: '🍳' },
  { label: 'Courses', value: 'shopping', icon: '🛒' },
  { label: 'Admin', value: 'admin', icon: '📋' },
  { label: 'Enfants', value: 'children', icon: '👶' },
  { label: 'Animaux', value: 'pets', icon: '🐾' },
  { label: 'Jardin', value: 'garden', icon: '🌱' },
  { label: 'Réparations', value: 'repairs', icon: '🔧' },
  { label: 'Santé', value: 'health', icon: '💊' },
  { label: 'Finances', value: 'finances', icon: '💰' },
  { label: 'Autre', value: 'other', icon: '📌' },
];

const PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Faible', value: 'low', color: Colors.gray400 },
  { label: 'Normale', value: 'medium', color: Colors.blue },
  { label: 'Haute', value: 'high', color: Colors.coral },
  { label: 'Urgente', value: 'urgent', color: Colors.error },
];

const RECURRENCES: { label: string; value: RecurrenceType }[] = [
  { label: 'Aucune', value: 'none' },
  { label: 'Quotidien', value: 'daily' },
  { label: 'Hebdo', value: 'weekly' },
  { label: 'Bi-hebdo', value: 'biweekly' },
  { label: 'Mensuel', value: 'monthly' },
];

function SelectChips<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
  activeColor = Colors.coral,
}: {
  options: { label: string; value: T; icon?: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (opt: { label: string; value: T; icon?: string; color?: string }) => string;
  activeColor?: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[
            styles.chip,
            value === opt.value && {
              backgroundColor: (opt.color ?? activeColor) + '20',
              borderColor: opt.color ?? activeColor,
            },
          ]}
        >
          {opt.icon && <Text style={{ fontSize: 14 }}>{opt.icon}</Text>}
          <Text
            variant="caption"
            style={{
              fontWeight: value === opt.value ? '600' : '400',
              color: value === opt.value ? (opt.color ?? activeColor) : Colors.textSecondary,
            }}
          >
            {renderLabel ? renderLabel(opt) : opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Date Picker Sheet (iOS) ───────────────────────────────────────────────────
// Rendered outside the ScrollView in its own Modal to avoid UIDatePicker
// height-measurement issues when nested inside ScrollView + Modal on iOS.

function DatePickerSheet({
  visible,
  initialDate,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const [localDate, setLocalDate] = useState(initialDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.dpOverlay} onPress={onCancel}>
        <Pressable style={styles.dpSheet}>
          {/* Toolbar iOS-style */}
          <View style={styles.dpHeader}>
            <TouchableOpacity onPress={onCancel} style={styles.dpToolbarBtn}>
              <Text style={styles.dpCancelText}>Annuler</Text>
            </TouchableOpacity>
            <Text variant="label" color="secondary">Échéance</Text>
            <TouchableOpacity onPress={() => onConfirm(localDate)} style={styles.dpToolbarBtn}>
              <Text style={styles.dpConfirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
          {/* Spinner — fonctionne de manière fiable sur iOS dans un Modal standalone */}
          <DateTimePicker
            value={localDate}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            onChange={(_event, date) => {
              if (date) setLocalDate(date);
            }}
            locale="fr-FR"
            style={styles.dpPicker}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CreateTaskModal({ visible, onClose }: CreateTaskModalProps) {
  const { showToast } = useUiStore();
  const { members } = useHouseholdStore();
  const createTask = useCreateTask();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      zone: 'general',
      priority: 'medium',
      recurrence: 'none',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      await createTask.mutateAsync(values);
      showToast('Tâche créée !', 'success');
      handleClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création', 'error');
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kvView}
        >
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text variant="h4">Nouvelle tâche</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Titre *"
                    placeholder="Ex: Faire la vaisselle"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.title?.message}
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
                    multiline
                    numberOfLines={3}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                )}
              />

              {/* Assignee */}
              <View>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>Assigner à</Text>
                <Controller
                  control={control}
                  name="assigned_to"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.memberRow}>
                      <TouchableOpacity
                        onPress={() => onChange('')}
                        style={[
                          styles.memberChip,
                          !value && { borderColor: Colors.coral, backgroundColor: Colors.coral + '15' },
                        ]}
                      >
                        <Text variant="caption" style={{ color: !value ? Colors.coral : Colors.textMuted }}>
                          Non assigné
                        </Text>
                      </TouchableOpacity>
                      {members.map((member) => (
                        <TouchableOpacity
                          key={member.user_id}
                          onPress={() => onChange(member.user_id)}
                          style={[
                            styles.memberChip,
                            value === member.user_id && {
                              borderColor: member.color,
                              backgroundColor: member.color + '20',
                            },
                          ]}
                        >
                          <Avatar
                            name={member.profile?.full_name}
                            color={member.color}
                            size="xs"
                          />
                          <Text
                            variant="caption"
                            style={{
                              color: value === member.user_id ? member.color : Colors.textMuted,
                              fontWeight: value === member.user_id ? '600' : '400',
                            }}
                          >
                            {member.profile?.full_name?.split(' ')[0] ?? 'Membre'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>

              {/* Due date */}
              <Controller
                control={control}
                name="due_date"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Text variant="label" color="secondary" style={styles.sectionLabel}>
                      Échéance (optionnel)
                    </Text>
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => {
                        setPickerDate(value ? new Date(value) : new Date());
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
                      <Text
                        variant="body"
                        style={{ flex: 1, color: value ? Colors.textPrimary : Colors.textMuted }}
                      >
                        {value
                          ? dayjs(value).format('DD-MM-YYYY')
                          : 'Sélectionner une date'}
                      </Text>
                      {value && (
                        <TouchableOpacity
                          onPress={() => onChange(undefined)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />

              {/* Estimated time */}
              <Controller
                control={control}
                name="estimated_minutes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Estimation (minutes, optionnel)"
                    placeholder="Ex: 30"
                    keyboardType="numeric"
                    leftIcon="time-outline"
                    value={value?.toString() ?? ''}
                    onChangeText={(v) => onChange(v ? parseInt(v) : undefined)}
                    onBlur={onBlur}
                  />
                )}
              />

              {/* Category */}
              <View>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>Catégorie</Text>
                <Controller
                  control={control}
                  name="category"
                  render={({ field: { value, onChange } }) => (
                    <SelectChips options={CATEGORIES} value={value} onChange={onChange} />
                  )}
                />
              </View>

              {/* Priority */}
              <View>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>Priorité</Text>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value, onChange } }) => (
                    <SelectChips options={PRIORITIES} value={value} onChange={onChange} />
                  )}
                />
              </View>

              {/* Recurrence */}
              <View>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>Récurrence</Text>
                <Controller
                  control={control}
                  name="recurrence"
                  render={({ field: { value, onChange } }) => (
                    <SelectChips options={RECURRENCES} value={value} onChange={onChange} activeColor={Colors.lavender} />
                  )}
                />
              </View>

              <Button
                label="Créer la tâche"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.sm }}
              />
            </ScrollView>

            {/* Android: DateTimePicker rendered as native dialog, position doesn't matter */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setValue('due_date', dayjs(selectedDate).format('YYYY-MM-DD'));
                  }
                }}
              />
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>

    {/* iOS: separate Modal so UIDatePicker is not nested inside ScrollView */}
    {Platform.OS === 'ios' && (
      <DatePickerSheet
        key={pickerDate.toISOString()}
        visible={showDatePicker}
        initialDate={pickerDate}
        onConfirm={(date) => {
          setValue('due_date', dayjs(date).format('YYYY-MM-DD'));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  kvView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['3xl'],
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  formContent: {
    gap: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  // DatePickerSheet styles
  dpOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  dpSheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingBottom: Spacing['3xl'],
  },
  dpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dpToolbarBtn: {
    minWidth: 70,
  },
  dpCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  dpConfirmText: {
    fontSize: Typography.fontSize.base,
    color: Colors.coral,
    fontWeight: '600',
    textAlign: 'right',
  },
  dpPicker: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.backgroundCard,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 34,
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
