import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget } from '../../constants/tokens';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];
const SHORT_DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const SHORT_MONTHS = [
  'janv.', 'fev.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysUntilFri = day <= 5 ? 5 - day : 5 + 7 - day;
  const fri = new Date(now);
  fri.setDate(now.getDate() + daysUntilFri);
  return fri;
}

function formatTriggerLabel(date: Date, hasTime: boolean): string {
  const now = new Date();
  const timePart = hasTime
    ? ` · ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : '';

  if (isSameDay(date, now)) return `Aujourd'hui${timePart}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(date, tomorrow)) return `Demain${timePart}`;

  const dow = SHORT_DAYS[date.getDay()];
  const d = date.getDate();
  const mon = SHORT_MONTHS[date.getMonth()];
  return `${dow} ${d} ${mon}${timePart}`;
}

// ─── Quick Chips Config ─────────────────────────────────────────────────────

interface QuickChip {
  label: string;
  bg: string;
  border: string;
  text: string;
  getDate: () => Date | null;
}

const QUICK_CHIPS: QuickChip[] = [
  {
    label: "Aujourd'hui",
    bg: `${Colors.sauge}20`,
    border: Colors.sauge,
    text: Colors.greenStrong,
    getDate: () => {
      const d = new Date();
      d.setHours(23, 59, 0, 0);
      return d;
    },
  },
  {
    label: 'Demain',
    bg: Colors.backgroundSubtle,
    border: Colors.border,
    text: Colors.textPrimary,
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 0, 0);
      return d;
    },
  },
  {
    label: 'Cette semaine',
    bg: `${Colors.prune}20`,
    border: Colors.prune,
    text: Colors.prune,
    getDate: () => {
      const d = endOfWeek();
      d.setHours(23, 59, 0, 0);
      return d;
    },
  },
  {
    label: 'Sans date',
    bg: `${Colors.terracotta}20`,
    border: Colors.terracotta,
    text: Colors.orangeStrong,
    getDate: () => null,
  },
];

// ─── Time config ────────────────────────────────────────────────────────────

type Period = 'matin' | 'apres-midi' | 'soir';

const PERIODS: { key: Period; label: string; emoji: string; hours: number[] }[] = [
  { key: 'matin', label: 'Matin', emoji: '🌅', hours: [6, 7, 8, 9, 10, 11, 12] },
  { key: 'apres-midi', label: 'Apres-midi', emoji: '☀️', hours: [12, 13, 14, 15, 16, 17, 18] },
  { key: 'soir', label: 'Soir', emoji: '🌙', hours: [18, 19, 20, 21, 22, 23] },
];

const MINUTES = ['00', '15', '30', '45'];

// ─── Component ──────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = 'Choisir une date',
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = value ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeSet, setTimeSet] = useState(false); // whether user explicitly chose a time
  const [selPeriod, setSelPeriod] = useState<Period>('matin');
  const [selHour, setSelHour] = useState<number | null>(null);
  const [selMinute, setSelMinute] = useState('00');

  const effectiveMin = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);
  const today = useMemo(() => new Date(), []);

  // Animations — main panel
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(-12)).current;

  // Animations — time panel
  const timeOpacity = useRef(new Animated.Value(0)).current;
  const timeTranslateY = useRef(new Animated.Value(-8)).current;
  const timeChevronRotation = useRef(new Animated.Value(0)).current;

  const chevronStyle = {
    transform: [{
      rotate: chevronRotation.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };
  const panelStyle = {
    opacity: panelOpacity,
    transform: [{ translateY: panelTranslateY }],
  };
  const timePanelStyle = {
    opacity: timeOpacity,
    transform: [{ translateY: timeTranslateY }],
  };
  const timeChevronStyle = {
    transform: [{
      rotate: timeChevronRotation.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  const toggleOpen = useCallback(() => {
    const next = !open;
    setOpen(next);
    Animated.spring(chevronRotation, { toValue: next ? 180 : 0, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    if (next) {
      Animated.timing(panelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.spring(panelTranslateY, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(panelOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      Animated.timing(panelTranslateY, { toValue: -12, duration: 150, useNativeDriver: true }).start();
      // Close time too
      setTimeOpen(false);
      Animated.timing(timeOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      Animated.timing(timeChevronRotation, { toValue: 0, duration: 100, useNativeDriver: true }).start();
    }
  }, [open, chevronRotation, panelOpacity, panelTranslateY, timeOpacity, timeChevronRotation]);

  const toggleTime = useCallback(() => {
    const next = !timeOpen;
    setTimeOpen(next);
    Animated.spring(timeChevronRotation, { toValue: next ? 180 : 0, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    if (next) {
      Animated.timing(timeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.spring(timeTranslateY, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(timeOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      Animated.timing(timeTranslateY, { toValue: -8, duration: 150, useNativeDriver: true }).start();
    }
  }, [timeOpen, timeChevronRotation, timeOpacity, timeTranslateY]);

  // ─── Calendar grid ────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1; // Mon=0
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [displayMonth]);

  // ─── Computed time display ────────────────────────────────────────────────

  const timeDisplayLabel = useMemo(() => {
    if (!timeSet || selHour === null) return 'Optionnel';
    return `${selHour.toString().padStart(2, '0')}:${selMinute}`;
  }, [timeSet, selHour, selMinute]);

  // ─── Helpers: merge time into date ────────────────────────────────────────

  const applyTimeToDate = useCallback(
    (date: Date | null, hour: number | null, minute: string, hasTime: boolean): Date | null => {
      if (!date) return null;
      const d = new Date(date);
      if (hasTime && hour !== null) {
        d.setHours(hour, parseInt(minute, 10), 0, 0);
      } else {
        d.setHours(23, 59, 0, 0);
      }
      return d;
    },
    [],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDayPress = (day: Date) => {
    const updated = applyTimeToDate(day, selHour, selMinute, timeSet)!;
    setSelectedDate(updated);
  };

  const handleQuickChip = (chip: QuickChip) => {
    const d = chip.getDate();
    if (d === null) {
      setSelectedDate(null);
      onChange(null);
      toggleOpen();
      return;
    }
    setSelectedDate(d);
    setTimeSet(false);
    setSelHour(null);
    setSelMinute('00');
  };

  const handlePeriodChange = (period: Period) => {
    setSelPeriod(period);
    const periodDef = PERIODS.find((p) => p.key === period)!;
    if (selHour !== null && !periodDef.hours.includes(selHour)) {
      setSelHour(null);
    }
  };

  const handleHourSelect = (hour: number) => {
    setSelHour(hour);
    setTimeSet(true);
    if (selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(hour, parseInt(selMinute, 10), 0, 0);
      setSelectedDate(d);
    }
  };

  const handleMinuteSelect = (minute: string) => {
    setSelMinute(minute);
    if (selHour !== null && selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(selHour, parseInt(minute, 10), 0, 0);
      setSelectedDate(d);
    }
  };

  const handleConfirm = () => {
    const final = applyTimeToDate(selectedDate, selHour, selMinute, timeSet);
    onChange(final);
    toggleOpen();
  };

  const prevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
  };

  const isChipActive = (chip: QuickChip) => {
    const chipDate = chip.getDate();
    if (chipDate === null && selectedDate === null) return true;
    if (chipDate && selectedDate && isSameDay(chipDate, selectedDate)) return true;
    return false;
  };

  // Is hour in the past when selected date is today?
  const isHourPast = useCallback(
    (hour: number) => {
      if (!selectedDate || !isSameDay(selectedDate, today)) return false;
      return hour < today.getHours();
    },
    [selectedDate, today],
  );

  const currentPeriodHours = PERIODS.find((p) => p.key === selPeriod)!.hours;

  return (
    <View>
      {/* ── Trigger ──────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.triggerLeft}>
          <View style={styles.triggerIcon}>
            <Ionicons name="calendar-outline" size={16} color={Colors.greenStrong} />
          </View>
          <Text
            style={[
              styles.triggerLabel,
              !value && styles.triggerPlaceholder,
            ]}
          >
            {value ? formatTriggerLabel(value, timeSet) : placeholder}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {open && (
        <Animated.View style={[styles.panel, panelStyle]}>
          {/* Month header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Quick chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {QUICK_CHIPS.map((chip) => {
              const active = isChipActive(chip);
              return (
                <TouchableOpacity
                  key={chip.label}
                  onPress={() => handleQuickChip(chip)}
                  style={[
                    styles.chip,
                    { backgroundColor: chip.bg, borderColor: chip.border },
                    active && {
                      transform: [{ scale: 1.04 }],
                      borderWidth: 2,
                      borderColor: chip.text,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: chip.text }]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Day names */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map((name, i) => (
              <View key={i} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              if (!day) {
                return <View key={`empty-${i}`} style={styles.dayCell} />;
              }
              const isPast = startOfDay(day) < effectiveMin;
              const isToday_ = isSameDay(day, today);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => !isPast && handleDayPress(new Date(day))}
                  disabled={isPast}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isPast && styles.dayTextPast,
                      isToday_ && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {isToday_ && (
                    <View
                      style={[
                        styles.todayDot,
                        isSelected && { backgroundColor: Colors.textInverse },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Time section ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.timeTrigger}
            onPress={toggleTime}
            activeOpacity={0.8}
          >
            <View style={styles.timeTriggerLeft}>
              <View style={styles.timeTriggerIcon}>
                <Ionicons name="time-outline" size={14} color={Colors.prune} />
              </View>
              <Text style={styles.timeTriggerLabel}>Heure limite</Text>
            </View>
            <View style={styles.timeTriggerRight}>
              <View
                style={[
                  styles.timeBadge,
                  timeSet ? styles.timeBadgeActive : styles.timeBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.timeBadgeText,
                    timeSet ? styles.timeBadgeTextActive : styles.timeBadgeTextInactive,
                  ]}
                >
                  {timeDisplayLabel}
                </Text>
              </View>
              <Animated.View style={timeChevronStyle}>
                <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {timeOpen && (
            <Animated.View style={[styles.timePanel, timePanelStyle]}>
              {/* Period filter */}
              <View style={styles.periodRow}>
                {PERIODS.map((p) => {
                  const active = selPeriod === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[styles.periodBtn, active && styles.periodBtnActive]}
                      onPress={() => handlePeriodChange(p.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.periodEmoji}>{p.emoji}</Text>
                      <Text
                        style={[
                          styles.periodText,
                          active && styles.periodTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Hour grid */}
              <View style={styles.hourGrid}>
                {currentPeriodHours.map((hour) => {
                  const active = selHour === hour;
                  const past = isHourPast(hour);
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourCell,
                        active && styles.hourCellActive,
                        past && styles.hourCellDisabled,
                      ]}
                      onPress={() => !past && handleHourSelect(hour)}
                      disabled={past}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.hourText,
                          active && styles.hourTextActive,
                          past && styles.hourTextDisabled,
                        ]}
                      >
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
                  {MINUTES.map((m) => {
                    const active = selMinute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.minuteCell, active && styles.minuteCellActive]}
                        onPress={() => handleMinuteSelect(m)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.minuteText,
                            active && styles.minuteTextActive,
                          ]}
                        >
                          :{m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Confirm ──────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>Confirmer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

export default DatePicker;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Trigger ───────────────────────────────────────────────────────────────
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.backgroundCard,
  },
  triggerOpen: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.inputFocusedBg,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  triggerIcon: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.sauge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  triggerPlaceholder: {
    color: Colors.textMuted,
  },

  // ── Panel ─────────────────────────────────────────────────────────────────
  panel: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.base,
  },

  // ── Month header ──────────────────────────────────────────────────────────
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  monthTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // ── Quick chips ───────────────────────────────────────────────────────────
  chipsRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // ── Day names ─────────────────────────────────────────────────────────────
  dayNamesRow: {
    flexDirection: 'row',
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },

  // ── Days grid ─────────────────────────────────────────────────────────────
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
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.card,
  },
  dayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  dayTextPast: {
    color: Colors.gray300,
  },
  dayTextToday: {
    fontWeight: Typography.fontWeight.bold,
  },
  dayTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: Spacing.xs,
    height: Spacing.xs,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },

  // ── Time trigger row ──────────────────────────────────────────────────────
  timeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    minHeight: TouchTarget.min,
  },
  timeTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeTriggerIcon: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.prune}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTriggerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  timeTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  timeBadgeActive: {
    backgroundColor: `${Colors.sauge}20`,
  },
  timeBadgeInactive: {
    backgroundColor: Colors.backgroundSubtle,
  },
  timeBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  timeBadgeTextActive: {
    color: Colors.greenStrong,
  },
  timeBadgeTextInactive: {
    color: Colors.textMuted,
  },

  // ── Time panel (expanded) ─────────────────────────────────────────────────
  timePanel: {
    gap: Spacing.md,
  },

  // Period filter
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
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
    minHeight: TouchTarget.min,
  },
  periodBtnActive: {
    backgroundColor: `${Colors.prune}20`,
    borderColor: Colors.prune,
  },
  periodEmoji: {
    fontSize: Typography.fontSize.sm,
  },
  periodText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.prune,
  },

  // Hour grid
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  hourCell: {
    width: '23%' as unknown as number,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    minHeight: TouchTarget.min,
  },
  hourCellActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  hourCellDisabled: {
    borderColor: Colors.borderLight,
  },
  hourText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  hourTextActive: {
    color: Colors.textInverse,
  },
  hourTextDisabled: {
    color: Colors.gray300,
  },

  // Minutes
  minuteSection: {
    gap: Spacing.xs,
  },
  minuteLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  minuteCell: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    minHeight: TouchTarget.min,
  },
  minuteCellActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  minuteText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  minuteTextActive: {
    color: Colors.textInverse,
  },

  // ── Confirm ───────────────────────────────────────────────────────────────
  confirmBtn: {
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.button,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
});
