# Dashboard Keurzen v7 — Redesign Spec

**Date:** 2026-04-11
**Source:** Stitch design (project 4455045934175792226, screen "Tableau de Bord Keurzen v7")
**Palette:** Cafe Cosy (terracotta, sauge, miel, rose, prune)

---

## Overview

Full dashboard redesign based on a Stitch-generated reference. Adopts the Stitch layout structure (header with greeting, insights carousel, score card, 2-column grid, upcoming tasks) while preserving the Cafe Cosy design tokens and existing navigation (3 tabs).

## Color Mapping (Stitch → Cafe Cosy)

| Stitch token | Hex | Cafe Cosy equivalent | Hex |
|---|---|---|---|
| primary | #00E5FF | terracotta | #C4846C |
| secondary | #FFB6C1 | rose | #D4807A |
| tertiary | #FFD700 | miel | #D4A959 |
| danger | #FF6B6B | rose | #D4807A |
| success | #48BB78 | sauge | #8BA888 |
| purple | #9F7AEA | prune | #9B8AA8 |
| background | #F7F9FC | background | #FAF6F1 |
| surface | #FFFFFF | backgroundCard | #FFFDF9 |
| text | #2D3748 | textPrimary | #3D2C22 |
| text-muted | #718096 | textMuted | #A89888 |

## Sections

### 1. Header

- **Left:** Mascot avatar (48px circle, white bg, card shadow) + greeting "Bonjour, {firstName}" with firstName in terracotta + subtitle "Prete a equilibrer votre quotidien ?" in muted
- **Right:** Notification bell icon with red badge dot when unread notifications exist
- **Behavior:** Sticky on mobile with background blur (backdrop-filter), static on web
- **Data:** `profile.full_name`, notification count from existing notification system

### 2. Insights Carousel (NEW)

Horizontal scrollable row of coaching insight cards. Min-width 280px per card, gap 16px, horizontal padding matches screen padding with overflow visible.

#### Card types

| Type | Background | Icon | Icon color | Label | CTA color |
|---|---|---|---|---|---|
| alert | rose/10 + border rose/20 | warning_amber (Ionicons: `warning-outline`) | rose | "Attention {name} !" | rose |
| conseil | backgroundCard + border standard | chat_bubble (Ionicons: `chatbubble-outline`) | miel | "Conseil" | terracotta |
| wellbeing | backgroundCard + border standard | favorite (Ionicons: `heart-outline`) | rose | "Bien-etre" | terracotta |

#### Card anatomy
- Top: icon + label (uppercase, xs, bold, tracking-wider)
- Middle: message text (sm, semibold)
- Bottom: CTA button text with arrow icon

#### Backend: Edge Function `get-coaching-insights`

Deterministic rules engine. No LLM. Analyzes existing data to produce insights.

**Rules:**

1. **TLX Delta Alert** — If any member's TLX score increased > 10% week-over-week → alert card: "Ta charge mentale semble augmenter cette semaine (+{delta}%)."
2. **Task Imbalance** — If task distribution gap > 20 percentage points → conseil card: "La repartition des taches est desequilibree. Pensez a deleguer."
3. **Task Completion Praise** — If a member completed >= 5 tasks today → wellbeing card: "{name} a complete {count} taches aujourd'hui. Remerciez-le/la !"
4. **Planning Reminder** — If it's Sunday or Monday and no tasks planned for the week → conseil card: "Prenez 15 minutes pour planifier la semaine ensemble."
5. **No insights** — If no rules trigger, show a single conseil card: "Tout va bien ! Continuez sur cette voie."

**Input data:** Reads from `tlx_entries`, `tasks`, `household_members` tables via service_role.

**Response shape:**
```typescript
interface CoachingInsight {
  id: string;
  type: 'alert' | 'conseil' | 'wellbeing';
  icon: string;
  label: string;
  message: string;
  cta_label: string;
  priority: number; // lower = show first
}
```

**No new DB table.** Insights are computed on-the-fly, not stored. The Edge Function returns a JSON array sorted by priority.

**RPC:** `get-coaching-insights(household_id uuid)` — but household_id is derived from `auth.uid()` inside the function, never passed as parameter.

### 3. Score du Foyer

Large card with decorative background blobs (terracotta/10 top-right, rose/10 bottom-left, blurred).

**Layout:**
- Left side:
  - Title "Score du Foyer" (lg, bold) + info icon button (muted)
  - Score: "85" in 4xl extrabold + "/100" in xl muted
  - Trend: arrow_upward icon + "+5% depuis la sem. derniere" in sauge (or arrow_downward in rose if negative)
  - Coach message: short text in muted (sm)
- Right side:
  - Circular gauge (112px) with terracotta stroke on gray100 track
  - Balance icon centered inside gauge

**Data:** Reuses existing `useHouseholdScore()` hook. Score, delta, and message come from weekly stats.

### 4. Two-Column Grid

#### 4a. Equite des Taches

- Title: "Equite des Taches" (sm, bold, center)
- Donut chart: two segments (terracotta for user, prune for partner)
- Legend below: colored dot + name + percentage for each member
- Uses existing task distribution data from `useTaskStats()`

#### 4b. Charge Mentale

- Title: "Charge Mentale" (sm, bold, center)
- Large text showing level: "Elevee" / "Moyenne" / "Faible"
  - Elevee: rose color
  - Moyenne: miel color
  - Faible: sauge color
- Subtitle: "Focus sur {name} cette semaine" in muted
- Progress bar: colored by level, on gray100 track
- Uses existing TLX data from `useTlxSummary()`

### 5. Taches a venir

- Header: "Taches a venir" (xl, bold) + "Voir tout" button in terracotta
- List of next 3-5 upcoming tasks (not just today, includes tomorrow+)
- Each task row:
  - Left: category icon in colored circle (terracotta/10, rose/10, etc.)
  - Middle: task title (sm, semibold) + date + assignee (xs, muted)
  - Right: empty circle checkbox (border gray200, 24px)
- Tap checkbox → marks task complete (optimistic update)
- "Voir tout" navigates to tasks screen

**Data:** Uses existing `useTasks()` with filter for upcoming uncompleted tasks, sorted by due date, limit 5.

## File Changes

### Mobile — `apps/mobile/`

| Action | File | Description |
|---|---|---|
| EDIT | `app/(app)/dashboard/index.tsx` | Replace layout with new section order, new header |
| NEW | `src/components/dashboard/InsightsCarousel.tsx` | Horizontal FlatList of InsightCard |
| NEW | `src/components/dashboard/InsightCard.tsx` | Single insight card component |
| EDIT | `src/components/dashboard/ScoreHeroCard.tsx` | Refactor to Stitch layout (left text + right gauge + blobs) |
| NEW | `src/components/dashboard/TaskEquityCard.tsx` | Donut chart with member legend |
| EDIT | `src/components/dashboard/MentalLoadCard.tsx` | Adapt to show level text + progress bar |
| NEW | `src/components/dashboard/UpcomingTasksCard.tsx` | Task list with checkbox circles |

### Web — `apps/web/`

| Action | File | Description |
|---|---|---|
| EDIT | `src/app/(app)/dashboard/page.tsx` | Replace layout, remove sidebar, adopt vertical scroll |
| NEW | `src/components/dashboard/InsightsCarousel.tsx` | Horizontal scroll row of InsightCard |
| NEW | `src/components/dashboard/InsightCard.tsx` | Single insight card component |
| NEW | `src/components/dashboard/ScoreHeroCard.tsx` | Score card with gauge and blobs |
| NEW | `src/components/dashboard/TaskEquityCard.tsx` | Donut SVG with legend |
| NEW | `src/components/dashboard/MentalLoadCard.tsx` | Level text + progress bar |
| NEW | `src/components/dashboard/UpcomingTasksCard.tsx` | Task list with checkboxes |

### Backend

| Action | File | Description |
|---|---|---|
| NEW | `apps/mobile/supabase/functions/get-coaching-insights/index.ts` | Edge Function with deterministic rules |

### Shared

| Action | File | Description |
|---|---|---|
| EDIT | `packages/shared/src/types/index.ts` | Add `CoachingInsight` type |
| NEW | `packages/queries/src/hooks/useCoachingInsights.ts` | TanStack Query hook calling the Edge Function |

## Navigation unchanged

Bottom tabs remain: Accueil / Taches / Hub. No changes to `_layout.tsx`.

## Out of scope

- Dark mode (existing dark mode support carries over, no new work)
- LLM-based insights (future enhancement)
- Notification bell backend (uses existing notification count)
- Bottom nav redesign (separate initiative)
- Weekly review screen (unchanged)
