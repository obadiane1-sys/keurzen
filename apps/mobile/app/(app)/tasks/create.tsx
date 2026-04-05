import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../../src/components/ui/Text';
import { useCreateTask, useTasks } from '../../../src/lib/queries/tasks';
import { TaskSuggestions } from '../../../src/components/tasks/TaskSuggestions';
import { buildTaskVariants, filterVariants } from '../../../src/lib/utils/taskVariants';
import type { TaskVariant } from '../../../src/lib/utils/taskVariants';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { categoryLabels } from '../../../src/components/tasks/TaskCard';
import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import type { TaskFormValues, TaskCategory, TaskPriority, RecurrenceType } from '../../../src/types';


const PRIORITY_CONFIG: {
  value: TaskPriority;
  label: string;
  description: string;
  dot: string;
  bg: string;
  border: string;
  text: string;
}[] = [
  { value: 'low',    label: 'Faible',  description: 'Rapide et simple',          dot: Colors.sauge,       bg: `${Colors.sauge}14`, border: `${Colors.sauge}40`, text: Colors.greenStrong },
  { value: 'medium', label: 'Moyenne', description: 'Effort modéré',             dot: Colors.miel,        bg: `${Colors.miel}14`, border: `${Colors.miel}40`, text: Colors.orangeStrong },
  { value: 'high',   label: 'Haute',   description: "Demande de l'attention",    dot: Colors.rose,        bg: `${Colors.rose}14`, border: `${Colors.rose}40`, text: Colors.redStrong },
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'none',     label: 'Aucune',       icon: 'close-circle-outline' },
  { value: 'daily',    label: 'Chaque jour',   icon: 'today-outline' },
  { value: 'weekly',   label: 'Chaque semaine', icon: 'calendar-outline' },
  { value: 'biweekly', label: 'Toutes les 2 sem.', icon: 'calendar-outline' },
  { value: 'monthly',  label: 'Chaque mois',   icon: 'repeat-outline' },
];

// ─── Date helpers ───────────────────────────────────────────────────────────

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const SHORT_DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const SHORT_MONTHS = [
  'janv.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDatePill(date: Date): string {
  const now = new Date();
  if (isSameDay(date, now)) return "Aujourd'hui";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(date, tomorrow)) return 'Demain';
  return `${SHORT_DAYS[date.getDay()]} ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

function endOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFri = day <= 5 ? 5 - day : 5 + 7 - day;
  const fri = new Date(now);
  fri.setDate(now.getDate() + daysUntilFri);
  return fri;
}

const QUICK_DATE_CHIPS = [
  { label: "Aujourd'hui", getDate: () => new Date() },
  { label: 'Demain', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
  { label: 'Vendredi', getDate: () => endOfWeek() },
];

type Period = 'matin' | 'apres-midi' | 'soir';
const PERIODS: { key: Period; label: string; emoji: string; hours: number[] }[] = [
  { key: 'matin', label: 'Matin', emoji: '\u{1F305}', hours: [6, 7, 8, 9, 10, 11, 12] },
  { key: 'apres-midi', label: 'Apres-midi', emoji: '\u{2600}\u{FE0F}', hours: [12, 13, 14, 15, 16, 17, 18] },
  { key: 'soir', label: 'Soir', emoji: '\u{1F319}', hours: [18, 19, 20, 21, 22, 23] },
];
const MINUTES = ['00', '15', '30', '45'];

// ─── Estimated time chips ─────────────────────────────────────────────────

const TIME_CHIPS: { value: number; label: string }[] = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
];

// ─── Sheet type ───────────────────────────────────────────────────────────

type SheetKey = 'date' | 'assignee' | 'time' | 'category' | 'priority' | 'recurrence' | 'note' | null;

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── BottomSheet component ────────────────────────────────────────────────

function BottomSheet({
  visible,
  onClose,
  title,
  children,
  renderContent,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  renderContent?: () => React.ReactNode;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, translateY, overlayOpacity]);

  if (!modalVisible && !visible) return null;

  return (
    <Modal transparent visible={modalVisible} animationType="none" statusBarTranslucent>
      <View style={sheetStyles.wrapper}>
        <Animated.View
          style={[
            sheetStyles.overlay,
            { opacity: overlayOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            sheetStyles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={sheetStyles.handleContainer}>
            <View style={sheetStyles.handle} />
          </View>

          <Text style={sheetStyles.title}>{title}</Text>

          <ScrollView
            style={sheetStyles.content}
            contentContainerStyle={sheetStyles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {renderContent ? renderContent() : children}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={sheetStyles.validateSafe}>
            <TouchableOpacity
              style={sheetStyles.validateBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={sheetStyles.validateText}>Valider</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.base,
  },
  content: {
    flexShrink: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  validateSafe: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  validateBtn: {
    backgroundColor: Colors.terracotta,
    height: 56,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  validateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});

// ─── OptionRow component ──────────────────────────────────────────────────

function OptionRow({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  onPress,
  isLast,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={rowStyles.optionRow} onPress={onPress} activeOpacity={0.6}>
        <View style={[rowStyles.optionIcon, { backgroundColor: `${iconColor}22` }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
        </View>
        <View style={rowStyles.optionContent}>
          <Text style={rowStyles.optionLabel}>{label}</Text>
          <Text
            style={[rowStyles.optionValue, valueColor ? { color: valueColor } : undefined]}
            numberOfLines={1}
          >
            {value}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {!isLast && <View style={rowStyles.optionDivider} />}
    </>
  );
}

const rowStyles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  optionValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  optionDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
});

// ─── Screen ────────────────────────────────────────────────────────────────

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTask = useCreateTask();
  const { members } = useHouseholdStore();
  const { data: existingTasks = [] } = useTasks();

  // Build deduplicated task variants for suggestions
  const allVariants = useMemo(
    () => buildTaskVariants(existingTasks),
    [existingTasks]
  );

  const filteredVariants = useMemo(
    () => filterVariants(allVariants, taskName),
    [allVariants, taskName]
  );

  // Form state
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<{ hour: number; minute: string } | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [category, setCategory] = useState<TaskCategory>('cleaning');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [notes, setNotes] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // Input focus state
  const [inputFocused, setInputFocused] = useState(false);

  // Sheet state
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);

  // Date picker state
  const [displayMonth, setDisplayMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [timeOpen, setTimeOpen] = useState(false);
  const [selPeriod, setSelPeriod] = useState<Period>('matin');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const effectiveMin = useMemo(() => startOfDay(new Date()), []);

  // ─── Calendar grid ────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [displayMonth]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDayPress = (day: Date) => setDueDate(day);
  const handleQuickDateChip = (getDate: () => Date) => setDueDate(getDate());
  const handleHourSelect = (hour: number) => setDueTime({ hour, minute: dueTime?.minute ?? '00' });

  const handleMinuteSelect = (minute: string) => {
    if (dueTime) {
      setDueTime({ ...dueTime, minute });
    } else {
      const firstHour = PERIODS.find(p => p.key === selPeriod)!.hours[0];
      setDueTime({ hour: firstHour, minute });
    }
  };

  const isHourPast = useCallback((hour: number) => {
    const now = new Date();
    if (!dueDate || !isSameDay(dueDate, now)) return false;
    return hour < now.getHours();
  }, [dueDate]);

  const toggleAssignee = (userId: string) => {
    setAssignedTo(prev => prev === userId ? null : userId);
  };

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    let dueDateStr: string | undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (dueTime) d.setHours(dueTime.hour, parseInt(dueTime.minute, 10), 0, 0);
      dueDateStr = d.toISOString().split('T')[0];
    }

    const values: TaskFormValues = {
      title: taskName.trim(),
      description: notes.trim() || undefined,
      category,
      zone: 'general',
      priority,
      recurrence,
      assigned_to: assignedTo ?? '',
      due_date: dueDateStr,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      task_type: 'household',
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

  const handleVariantSelect = useCallback((variant: TaskVariant) => {
    setTaskName(variant.title);
    setCategory(variant.category);
    setPriority(variant.priority);
    setRecurrence(variant.recurrence);
    setEstimatedMinutes(variant.estimatedMinutes != null ? String(variant.estimatedMinutes) : '');
    setNotes(variant.description ?? '');
    setInputFocused(false);
  }, []);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const categoryOptions = useMemo(() =>
    Object.entries(categoryLabels).map(([key, val]) => ({
      value: key as TaskCategory,
      label: val.label,
      icon: val.icon,
    })),
  []);

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMemberColor = (index: number) => Colors.memberColors[index % Colors.memberColors.length];

  const currentPeriodHours = PERIODS.find(p => p.key === selPeriod)!.hours;
  const isDisabled = !taskName.trim();

  // ─── Value previews ───────────────────────────────────────────────────────

  const datePreview = useMemo(() => {
    if (!dueDate) return 'Non définie';
    let text = formatDatePill(dueDate);
    if (dueTime) text += ` \u00B7 ${dueTime.hour.toString().padStart(2, '0')}:${dueTime.minute}`;
    return text;
  }, [dueDate, dueTime]);

  const assigneePreview = useMemo(() => {
    if (!assignedTo) return 'Personne';
    const member = members.find(m => m.user_id === assignedTo);
    if (!member) return 'Personne';
    return member.profile?.full_name?.split(' ')[0] ?? 'Membre';
  }, [assignedTo, members]);

  const timePreview = useMemo(() => {
    if (!estimatedMinutes) return 'Non défini';
    const mins = parseInt(estimatedMinutes, 10);
    if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}` : ''}`;
    return `${estimatedMinutes} min`;
  }, [estimatedMinutes]);

  const categoryPreview = useMemo(() => {
    return categoryLabels[category]?.label ?? category;
  }, [category]);

  const currentPriority = PRIORITY_CONFIG.find(p => p.value === priority)!;

  const recurrencePreview = useMemo(() => {
    return RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label ?? 'Aucune';
  }, [recurrence]);

  const notePreview = useMemo(() => {
    if (!notes.trim()) return 'Aucune';
    return notes.trim().length > 30 ? notes.trim().substring(0, 30) + '...' : notes.trim();
  }, [notes]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Nouvelle tâche</Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isDisabled || createTask.isPending}
            activeOpacity={0.7}
            style={styles.headerCreateBtn}
          >
            {createTask.isPending ? (
              <ActivityIndicator size="small" color={Colors.terracotta} />
            ) : (
              <Text style={[styles.headerCreateText, isDisabled && styles.headerCreateTextDisabled]}>
                Créer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scrollable form */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title input */}
        <View style={styles.titleSection}>
          <TextInput
            style={[
              styles.taskNameInput,
              inputFocused && styles.taskNameInputFocused,
            ]}
            placeholder="Que faut-il faire ?"
            placeholderTextColor={Colors.textMuted}
            value={taskName}
            onChangeText={setTaskName}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            autoFocus
            returnKeyType="done"
          />
          <TaskSuggestions
            query={taskName}
            variants={filteredVariants}
            visible={inputFocused}
            onSelect={handleVariantSelect}
          />
        </View>

        {/* Option rows card */}
        <View style={styles.optionsCard}>
          <OptionRow
            icon="calendar-outline"
            iconColor={Colors.terracotta}
            label="Date limite"
            value={datePreview}
            valueColor={dueDate ? Colors.terracotta : undefined}
            onPress={() => setActiveSheet('date')}
          />
          <OptionRow
            icon="person-outline"
            iconColor={Colors.prune}
            label="Assigné à"
            value={assigneePreview}
            valueColor={assignedTo ? Colors.prune : undefined}
            onPress={() => setActiveSheet('assignee')}
          />
          <OptionRow
            icon="time-outline"
            iconColor={Colors.miel}
            label="Temps estimé"
            value={timePreview}
            valueColor={estimatedMinutes ? Colors.miel : undefined}
            onPress={() => setActiveSheet('time')}
          />
          <OptionRow
            icon="pricetag-outline"
            iconColor={Colors.miel}
            label="Catégorie"
            value={categoryPreview}
            valueColor={Colors.miel}
            onPress={() => setActiveSheet('category')}
          />
          <OptionRow
            icon="flag-outline"
            iconColor={Colors.terracotta}
            label="Priorité"
            value={currentPriority.label}
            valueColor={currentPriority.dot}
            onPress={() => setActiveSheet('priority')}
          />
          <OptionRow
            icon="repeat-outline"
            iconColor={Colors.prune}
            label="Récurrence"
            value={recurrencePreview}
            valueColor={recurrence !== 'none' ? Colors.prune : undefined}
            onPress={() => setActiveSheet('recurrence')}
          />
          <OptionRow
            icon="document-text-outline"
            iconColor={Colors.gray400}
            label="Note"
            value={notePreview}
            valueColor={notes.trim() ? Colors.textPrimary : undefined}
            onPress={() => setActiveSheet('note')}
            isLast
          />
        </View>
      </ScrollView>

      {/* CTA fixed bottom */}
      <SafeAreaView edges={['bottom']} style={styles.ctaSafe}>
        <TouchableOpacity
          style={[styles.ctaButton, isDisabled && styles.ctaButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isDisabled || createTask.isPending}
        >
          {createTask.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color={Colors.textInverse} />
              <Text style={styles.ctaText}>Ajouter la tâche</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* ─── Bottom Sheets ─────────────────────────────────────────────────── */}

      {/* Date Sheet */}
      <BottomSheet
        visible={activeSheet === 'date'}
        onClose={() => setActiveSheet(null)}
        title="Date limite"
        renderContent={() => (
          <>
            {/* Quick chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {QUICK_DATE_CHIPS.map(chip => {
                const active = dueDate ? isSameDay(chip.getDate(), dueDate) : false;
                return (
                  <TouchableOpacity
                    key={chip.label}
                    onPress={() => handleQuickDateChip(chip.getDate)}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateChipText, active ? styles.dateChipTextActive as TextStyle : undefined]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {dueDate && (
                <TouchableOpacity
                  onPress={() => { setDueDate(null); setDueTime(null); }}
                  style={styles.dateChipClear}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateChipClearText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Mini calendar */}
            <View style={styles.calendarContainer}>
              <View style={styles.monthHeader}>
                <TouchableOpacity
                  onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                  style={styles.monthNavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                  style={styles.monthNavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.dayNamesRow}>
                {DAY_NAMES.map((name, i) => (
                  <View key={i} style={styles.dayNameCell}>
                    <Text style={styles.dayNameText}>{name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((day, i) => {
                  if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;
                  const isPast = startOfDay(day) < effectiveMin;
                  const isToday = isSameDay(day, today);
                  const isSelected = dueDate ? isSameDay(day, dueDate) : false;
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      onPress={() => !isPast && handleDayPress(day)}
                      disabled={isPast}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        isPast ? styles.dayTextPast as TextStyle : undefined,
                        isToday ? styles.dayTextToday as TextStyle : undefined,
                        isSelected ? styles.dayTextSelected as TextStyle : undefined,
                      ]}>
                        {day.getDate()}
                      </Text>
                      {isToday && !isSelected && <View style={styles.todayDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time section */}
            <TouchableOpacity style={styles.timeToggle} onPress={() => setTimeOpen(prev => !prev)} activeOpacity={0.7}>
              <View style={styles.timeToggleLeft}>
                <Ionicons name="time-outline" size={16} color={Colors.prune} />
                <Text style={styles.timeToggleLabel}>Heure limite</Text>
              </View>
              <View style={styles.timeToggleRight}>
                {dueTime && (
                  <View style={styles.pillMint}>
                    <Text style={styles.pillMintText}>
                      {dueTime.hour.toString().padStart(2, '0')}:{dueTime.minute}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={timeOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {timeOpen && (
              <View style={styles.timePanel}>
                {/* Period filter */}
                <View style={styles.periodRow}>
                  {PERIODS.map(p => {
                    const active = selPeriod === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[styles.periodBtn, active && styles.periodBtnActive]}
                        onPress={() => setSelPeriod(p.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.periodEmoji}>{p.emoji}</Text>
                        <Text style={[styles.periodText, active ? styles.periodTextActive as TextStyle : undefined]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hour grid */}
                <View style={styles.hourGrid}>
                  {currentPeriodHours.map(hour => {
                    const active = dueTime?.hour === hour;
                    const past = isHourPast(hour);
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.hourCell, active && styles.hourCellActive, past && styles.hourCellDisabled]}
                        onPress={() => !past && handleHourSelect(hour)}
                        disabled={past}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.hourText,
                          active ? styles.hourTextActive as TextStyle : undefined,
                          past ? styles.hourTextDisabled as TextStyle : undefined,
                        ]}>
                          {hour.toString().padStart(2, '0')}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Minutes */}
                <View style={styles.minuteSection}>
                  <Text style={styles.minuteSectionLabel}>MINUTES</Text>
                  <View style={styles.minuteRow}>
                    {MINUTES.map(m => {
                      const active = dueTime?.minute === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.minuteCell, active && styles.minuteCellActive]}
                          onPress={() => handleMinuteSelect(m)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.minuteText, active ? styles.minuteTextActive as TextStyle : undefined]}>
                            :{m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      />

      {/* Assignee Sheet */}
      <BottomSheet
        visible={activeSheet === 'assignee'}
        onClose={() => setActiveSheet(null)}
        title="Assigné à"
        renderContent={() => (
          <>
            {/* Aucun option */}
            <TouchableOpacity
              style={styles.sheetListRow}
              onPress={() => setAssignedTo(null)}
              activeOpacity={0.6}
            >
              <View style={[styles.sheetAvatar, { backgroundColor: Colors.gray100 }]}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
              </View>
              <Text style={styles.sheetListLabel}>Personne</Text>
              {!assignedTo && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.sauge} />
              )}
            </TouchableOpacity>
            <View style={styles.sheetDivider} />

            {members.length === 0 ? (
              <Text style={styles.emptyText}>Aucun membre dans le foyer</Text>
            ) : (
              members.map((m, i) => {
                const selected = assignedTo === m.user_id;
                const color = m.color ?? getMemberColor(i);
                const fullName = m.profile?.full_name ?? 'Membre';
                return (
                  <React.Fragment key={m.user_id}>
                    <TouchableOpacity
                      style={styles.sheetListRow}
                      onPress={() => toggleAssignee(m.user_id)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.sheetAvatar, { backgroundColor: selected ? color : Colors.gray100 }]}>
                        <Text style={[
                          styles.sheetAvatarText,
                          { color: selected ? Colors.textInverse : Colors.textSecondary },
                        ]}>
                          {getInitials(m.profile?.full_name)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.sheetListLabel,
                        selected && { fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'] },
                      ]}>
                        {fullName}
                      </Text>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.sauge} />
                      )}
                    </TouchableOpacity>
                    {i < members.length - 1 && <View style={styles.sheetDivider} />}
                  </React.Fragment>
                );
              })
            )}
          </>
        )}
      />

      {/* Estimated Time Sheet */}
      <BottomSheet
        visible={activeSheet === 'time'}
        onClose={() => setActiveSheet(null)}
        title="Temps estimé"
        renderContent={() => (
          <>
            <View style={styles.timeInputCenter}>
              <TextInput
                style={styles.timeInputLarge}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.timeInputSuffix}>min</Text>
            </View>

            <View style={styles.timeChipsRow}>
              {TIME_CHIPS.map(chip => {
                const active = estimatedMinutes === String(chip.value);
                return (
                  <TouchableOpacity
                    key={chip.value}
                    onPress={() => setEstimatedMinutes(active ? '' : String(chip.value))}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      />

      {/* Category Sheet */}
      <BottomSheet
        visible={activeSheet === 'category'}
        onClose={() => setActiveSheet(null)}
        title="Catégorie"
        renderContent={() => (
          <>
            {categoryOptions.map((opt, i) => {
              const active = category === opt.value;
              return (
                <React.Fragment key={opt.value}>
                  <TouchableOpacity
                    style={styles.sheetListRow}
                    onPress={() => setCategory(opt.value)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.sheetIconCircle, { backgroundColor: active ? `${Colors.prune}22` : Colors.gray50 }]}>
                      <Ionicons
                        name={opt.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={active ? Colors.prune : Colors.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.sheetListLabel,
                      active && { color: Colors.prune, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'] },
                    ]}>
                      {opt.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.sauge} />
                    )}
                  </TouchableOpacity>
                  {i < categoryOptions.length - 1 && <View style={styles.sheetDivider} />}
                </React.Fragment>
              );
            })}
          </>
        )}
      />

      {/* Priority Sheet */}
      <BottomSheet
        visible={activeSheet === 'priority'}
        onClose={() => setActiveSheet(null)}
        title="Priorité"
        renderContent={() => (
          <>
            <View style={styles.priorityCards}>
              {PRIORITY_CONFIG.map(p => {
                const active = priority === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    style={[
                      styles.priorityCard,
                      { borderColor: active ? p.dot : Colors.borderLight },
                      active && { borderWidth: 2 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: p.dot }]} />
                    <View style={styles.priorityCardContent}>
                      <Text style={[styles.priorityCardLabel, { color: p.text }]}>{p.label}</Text>
                      <Text style={styles.priorityCardDesc}>{p.description}</Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.sauge} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      />

      {/* Recurrence Sheet */}
      <BottomSheet
        visible={activeSheet === 'recurrence'}
        onClose={() => setActiveSheet(null)}
        title="Récurrence"
        renderContent={() => (
          <>
            {RECURRENCE_OPTIONS.map((opt, i) => {
              const active = recurrence === opt.value;
              return (
                <React.Fragment key={opt.value}>
                  <TouchableOpacity
                    style={styles.sheetListRow}
                    onPress={() => setRecurrence(opt.value)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.sheetIconCircle, { backgroundColor: active ? `${Colors.prune}22` : Colors.gray50 }]}>
                      <Ionicons
                        name={opt.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={active ? Colors.prune : Colors.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.sheetListLabel,
                      active && { color: Colors.prune, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'] },
                    ]}>
                      {opt.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.sauge} />
                    )}
                  </TouchableOpacity>
                  {i < RECURRENCE_OPTIONS.length - 1 && <View style={styles.sheetDivider} />}
                </React.Fragment>
              );
            })}
          </>
        )}
      />

      {/* Note Sheet */}
      <BottomSheet
        visible={activeSheet === 'note'}
        onClose={() => setActiveSheet(null)}
        title="Note"
        renderContent={() => (
          <>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              autoFocus={activeSheet === 'note'}
            />
          </>
        )}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerSafe: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    height: 52,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  headerCreateBtn: {
    paddingHorizontal: Spacing.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCreateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.terracotta,
  },
  headerCreateTextDisabled: {
    opacity: 0.35,
  },

  // ── ScrollView ──────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },

  // ── Title input ─────────────────────────────────────────────────────────
  titleSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  taskNameInput: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.input,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  taskNameInputFocused: {
    borderColor: Colors.borderFocus,
  },

  // ── Options card ────────────────────────────────────────────────────────
  optionsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // ── Date section (inside sheet) ─────────────────────────────────────────
  chipRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.base,
  },
  dateChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  dateChipActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  dateChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  dateChipTextActive: {
    color: Colors.textInverse,
  },
  dateChipClear: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.rose,
    backgroundColor: `${Colors.rose}14`,
  },
  dateChipClearText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.rose,
  },

  // Calendar
  calendarContainer: {
    gap: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  dayNamesRow: {
    flexDirection: 'row',
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%' as unknown as number,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 38,
  },
  dayCellSelected: {
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
  },
  dayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  dayTextPast: {
    color: Colors.gray300,
  },
  dayTextToday: {
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.terracotta,
  },
  dayTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.terracotta,
  },

  // Time
  timeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  timeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeToggleLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  timeToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timePanel: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  periodBtnActive: {
    backgroundColor: `${Colors.prune}1A`,
    borderColor: Colors.prune,
  },
  periodEmoji: {
    fontSize: Typography.fontSize.sm,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.prune,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hourCell: {
    width: '23%' as unknown as number,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
  },
  hourCellActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  hourCellDisabled: {
    borderColor: Colors.borderLight,
  },
  hourText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  hourTextActive: {
    color: Colors.textInverse,
  },
  hourTextDisabled: {
    color: Colors.gray300,
  },
  minuteSection: {
    gap: Spacing.xs,
  },
  minuteSectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  minuteCell: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
  },
  minuteCellActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  minuteText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  minuteTextActive: {
    color: Colors.textInverse,
  },
  pillMint: {
    backgroundColor: `${Colors.terracotta}1A`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  pillMintText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.greenStrong,
  },

  // ── Sheet list rows (assignee, category, recurrence) ────────────────────
  sheetListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  sheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetListLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // ── Estimated time (inside sheet) ───────────────────────────────────────
  timeInputCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  timeInputLarge: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },
  timeInputSuffix: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  timeChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  timeChipActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  timeChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.textInverse,
  },

  // ── Priority (inside sheet) ─────────────────────────────────────────────
  priorityCards: {
    gap: Spacing.md,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundCard,
    gap: Spacing.md,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm / 2,
  },
  priorityCardContent: {
    flex: 1,
    gap: 2,
  },
  priorityCardLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  },
  priorityCardDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // ── Note (inside sheet) ─────────────────────────────────────────────────
  noteInput: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // ── CTA ─────────────────────────────────────────────────────────────────
  ctaSafe: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.terracotta,
    height: 56,
    borderRadius: BorderRadius.button,
  },
  ctaButtonDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});
