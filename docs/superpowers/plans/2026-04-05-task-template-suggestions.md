# Task Template Suggestions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When typing a task title, suggest complete task variants from past tasks and pre-fill the form on selection.

**Architecture:** Extend existing `TaskSuggestions` component to accept full task variant objects instead of strings. Deduplication logic lives in a pure utility function. The creation screens (mobile + web) wire variant selection to form state pre-fill.

**Tech Stack:** React Native (mobile), React (web), TypeScript, existing `useTasks()` hook

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/mobile/src/lib/utils/taskVariants.ts` | Pure dedup + sorting logic |
| Modify | `apps/mobile/src/components/tasks/TaskSuggestions.tsx` | Render variant suggestions with subtitle |
| Modify | `apps/mobile/app/(app)/tasks/create.tsx` | Build variants, wire pre-fill on select |
| Create | `apps/web/src/lib/utils/taskVariants.ts` | Same pure logic (copy, shared package not set up) |
| Create | `apps/web/src/components/tasks/TaskSuggestions.tsx` | Web version of variant suggestions dropdown |
| Modify | `apps/web/src/components/tasks/CreateTaskModal.tsx` | Add title input with suggestions, wire pre-fill |

---

### Task 1: Create the variant deduplication utility (mobile)

**Files:**
- Create: `apps/mobile/src/lib/utils/taskVariants.ts`

- [ ] **Step 1: Create the utility file with types and logic**

```typescript
// apps/mobile/src/lib/utils/taskVariants.ts
import type { Task, TaskCategory, TaskPriority, RecurrenceType, TaskZone } from '../../types';

export interface TaskVariant {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: RecurrenceType;
  estimatedMinutes: number | null;
  description: string | null;
  zone: TaskZone;
  count: number;
}

function variantKey(t: { title: string; category: string; priority: string; recurrence: string; estimated_minutes: number | null }): string {
  return `${t.title.toLowerCase()}|${t.category}|${t.priority}|${t.recurrence}|${t.estimated_minutes ?? ''}`;
}

export function buildTaskVariants(tasks: Task[]): TaskVariant[] {
  const map = new Map<string, { variant: TaskVariant; count: number }>();

  for (const t of tasks) {
    const key = variantKey(t);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.variant.count = existing.count;
    } else {
      map.set(key, {
        count: 1,
        variant: {
          title: t.title,
          category: t.category,
          priority: t.priority,
          recurrence: t.recurrence,
          estimatedMinutes: t.estimated_minutes,
          description: t.description,
          zone: t.zone,
          count: 1,
        },
      });
    }
  }

  return Array.from(map.values())
    .map((entry) => entry.variant)
    .sort((a, b) => b.count - a.count);
}

export function filterVariants(variants: TaskVariant[], query: string, maxResults = 5): TaskVariant[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return variants
    .filter((v) => v.title.toLowerCase().includes(q) && v.title.toLowerCase() !== q)
    .slice(0, maxResults);
}

export function formatVariantSubtitle(v: TaskVariant, categoryLabels: Record<string, { label: string }>): string {
  const parts: string[] = [];

  const recurrenceLabels: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdo',
    biweekly: 'Bi-hebdo',
    monthly: 'Mensuel',
  };
  if (v.recurrence !== 'none' && recurrenceLabels[v.recurrence]) {
    parts.push(recurrenceLabels[v.recurrence]);
  }

  if (v.estimatedMinutes != null) {
    if (v.estimatedMinutes >= 60) {
      const h = Math.floor(v.estimatedMinutes / 60);
      const m = v.estimatedMinutes % 60;
      parts.push(m > 0 ? `${h}h${m}` : `${h}h`);
    } else {
      parts.push(`${v.estimatedMinutes}min`);
    }
  }

  const priorityLabels: Record<string, string> = { low: 'Faible', high: 'Haute', urgent: 'Urgente' };
  if (priorityLabels[v.priority]) {
    parts.push(priorityLabels[v.priority]);
  }

  if (parts.length === 0) {
    return categoryLabels[v.category]?.label ?? v.category;
  }

  return parts.join(' \u00B7 ');
}
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -20`
Expected: No errors related to `taskVariants.ts`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/utils/taskVariants.ts
git commit -m "feat(tasks): add task variant deduplication utility"
```

---

### Task 2: Update TaskSuggestions component (mobile)

**Files:**
- Modify: `apps/mobile/src/components/tasks/TaskSuggestions.tsx`

- [ ] **Step 1: Rewrite TaskSuggestions to accept TaskVariant objects**

Replace the entire file content with:

```typescript
// apps/mobile/src/components/tasks/TaskSuggestions.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import type { TaskVariant } from '../../lib/utils/taskVariants';
import { categoryLabels } from './TaskCard';
import { formatVariantSubtitle } from '../../lib/utils/taskVariants';

interface TaskSuggestionsProps {
  query: string;
  variants: TaskVariant[];
  onSelect: (variant: TaskVariant) => void;
  visible: boolean;
}

export const TaskSuggestions = React.memo(function TaskSuggestions({
  query,
  variants,
  onSelect,
  visible,
}: TaskSuggestionsProps) {
  if (!visible || variants.length === 0) return null;

  const q = query.toLowerCase();

  return (
    <View style={styles.container}>
      {variants.map((variant, i) => {
        const title = variant.title;
        const lowerTitle = title.toLowerCase();
        const matchIndex = lowerTitle.indexOf(q);
        const cat = categoryLabels[variant.category] ?? categoryLabels.other;
        const subtitle = formatVariantSubtitle(variant, categoryLabels);

        return (
          <TouchableOpacity
            key={`${title}-${variant.category}-${variant.recurrence}-${variant.estimatedMinutes}-${i}`}
            style={[styles.row, i === 0 && styles.rowFirst]}
            onPress={() => onSelect(variant)}
            activeOpacity={0.6}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={cat.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={Colors.terracotta}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.text} numberOfLines={1}>
                {matchIndex >= 0 ? (
                  <>
                    {title.substring(0, matchIndex)}
                    <Text style={styles.textHighlight}>
                      {title.substring(matchIndex, matchIndex + q.length)}
                    </Text>
                    {title.substring(matchIndex + q.length)}
                  </>
                ) : (
                  title
                )}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Ionicons
              name="arrow-up-outline"
              size={14}
              color={Colors.textMuted}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    minHeight: 56,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.terracotta}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textHighlight: {
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.terracotta,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  arrowIcon: {
    marginLeft: Spacing.sm,
    transform: [{ rotate: '-45deg' }],
  },
});
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -20`
Expected: No errors related to `TaskSuggestions.tsx`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/tasks/TaskSuggestions.tsx
git commit -m "feat(tasks): update TaskSuggestions to show full variant previews"
```

---

### Task 3: Wire variant suggestions into create.tsx (mobile)

**Files:**
- Modify: `apps/mobile/app/(app)/tasks/create.tsx`

Changes needed:
1. Import `buildTaskVariants`, `filterVariants`, `TaskVariant` from utility
2. Replace `taskSuggestions` (string array) with variant-based data
3. Update `TaskSuggestions` usage to pass variants and handle variant selection
4. Add pre-fill handler

- [ ] **Step 1: Update imports at top of file**

Replace:
```typescript
import { TaskSuggestions } from '../../../src/components/tasks/TaskSuggestions';
```

With:
```typescript
import { TaskSuggestions } from '../../../src/components/tasks/TaskSuggestions';
import { buildTaskVariants, filterVariants } from '../../../src/lib/utils/taskVariants';
import type { TaskVariant } from '../../../src/lib/utils/taskVariants';
```

- [ ] **Step 2: Replace taskSuggestions memo with variant-based logic**

Replace:
```typescript
  // Unique task titles for autocomplete suggestions
  const taskSuggestions = useMemo(
    () => [...new Set(existingTasks.map(t => t.title))],
    [existingTasks]
  );
```

With:
```typescript
  // Build deduplicated task variants for suggestions
  const allVariants = useMemo(
    () => buildTaskVariants(existingTasks),
    [existingTasks]
  );

  const filteredVariants = useMemo(
    () => filterVariants(allVariants, taskName),
    [allVariants, taskName]
  );
```

- [ ] **Step 3: Add pre-fill handler after existing handlers**

Add this after the `handleSubmit` function (around line 481):

```typescript
  const handleVariantSelect = useCallback((variant: TaskVariant) => {
    setTaskName(variant.title);
    setCategory(variant.category);
    setPriority(variant.priority);
    setRecurrence(variant.recurrence);
    setEstimatedMinutes(variant.estimatedMinutes != null ? String(variant.estimatedMinutes) : '');
    setNotes(variant.description ?? '');
    setInputFocused(false);
  }, []);
```

- [ ] **Step 4: Update TaskSuggestions JSX usage**

Replace:
```typescript
          <TaskSuggestions
            query={taskName}
            suggestions={taskSuggestions}
            visible={inputFocused}
            onSelect={(title) => {
              setTaskName(title);
              setInputFocused(false);
            }}
          />
```

With:
```typescript
          <TaskSuggestions
            query={taskName}
            variants={filteredVariants}
            visible={inputFocused}
            onSelect={handleVariantSelect}
          />
```

- [ ] **Step 5: Verify file compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/(app)/tasks/create.tsx
git commit -m "feat(tasks): wire variant suggestions with form pre-fill on mobile"
```

---

### Task 4: Create variant utility for web

**Files:**
- Create: `apps/web/src/lib/utils/taskVariants.ts`

- [ ] **Step 1: Create the web utility file**

This is the same logic as mobile. The shared package isn't set up, so we duplicate for now.

```typescript
// apps/web/src/lib/utils/taskVariants.ts

export interface TaskVariant {
  title: string;
  category: string;
  priority: string;
  recurrence: string;
  estimatedMinutes: number | null;
  description: string | null;
  zone: string;
  count: number;
}

interface TaskLike {
  title: string;
  category: string;
  priority: string;
  recurrence: string;
  estimated_minutes: number | null;
  description: string | null;
  zone: string;
}

function variantKey(t: TaskLike): string {
  return `${t.title.toLowerCase()}|${t.category}|${t.priority}|${t.recurrence}|${t.estimated_minutes ?? ''}`;
}

export function buildTaskVariants(tasks: TaskLike[]): TaskVariant[] {
  const map = new Map<string, { variant: TaskVariant; count: number }>();

  for (const t of tasks) {
    const key = variantKey(t);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.variant.count = existing.count;
    } else {
      map.set(key, {
        count: 1,
        variant: {
          title: t.title,
          category: t.category,
          priority: t.priority,
          recurrence: t.recurrence,
          estimatedMinutes: t.estimated_minutes,
          description: t.description,
          zone: t.zone,
          count: 1,
        },
      });
    }
  }

  return Array.from(map.values())
    .map((entry) => entry.variant)
    .sort((a, b) => b.count - a.count);
}

export function filterVariants(variants: TaskVariant[], query: string, maxResults = 5): TaskVariant[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return variants
    .filter((v) => v.title.toLowerCase().includes(q) && v.title.toLowerCase() !== q)
    .slice(0, maxResults);
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdo',
  biweekly: 'Bi-hebdo',
  monthly: 'Mensuel',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Faible',
  high: 'Haute',
  urgent: 'Urgente',
};

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: 'Menage',
  cooking: 'Cuisine',
  shopping: 'Courses',
  admin: 'Admin',
  children: 'Enfants',
  pets: 'Animaux',
  garden: 'Jardin',
  repairs: 'Bricolage',
  health: 'Sante',
  finances: 'Finances',
  other: 'Autre',
};

export function formatVariantSubtitle(v: TaskVariant): string {
  const parts: string[] = [];

  if (v.recurrence !== 'none' && RECURRENCE_LABELS[v.recurrence]) {
    parts.push(RECURRENCE_LABELS[v.recurrence]);
  }

  if (v.estimatedMinutes != null) {
    if (v.estimatedMinutes >= 60) {
      const h = Math.floor(v.estimatedMinutes / 60);
      const m = v.estimatedMinutes % 60;
      parts.push(m > 0 ? `${h}h${m}` : `${h}h`);
    } else {
      parts.push(`${v.estimatedMinutes}min`);
    }
  }

  if (PRIORITY_LABELS[v.priority]) {
    parts.push(PRIORITY_LABELS[v.priority]);
  }

  if (parts.length === 0) {
    return CATEGORY_LABELS[v.category] ?? v.category;
  }

  return parts.join(' \u00B7 ');
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/utils/taskVariants.ts
git commit -m "feat(tasks): add task variant utility for web"
```

---

### Task 5: Create web TaskSuggestions component

**Files:**
- Create: `apps/web/src/components/tasks/TaskSuggestions.tsx`

- [ ] **Step 1: Create the web suggestions dropdown component**

```tsx
// apps/web/src/components/tasks/TaskSuggestions.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { TaskVariant } from '@/lib/utils/taskVariants';
import { formatVariantSubtitle } from '@/lib/utils/taskVariants';

interface TaskSuggestionsProps {
  query: string;
  variants: TaskVariant[];
  onSelect: (variant: TaskVariant) => void;
  visible: boolean;
}

export function TaskSuggestions({ query, variants, onSelect, visible }: TaskSuggestionsProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Parent controls visibility via onBlur
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!visible || variants.length === 0) return null;

  const q = query.toLowerCase();

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background-card shadow-md"
    >
      {variants.map((variant, i) => {
        const title = variant.title;
        const lowerTitle = title.toLowerCase();
        const matchIndex = lowerTitle.indexOf(q);
        const subtitle = formatVariantSubtitle(variant);

        return (
          <button
            key={`${title}-${variant.category}-${variant.recurrence}-${variant.estimatedMinutes}-${i}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur before click fires
              onSelect(variant);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
          >
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm text-text-primary">
                {matchIndex >= 0 ? (
                  <>
                    {title.substring(0, matchIndex)}
                    <span className="font-bold text-terracotta">
                      {title.substring(matchIndex, matchIndex + q.length)}
                    </span>
                    {title.substring(matchIndex + q.length)}
                  </>
                ) : (
                  title
                )}
              </span>
              <span className="text-xs text-text-muted">{subtitle}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/tasks/TaskSuggestions.tsx
git commit -m "feat(tasks): add web TaskSuggestions dropdown component"
```

---

### Task 6: Wire suggestions into CreateTaskModal (web)

**Files:**
- Modify: `apps/web/src/components/tasks/CreateTaskModal.tsx`

- [ ] **Step 1: Add imports**

Add at top of file after existing imports:

```typescript
import { useState, useMemo } from 'react';
import { useTasks } from '@keurzen/queries';
import { TaskSuggestions } from './TaskSuggestions';
import { buildTaskVariants, filterVariants } from '@/lib/utils/taskVariants';
import type { TaskVariant } from '@/lib/utils/taskVariants';
```

- [ ] **Step 2: Add variant logic and state inside the component**

Add after `const { members } = useHouseholdStore();` (line 18):

```typescript
  const { data: existingTasks = [] } = useTasks();
  const [titleQuery, setTitleQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allVariants = useMemo(
    () => buildTaskVariants(existingTasks),
    [existingTasks],
  );

  const filteredVariants = useMemo(
    () => filterVariants(allVariants, titleQuery),
    [allVariants, titleQuery],
  );

  const handleVariantSelect = (variant: TaskVariant) => {
    reset({
      title: variant.title,
      description: variant.description ?? '',
      priority: variant.priority as TaskFormValues['priority'],
      category: variant.category as TaskFormValues['category'],
      zone: variant.zone as TaskFormValues['zone'],
      recurrence: variant.recurrence as TaskFormValues['recurrence'],
      estimated_minutes: variant.estimatedMinutes ?? undefined,
      task_type: 'household',
    });
    setTitleQuery(variant.title);
    setShowSuggestions(false);
  };
```

- [ ] **Step 3: Replace the title Input with suggestions-enabled version**

Replace:
```tsx
        <Input
          label="Titre"
          placeholder="Ex: Faire les courses"
          {...register('title', { required: 'Le titre est requis' })}
          error={errors.title?.message}
          autoFocus
        />
```

With:
```tsx
        <div className="relative">
          <Input
            label="Titre"
            placeholder="Ex: Faire les courses"
            {...register('title', { required: 'Le titre est requis' })}
            error={errors.title?.message}
            autoFocus
            onChange={(e) => {
              register('title').onChange(e);
              setTitleQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          <TaskSuggestions
            query={titleQuery}
            variants={filteredVariants}
            visible={showSuggestions}
            onSelect={handleVariantSelect}
          />
        </div>
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/ouss/Keurzen/apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/tasks/CreateTaskModal.tsx
git commit -m "feat(tasks): wire variant suggestions with form pre-fill on web"
```

---

### Task 7: Manual testing & lint

- [ ] **Step 1: Run lint**

Run: `cd /Users/ouss/Keurzen && npm run lint`
Expected: No new errors

- [ ] **Step 2: Test mobile manually**

Scenario:
1. Open the app, go to Tasks
2. Tap the FAB (+) to create a new task
3. Type the first 2+ chars of a previously created task title
4. Verify: suggestion rows appear with category icon, title (match highlighted), and subtitle (recurrence, duration, priority)
5. Tap a suggestion
6. Verify: all form fields are pre-filled (category, priority, recurrence, estimated time, notes)
7. Verify: date and assignee are NOT pre-filled
8. Modify a field, submit — verify task is created correctly

Edge cases:
- Type a title that matches no past tasks — no suggestions shown
- Type a title with multiple variants — multiple rows shown, sorted by frequency
- Type the exact full title of a task — no suggestions (exact match excluded)

- [ ] **Step 3: Test web manually**

Same scenario as mobile but in the web task creation modal:
1. Open Tasks page, click "Nouvelle tache"
2. Type in the title field
3. Verify dropdown appears with variant suggestions
4. Click a suggestion — form fields pre-fill
5. Submit and verify

- [ ] **Step 4: Final commit if lint fixes needed**

```bash
git add -A
git commit -m "fix: lint fixes for task suggestions feature"
```
