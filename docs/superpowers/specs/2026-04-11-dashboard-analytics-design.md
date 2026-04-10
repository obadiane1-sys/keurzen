# Dashboard Analytics Page — Design Spec

**Date:** 2026-04-11
**Scope:** New `/dashboard/analytics` page on mobile and web

---

## Context

The HouseholdScoreCard (mobile) and ScoreHeroCard (web) currently navigate to `/dashboard/weekly-review`, which is a retrospective AI-generated report. Users need a live, real-time analytics view of the current week's metrics. This new page serves that purpose while weekly-review remains the AI report.

## Navigation

- **HouseholdScoreCard** (mobile) `onPress` → `/(app)/dashboard/analytics`
- **ScoreHeroCard** (web) `onClick` → `/dashboard/analytics`
- Header: back button + title "Analyse de la semaine"
- Link to weekly-review remains accessible via a "Voir le rapport IA" button at the bottom

## Page Structure — 6 Sections

### 1. Score du foyer (hero)

- Large circular gauge: 160px mobile, 140px web
- Numeric score centered + level label (Fragile < 40 / A surveiller < 60 / Equilibre < 80 / Excellent >= 80)
- 4 sub-indicators in a row below:
  - Tasks completed (count)
  - Balance score (%)
  - Average TLX (0-100)
  - Streak days (count)
- Each sub-indicator: icon + value + label

### 2. Equite des taches

- Card titled "Repartition des taches"
- Horizontal stacked bar by member (color = `member.color`)
- Below the bar: list of members with:
  - Name, task count, actual %, expected %, delta
  - Visual indicator: sauge (balanced), miel (watch), rose (imbalanced)
- Delta thresholds: |delta| < 10pp → sauge, < 20pp → miel, >= 20pp → rose

### 3. Equite du temps

- Same layout as section 2 but for logged minutes
- Card titled "Repartition du temps"
- Same delta thresholds and color coding

### 4. TLX detaille

- Card titled "Charge mentale (TLX)"
- Global score with compact gauge (80px) + delta vs previous week (arrow + percentage)
- 6 horizontal dimension bars (0-100):
  - mental_demand, physical_demand, temporal_demand, effort, frustration, performance
  - Labels in French: Exigence mentale, Exigence physique, Pression temporelle, Effort, Frustration, Performance
- Bar color by threshold: sauge (<40), miel (40-70), rose (>70)
- Empty state: mascot + "Remplissez le TLX pour voir votre charge mentale" + CTA button

### 5. Coaching insights

- Card titled "Conseils du coach"
- Reuses existing `InsightCard` component
- Stacked list of insight cards (icon + type badge + message)
- Fallback when no insights: "Tout va bien" card

### 6. Tendances (4 semaines)

- Card titled "Evolution sur 4 semaines"
- 2 line charts side by side (or stacked on mobile):
  - Household score trend (4 data points)
  - Average TLX trend (4 data points)
- X axis: week labels ("S12", "S13", etc.)
- Y axis: 0-100
- Libraries: `victory-native` (mobile), `recharts` (web — new dependency)
- Empty state if < 2 weeks of data: "Les tendances apparaitront apres 2 semaines d'utilisation"

## Data Layer

### Existing hooks (no changes needed)

| Hook | Package | Purpose |
|------|---------|---------|
| `useWeeklyBalance()` | `@keurzen/queries` | Member balances for current week |
| `useCurrentTlx()` | `@keurzen/queries` | Current week TLX entry |
| `useTlxHistory(4)` | `@keurzen/queries` | Past 4 TLX entries |
| `useTlxDelta()` | `@keurzen/queries` | TLX delta vs previous week |
| `useCurrentWeekStats()` | `@keurzen/queries` | Weekly stats per member |
| `useCoachingInsights()` | `@keurzen/queries` | Coaching insights from edge function |
| `useTasks()` | `@keurzen/queries` | Task counts |
| `useHouseholdStreak()` | mobile queries | Streak days |

### New hook

`useAnalyticsTrends(weeks: number)` in `packages/queries/src/hooks/useAnalyticsTrends.ts`:
- Fetches `weekly_stats` for the household over the last N weeks (grouped by week)
- Fetches `tlx_entries` for the household over the last N weeks
- Returns: `{ weekLabels: string[], scores: number[], tlxScores: number[] }`
- Uses `useHouseholdStore` for household_id

## States

- **Loading:** Skeleton cards per section (no full-page spinner)
- **Empty:** Contextual message per section with appropriate empty state
- **Error:** Discrete error message per section (no global crash)

## Design System

- Palette Cafe Cosy: terracotta CTAs, sauge success, miel warnings, rose alerts, prune TLX
- Typography: Nunito (regular/medium/semibold/bold)
- Cards: white `#FFFDF9`, border `#E8DFD5`, rounded 12-16px
- Shadows: warm brown, opacity 0.04-0.08
- Touch targets >= 44px
- No blue, no pure gray, no gradients

## Files to Create

| Platform | File | Purpose |
|----------|------|---------|
| Mobile | `apps/mobile/app/(app)/dashboard/analytics.tsx` | Analytics screen |
| Web | `apps/web/src/app/(app)/dashboard/analytics/page.tsx` | Analytics page |
| Shared | `packages/queries/src/hooks/useAnalyticsTrends.ts` | Trends data hook |
| Mobile | `apps/mobile/src/components/analytics/ScoreHeroSection.tsx` | Score hero block |
| Mobile | `apps/mobile/src/components/analytics/EquityCard.tsx` | Reusable equity card (tasks + time) |
| Mobile | `apps/mobile/src/components/analytics/TlxDetailSection.tsx` | TLX detail block |
| Mobile | `apps/mobile/src/components/analytics/TrendsSection.tsx` | Charts block |
| Web | `apps/web/src/components/analytics/ScoreHeroSection.tsx` | Score hero block |
| Web | `apps/web/src/components/analytics/EquityCard.tsx` | Reusable equity card |
| Web | `apps/web/src/components/analytics/TlxDetailSection.tsx` | TLX detail block |
| Web | `apps/web/src/components/analytics/TrendsSection.tsx` | Charts block |

## Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx` | Navigate to `analytics` instead of `weekly-review` |
| `apps/web/src/components/dashboard/ScoreHeroCard.tsx` | Navigate to `/dashboard/analytics` instead of `/dashboard/weekly-review` |
| `packages/queries/src/index.ts` | Export `useAnalyticsTrends` |

## New Dependency

- `recharts` in `apps/web/package.json` (for trend charts)
