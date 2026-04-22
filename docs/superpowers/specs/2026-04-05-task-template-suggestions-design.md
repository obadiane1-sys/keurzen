# Task Template Suggestions — Design Spec

## Summary

Extend the existing `TaskSuggestions` component to suggest **complete task variants** (not just titles) based on previously created tasks. When a user types in the task title field, matching past tasks appear as suggestions with parameter previews. Selecting one pre-fills the entire creation form.

## Context

- Current `TaskSuggestions` suggests title strings only, sourced from `useTasks()`
- No backend changes needed — past tasks are already fetched client-side
- Inspired by Tiimo's template-based creation UX, adapted to Keurzen's implicit model

## Behavior

1. User types in the title field on the task creation screen
2. System searches past tasks whose title contains the query (case-insensitive, min 2 chars)
3. Results are **grouped by unique variant**: same `(title, category, priority, recurrence, estimated_minutes)`
4. Each variant displays as a suggestion row with:
   - Category icon + task title (bold match highlight, as today)
   - Subtitle line: `Recurrence · Duration · Priority` (only non-default values shown)
5. Variants are sorted by **frequency descending** (most-created variant first)
6. On tap: all form fields are pre-filled silently (title, category, priority, recurrence, estimated_minutes, description, zone). User can modify any field before submitting.
7. Max 5 suggestions displayed (across all titles, not per title)

## Variant Key

Deduplication key: `title.toLowerCase()|category|priority|recurrence|estimated_minutes`

Example: 3 tasks titled "Aspirateur" with `cleaning|medium|weekly|30` produce 1 suggestion. 1 task "Aspirateur" with `cleaning|high|daily|15` produces a separate suggestion.

## Suggestion Row Layout

```
[CategoryIcon] Aspirateur                    [arrow]
               Hebdo · 30min · Priorite moyenne
```

- Category icon uses existing `categoryLabels` mapping
- Subtitle tokens joined by ` · `, omitting defaults:
  - Recurrence: omit if `none`
  - Duration: omit if null
  - Priority: omit if `medium` (the default)
- If all parameters are default, subtitle shows the category label only

## Data Flow

```
useTasks() → existing tasks[]
  → deduplicate by variant key
  → sort by frequency desc
  → filter by title match against user input
  → display in TaskSuggestions
```

No new hooks, stores, or API calls required.

## Pre-fill Mapping

When a suggestion is selected, these fields are set:

| Suggestion field     | Form field          |
|----------------------|---------------------|
| title                | taskName            |
| category             | category            |
| priority             | priority            |
| recurrence           | recurrence          |
| estimated_minutes    | estimatedMinutes    |
| description          | notes               |
| zone                 | (not exposed in UI) |

Fields NOT pre-filled (context-dependent):
- `due_date` — user picks fresh each time
- `assigned_to` — user assigns fresh each time

## Component Changes

### `TaskSuggestions.tsx`

- Props change: receives `TaskVariant[]` instead of `string[]`
- New type:

```typescript
interface TaskVariant {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: RecurrenceType;
  estimatedMinutes: number | null;
  description: string | null;
  zone: TaskZone;
  count: number; // frequency for sorting
}
```

- `onSelect` callback changes: `(variant: TaskVariant) => void` instead of `(title: string) => void`
- Renders category icon instead of clock icon
- Adds subtitle line with parameter preview
- Match highlighting still applies to the title

### `create.tsx` (mobile)

- Builds `TaskVariant[]` from `useTasks()` with deduplication logic
- `onSelect` handler pre-fills all form state variables
- Closes suggestions after selection

### Web equivalent

- Same logic applied to the web task creation form in `apps/web/src/app/(app)/tasks/page.tsx` (or dedicated creation component if it exists)

## Edge Cases

- **No past tasks**: suggestions don't appear (same as today)
- **All variants identical for a title**: single suggestion shown
- **Very long subtitle**: truncate with ellipsis after ~40 chars
- **Task with only a title (all defaults)**: still suggested, subtitle shows category only

## Out of Scope

- Explicit "save as template" action
- System-provided templates
- Sub-tasks / checklist items (Tiimo feature not adopted)
- New database tables or migrations
- Backend search / API endpoint
