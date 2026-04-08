# Dashboard Redesign — Bevel-Inspired Hybrid

**Date:** 2026-04-05
**Status:** Approved
**Approach:** B — Bevel + Keurzen Hybrid

## Overview

Redesign the Keurzen dashboard (mobile + web) inspired by the Bevel health app's visual language: clean cards, conic-gradient circular gauges, status pills, and a narrative summary card. The existing "Cafe Cosy" palette and tokens are preserved — only the layout, visual hierarchy, and component structure change.

## Sections (top to bottom)

### 1. Header

- **Left:** "Aujourd'hui, {date}" with a dropdown chevron (decorative, no action for now)
- **Right:** User avatar (image or initial fallback in terracotta circle), taps to profile
- Notification bell removed from header — notification count is accessible via tab bar or settings
- Household name moves to a status pill (section 2)

### 2. Status Pills

Horizontal scrollable row of pill-shaped badges:

- **Foyer pill:** green dot + household name (always visible)
- **Today pill:** clipboard icon + "{n} taches aujourd'hui" (always visible)
- **Overdue pill:** red dot + "{n} en retard" — red tinted background + red border, only shown when overdue > 0

Styling: white bg, borderRadius 20, soft shadow, 12px font. Overdue pill uses `Colors.rose + '12'` bg and `Colors.rose + '30'` border.

### 3. Three Circular Gauges

Single white card (borderRadius 20, Shadows.card) containing 3 gauges side by side:

| Gauge | Data source | Color | Calculation |
|-------|------------|-------|-------------|
| TLX | `useCurrentTlx()` | `Colors.prune` (#9B8AA8) | score / 100 → degrees |
| Balance | `useWeeklyBalance()` | `Colors.sauge` (#8BA888) | current user's tasksShare → percentage |
| Semaine | `useTasks()` | `Colors.miel` (#D4A959) | done / (done + active) this week → percentage |

Each gauge: 80x80px circle, conic-gradient fill from 0deg to (value/max * 360)deg in the gauge color, remaining in `Colors.gray100`. Inner white circle (64x64px) with the value in bold + optional "/100" subtitle for TLX. Label below in `Colors.textSecondary`.

**Empty state:** When no TLX entry exists, show "—" in TLX gauge. When no tasks, show "0%" for Balance and Semaine.

### 4. Narrative Card

White card with:
- Left: sparkle icon + bold title (contextual)
- Right: expand chevron (decorative)
- Body: 1-2 sentence summary in `Colors.textSecondary`, lineHeight 1.6

**Narrative logic (generated client-side):**

| Condition | Title | Body template |
|-----------|-------|---------------|
| TLX delta < -5 | "Belle semaine en cours" | "Tu as complete {done} taches et ta charge mentale a baisse de {abs(delta)} points." |
| TLX delta > 5 | "Semaine chargee" | "Ta charge mentale a augmente de {delta} points. {overdueCount > 0 ? 'Il reste {overdueCount} tache(s) en retard.' : 'Prends un moment pour toi.'}" |
| No TLX | "Bienvenue" | "Remplis le questionnaire TLX pour suivre ta charge mentale cette semaine." |
| Default | "En bonne voie" | "Tu as complete {done} taches cette semaine. Continue comme ca !" |

### 5. Charge Mentale Section

Section label: "CHARGE MENTALE" (overline style, uppercase, letter-spacing 1.2px).

White card containing:
- **Top row:** green/red dot + "Score TLX cette semaine" + arrow icon (taps to TLX screen)
- **Stats row:** 3 values side by side — Max (rose), Min (sauge), Moy. (miel) — these are the user's TLX sub-dimension extremes from `useCurrentTlx()` (mental_demand as Max, performance as Min, weighted average as Moy). Next to them: mini conic-gradient gauge (52x52) showing the average.
- **Energy bar:** lightning icon + horizontal bar (10px height, borderRadius 5, gradient from sauge → miel → prune) filled to score%, + score label

**When no TLX entry exists:** Show a CTA "Evaluez votre charge mentale" with a pulse icon and chevron, linking to the TLX questionnaire.

### 6. Taches du Jour

Section header row: "TACHES DU JOUR" label + "Tout voir" link (terracotta).

White card with up to 4 tasks:
- Each row: priority dot (8px, color by priority) + title (13px semibold) + assignee name (11px muted)
- Divider: 1px `Colors.borderLight` between rows
- Tapping a task navigates to tasks screen

**Empty state:** "Aucune tache prevue aujourd'hui" centered in muted text.

### 7. Repartition Semaine

Section label: "REPARTITION CETTE SEMAINE".

White card with one row per household member:
- Member color dot (10px) + name (13px semibold) + progress bar (6px height, member color fill) + percentage label
- Data from `useWeeklyBalance()`

**Empty state:** "Pas encore de donnees cette semaine" centered.

### 8. Termine Recemment

Section label: "TERMINE RECEMMENT".

White card with up to 5 completed tasks:
- Each row: checkmark icon (sauge) + task title (13px, textSecondary) + date (11px, muted, DD/MM format)
- Dividers between rows

**Empty state:** "Aucune tache terminee cette semaine" centered.

### 9. Rapport Hebdo

Section label: "RAPPORT DE LA SEMAINE".

White card, single row:
- Chart icon + "Semaine du {weekStart}" title + subtitle "{totalTasks} taches · {memberCount} membres · {balanceStatus}" + arrow chevron
- Taps to weekly report screen
- Uses existing `WeeklyReportCard` component (mobile) / `WeeklyReportSection` (web)

## New Components

### `CircularGauge` (mobile: RN, web: CSS)

Props: `value: number`, `max: number`, `color: string`, `size?: number`, `label: string`, `subtitle?: string`

Renders a conic-gradient circular gauge. On mobile, uses `react-native-svg` for the arc (conic-gradient not natively supported in RN). On web, uses CSS conic-gradient.

### `StatusPill`

Props: `icon?: ReactNode`, `dot?: string`, `label: string`, `variant?: 'default' | 'alert'`

Pill-shaped badge with optional colored dot or icon.

### `NarrativeCard`

Props: none (derives all data from hooks internally)

Generates the contextual summary based on the narrative logic table above.

### `TlxDetailCard`

Props: `currentTlx`, `tlxDelta` (same as current)

The Bevel-style charge mentale section with Max/Min/Moy + mini gauge + energy bar.

## Files to Modify

### Mobile (`apps/mobile/`)

| File | Action |
|------|--------|
| `app/(app)/dashboard/index.tsx` | Rewrite — new layout with all 9 sections |
| `src/components/dashboard/CircularGauge.tsx` | Create — SVG circular gauge component |
| `src/components/dashboard/StatusPill.tsx` | Create — pill badge component |
| `src/components/dashboard/NarrativeCard.tsx` | Create — contextual summary card |
| `src/components/dashboard/TlxDetailCard.tsx` | Create — charge mentale section |

Components to keep as-is: `WeeklyReportCard.tsx`, `WeeklyBalanceCard.tsx` (may refactor inline).

Components no longer needed after redesign: `KPICard.tsx`, `AlertCard.tsx`, `MentalLoadCard.tsx`, `DecorativeBlobs.tsx`, `Icons.tsx` (remove if unused elsewhere).

### Web (`apps/web/`)

| File | Action |
|------|--------|
| `src/app/(app)/dashboard/page.tsx` | Rewrite — mirror mobile layout |
| `src/components/dashboard/CircularGauge.tsx` | Create — CSS conic-gradient gauge |
| `src/components/dashboard/StatusPills.tsx` | Create — pill badges row |
| `src/components/dashboard/NarrativeCard.tsx` | Create — contextual summary |
| `src/components/dashboard/TlxDetailCard.tsx` | Create — charge mentale section |
| `src/components/ui/StatCard.tsx` | Remove import from dashboard (keep file, may be used elsewhere) |

Components to keep: `BalanceCard.tsx`, `TodayTasks.tsx`, `RecentlyDone.tsx`, `WeeklyReportSection.tsx` — refactor styling to match new design.

## Dependencies

- **Mobile:** `react-native-svg` (likely already installed for victory-native)
- **Web:** No new dependencies — CSS conic-gradient is sufficient

## Testing Plan

- Verify all 9 sections render with data
- Verify empty states for each section (no TLX, no tasks, no balance data)
- Verify narrative card generates correct message for each condition
- Verify gauge calculations (conic-gradient degrees)
- Verify navigation: avatar → profile, tasks → tasks screen, TLX card → TLX screen, rapport → weekly report
- Verify pull-to-refresh still works (mobile)
- Verify responsive layout on web (grid collapse on small screens)
- Verify overdue pill only shows when overdue > 0
