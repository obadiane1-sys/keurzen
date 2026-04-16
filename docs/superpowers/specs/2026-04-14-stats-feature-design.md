# Stats Feature — Design Spec

**Date:** 2026-04-14
**Branch:** feat/dashboard-v7-redesign (or new `feat/stats-feature`)
**Status:** Approved design, ready for implementation plan
**Platforms:** Mobile + Web (dual-platform, simultaneous)

---

## Intent

Deliver a production-grade Stats page on mobile and web, based on the Stitch "Executive Zen - Analytics" mockup layout, adapted to the Keurzen Lavender design system. Two tabs: **Moi** (personal stats) and **Foyer** (household stats), with two timeline buckets in V1: **Jour** and **Semaine**. The existing placeholder at `apps/mobile/app/(app)/stats/index.tsx` is replaced, and a new web counterpart is created.

The feature exploits the existing data layer (`useWeeklyStats`, `useWeeklyBalance`, `useHouseholdScore`, `useAnalyticsTrends`, `useTasks`, `useCurrentTlx`) without introducing new Supabase migrations, RPCs, or tables.

## Non-goals (explicitly out of scope for V1)

- Mois / An timeline tabs — deferred to V2 (require new aggregation layer).
- Badges / Succès section — deferred to V2 (requires `achievements` table + unlock logic).
- Personal household score — we keep the score a household-level concept only; the "Moi" tab has no score hero.
- Removing / unifying the existing `dashboard/analytics.tsx` and `menu/analysis.tsx` screens — tracked as follow-up tech debt.
- Any new Supabase migrations, RPCs, Edge Functions, or DB schema changes.
- LLM-generated coach messages — V1 uses 3–4 hardcoded variants selected by state.
- Detox / Playwright E2E tests for this feature.

## Scope decisions (locked)

| Question | Decision |
|---|---|
| Platforms | Mobile + Web, same PR |
| Timelines V1 | Jour + Semaine only (2 buttons rendered) |
| "Moi" tab score | No score hero in "Moi" — only 4 KPIs |
| "Moi" tab répartition section | Not present — répartition belongs to "Foyer" only |
| "Moi" tab badges | Not rendered in V1 |
| "Foyer" tab trend chart | Included (exploits existing `useAnalyticsTrends`) |
| Nav entry point | Existing mobile tab bar slot (already labelled "Stats"); web sidebar entry to verify/add |
| Replace `/stats` placeholder only | Yes — leave `dashboard/analytics.tsx` and `menu/analysis.tsx` untouched |

## Information architecture

### Tab "Moi" (personal)

- **Header:** tabs Moi/Foyer + timeline Jour/Semaine
- **4 KPI grid (2×2):**
  - **Tâches complétées** — count of user's tasks with `status = 'done'` in period
  - **Série** — consecutive days with ≥1 completed task by this user (streak)
  - **Retard** — user's tasks with `due_date < today AND status != 'done'`
  - **Efficacité** — % of user's tasks completed on time over the period (`completed_at <= due_date`)
- **Empty state** if no tasks at all in period → mascot + message

### Tab "Foyer" (household)

- **Header:** same
- **ScoreHero:**
  - Large household score from `useHouseholdScore`
  - Delta vs previous period
  - Coach sentence (1 of 4 hardcoded variants based on state: balanced / watch / unbalanced / low-activity)
- **4 KPI grid (2×2):**
  - **Tâches complétées** — household total done in period
  - **Minutes totales** — sum of minutes tracked in period
  - **Retard** — household total overdue count
  - **Équilibre** — `100 - max(|tasksDelta|) * 100` (0–100 %)
- **Répartition:** member list from `useWeeklyBalance`, each with avatar, name, % share, lavender bar, qualitative label (Charge élevée / Équilibre idéal / Sous-chargé)
- **Tendance:** mini bar chart, 4 points
  - Period = Semaine → last 4 ISO weeks, from `useAnalyticsTrends(4)`
  - Period = Jour → last 7 days (new lightweight client-side aggregation from `useTasks`)
- **Empty state** if no data

## Data layer

New shared hook: `packages/queries/src/hooks/useStats.ts`

```ts
export type StatsScope = 'me' | 'household';
export type StatsPeriod = 'day' | 'week';

export interface StatsKpis {
  completedTasks: number;
  // Scope 'me'
  streakDays?: number;
  overdueCount?: number;
  efficiencyPct?: number;
  // Scope 'household'
  totalMinutes?: number;
  balancePct?: number;
}

export interface StatsTrendPoint {
  label: string;
  value: number; // completed tasks on that bucket
}

export interface StatsResult {
  score: HouseholdScoreResult | null; // null when scope='me'
  scoreDelta: number | null;           // percentage delta vs previous period
  coachMessage: string | null;         // null when scope='me'
  kpis: StatsKpis;
  members: MemberBalance[];            // empty when scope='me'
  trend: StatsTrendPoint[];
  isLoading: boolean;
  isEmpty: boolean;
}

export function useStats(args: { scope: StatsScope; period: StatsPeriod }): StatsResult;
```

- Internally composes existing hooks (`useTasks`, `useWeeklyBalance`, `useHouseholdScore`, `useCurrentTlx`, `useAnalyticsTrends`).
- Scope filtering (`me` vs `household`) happens in the hook, not in components.
- `coachMessage` picked from a small pure function `pickCoachMessage(state)` in `@keurzen/shared`.
- All date math uses `dayjs` + `isoWeek` plugin (already in use).

No backend changes. No new queries added to the Supabase client that aren't already used elsewhere.

## Shared utilities

Add to `@keurzen/shared`:

- `pickCoachMessage({ level, hasData }): string` — returns 1 of 4 French sentences.
- `computeStreakDays(tasks: Task[], userId: string): number` — pure, testable.
- `computeEfficiency(tasks: Task[], userId: string, period): number` — pure, testable.

These are pure and unit-testable without touching Supabase.

## UI components

Mirror in both platforms. No cross-platform UI package in this PR (follows current Keurzen convention).

Mobile: `apps/mobile/src/components/stats/`
Web: `apps/web/src/components/stats/`

| Component | Mobile | Web | Notes |
|---|---|---|---|
| `StatsHeader` | ✅ | ✅ | tabs Moi/Foyer + timeline buttons |
| `ScoreHero` | ✅ | ✅ | gros chiffre + delta + coach sentence |
| `KpiGrid` | ✅ | ✅ | 2×2 grid, accepts array of `{label, value, unit?}` |
| `MemberBalanceList` | ✅ | ✅ | avatar + bar + qualitative label |
| `TrendChart` | ✅ `victory-native` | ✅ inline SVG (no new dep) or `recharts` if already present — verify at impl time | bar chart, 4–7 points |
| `StatsEmptyState` | ✅ | ✅ | mascot + message |

Screens are thin orchestrators:

- `apps/mobile/app/(app)/stats/index.tsx` — replaces placeholder
- `apps/web/src/app/(app)/stats/page.tsx` — new file (verify dir exists at impl time)

Screen state: local `useState` for `scope` and `period`, passed to `useStats`.

## Design system (Lavender)

The Stitch mockup is a **layout reference only**. Colors, typography and spacing come from the existing Keurzen Lavender design system. Do not import any "zen-slate" / "zen-accent" / Playfair Display tokens.

- Primary: `#967BB6`
- Surface: `#F3F0FF`
- Border: `#DCD7E8`
- Text: `#5F5475`
- Cards: `#F9F8FD`, radius 12–16px
- Typography: Nunito family
- Shadows: lavender, opacity 0.04–0.12
- Touch targets ≥ 44px (mobile)
- Flat UI — no gradients

Tokens from `apps/mobile/src/constants/tokens.ts` and `apps/web/src/app/globals.css` CSS variables. Never hardcode.

## States

Each screen must handle:

- **Loading:** skeleton variants of `ScoreHero`, `KpiGrid`, `MemberBalanceList`, `TrendChart`.
- **Empty:** `StatsEmptyState` if `isEmpty` is true (no tasks and no trend data in period).
- **Error:** toast + retry — use existing error handling pattern from other pages.
- **Partial data:** if `useWeeklyBalance` returns members but `useAnalyticsTrends` is empty (e.g. brand new household), show the sections we have and hide the trend chart gracefully, not a full empty state.

## Testing

**TDD order: tests first.**

- Unit: `pickCoachMessage`, `computeStreakDays`, `computeEfficiency` — pure functions, easy.
- Unit: `useStats` — mock underlying hooks, assert scope filtering, KPI calc, `isEmpty`.
- Component (RN Testing Library / React Testing Library):
  - `KpiGrid` renders values correctly
  - `MemberBalanceList` shows all members with correct %
  - `StatsEmptyState` renders when isEmpty=true
  - Screen switches scope/period via header interactions
- No new E2E.

Coverage target: 80%+ on the new hook and pure utilities. Components: smoke + interaction tests.

## Files to create / modify

### Create

- `packages/queries/src/hooks/useStats.ts`
- `packages/queries/src/hooks/useStats.test.ts`
- `packages/shared/src/utils/statsHelpers.ts` (pickCoachMessage, computeStreakDays, computeEfficiency)
- `packages/shared/src/utils/statsHelpers.test.ts`
- `apps/mobile/src/components/stats/StatsHeader.tsx`
- `apps/mobile/src/components/stats/ScoreHero.tsx`
- `apps/mobile/src/components/stats/KpiGrid.tsx`
- `apps/mobile/src/components/stats/MemberBalanceList.tsx`
- `apps/mobile/src/components/stats/TrendChart.tsx`
- `apps/mobile/src/components/stats/StatsEmptyState.tsx`
- `apps/web/src/components/stats/StatsHeader.tsx`
- `apps/web/src/components/stats/ScoreHero.tsx`
- `apps/web/src/components/stats/KpiGrid.tsx`
- `apps/web/src/components/stats/MemberBalanceList.tsx`
- `apps/web/src/components/stats/TrendChart.tsx`
- `apps/web/src/components/stats/StatsEmptyState.tsx`
- `apps/web/src/app/(app)/stats/page.tsx` (verify path at impl)

### Modify

- `apps/mobile/app/(app)/stats/index.tsx` — replace placeholder with real screen
- `packages/queries/src/index.ts` — export `useStats`
- `packages/shared/src/utils/index.ts` — export stats helpers
- Web sidebar / nav — add Stats entry if missing (to verify at impl)

### Not touched

- `apps/mobile/app/(app)/dashboard/analytics.tsx`
- `apps/mobile/app/(app)/menu/analysis.tsx`
- Any Supabase migrations / functions
- Tab bar mobile (Stats slot already present)

## Risks

- **Web trend chart dep:** if `recharts` or equivalent isn't in `apps/web/package.json`, we'd either add it or hand-roll an SVG. Decision at implementation time — prefer hand-rolled SVG to avoid a new dep for a 4-bar chart.
- **`useAnalyticsTrends` double-counting:** hook already guards against duplicate `user_id` per week. Reuse as-is.
- **Streak computation cost:** naive implementation scans all user tasks. If `useTasks` returns large arrays, memoize. Acceptable for V1 household sizes.
- **Empty data UX:** new households will see the empty state — make sure the mascot copy is warm, not sterile.
- **Parity drift:** mobile and web components may drift visually. Single spec, single PR mitigates this.

## Verification before shipping (required by CLAUDE.md)

1. `npm run lint` — clean
2. `npm run test` — all new tests pass
3. Manual mobile scenario:
   - Open app → tap Stats tab → Moi Semaine shows 4 KPIs
   - Switch to Foyer → score hero, répartition, trend chart all render
   - Switch to Jour → values update
   - Brand new household → empty state renders
4. Manual web scenario: same, via web sidebar or direct URL
5. Verdict in the PR description: **prêt à tester** ou **pas encore prêt**
