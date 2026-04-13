# Task Creation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Dreamy palette with a lavender palette across both platforms and redesign the task creation form (mobile screen + web modal) to match the Stitch design.

**Architecture:** Token files (`tokens.ts` for mobile, `globals.css` for web) are updated first so all downstream components inherit the new palette. Then the mobile `create.tsx` screen and web `CreateTaskModal.tsx` are rewritten to match the Stitch layout — inline fields instead of bottom sheets, segmented toggle, priority slider, and inline recurrence picker.

**Tech Stack:** React Native (Expo), Next.js, Tailwind CSS, Zustand, TanStack Query, react-hook-form (web), Ionicons (mobile), lucide-react (web)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `apps/mobile/src/constants/tokens.ts` | Modify | Replace Dreamy palette with lavender tokens |
| `apps/web/src/app/globals.css` | Modify | Replace Dreamy CSS variables with lavender tokens |
| `apps/mobile/app/(app)/tasks/create.tsx` | Rewrite | Mobile task creation screen — Stitch layout |
| `apps/web/src/components/tasks/CreateTaskModal.tsx` | Rewrite | Web task creation modal — Stitch layout |

No new files. No type changes (existing `TaskFormValues` stays as-is, unused fields get defaults).

---

### Task 1: Update mobile design tokens to lavender palette

**Files:**
- Modify: `apps/mobile/src/constants/tokens.ts`

- [ ] **Step 1: Replace the Colors object**

Replace the entire `Colors` object in `apps/mobile/src/constants/tokens.ts`:

```typescript
export const Colors = {
  // ─── Brand palette (Lavender) ───
  primary: '#967BB6',
  primaryLight: '#E5DBFF',
  primarySurface: '#F3F0FF',
  accent: '#F4C2C2',
  joy: '#FFF9C4',

  // ─── Text ───
  textPrimary: '#5F5475',
  textSecondary: 'rgba(95, 84, 117, 0.8)',
  textMuted: 'rgba(95, 84, 117, 0.6)',
  textInverse: '#FFFFFF',

  // ─── Background ───
  background: '#FFFFFF',
  backgroundCard: '#F9F8FD',
  backgroundCardEnd: '#F3F0FF',
  backgroundElevated: '#FFFFFF',

  // ─── Border ───
  border: '#DCD7E8',
  borderLight: '#F3F0FF',
  borderFocus: '#967BB6',

  // ─── Feedback ───
  success: '#81C784',
  warning: '#FFF9C4',
  error: '#F4C2C2',
  info: '#967BB6',

  // ─── Member colors ───
  memberColors: [
    '#967BB6', '#F4C2C2', '#B39DDB', '#80CBC4',
    '#FFE082', '#FFAB91', '#A5D6A7', '#CE93D8',
  ],

  // ─── Gray scale (warm) ───
  gray50: '#F9F8FD',
  gray100: '#F3F0FF',
  gray200: '#DCD7E8',
  gray300: '#C4BDD4',
  gray400: '#9B93AC',
  gray500: '#7A7190',
  gray600: '#5F5475',
  gray700: '#483F5C',
  gray800: '#312944',
  gray900: '#1E1730',

  // ─── Transparent overlays ───
  overlay: 'rgba(95, 84, 117, 0.35)',
  overlayLight: 'rgba(95, 84, 117, 0.08)',

  // ─── Component-specific ───
  inputFocusedBg: '#FFFFFF',
  backgroundSubtle: '#F3F0FF',
  placeholder: 'rgba(95, 84, 117, 0.6)',
} as const;
```

- [ ] **Step 2: Update the Shadows object**

Replace shadow colors from `#90CAF9` to `#967BB6`:

```typescript
export const Shadows = {
  sm: {
    shadowColor: '#967BB6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#967BB6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#967BB6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#967BB6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;
```

- [ ] **Step 3: Update the doc comment**

Change the first line comment from `Charte graphique Dreamy — palette douce et rêveuse` to `Charte graphique Lavender — palette douce et élégante`.

- [ ] **Step 4: Verify no TypeScript errors**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -30`
Expected: No errors (or only pre-existing ones unrelated to tokens)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/constants/tokens.ts
git commit -m "style: migrate mobile tokens from Dreamy to lavender palette"
```

---

### Task 2: Update web CSS variables to lavender palette

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Replace the Keurzen custom theme block**

Replace the `@theme` block (lines 8-36) with lavender values:

```css
/* ─── Keurzen "Lavender" tokens ─── */
@theme {
  --color-primary: #967BB6;
  --color-primary-light: #E5DBFF;
  --color-primary-surface: #F3F0FF;
  --color-accent: #F4C2C2;
  --color-joy: #FFF9C4;
  --color-background: #FFFFFF;
  --color-background-card: #F9F8FD;
  --color-background-card-end: #F3F0FF;
  --color-text-primary: #5F5475;
  --color-text-secondary: rgba(95, 84, 117, 0.8);
  --color-text-muted: rgba(95, 84, 117, 0.6);
  --color-text-inverse: #FFFFFF;
  --color-border: #DCD7E8;
  --color-border-light: #F3F0FF;

  --shadow-sm: 0 1px 2px rgba(150, 123, 182, 0.08);
  --shadow-md: 0 2px 8px rgba(150, 123, 182, 0.1);
  --shadow-lg: 0 4px 16px rgba(150, 123, 182, 0.12);
  --shadow-card: 0 3px 10px rgba(150, 123, 182, 0.1);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-3xl: 40px;

  --font-heading: 'Fredoka One', cursive;
  --font-body: 'Open Sans', sans-serif;
}
```

- [ ] **Step 2: Replace the :root shadcn variables**

Replace the `:root` block (lines 82-115) with lavender-mapped values:

```css
:root {
  --background: #FFFFFF;
  --foreground: #5F5475;
  --card: #F9F8FD;
  --card-foreground: #5F5475;
  --popover: #FFFFFF;
  --popover-foreground: #5F5475;
  --primary: #967BB6;
  --primary-foreground: #FFFFFF;
  --secondary: #E5DBFF;
  --secondary-foreground: #5F5475;
  --muted: #F3F0FF;
  --muted-foreground: rgba(95, 84, 117, 0.8);
  --accent: #F3F0FF;
  --accent-foreground: #5F5475;
  --destructive: #F4C2C2;
  --border: #DCD7E8;
  --input: #DCD7E8;
  --ring: #967BB6;
  --chart-1: #967BB6;
  --chart-2: #F4C2C2;
  --chart-3: #FFF9C4;
  --chart-4: #B39DDB;
  --chart-5: #80CBC4;
  --radius: 0.75rem;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #5F5475;
  --sidebar-primary: #967BB6;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #F3F0FF;
  --sidebar-accent-foreground: #5F5475;
  --sidebar-border: #DCD7E8;
  --sidebar-ring: #967BB6;
}
```

- [ ] **Step 3: Update TLX slider shadow colors**

Replace `rgba(144, 202, 249, 0.15)` with `rgba(150, 123, 182, 0.15)` in the `.tlx-slider` styles (2 occurrences — `::-webkit-slider-thumb` and `::-moz-range-thumb`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style: migrate web CSS variables from Dreamy to lavender palette"
```

---

### Task 3: Rewrite mobile task creation screen

**Files:**
- Rewrite: `apps/mobile/app/(app)/tasks/create.tsx`

This is a full rewrite. The new screen renders all fields inline (no bottom sheets) matching the Stitch design. Key differences from current:
- Segmented toggle for task type (household/personal)
- All fields visible inline with label + input pattern
- Category as a tappable dropdown (shows a list below)
- Assignee as horizontal pills
- Due date as split date|time field (opens native pickers)
- Priority as a 3-step slider
- Recurrence as a tappable dropdown with inline "customize" panel

- [ ] **Step 1: Write the complete new screen**

Replace the entire content of `apps/mobile/app/(app)/tasks/create.tsx` with:

```typescript
import React, { useState, useMemo, useCallback } from 'react';
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

// ─── Day labels ──────────────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
            onPress={() => {
              setShowCategoryDropdown(!showCategoryDropdown);
              setShowRecurrenceDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={s.selectText}>{selectedCategory.emoji} {selectedCategory.label}</Text>
            <Ionicons
              name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>
          {showCategoryDropdown && (
            <View style={s.dropdown}>
              {CATEGORIES.map(cat => {
                const active = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[s.dropdownItem, active && s.dropdownItemActive]}
                    onPress={() => {
                      setCategory(cat.value);
                      setShowCategoryDropdown(false);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={[s.dropdownItemText, active && s.dropdownItemTextActive]}>
                      {cat.emoji} {cat.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ─── Assigné à ────────────────────────────────────────────────── */}
        <View style={s.fieldGroup}>
          <FieldLabel>ASSIGNÉ À</FieldLabel>
          <View style={s.pillsRow}>
            {members.map((m, i) => {
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
            onPress={() => {
              setShowRecurrenceDropdown(!showRecurrenceDropdown);
              setShowCategoryDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={s.selectFieldInner}>
              <Ionicons name="repeat-outline" size={20} color={Colors.primary} />
              <Text style={s.selectText}>{recurrenceLabel}</Text>
            </View>
            <Ionicons
              name={showRecurrenceDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
          {showRecurrenceDropdown && (
            <View style={s.dropdown}>
              {RECURRENCE_OPTIONS.map(opt => {
                const active = recurrence === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.dropdownItem, active && s.dropdownItemActive]}
                    onPress={() => {
                      setRecurrence(opt.value);
                      setShowRecurrenceDropdown(false);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={[s.dropdownItemText, active && s.dropdownItemTextActive]}>
                      {opt.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
    color: `${Colors.primary}B3`, // 70% opacity
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },

  // Input
  input: {
    backgroundColor: `${Colors.primarySurface}4D`, // 30% opacity
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

  // Dropdown
  dropdown: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: `${Colors.primarySurface}80`,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'],
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
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -30`
Expected: No new errors from create.tsx

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/tasks/create.tsx
git commit -m "feat: rewrite mobile task creation screen to match Stitch design"
```

---

### Task 4: Rewrite web task creation modal

**Files:**
- Rewrite: `apps/web/src/components/tasks/CreateTaskModal.tsx`

- [ ] **Step 1: Write the complete new modal**

Replace the entire content of `apps/web/src/components/tasks/CreateTaskModal.tsx` with:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useCreateTask } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Modal } from '@/components/ui/Modal';
import type { TaskFormValues, TaskCategory, TaskPriority, RecurrenceType, TaskType } from '@keurzen/shared';

// ─── Category config ─────────────────────────────────────────────────────────

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

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Jamais' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuel' },
  { value: 'monthly', label: 'Mensuel' },
];

const PRIORITY_LABELS = ['Basse', 'Moyenne', 'Haute'] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { members } = useHouseholdStore();

  // Form state
  const [taskType, setTaskType] = useState<TaskType>('household');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('shopping');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [priority, setPriority] = useState(1); // 0=low, 1=medium, 2=high
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.value === category)!;
  const priorityValue: TaskPriority = priority === 0 ? 'low' : priority === 1 ? 'medium' : 'high';
  const isDisabled = !title.trim();

  const resetForm = useCallback(() => {
    setTaskType('household');
    setTitle('');
    setCategory('shopping');
    setAssignedTo(null);
    setDueDate('');
    setDueTime('10:00');
    setPriority(1);
    setRecurrence('none');
    setShowCategoryDropdown(false);
    setShowRecurrenceDropdown(false);
  }, []);

  const handleSubmit = async () => {
    if (isDisabled) return;

    const values: TaskFormValues = {
      title: title.trim(),
      category,
      zone: 'general',
      priority: priorityValue,
      recurrence,
      assigned_to: assignedTo ?? '',
      due_date: dueDate || undefined,
      task_type: taskType,
    };

    await createTask(values);
    resetForm();
    onClose();
  };

  const getInitial = (name?: string | null) => {
    if (!name) return '?';
    return name.trim()[0]?.toUpperCase() ?? '?';
  };

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Nouvelle tâche">
      <div className="space-y-6">
        {/* ─── Task Type Toggle ─────────────────────────────────────────── */}
        <div className="flex rounded-xl bg-primary-surface p-1">
          <button
            type="button"
            className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition-all ${
              taskType === 'household'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted'
            }`}
            onClick={() => setTaskType('household')}
          >
            🏠 Ménage
          </button>
          <button
            type="button"
            className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition-all ${
              taskType === 'personal'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted'
            }`}
            onClick={() => setTaskType('personal')}
          >
            👤 Perso
          </button>
        </div>

        {/* ─── Nom ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Nom
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            placeholder="Ex : Courses, Ménage salon..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* ─── Catégorie ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Catégorie
          </label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm hover:border-primary transition-all"
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowRecurrenceDropdown(false);
              }}
            >
              <span>{selectedCategory.emoji} {selectedCategory.label}</span>
              <svg className={`h-5 w-5 text-primary transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-md">
                {CATEGORIES.map(cat => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className={`flex w-full items-center justify-between border-b border-primary-surface/50 px-4 py-3 text-left text-sm transition-colors hover:bg-primary-surface ${
                        active ? 'bg-primary-surface/50 font-medium text-primary' : ''
                      }`}
                      onClick={() => {
                        setCategory(cat.value);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <span>{cat.emoji} {cat.label}</span>
                      {active && (
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Assigné à ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Assigné à
          </label>
          <div className="flex gap-2">
            {members.map(m => {
              const selected = assignedTo === m.user_id;
              const name = m.profile?.full_name?.split(' ')[0] ?? 'Membre';
              return (
                <button
                  key={m.user_id}
                  type="button"
                  className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold transition-all ${
                    selected
                      ? 'bg-primary-light text-text-primary'
                      : 'border border-border text-text-muted'
                  }`}
                  onClick={() => setAssignedTo(selected ? null : m.user_id)}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                    selected ? 'bg-white' : 'bg-primary-surface'
                  }`}>
                    {getInitial(m.profile?.full_name)}
                  </div>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Échéance ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Échéance
          </label>
          <div className="flex overflow-hidden rounded-xl border border-border bg-primary-surface/30 hover:border-primary transition-all">
            <div className="flex flex-1 items-center gap-3 border-r border-border px-4 py-3.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                className="flex-1 bg-transparent text-sm font-medium text-text-primary focus:outline-none"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type="time"
                className="bg-transparent text-sm font-medium text-text-primary focus:outline-none"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                step="300"
              />
            </div>
          </div>
        </div>

        {/* ─── Priorité ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Priorité
          </label>
          <div className="px-2 pt-2">
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="priority-slider w-full"
            />
            <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-tight">
              <span className={priority === 0 ? 'text-primary' : 'text-text-muted'}>Basse</span>
              <span className={priority === 1 ? 'text-primary' : 'text-text-muted'}>Moyenne</span>
              <span className={priority === 2 ? 'text-primary' : 'text-text-muted'}>Haute</span>
            </div>
          </div>
        </div>

        {/* ─── Répéter ──────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Répéter
          </label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm hover:border-primary transition-all"
              onClick={() => {
                setShowRecurrenceDropdown(!showRecurrenceDropdown);
                setShowCategoryDropdown(false);
              }}
            >
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="flex-1 text-left font-medium text-text-primary">
                {RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label}
              </span>
              <svg className={`h-4 w-4 text-text-muted transition-transform ${showRecurrenceDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRecurrenceDropdown && (
              <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-md">
                {RECURRENCE_OPTIONS.map(opt => {
                  const active = recurrence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`flex w-full items-center justify-between border-b border-primary-surface/50 px-4 py-3 text-left text-sm transition-colors hover:bg-primary-surface ${
                        active ? 'bg-primary-surface/50 font-medium text-primary' : ''
                      }`}
                      onClick={() => {
                        setRecurrence(opt.value);
                        setShowRecurrenceDropdown(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit Button ────────────────────────────────────────────── */}
        <button
          type="button"
          className={`w-full rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${
            isDisabled ? 'opacity-35 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          onClick={handleSubmit}
          disabled={isDisabled || isPending}
        >
          {isPending ? 'Création...' : 'Créer la tâche'}
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Add the priority slider CSS to globals.css**

Add at the end of `apps/web/src/app/globals.css`, before the closing `}` of `@layer base` or after it:

```css
/* Priority slider */
.priority-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: var(--color-primary-light);
  border-radius: 5px;
  outline: none;
}
.priority-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.priority-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

- [ ] **Step 3: Verify web build compiles**

Run: `cd /Users/ouss/Keurzen/apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/tasks/CreateTaskModal.tsx apps/web/src/app/globals.css
git commit -m "feat: rewrite web task creation modal to match Stitch design"
```
