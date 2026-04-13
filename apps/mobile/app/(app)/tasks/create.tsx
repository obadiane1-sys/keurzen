import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  TextStyle,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Text } from '../../../src/components/ui/Text';
import { useCreateTask } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import type { TaskFormValues, TaskCategory, TaskPriority, RecurrenceType, TaskType } from '../../../src/types';

// ─── Category config with emojis ─────────────────────────────────────────────

const CATEGORIES: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'cleaning', label: 'Ménage', emoji: '🧹' },
  { value: 'cooking', label: 'Cuisine', emoji: '🍳' },
  { value: 'shopping', label: 'Courses', emoji: '🛒' },
  { value: 'admin', label: 'Admin', emoji: '📋' },
  { value: 'children', label: 'Enfants', emoji: '👶' },
  { value: 'pets', label: 'Animaux', emoji: '🐾' },
  { value: 'garden', label: 'Jardin', emoji: '🌿' },
  { value: 'repairs', label: 'Bricolage', emoji: '🔧' },
  { value: 'health', label: 'Santé', emoji: '💊' },
  { value: 'finances', label: 'Finances', emoji: '💰' },
  { value: 'other', label: 'Autre', emoji: '📦' },
];

// ─── Recurrence options ──────────────────────────────────────────────────────

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Jamais' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuel' },
  { value: 'monthly', label: 'Mensuel' },
];

// ─── Date helpers ────────────────────────────────────────────────────────────

const LONG_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const LONG_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function formatDateDisplay(date: Date): string {
  return `${LONG_DAYS[date.getDay()]} ${date.getDate()} ${LONG_MONTHS[date.getMonth()]}`;
}

function formatTimeDisplay(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Option Sheet (overlay) ──────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;

function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  renderLabel,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  renderLabel?: (opt: { value: T; label: string }) => string;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <TouchableOpacity
        style={s.sheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={s.sheetContainer}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={s.sheetScroll}>
            {options.map(opt => {
              const active = selected === opt.value;
              const label = renderLabel ? renderLabel(opt) : opt.label;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.sheetItem, active && s.sheetItemActive]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={[s.sheetItemText, active && s.sheetItemTextActive]}>
                    {label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Label component ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTask = useCreateTask();
  const { members } = useHouseholdStore();

  // Form state
  const [taskType, setTaskType] = useState<TaskType>('household');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<TaskCategory>('shopping');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [priority, setPriority] = useState<number>(1); // 0=low, 1=medium, 2=high
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const selectedCategory = CATEGORIES.find(c => c.value === category)!;
  const priorityLabel = priority === 0 ? 'low' : priority === 1 ? 'medium' : 'high';
  const recurrenceLabel = RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label ?? 'Jamais';
  const isDisabled = !taskName.trim();

  const getInitial = (name?: string | null) => {
    if (!name) return '?';
    return name.trim()[0]?.toUpperCase() ?? '?';
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const updated = new Date(dueDate);
      updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setDueDate(updated);
    }
  }, [dueDate]);

  const handleTimeChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const updated = new Date(dueDate);
      updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setDueDate(updated);
    }
  }, [dueDate]);

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    const values: TaskFormValues = {
      title: taskName.trim(),
      category,
      zone: 'general',
      priority: priorityLabel as TaskPriority,
      recurrence,
      assigned_to: assignedTo ?? '',
      due_date: dueDate.toISOString().split('T')[0],
      task_type: taskType,
    };

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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nouvelle tâche</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isDisabled || createTask.isPending}
            style={s.headerBtn}
            activeOpacity={0.7}
          >
            {createTask.isPending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={[s.headerCreateText, isDisabled && { opacity: 0.35 }]}>Créer</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Task Type Toggle ─────────────────────────────────────────── */}
        <View style={s.toggleContainer}>
          <TouchableOpacity
            style={[s.toggleBtn, taskType === 'household' && s.toggleBtnActive]}
            onPress={() => setTaskType('household')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, taskType === 'household' && s.toggleTextActive]}>
              🏠 Ménage
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, taskType === 'personal' && s.toggleBtnActive]}
            onPress={() => setTaskType('personal')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, taskType === 'personal' && s.toggleTextActive]}>
              👤 Perso
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Nom ──────────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>NOM</FieldLabel>
          <TextInput
            style={s.input}
            placeholder="Ex : Courses, Ménage salon..."
            placeholderTextColor={Colors.textMuted}
            value={taskName}
            onChangeText={setTaskName}
            autoFocus
            returnKeyType="done"
          />
        </View>

        {/* ─── Catégorie ────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>CATÉGORIE</FieldLabel>
          <TouchableOpacity
            style={s.selectField}
            onPress={() => setShowCategoryDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={s.selectText}>{selectedCategory.emoji} {selectedCategory.label}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Assigné à ────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>ASSIGNÉ À</FieldLabel>
          <View style={s.pillsRow}>
            {members.map((m) => {
              const selected = assignedTo === m.user_id;
              const name = m.profile?.full_name?.split(' ')[0] ?? 'Membre';
              return (
                <TouchableOpacity
                  key={m.user_id}
                  style={[s.pill, selected ? s.pillActive : s.pillInactive]}
                  onPress={() => setAssignedTo(selected ? null : m.user_id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.pillAvatar, selected ? s.pillAvatarActive : s.pillAvatarInactive]}>
                    <Text style={[s.pillAvatarText, selected && { color: Colors.textPrimary }]}>
                      {getInitial(m.profile?.full_name)}
                    </Text>
                  </View>
                  <Text style={[s.pillName, selected && s.pillNameActive]}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Échéance ─────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>ÉCHÉANCE</FieldLabel>
          <View style={s.dateTimeRow}>
            <TouchableOpacity
              style={s.dateSection}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={s.dateTimeText}>{formatDateDisplay(dueDate)}</Text>
            </TouchableOpacity>
            <View style={s.dateTimeSeparator} />
            <TouchableOpacity
              style={s.timeSection}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={s.dateTimeText}>{formatTimeDisplay(dueDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            locale="fr-FR"
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            locale="fr-FR"
            minuteInterval={5}
          />
        )}

        {/* ─── Priorité ─────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>PRIORITÉ</FieldLabel>
          <View style={s.sliderContainer}>
            <View style={s.sliderTrack}>
              <View style={[s.sliderFill, { width: `${priority * 50}%` }]} />
              {[0, 1, 2].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    s.sliderThumbTouchable,
                    { left: `${val * 50}%` },
                  ]}
                  onPress={() => setPriority(val)}
                  activeOpacity={0.7}
                >
                  {priority === val && <View style={s.sliderThumb} />}
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.sliderLabels}>
              <Text style={[s.sliderLabel, priority === 0 && s.sliderLabelActive]}>Basse</Text>
              <Text style={[s.sliderLabel, s.sliderLabelCenter, priority === 1 && s.sliderLabelActive]}>Moyenne</Text>
              <Text style={[s.sliderLabel, s.sliderLabelRight, priority === 2 && s.sliderLabelActive]}>Haute</Text>
            </View>
          </View>
        </View>

        {/* ─── Répéter ──────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>RÉPÉTER</FieldLabel>
          <TouchableOpacity
            style={s.selectField}
            onPress={() => setShowRecurrenceDropdown(true)}
            activeOpacity={0.7}
          >
            <View style={s.selectFieldInner}>
              <Ionicons name="repeat-outline" size={20} color={Colors.primary} />
              <Text style={s.selectText}>{recurrenceLabel}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Option Sheets ─────────────────────────────────────────────── */}
      <OptionSheet
        visible={showCategoryDropdown}
        title="Catégorie"
        options={CATEGORIES}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategoryDropdown(false)}
        renderLabel={opt => `${opt.emoji} ${opt.label}`}
      />
      <OptionSheet
        visible={showRecurrenceDropdown}
        title="Récurrence"
        options={RECURRENCE_OPTIONS}
        selected={recurrence}
        onSelect={setRecurrence}
        onClose={() => setShowRecurrenceDropdown(false)}
      />

      {/* ─── CTA Button ─────────────────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={s.ctaSafe}>
        <TouchableOpacity
          style={[s.ctaButton, isDisabled && s.ctaButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isDisabled || createTask.isPending}
        >
          {createTask.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={s.ctaText}>Créer la tâche</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  headerSafe: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  headerCreateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.primary,
  },

  // ScrollView
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md + 2,
  },
  toggleBtnActive: {
    backgroundColor: Colors.background,
    ...Shadows.sm,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  },

  // Field group
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: `${Colors.primary}B3`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },

  // Input
  input: {
    backgroundColor: `${Colors.primarySurface}4D`,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },

  // Select field
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.primarySurface}4D`,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  selectFieldInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },

  // Option Sheet overlay
  sheetOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing['3xl'],
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.base,
  },
  sheetScroll: {
    paddingHorizontal: Spacing.lg,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sheetItemActive: {
    backgroundColor: `${Colors.primarySurface}80`,
    borderRadius: BorderRadius.md,
  },
  sheetItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  sheetItemTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  pillActive: {
    backgroundColor: Colors.primaryLight,
  },
  pillInactive: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAvatarActive: {
    backgroundColor: Colors.background,
  },
  pillAvatarInactive: {
    backgroundColor: Colors.primarySurface,
  },
  pillAvatarText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textMuted,
  },
  pillName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textMuted,
  },
  pillNameActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  },

  // Date/Time
  dateTimeRow: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primarySurface}4D`,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  dateSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  dateTimeSeparator: {
    width: 1,
    backgroundColor: Colors.border,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  dateTimeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },

  // Priority slider
  sliderContainer: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sliderThumbTouchable: {
    position: 'absolute',
    top: -17,
    width: 40,
    height: 40,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.background,
    ...Shadows.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  sliderLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  sliderLabelActive: {
    color: Colors.primary,
  },
  sliderLabelCenter: {
    textAlign: 'center',
  },
  sliderLabelRight: {
    textAlign: 'right',
  },

  // CTA
  ctaSafe: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  ctaButtonDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});
