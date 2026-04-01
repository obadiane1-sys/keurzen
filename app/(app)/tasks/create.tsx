import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  LayoutChangeEvent,
  TextStyle,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../../src/components/ui/Text';
import { useCreateTask } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { categoryLabels } from '../../../src/components/tasks/TaskCard';
import type { TaskFormValues, TaskCategory, TaskPriority } from '../../../src/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const MINT = '#7DCCC3';
const BORDER_COLOR = '#f0ede8';
const TEXT_PRIMARY = '#1a1a2e';
const TEXT_PLACEHOLDER = '#d0cdd8';
const TEXT_MUTED = '#c0bdb8';
const TEXT_SUBTLE = '#6b6b8a';

const ROW_ICON = {
  date:     { bg: '#E1F5EE', stroke: '#0F6E56' },
  assignee: { bg: '#EEEDFE', stroke: '#534AB7' },
  category: { bg: '#FAEEDA', stroke: '#854F0B' },
  priority: { bg: '#FAECE7', stroke: '#993C1D' },
  note:     { bg: '#F1EFE8', stroke: '#5F5E5A' },
};

const PRIORITY_CONFIG: { value: TaskPriority; label: string; dot: string; labelColor: string; bg: string; border: string; text: string }[] = [
  { value: 'low',    label: 'Faible',  dot: '#1D9E75', labelColor: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB', text: '#0F6E56' },
  { value: 'medium', label: 'Moyenne', dot: '#EF9F27', labelColor: '#854F0B', bg: '#FAEEDA', border: '#FAC775', text: '#854F0B' },
  { value: 'high',   label: 'Élevée',  dot: '#D85A30', labelColor: '#993C1D', bg: '#FAECE7', border: '#F5C4B3', text: '#993C1D' },
];

const MEMBER_COLORS = ['#F0A898', '#AFA9EC', '#7DCCC3', '#F5C4B3', '#9FE1CB', '#CECBF6'];

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

// Quick chips for date
const QUICK_DATE_CHIPS = [
  { label: "Aujourd'hui", bg: '#E1F5EE', border: '#9FE1CB', text: '#0F6E56', getDate: () => new Date() },
  { label: 'Demain', bg: '#F1EFE8', border: '#D3D1C7', text: '#444441', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
  { label: 'Vendredi', bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489', getDate: () => endOfWeek() },
];

// Time periods
type Period = 'matin' | 'apres-midi' | 'soir';
const PERIODS: { key: Period; label: string; emoji: string; hours: number[] }[] = [
  { key: 'matin', label: 'Matin', emoji: '🌅', hours: [6, 7, 8, 9, 10, 11, 12] },
  { key: 'apres-midi', label: 'Après-midi', emoji: '☀️', hours: [12, 13, 14, 15, 16, 17, 18] },
  { key: 'soir', label: 'Soir', emoji: '🌙', hours: [18, 19, 20, 21, 22, 23] },
];
const MINUTES = ['00', '15', '30', '45'];

// ─── Expandable Row wrapper ─────────────────────────────────────────────────

type RowKey = 'date' | 'assignee' | 'category' | 'priority' | 'note';

function ExpandablePanel({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && !measured) {
      setContentHeight(h);
      setMeasured(true);
    } else if (h > 0 && Math.abs(h - contentHeight) > 1) {
      setContentHeight(h);
    }
  }, [measured, contentHeight]);

  React.useEffect(() => {
    if (!measured && expanded) {
      // First expansion — wait for measure, then animate
      return;
    }
    Animated.spring(animatedHeight, {
      toValue: expanded ? contentHeight : 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, contentHeight, animatedHeight, measured]);

  // When first measured and expanded, animate immediately
  React.useEffect(() => {
    if (measured && expanded && contentHeight > 0) {
      Animated.spring(animatedHeight, {
        toValue: contentHeight,
        damping: 18,
        stiffness: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [measured, contentHeight, expanded, animatedHeight]);

  return (
    <Animated.View style={{ height: animatedHeight, overflow: 'hidden' as const }}>
      <View
        onLayout={onLayout}
        style={{ position: measured ? 'relative' : 'absolute', width: '100%' }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createTask = useCreateTask();
  const { members } = useHouseholdStore();

  // Form state
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<{ hour: number; minute: string } | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [category, setCategory] = useState<TaskCategory>('cleaning');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [notes, setNotes] = useState('');

  // Expansion state — one panel at a time
  const [expandedRow, setExpandedRow] = useState<RowKey | null>(null);

  // Date picker state
  const [displayMonth, setDisplayMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [timeOpen, setTimeOpen] = useState(false);
  const [selPeriod, setSelPeriod] = useState<Period>('matin');

  const today = useMemo(() => new Date(), []);
  const effectiveMin = useMemo(() => startOfDay(new Date()), []);

  // Fix #3: reset timeOpen when changing rows
  const toggleRow = useCallback((key: RowKey) => {
    setExpandedRow(prev => {
      if (prev === 'date' && key !== 'date') {
        setTimeOpen(false);
      }
      return prev === key ? null : key;
    });
  }, []);

  // Chevron rotation per row
  const chevronDate = useRef(new Animated.Value(0)).current;
  const chevronAssignee = useRef(new Animated.Value(0)).current;
  const chevronCategory = useRef(new Animated.Value(0)).current;
  const chevronPriority = useRef(new Animated.Value(0)).current;

  const chevronMap: Record<string, Animated.Value> = useMemo(() => ({
    date: chevronDate,
    assignee: chevronAssignee,
    category: chevronCategory,
    priority: chevronPriority,
  }), [chevronDate, chevronAssignee, chevronCategory, chevronPriority]);

  React.useEffect(() => {
    const keys = ['date', 'assignee', 'category', 'priority'];
    keys.forEach(k => {
      Animated.spring(chevronMap[k], {
        toValue: expandedRow === k ? 90 : 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [expandedRow, chevronMap]);

  const chevronStyleDate = { transform: [{ rotate: chevronDate.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }] };
  const chevronStyleAssignee = { transform: [{ rotate: chevronAssignee.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }] };
  const chevronStyleCategory = { transform: [{ rotate: chevronCategory.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }] };
  const chevronStylePriority = { transform: [{ rotate: chevronPriority.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }] };

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

  const handleDayPress = (day: Date) => {
    setDueDate(day);
  };

  const handleQuickDateChip = (getDate: () => Date) => {
    setDueDate(getDate());
  };

  const handleHourSelect = (hour: number) => {
    setDueTime({ hour, minute: dueTime?.minute ?? '00' });
  };

  // Fix #2: allow minute selection even without hour — auto-select first available hour
  const handleMinuteSelect = (minute: string) => {
    if (dueTime) {
      setDueTime({ ...dueTime, minute });
    } else {
      const firstHour = PERIODS.find(p => p.key === selPeriod)!.hours[0];
      setDueTime({ hour: firstHour, minute });
    }
  };

  const isHourPast = useCallback((hour: number) => {
    if (!dueDate || !isSameDay(dueDate, today)) return false;
    return hour < today.getHours();
  }, [dueDate, today]);

  // Fix #4: single assignee selection (toggle on/off)
  const toggleAssignee = (userId: string) => {
    setAssignedTo(prev => prev === userId ? null : userId);
  };

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    let dueDateStr: string | undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (dueTime) {
        d.setHours(dueTime.hour, parseInt(dueTime.minute, 10), 0, 0);
      }
      dueDateStr = d.toISOString().split('T')[0];
    }

    const values: TaskFormValues = {
      title: taskName.trim(),
      description: notes.trim() || undefined,
      category,
      zone: 'general',
      priority,
      recurrence: 'none',
      assigned_to: assignedTo ?? '',
      due_date: dueDateStr,
      estimated_minutes: undefined,
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

  // ─── Category options ─────────────────────────────────────────────────────

  const categoryOptions = useMemo(() =>
    Object.entries(categoryLabels).map(([key, val]) => ({
      value: key as TaskCategory,
      label: val.label,
      icon: val.icon,
    })),
  []);

  // ─── Priority display ────────────────────────────────────────────────────

  const currentPriority = PRIORITY_CONFIG.find(p => p.value === priority) ?? PRIORITY_CONFIG[1];

  // ─── Assignee display ─────────────────────────────────────────────────────

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMemberColor = (index: number) => MEMBER_COLORS[index % MEMBER_COLORS.length];

  const assignedMember = assignedTo ? members.find(m => m.user_id === assignedTo) : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  const currentPeriodHours = PERIODS.find(p => p.key === selPeriod)!.hours;
  const isDisabled = !taskName.trim();
  // Fix #6: dynamic spacer based on CTA height + insets
  const ctaHeight = 50 + 12 + 12 + insets.bottom;

  return (
    <View style={styles.container}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          {/* Fix #5: 44px touch targets */}
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle tâche</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerBtn}
            activeOpacity={0.7}
            disabled={isDisabled || createTask.isPending}
          >
            {createTask.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ opacity: isDisabled ? 0.45 : 1 }} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── TASK NAME ──────────────────────────────────────────────────── */}
      <View style={styles.taskNameContainer}>
        <TextInput
          style={styles.taskNameInput}
          placeholder="Nom de la tâche…"
          placeholderTextColor={TEXT_PLACEHOLDER}
          value={taskName}
          onChangeText={setTaskName}
          autoFocus
          returnKeyType="done"
        />
      </View>

      {/* ── ROWS ───────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── ROW 1: DATE LIMITE ─────────────────────────────────────── */}
        <TouchableOpacity style={styles.row} onPress={() => toggleRow('date')} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: ROW_ICON.date.bg }]}>
            <Ionicons name="calendar-outline" size={16} color={ROW_ICON.date.stroke} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Date limite</Text>
          </View>
          <View style={styles.rowRight}>
            {dueDate && (
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{formatDatePill(dueDate)}</Text>
              </View>
            )}
            {dueTime && (
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>
                  {dueTime.hour.toString().padStart(2, '0')}:{dueTime.minute}
                </Text>
              </View>
            )}
          </View>
          <Animated.View style={chevronStyleDate}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </TouchableOpacity>

        <ExpandablePanel expanded={expandedRow === 'date'}>
          <View style={styles.expandedContent}>
            {/* Quick chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsRow}>
              {QUICK_DATE_CHIPS.map(chip => {
                const active = dueDate ? isSameDay(chip.getDate(), dueDate) : false;
                return (
                  <TouchableOpacity
                    key={chip.label}
                    onPress={() => handleQuickDateChip(chip.getDate)}
                    style={[
                      styles.quickChip,
                      { backgroundColor: chip.bg, borderColor: chip.border },
                      active && { transform: [{ scale: 1.04 }], borderWidth: 2, borderColor: chip.text },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.quickChipText, { color: chip.text }]}>{chip.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mini calendar */}
            <View style={styles.calendarContainer}>
              <View style={styles.monthHeader}>
                {/* Fix #5: 44px touch targets for month nav */}
                <TouchableOpacity
                  onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                  style={styles.monthBtn}
                  hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                >
                  <Text style={styles.monthBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                  style={styles.monthBtn}
                  hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                >
                  <Text style={styles.monthBtnText}>›</Text>
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
                      {isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: '#FFFFFF' }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time toggle */}
            <TouchableOpacity style={styles.timeToggle} onPress={() => setTimeOpen(prev => !prev)} activeOpacity={0.8}>
              <View style={styles.timeToggleLeft}>
                <View style={[styles.timeToggleIcon, { backgroundColor: '#EEEDFE' }]}>
                  <Ionicons name="time-outline" size={14} color="#3C3489" />
                </View>
                <Text style={styles.timeToggleLabel}>Heure limite</Text>
              </View>
              <View style={styles.timeToggleRight}>
                {dueTime && (
                  <View style={styles.timeActiveBadge}>
                    <Text style={styles.timeActiveBadgeText}>
                      {dueTime.hour.toString().padStart(2, '0')}:{dueTime.minute}
                    </Text>
                  </View>
                )}
                <Ionicons name={timeOpen ? 'chevron-up' : 'chevron-down'} size={14} color={TEXT_SUBTLE} />
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
                        activeOpacity={0.8}
                      >
                        <Text style={styles.periodEmoji}>{p.emoji}</Text>
                        <Text style={[styles.periodText, active ? styles.periodTextActive as TextStyle : undefined]}>{p.label}</Text>
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
                        <Text style={[styles.hourText, active ? styles.hourTextActive as TextStyle : undefined, past ? styles.hourTextDisabled as TextStyle : undefined]}>
                          {hour.toString().padStart(2, '0')}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Minutes */}
                <View style={styles.minuteSection}>
                  <Text style={styles.minuteLabel}>MINUTES</Text>
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
                          <Text style={[styles.minuteText, active ? styles.minuteTextActive as TextStyle : undefined]}>:{m}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ExpandablePanel>

        {/* ── ROW 2: ASSIGNÉ À ───────────────────────────────────────── */}
        <TouchableOpacity style={styles.row} onPress={() => toggleRow('assignee')} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: ROW_ICON.assignee.bg }]}>
            <Ionicons name="person-outline" size={16} color={ROW_ICON.assignee.stroke} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Assigné à</Text>
          </View>
          <View style={styles.rowRight}>
            {!assignedMember && (
              <Text style={styles.rowPlaceholder}>Personne</Text>
            )}
            {assignedMember && (
              <View style={[styles.miniAvatar, { backgroundColor: assignedMember.color ?? getMemberColor(0) }]}>
                <Text style={styles.miniAvatarText}>
                  {getInitials(assignedMember.profile?.full_name)}
                </Text>
              </View>
            )}
          </View>
          <Animated.View style={chevronStyleAssignee}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </TouchableOpacity>

        <ExpandablePanel expanded={expandedRow === 'assignee'}>
          <View style={styles.expandedContent}>
            {/* Fix #7: empty state for no members */}
            {members.length === 0 ? (
              <Text style={styles.emptyAssignee}>Aucun membre dans le foyer</Text>
            ) : (
              <View style={styles.assigneeGrid}>
                {members.map((m, i) => {
                  const selected = assignedTo === m.user_id;
                  const color = m.color ?? getMemberColor(i);
                  return (
                    <TouchableOpacity
                      key={m.user_id}
                      onPress={() => toggleAssignee(m.user_id)}
                      style={styles.assigneeItem}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.assigneeAvatar,
                        {
                          backgroundColor: selected ? color : '#F1F5F9',
                          borderColor: selected ? MINT : 'transparent',
                          borderWidth: selected ? 2 : 0,
                          transform: [{ scale: selected ? 1.1 : 1 }],
                        },
                      ]}>
                        <Text style={[
                          styles.assigneeInitials,
                          { color: selected ? '#FFFFFF' : TEXT_SUBTLE },
                        ]}>
                          {getInitials(m.profile?.full_name)}
                        </Text>
                      </View>
                      <Text style={styles.assigneeName} numberOfLines={1}>
                        {m.profile?.full_name ?? 'Membre'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ExpandablePanel>

        {/* ── ROW 3: CATÉGORIE ───────────────────────────────────────── */}
        <TouchableOpacity style={styles.row} onPress={() => toggleRow('category')} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: ROW_ICON.category.bg }]}>
            <Ionicons name="grid-outline" size={16} color={ROW_ICON.category.stroke} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Catégorie</Text>
          </View>
          <View style={styles.rowRight}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {categoryLabels[category]?.label ?? 'Aucune'}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStyleCategory}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </TouchableOpacity>

        <ExpandablePanel expanded={expandedRow === 'category'}>
          <View style={styles.expandedContent}>
            <View style={styles.categoryGrid}>
              {categoryOptions.map(opt => {
                const active = category === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setCategory(opt.value)}
                    style={[
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={active ? '#3C3489' : TEXT_SUBTLE}
                    />
                    <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive as TextStyle : undefined]}>
                      {opt.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={14} color="#3C3489" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ExpandablePanel>

        {/* ── ROW 4: PRIORITÉ ────────────────────────────────────────── */}
        <TouchableOpacity style={styles.row} onPress={() => toggleRow('priority')} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: ROW_ICON.priority.bg }]}>
            <Ionicons name="flag-outline" size={16} color={ROW_ICON.priority.stroke} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Priorité</Text>
          </View>
          <View style={styles.rowRight}>
            <View style={styles.priorityDisplay}>
              <View style={[styles.priorityDot, { backgroundColor: currentPriority.dot }]} />
              <Text style={[styles.priorityDisplayText, { color: currentPriority.labelColor }]}>
                {currentPriority.label}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStylePriority}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </TouchableOpacity>

        <ExpandablePanel expanded={expandedRow === 'priority'}>
          <View style={styles.expandedContent}>
            <View style={styles.priorityRow}>
              {PRIORITY_CONFIG.map(p => {
                const active = priority === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    style={[
                      styles.priorityChip,
                      { backgroundColor: p.bg, borderColor: p.border },
                      active && { transform: [{ scale: 1.04 }], borderWidth: 2, borderColor: p.text },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.priorityChipDot, { backgroundColor: p.dot }]} />
                    <Text style={[styles.priorityChipText, { color: p.text }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ExpandablePanel>

        {/* ── ROW 5: NOTE ────────────────────────────────────────────── */}
        <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => toggleRow('note')} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: ROW_ICON.note.bg }]}>
            <Ionicons name="document-text-outline" size={16} color={ROW_ICON.note.stroke} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Note</Text>
          </View>
          {notes.trim() ? (
            <Text style={styles.notePreview} numberOfLines={1}>{notes.trim()}</Text>
          ) : (
            <Text style={styles.rowPlaceholder}>Aucune</Text>
          )}
        </TouchableOpacity>

        <ExpandablePanel expanded={expandedRow === 'note'}>
          <View style={[styles.expandedContent, { paddingBottom: 8 }]}>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note…"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ExpandablePanel>

        {/* Fix #6: dynamic spacer for bottom CTA */}
        <View style={{ height: ctaHeight + 16 }} />
      </ScrollView>

      {/* ── CTA (fixed bottom) ─────────────────────────────────────── */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.ctaButton, isDisabled && styles.ctaButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isDisabled || createTask.isPending}
        >
          {createTask.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>Ajouter la tâche</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  headerSafe: {
    backgroundColor: MINT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: MINT,
  },
  // Fix #5: 44px minimum touch target
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Task name
  taskNameContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
  },
  taskNameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Row
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowPlaceholder: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  chevron: {
    fontSize: 16,
    color: TEXT_MUTED,
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
  },

  // ─── Date row expanded ────────────────────────────────────────────────────
  datePill: {
    backgroundColor: '#E1F5EE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
  },
  timePill: {
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444441',
  },

  quickChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Calendar
  calendarContainer: {
    gap: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnText: {
    fontSize: 18,
    color: TEXT_SUBTLE,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dayNamesRow: {
    flexDirection: 'row',
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaaaaa',
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
    maxHeight: 36,
  },
  dayCellSelected: {
    backgroundColor: MINT,
    borderRadius: 18,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  dayTextPast: {
    color: '#d0cdc8',
  },
  dayTextToday: {
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MINT,
  },

  // Time toggle
  timeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  timeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeToggleIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  timeToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeActiveBadge: {
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeActiveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
  },

  // Time panel
  timePanel: {
    gap: 12,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0ddd6',
    backgroundColor: '#FFFFFF',
  },
  periodBtnActive: {
    backgroundColor: '#EEEDFE',
    borderColor: '#CECBF6',
  },
  periodEmoji: {
    fontSize: 13,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SUBTLE,
  },
  periodTextActive: {
    color: '#3C3489',
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hourCell: {
    width: '23%' as unknown as number,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0ddd6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  hourCellActive: {
    backgroundColor: MINT,
    borderColor: MINT,
  },
  hourCellDisabled: {
    borderColor: BORDER_COLOR,
  },
  hourText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SUBTLE,
  },
  hourTextActive: {
    color: '#FFFFFF',
  },
  hourTextDisabled: {
    color: '#d0cdc8',
  },
  minuteSection: {
    gap: 6,
  },
  minuteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaaaaa',
    letterSpacing: 1,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  minuteCell: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0ddd6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  minuteCellActive: {
    backgroundColor: MINT,
    borderColor: MINT,
  },
  minuteText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SUBTLE,
  },
  minuteTextActive: {
    color: '#FFFFFF',
  },

  // ─── Assignee row expanded ────────────────────────────────────────────────
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assigneeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  assigneeItem: {
    alignItems: 'center',
    gap: 4,
    width: 56,
  },
  assigneeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitials: {
    fontSize: 13,
    fontWeight: '700',
  },
  assigneeName: {
    fontSize: 10,
    color: TEXT_SUBTLE,
    textAlign: 'center',
  },
  emptyAssignee: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // ─── Category row expanded ────────────────────────────────────────────────
  categoryBadge: {
    backgroundColor: '#EEEDFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3489',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ddd6',
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: '#EEEDFE',
    borderColor: '#CECBF6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SUBTLE,
  },
  categoryChipTextActive: {
    color: '#3C3489',
  },

  // ─── Priority row expanded ────────────────────────────────────────────────
  priorityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityDisplayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Note row ─────────────────────────────────────────────────────────────
  notePreview: {
    fontSize: 13,
    color: TEXT_SUBTLE,
    maxWidth: 150,
  },
  noteInput: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // ─── CTA ──────────────────────────────────────────────────────────────────
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: BORDER_COLOR,
  },
  ctaButton: {
    backgroundColor: MINT,
    borderRadius: 24,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
