# Palier 2A: Task Types, Mental Load Rating, Vue Par Membre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add task types (household/personal), a required mental load rating bottom sheet when completing household tasks, and a "Par membre" grouped view to the task list.

**Architecture:** Add `task_type` column to `tasks` table and a new `task_completion_ratings` table. An atomic RPC `complete_task_with_rating` marks household tasks as done and records the rating in one transaction. Client-side: a `CompletionRatingSheet` bottom sheet component, a `TaskViewToggle` segmented control, and SectionList grouping logic in the task list screen.

**Tech Stack:** Supabase (Postgres migration, RLS, RPC), React Native, TypeScript, TanStack Query v5, Zustand, Expo Router 4

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/017_add_task_type_and_ratings.sql` | Migration: add `task_type` column, create `task_completion_ratings` table, RLS, RPC, index |
| `src/components/tasks/CompletionRatingSheet.tsx` | Bottom sheet for mental load rating (3 buttons, required, not dismissable) |
| `src/components/tasks/TaskViewToggle.tsx` | Segmented control: "Liste" / "Par membre" |

### Modified files
| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `TaskType`, `TaskCompletionRating`, update `Task` and `TaskFormValues` |
| `src/utils/validation.ts` | Add `task_type` to `taskSchema` |
| `src/lib/queries/tasks.ts` | Add `useCompleteTaskWithRating` hook, update `createTask` to send `task_type` |
| `src/components/tasks/TaskCard.tsx` | Add "Perso" pill badge |
| `src/components/tasks/TaskFilters.tsx` | Add `taskType` filter prop + type chips |
| `app/(app)/tasks/index.tsx` | Rating sheet state, view toggle, SectionList for member view, type filter state |
| `app/(app)/tasks/[id].tsx` | Rating sheet state, type badge, conditional edit fields |
| `app/(app)/tasks/create.tsx` | Task type segmented control, conditional assignee field |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/017_add_task_type_and_ratings.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 017_add_task_type_and_ratings.sql
-- Palier 2A: Add task_type to tasks, create task_completion_ratings table

-- ─── 1. Add task_type column ────────────────────────────────────────────────

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'household';

ALTER TABLE tasks
ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('household', 'personal'));

-- ─── 2. Create task_completion_ratings table ────────────────────────────────

CREATE TABLE IF NOT EXISTS task_completion_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  household_id uuid NOT NULL REFERENCES households(id),
  rating smallint NOT NULL CHECK (rating IN (1, 2, 3)),
  rated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for Palier 3 aggregation: AVG(rating) GROUP BY household_id, user_id over time
CREATE INDEX IF NOT EXISTS idx_tcr_household_user_rated
ON task_completion_ratings (household_id, user_id, rated_at);

-- ─── 3. RLS for task_completion_ratings ─────────────────────────────────────

ALTER TABLE task_completion_ratings ENABLE ROW LEVEL SECURITY;

-- Members can insert their own ratings
CREATE POLICY "Users can insert own ratings"
ON task_completion_ratings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = task_completion_ratings.household_id
      AND hm.user_id = auth.uid()
  )
);

-- Members can read all ratings in their household
CREATE POLICY "Members can read household ratings"
ON task_completion_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = task_completion_ratings.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ─── 4. Atomic RPC: complete_task_with_rating ───────────────────────────────

CREATE OR REPLACE FUNCTION complete_task_with_rating(
  p_task_id uuid,
  p_rating smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_task_type text;
BEGIN
  -- Validate task exists and user is a member of its household
  SELECT t.household_id, t.task_type
  INTO v_household_id, v_task_type
  FROM tasks t
  JOIN household_members hm ON hm.household_id = t.household_id
  WHERE t.id = p_task_id
    AND hm.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;

  IF v_task_type != 'household' THEN
    RAISE EXCEPTION 'Rating only applies to household tasks';
  END IF;

  IF p_rating NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid rating value';
  END IF;

  -- Mark task as done
  UPDATE tasks
  SET status = 'done',
      completed_at = now(),
      updated_at = now()
  WHERE id = p_task_id;

  -- Insert rating
  INSERT INTO task_completion_ratings (task_id, user_id, household_id, rating)
  VALUES (p_task_id, auth.uid(), v_household_id, p_rating);
END;
$$;
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`
Expected: Migration applied successfully. `tasks.task_type` column exists with default `'household'`. `task_completion_ratings` table exists. RPC `complete_task_with_rating` is callable.

- [ ] **Step 3: Verify migration**

Run: `npx supabase db diff` (or check via Supabase dashboard)
Expected: No pending changes — migration fully applied.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/017_add_task_type_and_ratings.sql
git commit -m "feat: add task_type column and task_completion_ratings table (Palier 2A)"
```

---

## Task 2: TypeScript Types & Validation

**Files:**
- Modify: `src/types/index.ts:58-106`
- Modify: `src/utils/validation.ts:16-32`

- [ ] **Step 1: Add TaskType and TaskCompletionRating types, update Task and TaskFormValues**

In `src/types/index.ts`, add after line 83 (after `RecurrenceType`):

```typescript
export type TaskType = 'household' | 'personal';
```

In the `Task` interface, add `task_type` field after `recurrence_parent_id`:

```typescript
export interface Task {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  category: TaskCategory;
  zone: TaskZone;
  priority: TaskPriority;
  estimated_minutes: number | null;
  status: TaskStatus;
  recurrence: RecurrenceType;
  recurrence_parent_id: string | null;
  task_type: TaskType;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_profile?: Profile;
  time_logs?: TimeLog[];
}
```

Add a new interface after `TimeLog`:

```typescript
// ─── Task Completion Ratings ──────────────────────────────────────────────────

export interface TaskCompletionRating {
  id: string;
  task_id: string;
  user_id: string;
  household_id: string;
  rating: 1 | 2 | 3;
  rated_at: string;
}
```

In `TaskFormValues`, add `task_type`:

```typescript
export interface TaskFormValues {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  category: TaskCategory;
  zone: TaskZone;
  priority: TaskPriority;
  estimated_minutes?: number;
  recurrence: RecurrenceType;
  task_type: TaskType;
}
```

- [ ] **Step 2: Update validation schema**

In `src/utils/validation.ts`, add `task_type` to `taskSchema`:

```typescript
export const taskSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long'),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional(),
  category: z.enum([
    'cleaning', 'cooking', 'shopping', 'admin', 'children',
    'pets', 'garden', 'repairs', 'health', 'finances', 'other',
  ]),
  zone: z.enum([
    'kitchen', 'bathroom', 'bedroom', 'living_room',
    'garden', 'garage', 'general', 'outside', 'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_minutes: z.number().min(1).max(1440).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly']),
  task_type: z.enum(['household', 'personal']).default('household'),
});
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors (pre-existing warnings may exist).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/utils/validation.ts
git commit -m "feat: add TaskType, TaskCompletionRating types and validation (Palier 2A)"
```

---

## Task 3: Query Layer — useCompleteTaskWithRating + createTask update

**Files:**
- Modify: `src/lib/queries/tasks.ts`

- [ ] **Step 1: Update createTask to include task_type**

In `src/lib/queries/tasks.ts`, update the `createTask` function to include `task_type`:

```typescript
async function createTask(
  values: TaskFormValues,
  householdId: string,
  userId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...values,
      household_id: householdId,
      created_by: userId,
      status: 'todo',
      assigned_to: values.assigned_to || null,
      due_date: values.due_date || null,
      description: values.description || null,
      estimated_minutes: values.estimated_minutes ?? null,
      task_type: values.task_type ?? 'household',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Task;
}
```

- [ ] **Step 2: Add useCompleteTaskWithRating hook**

Add after the `useUpdateTaskStatus` hook:

```typescript
// ─── Complete Task With Rating (household tasks only) ────────────────────────

export function useCompleteTaskWithRating() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ taskId, rating }: { taskId: string; rating: 1 | 2 | 3 }) => {
      const { error } = await supabase.rpc('complete_task_with_rating', {
        p_task_id: taskId,
        p_rating: rating,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
    },
  });
}
```

- [ ] **Step 3: Update import in the file header**

Make sure the import includes the new type:

```typescript
import type { Task, TaskFormValues, TaskStatus, TaskType } from '../../types';
```

(Note: `TaskType` import is for documentation/future use — the hook uses `1 | 2 | 3` literal for rating directly.)

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/tasks.ts
git commit -m "feat: add useCompleteTaskWithRating hook, send task_type on create (Palier 2A)"
```

---

## Task 4: CompletionRatingSheet Component

**Files:**
- Create: `src/components/tasks/CompletionRatingSheet.tsx`

- [ ] **Step 1: Create the CompletionRatingSheet component**

```typescript
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, TouchTarget } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Task } from '../../types';

// ─── Rating config ──────────────────────────────────────────────────────────

const RATINGS = [
  { value: 1 as const, label: 'Legere', emoji: '\u{1F7E2}', color: Colors.mint },
  { value: 2 as const, label: 'Moyenne', emoji: '\u{1F7E1}', color: Colors.warning },
  { value: 3 as const, label: 'Lourde', emoji: '\u{1F534}', color: Colors.coral },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface CompletionRatingSheetProps {
  task: Task | null;
  onRate: (taskId: string, rating: 1 | 2 | 3) => void;
  isLoading: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CompletionRatingSheet({ task, onRate, isLoading }: CompletionRatingSheetProps) {
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const handleRate = async (rating: 1 | 2 | 3) => {
    setError(null);
    try {
      onRate(task.id, rating);
    } catch {
      setError('Erreur lors de la sauvegarde. Reessayez.');
    }
  };

  return (
    <Modal
      visible={!!task}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Task name context */}
          <Text variant="caption" color="muted" numberOfLines={1} style={styles.taskName}>
            {task.title}
          </Text>

          {/* Question */}
          <Text variant="h4" style={styles.question}>
            Comment tu t'es senti·e sur cette tache ?
          </Text>

          {/* Rating buttons */}
          <View style={styles.ratingRow}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.ratingButton,
                  { backgroundColor: r.color + '20', borderColor: r.color + '60' },
                ]}
                onPress={() => handleRate(r.value)}
                disabled={isLoading}
                activeOpacity={0.7}
                accessibilityLabel={`${r.label} - niveau ${r.value}`}
                accessibilityRole="button"
              >
                <Text style={styles.ratingEmoji}>{r.emoji}</Text>
                <Text
                  variant="label"
                  style={[styles.ratingLabel, { color: r.color === Colors.warning ? Colors.gray700 : r.color }]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading indicator */}
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.mint}
              style={styles.loader}
            />
          )}

          {/* Error message */}
          {error && (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
    ...Shadows.lg,
  },
  taskName: {
    textAlign: 'center',
  },
  question: {
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    minHeight: TouchTarget.min,
    gap: Spacing.sm,
  },
  ratingEmoji: {
    fontSize: 28,
  },
  ratingLabel: {
    textAlign: 'center',
  },
  loader: {
    marginTop: Spacing.sm,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify file compiles (no syntax errors)**

Run: `npm run lint`
Expected: No errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/CompletionRatingSheet.tsx
git commit -m "feat: add CompletionRatingSheet component (Palier 2A)"
```

---

## Task 5: TaskViewToggle Component

**Files:**
- Create: `src/components/tasks/TaskViewToggle.tsx`

- [ ] **Step 1: Create the TaskViewToggle component**

```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TaskViewMode = 'list' | 'member';

interface TaskViewToggleProps {
  mode: TaskViewMode;
  onModeChange: (mode: TaskViewMode) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

const OPTIONS: { value: TaskViewMode; label: string }[] = [
  { value: 'list', label: 'Liste' },
  { value: 'member', label: 'Par membre' },
];

export function TaskViewToggle({ mode, onModeChange }: TaskViewToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onModeChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              variant="bodySmall"
              weight="semibold"
              style={active ? styles.textActive : styles.textInactive}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  segmentActive: {
    backgroundColor: Colors.backgroundCard,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textActive: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  textInactive: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
});
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/TaskViewToggle.tsx
git commit -m "feat: add TaskViewToggle segmented control component (Palier 2A)"
```

---

## Task 6: TaskCard — Add "Perso" Badge

**Files:**
- Modify: `src/components/tasks/TaskCard.tsx:78-101`

- [ ] **Step 1: Add "Perso" pill badge to TaskCard**

In `src/components/tasks/TaskCard.tsx`, add a "Perso" badge in the `metaRow` section. After the existing badges in the `<View style={styles.metaRow}>`, add a conditional badge:

Find this block in the `metaRow`:

```tsx
        <View style={styles.metaRow}>
          <Badge label="" status={displayStatus} size="sm" dot />
          <Badge label={priorityLabels[task.priority] ?? task.priority} priority={task.priority} size="sm" />
          <View style={styles.categoryChip}>
```

Replace with:

```tsx
        <View style={styles.metaRow}>
          <Badge label="" status={displayStatus} size="sm" dot />
          <Badge label={priorityLabels[task.priority] ?? task.priority} priority={task.priority} size="sm" />
          {task.task_type === 'personal' && (
            <Badge
              label="Perso"
              color={Colors.lavender + '25'}
              textColor={Colors.lavender}
              size="sm"
            />
          )}
          <View style={styles.categoryChip}>
```

Also add the import for Colors if not already present (it is already imported at line 5).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/TaskCard.tsx
git commit -m "feat: show 'Perso' badge on personal task cards (Palier 2A)"
```

---

## Task 7: TaskFilters — Add Type Filter

**Files:**
- Modify: `src/components/tasks/TaskFilters.tsx`

- [ ] **Step 1: Add task type filter to TaskFilters**

Replace the entire file content with:

```typescript
import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { TaskStatus } from '../../types';
import type { TaskType } from '../../types';

// ─── Status filter ───────────────────────────────────────────────────────────

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'todo', label: 'A faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminees' },
  { value: 'overdue', label: 'En retard' },
];

// ─── Type filter ─────────────────────────────────────────────────────────────

const typeOptions: { value: TaskType | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'household', label: 'Foyer' },
  { value: 'personal', label: 'Perso' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface TaskFiltersProps {
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  selectedType?: TaskType | 'all';
  onTypeChange?: (type: TaskType | 'all') => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskFilters({
  selectedStatus,
  onStatusChange,
  selectedType = 'all',
  onTypeChange,
}: TaskFiltersProps) {
  return (
    <View style={styles.wrapper}>
      {/* Status filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {statusOptions.map((opt) => {
          const active = selectedStatus === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onStatusChange(opt.value)}
              style={[styles.chip, active ? styles.chipActive : undefined]}
              activeOpacity={0.8}
            >
              <Text
                variant="bodySmall"
                weight="semibold"
                style={[styles.chipText, active ? styles.chipTextActive as TextStyle : undefined]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Type filter row */}
      {onTypeChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {typeOptions.map((opt) => {
            const active = selectedType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onTypeChange(opt.value)}
                style={[styles.chip, active ? styles.chipActiveType : undefined]}
                activeOpacity={0.8}
              >
                <Text
                  variant="bodySmall"
                  weight="semibold"
                  style={[styles.chipText, active ? styles.chipTextActiveType as TextStyle : undefined]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  container: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
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
  chipActiveType: {
    backgroundColor: Colors.lavender,
    borderColor: Colors.lavender,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  chipTextActiveType: {
    color: Colors.textInverse,
  },
});
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/TaskFilters.tsx
git commit -m "feat: add task type filter to TaskFilters (Palier 2A)"
```

---

## Task 8: Task List Screen — Rating Sheet + View Toggle + Member View

**Files:**
- Modify: `app/(app)/tasks/index.tsx`

This is the largest task. It integrates the rating sheet, view toggle, type filter, and member view (SectionList).

- [ ] **Step 1: Update imports**

Replace the imports section at the top of `app/(app)/tasks/index.tsx`:

```typescript
import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  SectionList,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors, Spacing, BorderRadius, Shadows, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Avatar } from '../../../src/components/ui/Avatar';
import { TaskCard } from '../../../src/components/tasks/TaskCard';
import { TaskFilters } from '../../../src/components/tasks/TaskFilters';
import { TaskCompletionToast } from '../../../src/components/tasks/TaskCompletionToast';
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { TaskViewToggle } from '../../../src/components/tasks/TaskViewToggle';
import type { TaskViewMode } from '../../../src/components/tasks/TaskViewToggle';
import { useTasks, useUpdateTaskStatus, useCompleteTaskWithRating } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Task, TaskStatus, TaskType } from '../../../src/types';
```

- [ ] **Step 2: Update state and hooks in the component body**

Replace the state declarations and hooks section (after `export default function TasksScreen() {`):

```typescript
export default function TasksScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const completeWithRating = useCompleteTaskWithRating();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [completedTaskName, setCompletedTaskName] = useState<string | null>(null);
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
```

- [ ] **Step 3: Update filter & sort logic**

Replace the `filteredTasks` useMemo with:

```typescript
  // ─── Filter & sort ─────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.task_type === typeFilter);
    }

    // Status filter
    const now = dayjs();
    if (statusFilter === 'overdue') {
      result = result.filter(
        (t) => t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(now, 'day')
      );
    } else if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort: overdue first, then by due_date, then by created_at
    result.sort((a, b) => {
      const aOverdue = a.status !== 'done' && a.due_date && dayjs(a.due_date).isBefore(now, 'day');
      const bOverdue = b.status !== 'done' && b.due_date && dayjs(b.due_date).isBefore(now, 'day');
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Done tasks at the bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;

      // By due_date ascending (nulls last)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      // By created_at descending
      return b.created_at.localeCompare(a.created_at);
    });

    return result;
  }, [tasks, statusFilter, typeFilter]);
```

- [ ] **Step 4: Add member view sections useMemo**

After `filteredTasks`, add:

```typescript
  // ─── Member view sections ──────────────────────────────────────────────────

  const memberSections = useMemo(() => {
    if (viewMode !== 'member') return [];

    const groups = new Map<string | null, Task[]>();
    for (const task of filteredTasks) {
      const key = task.assigned_to;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    const sections: { title: string; color: string; count: number; data: Task[] }[] = [];

    // Sort by pending task count descending (busiest first)
    const sortedKeys = [...groups.entries()].sort((a, b) => {
      // "Unassigned" always last
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      const aPending = a[1].filter((t) => t.status !== 'done').length;
      const bPending = b[1].filter((t) => t.status !== 'done').length;
      return bPending - aPending;
    });

    for (const [userId, sectionTasks] of sortedKeys) {
      if (userId === null) {
        sections.push({
          title: 'Non assignees',
          color: Colors.gray400,
          count: sectionTasks.length,
          data: sectionTasks,
        });
      } else {
        const member = members.find((m) => m.user_id === userId);
        sections.push({
          title: member?.profile?.full_name ?? 'Membre',
          color: member?.color ?? Colors.gray400,
          count: sectionTasks.length,
          data: sectionTasks,
        });
      }
    }

    return sections;
  }, [filteredTasks, viewMode, members]);
```

- [ ] **Step 5: Update handleToggleStatus to use rating sheet**

Replace the `handleToggleStatus` callback:

```typescript
  const handleToggleStatus = useCallback(
    (task: Task) => {
      if (task.status === 'done') {
        // Re-open task
        updateStatus.mutate({ id: task.id, status: 'todo' });
        return;
      }

      // Marking as done
      if (task.task_type === 'household') {
        // Open rating sheet for household tasks
        setRatingTask(task);
      } else {
        // Personal tasks: instant completion
        updateStatus.mutate({ id: task.id, status: 'done' });
        setCompletedTaskName(task.title);
      }
    },
    [updateStatus]
  );

  const handleRate = useCallback(
    (taskId: string, rating: 1 | 2 | 3) => {
      completeWithRating.mutate(
        { taskId, rating },
        {
          onSuccess: () => {
            setCompletedTaskName(ratingTask?.title ?? '');
            setRatingTask(null);
          },
        }
      );
    },
    [completeWithRating, ratingTask]
  );
```

- [ ] **Step 6: Update the render section**

Replace the entire return JSX (the `return (` block after the loading/no-household guards). This is the most significant change:

```tsx
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Taches</Text>
        <Text variant="bodySmall" color="secondary">
          {tasks.filter((t) => t.status !== 'done').length} en cours
        </Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TaskViewToggle mode={viewMode} onModeChange={setViewMode} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TaskFilters
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedType={typeFilter}
          onTypeChange={setTypeFilter}
        />
      </View>

      {/* Task List or Member View */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          expression="normal"
          action={{ label: 'Ajouter une tache', onPress: handleCreate }}
        />
      ) : viewMode === 'list' ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onToggleStatus={() => handleToggleStatus(item)}
            />
          )}
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
      ) : (
        <SectionList
          sections={memberSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Avatar
                name={section.title}
                color={section.color}
                size="sm"
              />
              <Text variant="label" style={styles.sectionTitle}>
                {section.title}
              </Text>
              <Text variant="caption" color="muted">
                {section.count}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item)}
              onToggleStatus={() => handleToggleStatus(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
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
        onPress={handleCreate}
        style={styles.fab}
        activeOpacity={0.85}
        accessibilityLabel="Creer une tache"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>

      {/* Rating bottom sheet */}
      <CompletionRatingSheet
        task={ratingTask}
        onRate={handleRate}
        isLoading={completeWithRating.isPending}
      />

      {/* Completion celebration */}
      <TaskCompletionToast
        taskName={completedTaskName ?? ''}
        visible={!!completedTaskName}
        onDismiss={() => setCompletedTaskName(null)}
      />
    </SafeAreaView>
  );
```

- [ ] **Step 7: Add new styles**

Add these styles to the `StyleSheet.create` at the bottom:

```typescript
  toggleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    flex: 1,
  },
```

- [ ] **Step 8: Run lint**

Run: `npm run lint`
Expected: No new errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/tasks/index.tsx
git commit -m "feat: integrate rating sheet, view toggle, member view in task list (Palier 2A)"
```

---

## Task 9: Task Detail Screen — Rating Sheet + Type Badge

**Files:**
- Modify: `app/(app)/tasks/[id].tsx`

- [ ] **Step 1: Update imports**

Add these imports at the top of `app/(app)/tasks/[id].tsx`:

```typescript
import { CompletionRatingSheet } from '../../../src/components/tasks/CompletionRatingSheet';
import { useCompleteTaskWithRating } from '../../../src/lib/queries/tasks';
import { Badge } from '../../../src/components/ui/Badge';
```

Note: `Badge` is already imported at line 23. Only add `CompletionRatingSheet` and `useCompleteTaskWithRating`.

- [ ] **Step 2: Add rating state and hook**

After the existing hooks in `TaskDetailScreen()`, add:

```typescript
  const completeWithRating = useCompleteTaskWithRating();
  const [ratingTask, setRatingTask] = React.useState<Task | null>(null);
```

(Add `Task` to the existing import from `'../../../src/types'` if not already there — it's not currently imported, only `TaskFormValues` and `TaskStatus` are.)

Update the import line from types:

```typescript
import type { Task, TaskFormValues, TaskStatus } from '../../../src/types';
```

- [ ] **Step 3: Update handleToggleStatus**

Replace the existing `handleToggleStatus`:

```typescript
  const handleToggleStatus = () => {
    if (isDone) {
      // Re-open task
      updateStatus.mutate({ id: task.id, status: 'todo' });
      return;
    }

    // Marking as done
    if (task.task_type === 'household') {
      setRatingTask(task);
    } else {
      updateStatus.mutate({ id: task.id, status: 'done' });
    }
  };

  const handleRate = (taskId: string, rating: 1 | 2 | 3) => {
    completeWithRating.mutate(
      { taskId, rating },
      {
        onSuccess: () => {
          setRatingTask(null);
        },
      }
    );
  };
```

- [ ] **Step 4: Add type badge to the badge row**

Find the badge row in the detail view:

```tsx
        <View style={styles.badgeRow}>
          <Badge label="" status={displayStatus} dot />
          <Badge label={priorityLabels[task.priority] ?? task.priority} priority={task.priority} />
```

Add after the priority badge:

```tsx
          {task.task_type === 'personal' && (
            <Badge
              label="Perso"
              color={Colors.lavender + '25'}
              textColor={Colors.lavender}
            />
          )}
```

- [ ] **Step 5: Add CompletionRatingSheet to the render**

Just before `</SafeAreaView>` at the end of the detail view return, add:

```tsx
      {/* Rating bottom sheet */}
      <CompletionRatingSheet
        task={ratingTask}
        onRate={handleRate}
        isLoading={completeWithRating.isPending}
      />
```

- [ ] **Step 6: Conditionally hide "Assigne a" in edit mode for personal tasks**

In the edit mode section, the assignee field is not currently shown (the edit form only has title, description, due_date, estimated_minutes). No change needed here — the assign field is only in the create screen.

- [ ] **Step 7: Update the "Assigne a" info row in detail view**

Find the `InfoRow` for the assignee in the detail view:

```tsx
            {assignee && (
              <InfoRow
                icon="person-outline"
                label="Assigne a"
                value={assignee.profile?.full_name ?? 'Membre'}
              />
            )}
```

No change needed — it already only shows when there's an assignee.

- [ ] **Step 8: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/tasks/[id].tsx
git commit -m "feat: add rating sheet and type badge to task detail screen (Palier 2A)"
```

---

## Task 10: Create Task Screen — Task Type Toggle

**Files:**
- Modify: `app/(app)/tasks/create.tsx`

- [ ] **Step 1: Add task type state**

In `CreateTaskScreen`, after the existing state declarations (around line 170-176), add:

```typescript
  const [taskType, setTaskType] = useState<'household' | 'personal'>('household');
```

- [ ] **Step 2: Import useAuthStore**

Add to imports at the top:

```typescript
import { useAuthStore } from '../../../src/stores/auth.store';
```

And in the component body, after `const { members } = useHouseholdStore();`:

```typescript
  const { user } = useAuthStore();
```

- [ ] **Step 3: Auto-set assignee for personal tasks**

When `taskType` changes to `'personal'`, auto-assign to current user. Add this effect after the state declarations:

```typescript
  // Auto-assign to self when switching to personal
  React.useEffect(() => {
    if (taskType === 'personal' && user) {
      setAssignedTo(user.id);
    }
  }, [taskType, user]);
```

- [ ] **Step 4: Add task type segmented control to the form UI**

Find the title input area in the render. The create screen uses a custom form with expandable rows. The task type toggle should go right after the title input at the top.

Find where the title `TextInput` is rendered (look for `taskName` and `setTaskName`). After the title input wrapper, add the type toggle:

```tsx
          {/* Task type toggle */}
          <View style={localStyles.typeToggleRow}>
            <TouchableOpacity
              style={[
                localStyles.typeOption,
                taskType === 'household' && localStyles.typeOptionActive,
              ]}
              onPress={() => setTaskType('household')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  localStyles.typeOptionText,
                  taskType === 'household' && localStyles.typeOptionTextActive,
                ]}
              >
                Foyer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.typeOption,
                taskType === 'personal' && localStyles.typeOptionActivePersonal,
              ]}
              onPress={() => setTaskType('personal')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  localStyles.typeOptionText,
                  taskType === 'personal' && localStyles.typeOptionTextActive,
                ]}
              >
                Perso
              </Text>
            </TouchableOpacity>
          </View>
```

Add these styles to the file's StyleSheet (or add a new `localStyles` object at the bottom):

```typescript
const localStyles = StyleSheet.create({
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: '#88D4A920',
    borderColor: '#88D4A960',
  },
  typeOptionActivePersonal: {
    backgroundColor: '#BCA7FF20',
    borderColor: '#BCA7FF60',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeOptionTextActive: {
    color: '#1E293B',
  },
});
```

- [ ] **Step 5: Hide assignee row when personal task**

Find the assignee expandable row (the row with `'assignee'` key). Wrap it with a condition:

```tsx
          {taskType === 'household' && (
            // ... existing assignee row ...
          )}
```

- [ ] **Step 6: Update handleSubmit to include task_type**

Find the `handleSubmit` function. Update the `values` object:

```typescript
    const values: TaskFormValues = {
      title: taskName.trim(),
      description: notes.trim() || undefined,
      category,
      zone: 'general',
      priority,
      recurrence: 'none',
      assigned_to: taskType === 'personal' ? (user?.id ?? '') : (assignedTo ?? ''),
      due_date: dueDateStr,
      estimated_minutes: undefined,
      task_type: taskType,
    };
```

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/(app)/tasks/create.tsx
git commit -m "feat: add task type toggle to create screen (Palier 2A)"
```

---

## Task 11: Integration Testing & Verification

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run lint for entire project**

Run: `npm run lint`
Expected: No new errors from Palier 2A changes.

- [ ] **Step 2: Run tests**

Run: `npm run test`
Expected: All existing tests pass. No regression.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Verify the app starts**

Run: `npx expo start --tunnel`
Expected: App builds and starts without errors.

- [ ] **Step 5: Manual test scenarios**

Test these on the device:

1. **Create household task** → default type is "Foyer", can assign to any member
2. **Create personal task** → switch to "Perso", assignee hidden, auto-assigned to self
3. **Task list shows "Perso" badge** on personal tasks
4. **Type filter works** → "Foyer" hides personal, "Perso" hides household, "Toutes" shows all
5. **Complete household task from list** → rating sheet appears, pick a rating → task marked done + toast
6. **Complete personal task from list** → instant completion, no sheet
7. **Complete household task from detail** → same rating sheet behavior
8. **Re-open a done task** → no rating sheet (just toggles back to todo)
9. **View toggle: "Par membre"** → tasks grouped by assigned member with headers
10. **"Par membre" unassigned section** → tasks with no assignee in "Non assignees" at bottom
11. **Filters work in member view** → status and type filters apply before grouping

- [ ] **Step 6: Verify data in Supabase**

Check `task_completion_ratings` table after completing a household task:
- Row exists with correct `task_id`, `user_id`, `household_id`, `rating`, `rated_at`

Check `tasks` table:
- New tasks have `task_type` column set correctly
- Existing tasks have `task_type = 'household'`
