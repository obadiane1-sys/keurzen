# Task Creation Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full-screen task creation modal with a compact bottom sheet (quick-add style Todoist/Things 3).

**Architecture:** Single-file rewrite of `app/(app)/tasks/create.tsx`. The bottom sheet uses native `Animated` + `PanResponder` (no external dep). The overlay + sheet are rendered as a full-screen layer. All existing business logic (mutations, stores, types) is preserved. Sub-panels for date/assignee/category/priority/note slide in between the input and the action bar.

**Tech Stack:** React Native Animated API, PanResponder, Expo Router, Zustand, TanStack Query v5, Keurzen design tokens.

**Spec:** `docs/superpowers/specs/2026-04-02-task-creation-bottom-sheet-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/(app)/tasks/create.tsx` | Rewrite | Full bottom sheet screen with all sub-panels |
| `app/(app)/tasks/_layout.tsx` | Modify | Add `presentation: 'transparentModal'` for the create route |
| `app/(app)/tasks/index.tsx` | No change | FAB already pushes to `create` |

**No new files created.** Everything stays in `create.tsx` to match the existing pattern (the current file is already self-contained at ~1370 lines).

---

## Task 1: Configure transparent modal presentation

**Files:**
- Modify: `app/(app)/tasks/_layout.tsx`

The sheet needs to render over the task list with a transparent background. Expo Router's Stack supports `presentation: 'transparentModal'` per-screen.

- [ ] **Step 1: Add screen options for the create route**

```tsx
import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/tokens';

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep _layout`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/tasks/_layout.tsx
git commit -m "feat(tasks): configure transparent modal for create route"
```

---

## Task 2: Bottom sheet shell — overlay, container, gestures

**Files:**
- Modify: `app/(app)/tasks/create.tsx` (rewrite top-level structure)

Replace the entire render output. Keep all imports, constants, helpers, and types from the current file. Replace only the component body and styles.

- [ ] **Step 1: Write the bottom sheet container with overlay**

Replace the `CreateTaskScreen` component body and styles. Keep all code above `export default function CreateTaskScreen()` unchanged (lines 1–153 of current file: imports, SECTION_ICONS, PRIORITY_CONFIG, date helpers, constants).

The new component structure:

```tsx
export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ─── Sheet animation ──────────────────────────────────────────────────
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Open sheet on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
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
  }, []);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  }, [router, sheetTranslateY, overlayOpacity]);

  // ─── Pan gesture for swipe dismiss ────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          sheetTranslateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) {
          closeSheet();
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.fullScreen}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeSheet}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>

        {/* Content placeholder — will be filled in Task 3-5 */}
        <View style={styles.sheetBody}>
          {/* Task name input (Task 3) */}
          {/* Sub-panel area (Task 4) */}
        </View>

        {/* Action bar placeholder — (Task 5) */}
      </Animated.View>
    </View>
  );
}
```

Add these imports to the top (merge with existing):

```tsx
import { Dimensions, PanResponder, useEffect } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
```

Add these styles (replace the existing `styles` object):

```tsx
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.lg,
    maxHeight: '85%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
  },
  sheetBody: {
    paddingHorizontal: Spacing.lg,
  },
});
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep create.tsx`
Expected: no errors (warnings about unused vars from old code are ok — they get wired in subsequent tasks)

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/tasks/create.tsx
git commit -m "feat(tasks): bottom sheet shell with overlay and swipe dismiss"
```

---

## Task 3: Task name input

**Files:**
- Modify: `app/(app)/tasks/create.tsx`

- [ ] **Step 1: Add task name input inside sheetBody**

Replace the `{/* Task name input (Task 3) */}` placeholder:

```tsx
{/* Task name input */}
<TextInput
  style={styles.taskNameInput}
  placeholder="Que faut-il faire ?"
  placeholderTextColor={Colors.textMuted}
  value={taskName}
  onChangeText={setTaskName}
  autoFocus
  returnKeyType="done"
  onSubmitEditing={() => {
    if (taskName.trim()) handleSubmit();
  }}
/>
```

Wire up the form state (keep all existing `useState` hooks from the current file: `taskName`, `dueDate`, `dueTime`, `assignedTo`, `category`, `priority`, `notes`) and the `handleSubmit` function (unchanged from current file).

Add style:

```tsx
taskNameInput: {
  fontSize: Typography.fontSize.xl,
  fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  color: Colors.navy,
  padding: 0,
  marginBottom: Spacing.md,
},
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep create.tsx`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/tasks/create.tsx
git commit -m "feat(tasks): add task name input to bottom sheet"
```

---

## Task 4: Action bar with icon buttons and CTA

**Files:**
- Modify: `app/(app)/tasks/create.tsx`

- [ ] **Step 1: Add active panel state and action bar**

Add state:

```tsx
type PanelKey = 'date' | 'assignee' | 'category' | 'priority' | 'note';
const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

const togglePanel = useCallback((key: PanelKey) => {
  setActivePanel(prev => prev === key ? null : key);
}, []);
```

Add the action bar after `sheetBody`, still inside the sheet:

```tsx
{/* Action bar */}
<View style={styles.actionBar}>
  <View style={styles.actionIcons}>
    {ACTION_BUTTONS.map(btn => {
      const isActive = activePanel === btn.key;
      const hasValue = btn.hasValue();
      return (
        <TouchableOpacity
          key={btn.key}
          style={[styles.actionIcon, { backgroundColor: SECTION_ICONS[btn.key].bg }]}
          onPress={() => togglePanel(btn.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={btn.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={isActive ? Colors.navy : SECTION_ICONS[btn.key].stroke}
          />
          {hasValue && <View style={[styles.actionDot, { backgroundColor: btn.dotColor() }]} />}
        </TouchableOpacity>
      );
    })}
  </View>

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
        <Ionicons name="add" size={18} color={Colors.textInverse} />
        <Text style={styles.ctaText}>Ajouter</Text>
      </>
    )}
  </TouchableOpacity>
</View>
```

Add `ACTION_BUTTONS` config above the component (after `PRIORITY_CONFIG`):

```tsx
// Defined inside the component as it reads state — see step below
```

Actually, `ACTION_BUTTONS` needs to read state (`dueDate`, `assignedTo`, etc.) so it must be defined inside the component as a `useMemo`:

```tsx
const ACTION_BUTTONS = useMemo(() => [
  {
    key: 'date' as PanelKey,
    icon: 'calendar-outline',
    hasValue: () => !!dueDate,
    dotColor: () => Colors.mint,
  },
  {
    key: 'assignee' as PanelKey,
    icon: 'person-outline',
    hasValue: () => !!assignedTo,
    dotColor: () => Colors.mint,
  },
  {
    key: 'category' as PanelKey,
    icon: 'grid-outline',
    hasValue: () => category !== 'cleaning',
    dotColor: () => Colors.lavender,
  },
  {
    key: 'priority' as PanelKey,
    icon: 'flag-outline',
    hasValue: () => priority !== 'medium',
    dotColor: () => {
      const p = PRIORITY_CONFIG.find(c => c.value === priority);
      return p?.dot ?? Colors.warning;
    },
  },
  {
    key: 'note' as PanelKey,
    icon: 'document-text-outline',
    hasValue: () => !!notes.trim(),
    dotColor: () => Colors.gray400,
  },
], [dueDate, assignedTo, category, priority, notes]);
```

Add styles:

```tsx
actionBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: Spacing.lg,
  paddingVertical: Spacing.md,
  borderTopWidth: 1,
  borderTopColor: Colors.borderLight,
},
actionIcons: {
  flexDirection: 'row',
  gap: Spacing.sm,
},
actionIcon: {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: 'center',
  justifyContent: 'center',
},
actionDot: {
  position: 'absolute',
  top: 2,
  right: 2,
  width: 6,
  height: 6,
  borderRadius: 3,
},
ctaButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.xs,
  backgroundColor: Colors.mint,
  borderRadius: BorderRadius.full,
  height: 44,
  paddingHorizontal: Spacing.lg,
  ...Shadows.sm,
},
ctaButtonDisabled: {
  opacity: 0.4,
},
ctaText: {
  fontSize: Typography.fontSize.sm,
  fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  color: Colors.textInverse,
},
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep create.tsx`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/tasks/create.tsx
git commit -m "feat(tasks): add action bar with icon buttons and CTA"
```

---

## Task 5: Sub-panels (date, assignee, category, priority, note)

**Files:**
- Modify: `app/(app)/tasks/create.tsx`

This is the largest task. All existing sub-panel JSX from the current file is migrated into a `renderPanel()` function. The logic (handlers, state, calendar grid computation) is already present in the component — only the rendering changes.

- [ ] **Step 1: Add sub-panel container between input and action bar**

Inside `sheetBody`, after the TextInput and before the closing `</View>`:

```tsx
{/* Sub-panel */}
{activePanel && (
  <View style={styles.subPanel}>
    {activePanel === 'date' && renderDatePanel()}
    {activePanel === 'assignee' && renderAssigneePanel()}
    {activePanel === 'category' && renderCategoryPanel()}
    {activePanel === 'priority' && renderPriorityPanel()}
    {activePanel === 'note' && renderNotePanel()}
  </View>
)}
```

Add style:

```tsx
subPanel: {
  backgroundColor: Colors.gray50,
  borderRadius: BorderRadius.lg,
  padding: Spacing.base,
  marginBottom: Spacing.md,
  gap: Spacing.md,
},
```

- [ ] **Step 2: Implement renderDatePanel()**

Migrate the existing date panel JSX. This includes: quick chips, mini calendar, time toggle with period/hour/minute selectors. All handlers (`handleDayPress`, `handleQuickDateChip`, `handleHourSelect`, `handleMinuteSelect`, `isHourPast`) and state (`displayMonth`, `timeOpen`, `selPeriod`, `calendarDays`) are already in the component.

```tsx
const renderDatePanel = () => (
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
    </ScrollView>

    {/* Mini calendar — identical to current implementation */}
    <View style={styles.calendarContainer}>
      {/* Month header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map((name, i) => (
          <View key={i} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
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

    {/* Time toggle */}
    <TouchableOpacity style={styles.timeToggle} onPress={() => setTimeOpen(prev => !prev)} activeOpacity={0.7}>
      <View style={styles.timeToggleLeft}>
        <Ionicons name="time-outline" size={16} color={Colors.lavender} />
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
        <Ionicons name={timeOpen ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>

    {/* Time panel (periods + hours + minutes) — only if timeOpen */}
    {timeOpen && (
      <View style={styles.timePanel}>
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
);
```

- [ ] **Step 3: Implement renderAssigneePanel()**

```tsx
const renderAssigneePanel = () => (
  <>
    {members.length === 0 ? (
      <Text style={styles.emptyText}>Aucun membre dans le foyer</Text>
    ) : (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assigneeRow}>
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
                  backgroundColor: selected ? color : Colors.gray100,
                  borderColor: selected ? Colors.mint : 'transparent',
                  borderWidth: selected ? 2.5 : 0,
                  transform: [{ scale: selected ? 1.05 : 1 }],
                },
              ]}>
                <Text style={[
                  styles.assigneeInitials,
                  { color: selected ? Colors.textInverse : Colors.textSecondary },
                ]}>
                  {getInitials(m.profile?.full_name)}
                </Text>
              </View>
              <Text style={[
                styles.assigneeName,
                selected ? { color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'] } as TextStyle : undefined,
              ]} numberOfLines={1}>
                {m.profile?.full_name?.split(' ')[0] ?? 'Membre'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}
  </>
);
```

- [ ] **Step 4: Implement renderCategoryPanel()**

```tsx
const renderCategoryPanel = () => (
  <View style={styles.categoryGrid}>
    {categoryOptions.map(opt => {
      const active = category === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          onPress={() => setCategory(opt.value)}
          style={[styles.categoryChip, active && styles.categoryChipActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={opt.icon as keyof typeof Ionicons.glyphMap}
            size={15}
            color={active ? Colors.lavender : Colors.textMuted}
          />
          <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive as TextStyle : undefined]}>
            {opt.label}
          </Text>
          {active && <Ionicons name="checkmark-circle" size={14} color={Colors.lavender} />}
        </TouchableOpacity>
      );
    })}
  </View>
);
```

- [ ] **Step 5: Implement renderPriorityPanel()**

```tsx
const renderPriorityPanel = () => (
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
            active && { borderColor: p.dot, borderWidth: 2 },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.priorityChipDot, { backgroundColor: p.dot }]} />
          <Text style={[styles.priorityChipText, { color: p.text }]}>{p.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
```

- [ ] **Step 6: Implement renderNotePanel()**

```tsx
const renderNotePanel = () => (
  <TextInput
    style={styles.noteInput}
    placeholder="Ajouter une note..."
    placeholderTextColor={Colors.textMuted}
    value={notes}
    onChangeText={setNotes}
    multiline
    textAlignVertical="top"
  />
);
```

- [ ] **Step 7: Add all remaining styles**

Add to the `styles` object (merge with existing from Task 2):

```tsx
// Sub-panel
subPanel: {
  backgroundColor: Colors.gray50,
  borderRadius: BorderRadius.lg,
  padding: Spacing.base,
  marginBottom: Spacing.md,
  gap: Spacing.md,
},

// Date
chipRow: { gap: Spacing.sm, paddingVertical: 2 },
dateChip: {
  paddingHorizontal: Spacing.base,
  paddingVertical: Spacing.sm,
  borderRadius: BorderRadius.xl,
  borderWidth: 1.5,
  borderColor: Colors.border,
  backgroundColor: Colors.backgroundCard,
},
dateChipActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
dateChipText: {
  fontSize: Typography.fontSize.sm,
  fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  color: Colors.textSecondary,
},
dateChipTextActive: { color: Colors.textInverse },
calendarContainer: { gap: Spacing.sm },
monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
monthNavBtn: {
  width: 32, height: 32, borderRadius: BorderRadius.full,
  backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
},
monthTitle: {
  fontSize: Typography.fontSize.base,
  fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  color: Colors.navy,
},
dayNamesRow: { flexDirection: 'row' },
dayNameCell: { flex: 1, alignItems: 'center' },
dayNameText: {
  fontSize: Typography.fontSize.xs,
  fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  color: Colors.textMuted, textTransform: 'uppercase',
},
daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
dayCell: { width: '14.285%' as unknown as number, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', maxHeight: 38 },
dayCellSelected: { backgroundColor: Colors.mint, borderRadius: BorderRadius.full },
dayText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium as TextStyle['fontWeight'], color: Colors.textPrimary },
dayTextPast: { color: Colors.gray300 },
dayTextToday: { fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'], color: Colors.mint },
dayTextSelected: { color: Colors.textInverse, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'] },
todayDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.mint },

// Time
timeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
timeToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
timeToggleLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'], color: Colors.textPrimary },
timeToggleRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
pillMint: { backgroundColor: `${Colors.mint}1A`, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
pillMintText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'], color: '#0F6E56' },
timePanel: { gap: Spacing.md },
periodRow: { flexDirection: 'row', gap: Spacing.sm },
periodBtn: {
  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
},
periodBtnActive: { backgroundColor: `${Colors.lavender}1A`, borderColor: Colors.lavender },
periodEmoji: { fontSize: Typography.fontSize.sm },
periodText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'], color: Colors.textSecondary },
periodTextActive: { color: Colors.lavender },
hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
hourCell: {
  width: '23%' as unknown as number, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, alignItems: 'center',
},
hourCellActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
hourCellDisabled: { borderColor: Colors.borderLight },
hourText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'], color: Colors.textSecondary },
hourTextActive: { color: Colors.textInverse },
hourTextDisabled: { color: Colors.gray300 },
minuteSection: { gap: Spacing.xs },
minuteSectionLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'], color: Colors.textMuted, letterSpacing: 1 },
minuteRow: { flexDirection: 'row', gap: Spacing.sm },
minuteCell: {
  flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, alignItems: 'center',
},
minuteCellActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
minuteText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'], color: Colors.textSecondary },
minuteTextActive: { color: Colors.textInverse },

// Assignee
assigneeRow: { gap: Spacing.base, paddingVertical: 2 },
assigneeItem: { alignItems: 'center', gap: Spacing.xs, width: 60 },
assigneeAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
assigneeInitials: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'] },
assigneeName: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.sm },

// Category
categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
categoryChip: {
  flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
},
categoryChipActive: { backgroundColor: `${Colors.lavender}1A`, borderColor: Colors.lavender },
categoryChipText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'], color: Colors.textSecondary },
categoryChipTextActive: { color: Colors.lavender },

// Priority
priorityRow: { flexDirection: 'row', gap: Spacing.sm },
priorityChip: {
  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5,
},
priorityChipDot: { width: 8, height: 8, borderRadius: 4 },
priorityChipText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'] },

// Note
noteInput: {
  fontSize: Typography.fontSize.base, color: Colors.textPrimary, minHeight: 80,
  textAlignVertical: 'top', backgroundColor: Colors.backgroundCard,
  borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
},
```

- [ ] **Step 8: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep create.tsx`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/tasks/create.tsx
git commit -m "feat(tasks): add all sub-panels — date, assignee, category, priority, note"
```

---

## Task 6: Clean up old code and final integration

**Files:**
- Modify: `app/(app)/tasks/create.tsx`

- [ ] **Step 1: Remove dead code**

Remove the old `ExpandablePanel` component (no longer needed — sub-panels are simple conditional renders). Remove the old `chevronAnims`, `prevExpandedRow`, `chevronStyles`, `makeChevronStyle`, `renderSectionRow` and related code. Remove the old `expandedRow` state (replaced by `activePanel`). Remove unused styles (`sectionsCard`, `sectionRow`, `sectionIcon`, `sectionLabel`, `sectionRight`, `sectionDivider`, `expandedContent`, `headerSafe`, `handleBar` from old position, `header`, `headerBtn`, `headerTitle`, `headerSubmitBtn`, etc.).

- [ ] **Step 2: Update handleSubmit to close sheet**

Modify `handleSubmit` to call `closeSheet()` instead of `router.back()` on success:

```tsx
try {
  await createTask.mutateAsync(values);
  closeSheet();
} catch (err: unknown) {
  // ... existing error handling
}
```

- [ ] **Step 3: Reset timeOpen when switching panels**

In `togglePanel`:

```tsx
const togglePanel = useCallback((key: PanelKey) => {
  setActivePanel(prev => {
    if (prev === 'date' && key !== 'date') setTimeOpen(false);
    return prev === key ? null : key;
  });
}, []);
```

- [ ] **Step 4: Add ScrollView around sheetBody for long sub-panels**

Wrap the sheetBody content in a ScrollView to handle the date panel (calendar + time) which can be tall:

```tsx
<ScrollView
  style={styles.sheetBody}
  contentContainerStyle={styles.sheetBodyContent}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
  bounces={false}
>
  {/* Task name input */}
  {/* Sub-panel */}
</ScrollView>
```

Add style:

```tsx
sheetBodyContent: {
  paddingHorizontal: Spacing.lg,
},
```

Update `sheetBody` to remove paddingHorizontal (moved to contentContainerStyle):

```tsx
sheetBody: {
  maxHeight: SCREEN_HEIGHT * 0.55,
},
```

- [ ] **Step 5: Full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep create.tsx`
Expected: no errors

- [ ] **Step 6: Final commit**

```bash
git add app/\(app\)/tasks/create.tsx
git commit -m "feat(tasks): complete bottom sheet task creation — cleanup and integration"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npx tsc --noEmit` — 0 errors on create.tsx and _layout.tsx
- [ ] Open app → Tasks → tap FAB "+" → sheet slides up from bottom
- [ ] Type task name → CTA becomes active
- [ ] Tap calendar icon → date panel slides in, sheet grows
- [ ] Select "Demain" → chip active, mint dot on calendar icon
- [ ] Tap person icon → date panel out, assignee panel in
- [ ] Select a member → avatar highlighted, dot on person icon
- [ ] Tap "Ajouter" → task created, sheet closes, toast shown
- [ ] Swipe down on handle → sheet dismisses
- [ ] Tap overlay → sheet dismisses
- [ ] Empty title → CTA disabled
- [ ] Test on web → no PanResponder crash, overlay tap works
