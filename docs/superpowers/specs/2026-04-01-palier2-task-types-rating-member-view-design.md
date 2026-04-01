# Spec: Palier 2A — Task Types, Mental Load Rating, Vue Par Membre

**Date:** 2026-04-01
**Status:** Draft
**Scope:** Add task types (household/personal), mental load rating at completion, and member view to the task system

---

## Context

Palier 1 (Fondations) is complete. Palier 2 is the core of Keurzen — task management with fairness visibility. This spec covers the first half of Palier 2:

- Task types: `household` vs `personal`
- Mental load rating at completion (household tasks only)
- Vue par membre (segmented control on task list)

Recurrence engine is covered in a separate Spec B.

### What already exists

- Full task CRUD: create, edit, delete, assign, mark done
- Task list screen with status filters, sorting (overdue first, done last)
- Task detail screen with view + edit mode
- Task creation form with all fields
- `tasks` table with all columns except `task_type`
- No `task_completion_ratings` table
- No member view grouping

---

## Design Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Personal task visibility | Visible to all household members | Keurzen's core value is load visibility; hiding tasks undermines fairness metrics |
| Rating dismissability | Required, not dismissable | Palier 3 fairness scores depend on complete data; 3 buttons is fast enough |
| Vue par membre location | Segmented control on same screen | Simpler navigation, same data differently grouped |
| Task type default | Default to `household`, toggle to switch | Most tasks are household tasks; minimizes friction |
| Rating storage | Separate table, not column on tasks | Preserves history on re-completion; cleaner aggregation for Palier 3 |
| Completion + rating | Atomic RPC | Prevents task marked done without rating |

---

## Change 1: Database Schema

### 1a. Add `task_type` column to `tasks`

```sql
ALTER TABLE tasks
ADD COLUMN task_type text NOT NULL DEFAULT 'household'
CHECK (task_type IN ('household', 'personal'));
```

- All existing tasks default to `'household'`
- Personal tasks: `assigned_to` is set to `created_by` (enforced client-side)

### 1b. New `task_completion_ratings` table

```sql
CREATE TABLE task_completion_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  household_id uuid NOT NULL REFERENCES households(id),
  rating smallint NOT NULL CHECK (rating IN (1, 2, 3)),
  rated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for Palier 3 aggregation queries
CREATE INDEX idx_task_completion_ratings_household_user
ON task_completion_ratings (household_id, user_id, rated_at);
```

- RLS: members can insert for themselves (`auth.uid() = user_id`), read all within their household
- One rating per completion event (not unique on task_id — allows re-completions)
- Rating values: 1 = Legere, 2 = Moyenne, 3 = Lourde

### 1c. New RPC `complete_task_with_rating`

```sql
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
  -- Get task info and validate membership
  SELECT t.household_id, t.task_type INTO v_household_id, v_task_type
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
  SET status = 'done', completed_at = now(), updated_at = now()
  WHERE id = p_task_id;

  -- Insert rating
  INSERT INTO task_completion_ratings (task_id, user_id, household_id, rating)
  VALUES (p_task_id, auth.uid(), v_household_id, p_rating);
END;
$$;
```

### Files affected

- New: `supabase/migrations/017_add_task_type_and_ratings.sql`

---

## Change 2: Task Type in Creation and Display

### 2a. Create form

**File:** `app/(app)/tasks/create.tsx`

- Add segmented control at the top of the form: "Foyer" (default) | "Perso"
- When "Perso" selected:
  - `assigned_to` auto-set to current user, field hidden
  - All other fields remain the same
- When "Foyer" selected: form works as today
- `task_type` sent to Supabase on insert

### 2b. Task list display

**File:** `app/(app)/tasks/index.tsx`

- `TaskCard` shows a subtle "Perso" pill badge for personal tasks; no badge for household (default)
- Add type filter: "Toutes" | "Foyer" | "Perso" — integrated into existing `TaskFilters` component
- Personal tasks from other members show their name + "Perso" tag

### 2c. Task detail

**File:** `app/(app)/tasks/[id].tsx`

- Show task type as badge near the title
- Personal tasks: hide "Assigner a" field in edit mode, lock to creator
- Status toggle behavior depends on type (see Change 3)

### 2d. Type system

**File:** `src/types/index.ts`

- Add `task_type: 'household' | 'personal'` to `Task` interface
- Add `task_type` to `TaskFormValues`

**File:** `src/lib/queries/tasks.ts`

- `useCreateTask`: send `task_type` field
- All existing queries return `task_type` (no filter server-side)

### Files affected

- `app/(app)/tasks/create.tsx` — segmented control, conditional field visibility
- `app/(app)/tasks/index.tsx` — "Perso" badge, type filter
- `app/(app)/tasks/[id].tsx` — type badge, conditional edit fields
- `src/types/index.ts` — add `task_type` to Task and TaskFormValues
- `src/lib/queries/tasks.ts` — send `task_type` on create
- `src/components/tasks/TaskCard.tsx` — "Perso" pill badge
- `src/components/tasks/TaskFilters.tsx` — type filter option

---

## Change 3: Mental Load Rating Bottom Sheet

### 3a. Component

**New file:** `src/components/tasks/CompletionRatingSheet.tsx`

A bottom sheet that appears when a household task is marked as done.

**Content:**
- Task name shown subtly for context
- Title: "Comment tu t'es senti-e sur cette tache ?"
- Three large buttons in a horizontal row:
  - "Legere" (rating: 1) — Mint color (#88D4A9)
  - "Moyenne" (rating: 2) — Warning/amber color (#FBBF24, existing `Colors.warning` token)
  - "Lourde" (rating: 3) — Coral color (#FFA69E)
- Each button: rounded card, emoji (green/yellow/red circle) + label, min 44px touch target
- No close button, no backdrop dismiss — rating is required
- Loading state while RPC executes

### 3b. Trigger logic

**Where completion happens:**
- `app/(app)/tasks/index.tsx` — from TaskCard status toggle
- `app/(app)/tasks/[id].tsx` — from detail screen status toggle

**Logic:**
- When user taps "done" on a task:
  - If `task.task_type === 'household'`: open `CompletionRatingSheet` with that task
  - If `task.task_type === 'personal'`: call `useUpdateTaskStatus` directly (instant completion)

**State per screen:**
- `ratingTask: Task | null` — when set, sheet opens for that task

### 3c. New hook

**File:** `src/lib/queries/tasks.ts`

New hook: `useCompleteTaskWithRating`
- Calls `complete_task_with_rating` RPC with `task_id` and `rating`
- On success: invalidates `['tasks']` query key, shows `TaskCompletionToast`
- Handles loading and error states

### 3d. Flow

1. User taps "done" on a household task
2. Rating sheet opens (task stays `in_progress`)
3. User taps one of the 3 rating buttons
4. RPC called: task marked done + rating inserted atomically
5. Sheet closes, toast shown, task list refreshes
6. If RPC fails: sheet shows error, user can retry

### Files affected

- New: `src/components/tasks/CompletionRatingSheet.tsx`
- `app/(app)/tasks/index.tsx` — rating sheet state + trigger logic
- `app/(app)/tasks/[id].tsx` — rating sheet state + trigger logic
- `src/lib/queries/tasks.ts` — new `useCompleteTaskWithRating` hook

---

## Change 4: Vue Par Membre (Segmented Control)

### 4a. View toggle

**New file:** `src/components/tasks/TaskViewToggle.tsx`

Segmented control with two segments: "Liste" (default) | "Par membre"
- Props: `mode: 'list' | 'member'`, `onModeChange`
- Positioned below header, above filters

### 4b. Task list screen changes

**File:** `app/(app)/tasks/index.tsx`

**"Liste" mode (current behavior):**
- Flat `FlatList` sorted by overdue first, due date, done last
- Existing filters + new type filter apply

**"Par membre" mode:**
- `SectionList` grouped by `assigned_to`
- Section headers: member avatar circle (with their color from `household_members.color`) + name + task count
- Sections ordered by number of pending tasks descending (busiest member first)
- "Non assignees" section at the bottom for tasks with `assigned_to = null`
- Same filters apply — filtering happens before grouping

### 4c. Data grouping

- Pure client-side: `useMemo` that groups filtered tasks by `assigned_to`
- Member info (name, color) from `useHouseholdStore().members`
- No new query or RPC needed

### Files affected

- New: `src/components/tasks/TaskViewToggle.tsx`
- `app/(app)/tasks/index.tsx` — segmented control state, SectionList for member view, grouping logic

---

## Summary of All Files

### New files
- `supabase/migrations/017_add_task_type_and_ratings.sql`
- `src/components/tasks/CompletionRatingSheet.tsx`
- `src/components/tasks/TaskViewToggle.tsx`

### Modified files
- `src/types/index.ts`
- `src/lib/queries/tasks.ts`
- `src/components/tasks/TaskCard.tsx`
- `src/components/tasks/TaskFilters.tsx`
- `app/(app)/tasks/create.tsx`
- `app/(app)/tasks/index.tsx`
- `app/(app)/tasks/[id].tsx`

---

## How to Test

### Task types
- Create a household task → no "Perso" badge, assign to any member
- Create a personal task → "Perso" badge shown, assigned_to locked to creator
- Other members see personal tasks in the list with "Perso" tag
- Filter by type: "Foyer" hides personal, "Perso" hides household

### Mental load rating
- Mark a household task as done → rating sheet appears, cannot dismiss
- Tap a rating → task marked done, toast shown, rating stored
- Mark a personal task as done → instant completion, no sheet
- Re-open a task (set to todo), mark done again → new rating row created
- Check `task_completion_ratings` table has correct data

### Vue par membre
- Toggle to "Par membre" → tasks grouped by assigned member with headers
- Busiest member section appears first
- Unassigned tasks in "Non assignees" section at bottom
- Filters still work in member view
- Toggle back to "Liste" → normal flat list

### Edge cases
- Task with no assigned member in member view → appears in "Non assignees"
- Complete a household task from detail screen → same rating sheet behavior
- Error during RPC → sheet shows error, user can retry
- All tasks filtered out in member view → empty state shown

---

## Risks

- **Migration on existing data:** Adding `task_type` with default `'household'` is safe — all existing tasks are household tasks. Non-destructive.
- **Rating sheet blocking:** Since it's not dismissable, if the RPC hangs the user is stuck. Mitigation: timeout + error state with retry button.
- **Performance of client-side grouping:** For large task lists, `useMemo` grouping could be slow. Acceptable for V1 — households won't have thousands of tasks.
