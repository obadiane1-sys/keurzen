# Stats Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-grade Stats page on mobile and web with two tabs (Moi / Foyer) and two timelines (Jour / Semaine), built entirely on existing Supabase data.

**Architecture:** A single shared hook `useStats({scope, period})` orchestrates existing hooks (`useTasks`, `useWeeklyBalance`, `useHouseholdScore`, `useAnalyticsTrends`, `useCurrentTlx`) and returns a normalized `StatsResult` consumed by thin mobile and web screens. UI components are mirrored 1:1 between platforms under `src/components/stats/`. Pure calculation helpers live in `@keurzen/shared`. No migrations, no RPCs.

**Tech Stack:** TypeScript strict, React Native 0.83 / Expo SDK 55, Next.js App Router, TanStack Query v5, Zustand, dayjs (+ isoWeek), Tailwind + NativeWind (mobile), CSS variables (web), victory-native (mobile charts), inline SVG (web chart — no new dep), Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-04-14-stats-feature-design.md`

**Design system (Lavender — NEVER hardcode):**
- Primary `#967BB6` · PrimaryLight `#E5DBFF` · PrimarySurface `#F3F0FF`
- Text `#5F5475` · Card `#F9F8FD` · Border `#DCD7E8`
- Nunito (regular/medium/semibold/bold), radii 12–16px, shadow opacity 0.04–0.12
- Flat UI, no gradients, touch targets ≥ 44px
- Mobile tokens: `apps/mobile/src/constants/tokens.ts`
- Web tokens: CSS vars in `apps/web/src/app/globals.css`

**Types already available in `@keurzen/shared`:**
- `HouseholdScoreResult` (from `householdScore.ts`)
- `MemberBalance` (re-export via `useWeeklyStats.ts` — re-export from shared if not already)
- `Task` (canonical task type used in `useTasks`)

---

## File Structure

### Create

| File | Responsibility |
|---|---|
| `packages/shared/src/utils/statsHelpers.ts` | Pure functions: `computeStreakDays`, `computeEfficiency`, `pickCoachMessage`, `computeScoreDelta` |
| `packages/shared/src/utils/statsHelpers.test.ts` | Unit tests for above |
| `packages/queries/src/hooks/useStats.ts` | Orchestrator hook returning `StatsResult` |
| `packages/queries/src/hooks/useStats.test.ts` | Unit tests mocking underlying hooks |
| `apps/mobile/src/components/stats/StatsHeader.tsx` | Scope tabs + timeline buttons |
| `apps/mobile/src/components/stats/ScoreHero.tsx` | Household score + delta + coach sentence |
| `apps/mobile/src/components/stats/KpiGrid.tsx` | 2×2 KPI grid |
| `apps/mobile/src/components/stats/MemberBalanceList.tsx` | Member avatars + bar + qualitative label |
| `apps/mobile/src/components/stats/TrendChart.tsx` | Mini bar chart via victory-native |
| `apps/mobile/src/components/stats/StatsEmptyState.tsx` | Mascot + copy |
| `apps/web/src/components/stats/StatsHeader.tsx` | Same as mobile (web variant) |
| `apps/web/src/components/stats/ScoreHero.tsx` | Same (web variant) |
| `apps/web/src/components/stats/KpiGrid.tsx` | Same (web variant) |
| `apps/web/src/components/stats/MemberBalanceList.tsx` | Same (web variant) |
| `apps/web/src/components/stats/TrendChart.tsx` | Inline SVG bar chart |
| `apps/web/src/components/stats/StatsEmptyState.tsx` | Mascot + copy (web variant) |
| `apps/web/src/app/(app)/stats/page.tsx` | Web screen orchestrator |

### Modify

| File | Change |
|---|---|
| `packages/shared/src/utils/index.ts` | Export stats helpers |
| `packages/queries/src/index.ts` | Export `useStats` |
| `apps/mobile/app/(app)/stats/index.tsx` | Replace placeholder with full screen |
| `apps/web/src/components/layout/Sidebar.tsx` | Add `/stats` entry with `BarChart3` lucide icon |

### Not touched

- `apps/mobile/app/(app)/dashboard/analytics.tsx`
- `apps/mobile/app/(app)/menu/analysis.tsx`
- Any Supabase migration or function
- Mobile tab bar (Stats slot already present at `apps/mobile/app/(app)/_layout.tsx:13`)

---

## Types (shared across tasks — defined in Task 2)

```ts
// packages/queries/src/hooks/useStats.ts
export type StatsScope = 'me' | 'household';
export type StatsPeriod = 'day' | 'week';

export interface StatsKpi {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface StatsTrendPoint {
  label: string;
  value: number;
}

export interface StatsResult {
  scope: StatsScope;
  period: StatsPeriod;
  score: HouseholdScoreResult | null;
  scoreDelta: number | null;
  coachMessage: string | null;
  kpis: StatsKpi[];
  members: MemberBalance[];
  trend: StatsTrendPoint[];
  isLoading: boolean;
  isEmpty: boolean;
}

export function useStats(args: {
  scope: StatsScope;
  period: StatsPeriod;
}): StatsResult;
```

```ts
// packages/shared/src/utils/statsHelpers.ts
export type CoachLevel = 'balanced' | 'watch' | 'unbalanced' | 'low-activity';

export function computeStreakDays(
  tasks: { completed_at: string | null; assigned_to: string | null; status: string }[],
  userId: string,
  today: Date
): number;

export function computeEfficiency(
  tasks: { completed_at: string | null; due_date: string | null; status: string; assigned_to: string | null }[],
  userId: string,
  periodStart: Date,
  periodEnd: Date
): number; // 0-100 integer

export function pickCoachMessage(level: CoachLevel): string;

export function computeScoreDelta(
  currentScore: number,
  previousScore: number
): number; // percentage delta rounded
```

---

## Task 1: Pure helpers in @keurzen/shared (TDD)

**Files:**
- Create: `packages/shared/src/utils/statsHelpers.ts`
- Create: `packages/shared/src/utils/statsHelpers.test.ts`
- Modify: `packages/shared/src/utils/index.ts`

- [ ] **Step 1.1: Write the failing tests for `computeStreakDays`**

Create `packages/shared/src/utils/statsHelpers.test.ts`:

```ts
import {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
  computeScoreDelta,
} from './statsHelpers';

const USER = 'u1';

function task(opts: Partial<{ completed_at: string | null; assigned_to: string | null; status: string; due_date: string | null }>) {
  return {
    completed_at: null,
    assigned_to: USER,
    status: 'done',
    due_date: null,
    ...opts,
  };
}

describe('computeStreakDays', () => {
  const today = new Date('2026-04-14T12:00:00Z');

  it('returns 0 when user has no completed tasks', () => {
    expect(computeStreakDays([], USER, today)).toBe(0);
  });

  it('returns 1 when user completed a task today', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z' })];
    expect(computeStreakDays(tasks, USER, today)).toBe(1);
  });

  it('counts 3 consecutive days ending today', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z' }),
      task({ completed_at: '2026-04-13T09:00:00Z' }),
      task({ completed_at: '2026-04-12T09:00:00Z' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(3);
  });

  it('breaks streak on a missing day', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z' }),
      task({ completed_at: '2026-04-12T09:00:00Z' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(1);
  });

  it('ignores tasks from other users', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', assigned_to: 'other' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(0);
  });

  it('ignores tasks not done', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z', status: 'todo' })];
    expect(computeStreakDays(tasks, USER, today)).toBe(0);
  });
});

describe('computeEfficiency', () => {
  const start = new Date('2026-04-13T00:00:00Z');
  const end = new Date('2026-04-19T23:59:59Z');

  it('returns 0 when no tasks in period', () => {
    expect(computeEfficiency([], USER, start, end)).toBe(0);
  });

  it('returns 100 when every task is completed on time', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', due_date: '2026-04-15' }),
      task({ completed_at: '2026-04-16T09:00:00Z', due_date: '2026-04-16' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(100);
  });

  it('returns 50 when half the tasks are late', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', due_date: '2026-04-15' }),
      task({ completed_at: '2026-04-18T09:00:00Z', due_date: '2026-04-16' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(50);
  });

  it('ignores tasks outside the period', () => {
    const tasks = [
      task({ completed_at: '2026-04-10T09:00:00Z', due_date: '2026-04-10' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(0);
  });

  it('counts a task without a due date as on time', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z', due_date: null })];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(100);
  });
});

describe('pickCoachMessage', () => {
  it('returns a non-empty French string for each level', () => {
    for (const level of ['balanced', 'watch', 'unbalanced', 'low-activity'] as const) {
      const msg = pickCoachMessage(level);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('returns different messages for different levels', () => {
    const b = pickCoachMessage('balanced');
    const u = pickCoachMessage('unbalanced');
    expect(b).not.toBe(u);
  });
});

describe('computeScoreDelta', () => {
  it('returns 0 when previous is 0', () => {
    expect(computeScoreDelta(80, 0)).toBe(0);
  });

  it('returns positive percentage when score increased', () => {
    expect(computeScoreDelta(84, 80)).toBe(5);
  });

  it('returns negative when score decreased', () => {
    expect(computeScoreDelta(76, 80)).toBe(-5);
  });

  it('rounds to integer', () => {
    expect(computeScoreDelta(81, 80)).toBe(1);
  });
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

Run: `npx jest packages/shared/src/utils/statsHelpers.test.ts`
Expected: FAIL — `Cannot find module './statsHelpers'`

- [ ] **Step 1.3: Implement `statsHelpers.ts`**

Create `packages/shared/src/utils/statsHelpers.ts`:

```ts
import dayjs from 'dayjs';

export type CoachLevel = 'balanced' | 'watch' | 'unbalanced' | 'low-activity';

type StreakTask = {
  completed_at: string | null;
  assigned_to: string | null;
  status: string;
};

export function computeStreakDays(
  tasks: StreakTask[],
  userId: string,
  today: Date
): number {
  const doneDays = new Set<string>();
  for (const t of tasks) {
    if (t.assigned_to !== userId) continue;
    if (t.status !== 'done') continue;
    if (!t.completed_at) continue;
    doneDays.add(dayjs(t.completed_at).format('YYYY-MM-DD'));
  }

  let streak = 0;
  let cursor = dayjs(today);
  while (doneDays.has(cursor.format('YYYY-MM-DD'))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

type EfficiencyTask = {
  completed_at: string | null;
  due_date: string | null;
  status: string;
  assigned_to: string | null;
};

export function computeEfficiency(
  tasks: EfficiencyTask[],
  userId: string,
  periodStart: Date,
  periodEnd: Date
): number {
  const start = dayjs(periodStart);
  const end = dayjs(periodEnd);
  const mine = tasks.filter((t) => {
    if (t.assigned_to !== userId) return false;
    if (t.status !== 'done') return false;
    if (!t.completed_at) return false;
    const c = dayjs(t.completed_at);
    return (c.isSame(start) || c.isAfter(start)) && (c.isSame(end) || c.isBefore(end));
  });
  if (mine.length === 0) return 0;

  const onTime = mine.filter((t) => {
    if (!t.due_date) return true;
    return dayjs(t.completed_at!).isSame(dayjs(t.due_date), 'day')
      || dayjs(t.completed_at!).isBefore(dayjs(t.due_date).endOf('day'));
  });

  return Math.round((onTime.length / mine.length) * 100);
}

const COACH_MESSAGES: Record<CoachLevel, string> = {
  balanced: 'Un equilibre remarquable cette semaine.',
  watch: 'Attention, la balance commence a pencher.',
  unbalanced: 'La charge est desequilibree — il est temps d\'en parler.',
  'low-activity': 'Peu d\'activite cette periode — donnez-vous un nouvel elan.',
};

export function pickCoachMessage(level: CoachLevel): string {
  return COACH_MESSAGES[level];
}

export function computeScoreDelta(
  currentScore: number,
  previousScore: number
): number {
  if (previousScore === 0) return 0;
  return Math.round(((currentScore - previousScore) / previousScore) * 100);
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

Run: `npx jest packages/shared/src/utils/statsHelpers.test.ts`
Expected: PASS — all 15+ tests green.

- [ ] **Step 1.5: Export helpers from shared index**

Edit `packages/shared/src/utils/index.ts` — append at the bottom:

```ts
export {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
  computeScoreDelta,
} from './statsHelpers';
export type { CoachLevel } from './statsHelpers';
```

- [ ] **Step 1.6: Commit**

```bash
git add packages/shared/src/utils/statsHelpers.ts packages/shared/src/utils/statsHelpers.test.ts packages/shared/src/utils/index.ts
git commit -m "feat(shared): add stats helpers (streak, efficiency, coach, delta)"
```

---

## Task 2: `useStats` orchestrator hook (TDD)

**Files:**
- Create: `packages/queries/src/hooks/useStats.ts`
- Create: `packages/queries/src/hooks/useStats.test.ts`
- Modify: `packages/queries/src/index.ts`

- [ ] **Step 2.1: Write the failing test**

Create `packages/queries/src/hooks/useStats.test.ts`. This test mocks the underlying hooks to isolate the orchestration logic.

```ts
import { renderHook } from '@testing-library/react';
import { useStats } from './useStats';

jest.mock('./useTasks', () => ({ useTasks: jest.fn() }));
jest.mock('./useWeeklyStats', () => ({
  useWeeklyBalance: jest.fn(),
  useCurrentWeekStats: jest.fn(),
}));
jest.mock('./useHouseholdScore', () => ({ useHouseholdScore: jest.fn() }));
jest.mock('./useAnalyticsTrends', () => ({ useAnalyticsTrends: jest.fn() }));
jest.mock('./useTlx', () => ({ useCurrentTlx: jest.fn() }));
jest.mock('@keurzen/stores', () => ({
  useAuthStore: () => ({ session: { user: { id: 'u1' } } }),
  useHouseholdStore: () => ({ currentHousehold: { id: 'h1' }, members: [] }),
}));

import { useTasks } from './useTasks';
import { useWeeklyBalance } from './useWeeklyStats';
import { useHouseholdScore } from './useHouseholdScore';
import { useAnalyticsTrends } from './useAnalyticsTrends';
import { useCurrentTlx } from './useTlx';

const mockTasks = useTasks as jest.Mock;
const mockBalance = useWeeklyBalance as jest.Mock;
const mockScore = useHouseholdScore as jest.Mock;
const mockTrends = useAnalyticsTrends as jest.Mock;
const mockTlx = useCurrentTlx as jest.Mock;

function setupDefaults() {
  mockTasks.mockReturnValue({ data: [], isLoading: false });
  mockBalance.mockReturnValue({ members: [], isLoading: false });
  mockScore.mockReturnValue({
    score: { score: 0, level: 'balanced', dimensions: [] },
    isLoading: false,
  });
  mockTrends.mockReturnValue({ data: [], isLoading: false });
  mockTlx.mockReturnValue({ data: null, isLoading: false });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('useStats — scope=me', () => {
  it('returns empty state when user has no tasks', () => {
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.score).toBeNull();
    expect(result.current.members).toEqual([]);
  });

  it('counts only this users completed tasks', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
        { id: 't2', assigned_to: 'u2', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    const completed = result.current.kpis.find((k) => k.key === 'completed');
    expect(completed?.value).toBe(1);
  });

  it('exposes streak, overdue and efficiency KPIs', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    const keys = result.current.kpis.map((k) => k.key);
    expect(keys).toEqual(['completed', 'streak', 'overdue', 'efficiency']);
  });
});

describe('useStats — scope=household', () => {
  it('returns score and coach message', () => {
    mockScore.mockReturnValue({
      score: { score: 85, level: 'balanced', dimensions: [] },
      isLoading: false,
    });
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    expect(result.current.score?.score).toBe(85);
    expect(result.current.coachMessage).not.toBeNull();
  });

  it('returns 4 household KPIs with expected keys', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null, duration_minutes: 30 },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    const keys = result.current.kpis.map((k) => k.key);
    expect(keys).toEqual(['completed', 'minutes', 'overdue', 'balance']);
  });

  it('flags isEmpty=false when there are members even without tasks', () => {
    mockBalance.mockReturnValue({
      members: [{ userId: 'u1', name: 'Ouss', color: '#967BB6', avatarUrl: null, tasksShare: 1, minutesShare: 0, tasksDelta: 0, minutesDelta: 0, level: 'balanced' }],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    expect(result.current.members).toHaveLength(1);
  });
});

describe('useStats — loading', () => {
  it('propagates loading from underlying hooks', () => {
    mockTasks.mockReturnValue({ data: [], isLoading: true });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    expect(result.current.isLoading).toBe(true);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npx jest packages/queries/src/hooks/useStats.test.ts`
Expected: FAIL — `Cannot find module './useStats'`

- [ ] **Step 2.3: Implement `useStats.ts`**

Create `packages/queries/src/hooks/useStats.ts`:

```ts
import { useMemo } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
  type HouseholdScoreResult,
} from '@keurzen/shared';
import type { CoachLevel } from '@keurzen/shared';
import { useTasks } from './useTasks';
import { useWeeklyBalance, type MemberBalance } from './useWeeklyStats';
import { useHouseholdScore } from './useHouseholdScore';
import { useAnalyticsTrends } from './useAnalyticsTrends';
import { useCurrentTlx } from './useTlx';

dayjs.extend(isoWeek);

export type StatsScope = 'me' | 'household';
export type StatsPeriod = 'day' | 'week';

export interface StatsKpi {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface StatsTrendPoint {
  label: string;
  value: number;
}

export interface StatsResult {
  scope: StatsScope;
  period: StatsPeriod;
  score: HouseholdScoreResult | null;
  scoreDelta: number | null;
  coachMessage: string | null;
  kpis: StatsKpi[];
  members: MemberBalance[];
  trend: StatsTrendPoint[];
  isLoading: boolean;
  isEmpty: boolean;
}

function getPeriodBounds(period: StatsPeriod): { start: Date; end: Date } {
  const now = dayjs();
  if (period === 'day') {
    return { start: now.startOf('day').toDate(), end: now.endOf('day').toDate() };
  }
  return {
    start: now.startOf('isoWeek').toDate(),
    end: now.endOf('isoWeek').toDate(),
  };
}

function filterTasksInPeriod<T extends { completed_at: string | null; status: string }>(
  tasks: T[],
  start: Date,
  end: Date
): T[] {
  return tasks.filter((t) => {
    if (t.status !== 'done' || !t.completed_at) return false;
    const c = dayjs(t.completed_at);
    return !c.isBefore(start) && !c.isAfter(end);
  });
}

function coachLevelFromScore(
  score: HouseholdScoreResult | null,
  totalTasks: number
): CoachLevel {
  if (totalTasks < 3) return 'low-activity';
  if (!score) return 'balanced';
  if (score.level === 'unbalanced') return 'unbalanced';
  if (score.level === 'watch') return 'watch';
  return 'balanced';
}

export function useStats(args: {
  scope: StatsScope;
  period: StatsPeriod;
}): StatsResult {
  const { scope, period } = args;
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';

  const tasksQ = useTasks();
  const balanceQ = useWeeklyBalance();
  const scoreQ = useHouseholdScore();
  const trendsQ = useAnalyticsTrends(4);
  const tlxQ = useCurrentTlx();

  const isLoading =
    !!tasksQ.isLoading ||
    !!balanceQ.isLoading ||
    !!scoreQ.isLoading ||
    !!trendsQ.isLoading ||
    !!tlxQ.isLoading;

  return useMemo<StatsResult>(() => {
    const allTasks = (tasksQ.data as any[]) ?? [];
    const { start, end } = getPeriodBounds(period);
    const today = new Date();

    const scopedTasks = scope === 'me'
      ? allTasks.filter((t: any) => t.assigned_to === userId)
      : allTasks;

    const tasksInPeriod = filterTasksInPeriod(scopedTasks, start, end);
    const overdueCount = scopedTasks.filter(
      (t: any) => t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(today, 'day')
    ).length;

    let kpis: StatsKpi[] = [];
    if (scope === 'me') {
      const streak = computeStreakDays(allTasks as any, userId, today);
      const efficiency = computeEfficiency(allTasks as any, userId, start, end);
      kpis = [
        { key: 'completed', label: 'Completees', value: tasksInPeriod.length },
        { key: 'streak', label: 'Serie', value: streak, unit: 'j' },
        { key: 'overdue', label: 'Retard', value: overdueCount },
        { key: 'efficiency', label: 'Efficacite', value: efficiency, unit: '%' },
      ];
    } else {
      const totalMinutes = tasksInPeriod.reduce(
        (sum: number, t: any) => sum + (t.duration_minutes ?? 0),
        0
      );
      const maxImbalance = balanceQ.members.length > 0
        ? Math.max(...balanceQ.members.map((m: MemberBalance) => Math.abs(m.tasksDelta)))
        : 0;
      const balancePct = Math.max(0, Math.round((1 - maxImbalance) * 100));
      kpis = [
        { key: 'completed', label: 'Completees', value: tasksInPeriod.length },
        { key: 'minutes', label: 'Minutes', value: totalMinutes },
        { key: 'overdue', label: 'Retard', value: overdueCount },
        { key: 'balance', label: 'Equilibre', value: balancePct, unit: '%' },
      ];
    }

    const trend: StatsTrendPoint[] = scope === 'household' && period === 'week'
      ? ((trendsQ.data as any[]) ?? []).map((w) => ({
          label: w.weekLabel,
          value: w.totalTasks,
        }))
      : [];

    const score = scope === 'household' ? scoreQ.score ?? null : null;
    const coachMessage = scope === 'household'
      ? pickCoachMessage(coachLevelFromScore(score, tasksInPeriod.length))
      : null;

    const isEmpty =
      tasksInPeriod.length === 0 &&
      (scope === 'me' || balanceQ.members.length === 0);

    return {
      scope,
      period,
      score,
      scoreDelta: null, // V1: no previous-period comparison; future enhancement
      coachMessage,
      kpis,
      members: scope === 'household' ? balanceQ.members : [],
      trend,
      isLoading,
      isEmpty,
    };
  }, [scope, period, tasksQ.data, balanceQ.members, scoreQ.score, trendsQ.data, userId, isLoading]);
}
```

- [ ] **Step 2.4: Run tests to verify they pass**

Run: `npx jest packages/queries/src/hooks/useStats.test.ts`
Expected: PASS — all describe blocks green.

- [ ] **Step 2.5: Export from queries index**

Edit `packages/queries/src/index.ts` — append:

```ts
export * from './hooks/useStats';
```

- [ ] **Step 2.6: Run full test suite to catch type regressions**

Run: `npm run test` (from repo root)
Expected: PASS — no broken tests elsewhere.

- [ ] **Step 2.7: Commit**

```bash
git add packages/queries/src/hooks/useStats.ts packages/queries/src/hooks/useStats.test.ts packages/queries/src/index.ts
git commit -m "feat(queries): add useStats orchestrator hook"
```

---

## Task 3: Mobile shared UI components (stateless)

All components in this task are stateless presentational. They consume props only — no hooks beyond React.

**Files:**
- Create: `apps/mobile/src/components/stats/StatsHeader.tsx`
- Create: `apps/mobile/src/components/stats/ScoreHero.tsx`
- Create: `apps/mobile/src/components/stats/KpiGrid.tsx`
- Create: `apps/mobile/src/components/stats/MemberBalanceList.tsx`
- Create: `apps/mobile/src/components/stats/TrendChart.tsx`
- Create: `apps/mobile/src/components/stats/StatsEmptyState.tsx`

- [ ] **Step 3.1: `StatsHeader.tsx`**

```tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import type { StatsScope, StatsPeriod } from '@keurzen/queries';

interface Props {
  scope: StatsScope;
  period: StatsPeriod;
  onScopeChange: (s: StatsScope) => void;
  onPeriodChange: (p: StatsPeriod) => void;
}

export function StatsHeader({ scope, period, onScopeChange, onPeriodChange }: Props) {
  return (
    <View className="px-6 pt-4">
      <View className="flex-row bg-[#F3F0FF] rounded-xl p-1 mb-6">
        {(['me', 'household'] as const).map((s) => {
          const active = scope === s;
          return (
            <Pressable
              key={s}
              onPress={() => onScopeChange(s)}
              className={`flex-1 py-3 rounded-lg ${active ? 'bg-white' : ''}`}
              style={active ? { shadowColor: '#967BB6', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : undefined}
              accessibilityRole="button"
              accessibilityLabel={s === 'me' ? 'Stats personnelles' : 'Stats du foyer'}
            >
              <Text
                className="text-center uppercase"
                style={{ fontFamily: 'Nunito_700Bold', fontSize: 11, color: active ? '#5F5475' : 'rgba(95,84,117,0.6)', letterSpacing: 1.2 }}
              >
                {s === 'me' ? 'Moi' : 'Foyer'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row border-b border-[#DCD7E8]">
        {(['day', 'week'] as const).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => onPeriodChange(p)}
              className="flex-1 py-3"
              accessibilityRole="button"
              accessibilityLabel={p === 'day' ? 'Jour' : 'Semaine'}
            >
              <Text
                className="text-center uppercase"
                style={{
                  fontFamily: active ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
                  fontSize: 10,
                  color: active ? '#5F5475' : 'rgba(95,84,117,0.5)',
                  letterSpacing: 1.5,
                }}
              >
                {p === 'day' ? 'Jour' : 'Semaine'}
              </Text>
              {active && (
                <View className="h-[2px] bg-[#967BB6] mt-2 mx-6 rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 3.2: `ScoreHero.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';

interface Props {
  score: number;
  delta: number | null;
  coachMessage: string | null;
}

export function ScoreHero({ score, delta, coachMessage }: Props) {
  return (
    <View className="items-center py-8">
      <Text
        className="uppercase"
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, color: 'rgba(95,84,117,0.5)' }}
      >
        Score global
      </Text>
      <View className="flex-row items-baseline mt-3">
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 88, color: '#5F5475', lineHeight: 96 }}>
          {score}
        </Text>
        {delta !== null && delta !== 0 && (
          <Text
            className="ml-2"
            style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: delta >= 0 ? '#81C784' : '#E07A5F' }}
          >
            {delta > 0 ? '+' : ''}{delta}%
          </Text>
        )}
      </View>
      {coachMessage && (
        <Text
          className="mt-4 italic text-center px-4"
          style={{ fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(95,84,117,0.7)' }}
        >
          « {coachMessage} »
        </Text>
      )}
      <View className="w-10 h-[1px] bg-[#DCD7E8] mt-6" />
    </View>
  );
}
```

- [ ] **Step 3.3: `KpiGrid.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import type { StatsKpi } from '@keurzen/queries';

interface Props {
  kpis: StatsKpi[];
}

export function KpiGrid({ kpis }: Props) {
  return (
    <View className="flex-row flex-wrap px-6 py-6">
      {kpis.map((kpi) => (
        <View key={kpi.key} className="w-1/2 mb-8 pr-4">
          <Text
            className="uppercase"
            style={{ fontFamily: 'Nunito_700Bold', fontSize: 9, letterSpacing: 1.5, color: 'rgba(95,84,117,0.5)' }}
          >
            {kpi.label}
          </Text>
          <View className="flex-row items-baseline mt-2">
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#5F5475' }}>
              {kpi.value}
            </Text>
            {kpi.unit && (
              <Text className="ml-1" style={{ fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(95,84,117,0.5)' }}>
                {kpi.unit}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3.4: `MemberBalanceList.tsx`**

```tsx
import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '../ui/Text';
import type { MemberBalance } from '@keurzen/queries';

interface Props {
  members: MemberBalance[];
}

function labelFor(level: MemberBalance['level']): { text: string; color: string } {
  switch (level) {
    case 'unbalanced':
      return { text: 'Charge elevee', color: '#E07A5F' };
    case 'watch':
      return { text: 'A surveiller', color: '#F4A261' };
    default:
      return { text: 'Equilibre ideal', color: '#967BB6' };
  }
}

export function MemberBalanceList({ members }: Props) {
  return (
    <View className="px-6 pt-6">
      <Text
        className="uppercase pb-4 border-b border-[#DCD7E8]/50"
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, letterSpacing: 2, color: '#5F5475' }}
      >
        Repartition
      </Text>
      <View className="pt-6 gap-6">
        {members.map((m) => {
          const pct = Math.round(m.tasksShare * 100);
          const label = labelFor(m.level);
          return (
            <View key={m.userId} className="flex-row items-center gap-4">
              {m.avatarUrl ? (
                <Image source={{ uri: m.avatarUrl }} className="w-12 h-12 rounded-full" />
              ) : (
                <View className="w-12 h-12 rounded-full bg-[#F3F0FF] items-center justify-center">
                  <Text style={{ fontFamily: 'Nunito_700Bold', color: '#967BB6' }}>
                    {m.name.slice(0, 1)}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row justify-between items-baseline">
                  <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#5F5475' }}>
                    {m.name}
                  </Text>
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#5F5475' }}>
                    {pct}%
                  </Text>
                </View>
                <View className="h-[3px] bg-[#F3F0FF] rounded-full mt-2 overflow-hidden">
                  <View
                    style={{ width: `${pct}%`, backgroundColor: label.color, height: '100%' }}
                  />
                </View>
                <Text
                  className="uppercase mt-2"
                  style={{ fontFamily: 'Nunito_700Bold', fontSize: 9, letterSpacing: 1.2, color: label.color }}
                >
                  {label.text}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 3.5: `TrendChart.tsx` (mobile — victory-native)**

```tsx
import React from 'react';
import { View, Dimensions } from 'react-native';
import { Text } from '../ui/Text';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import type { StatsTrendPoint } from '@keurzen/queries';

interface Props {
  points: StatsTrendPoint[];
  title?: string;
}

export function TrendChart({ points, title = 'Tendance' }: Props) {
  if (points.length === 0) return null;
  const width = Dimensions.get('window').width - 48;

  return (
    <View className="px-6 pt-8">
      <Text
        className="uppercase mb-4"
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, letterSpacing: 2, color: '#5F5475' }}
      >
        {title}
      </Text>
      <VictoryChart width={width} height={160} padding={{ top: 10, bottom: 30, left: 30, right: 10 }}>
        <VictoryAxis
          style={{
            axis: { stroke: 'transparent' },
            tickLabels: { fill: 'rgba(95,84,117,0.5)', fontFamily: 'Nunito_500Medium', fontSize: 10 },
          }}
        />
        <VictoryAxis dependentAxis style={{ axis: { stroke: 'transparent' }, tickLabels: { fill: 'transparent' } }} />
        <VictoryBar
          data={points.map((p) => ({ x: p.label, y: p.value }))}
          cornerRadius={{ top: 4 }}
          style={{ data: { fill: '#967BB6' } }}
          barRatio={0.6}
        />
      </VictoryChart>
    </View>
  );
}
```

- [ ] **Step 3.6: `StatsEmptyState.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';

export function StatsEmptyState() {
  return (
    <View className="items-center justify-center px-10 py-16">
      <Mascot size={96} />
      <Text
        className="text-center mt-6"
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#5F5475' }}
      >
        Pas encore de donnees
      </Text>
      <Text
        className="text-center mt-2"
        style={{ fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(95,84,117,0.7)', lineHeight: 20 }}
      >
        Complete quelques taches et tes statistiques s'afficheront ici.
      </Text>
    </View>
  );
}
```

- [ ] **Step 3.7: Sanity type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS — no TS errors on the new files. If `victory-native` import path differs, verify against the existing `apps/mobile/src/components/stats/TrendChart` usage in the repo (look for any existing chart, e.g. `grep -r "victory-native" apps/mobile/src`).

- [ ] **Step 3.8: Commit**

```bash
git add apps/mobile/src/components/stats/
git commit -m "feat(mobile): add stats UI components"
```

---

## Task 4: Mobile stats screen

**Files:**
- Modify: `apps/mobile/app/(app)/stats/index.tsx` (replace placeholder)

- [ ] **Step 4.1: Replace screen content**

Replace the full contents of `apps/mobile/app/(app)/stats/index.tsx` with:

```tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { useStats, type StatsScope, type StatsPeriod } from '@keurzen/queries';
import { StatsHeader } from '../../../src/components/stats/StatsHeader';
import { ScoreHero } from '../../../src/components/stats/ScoreHero';
import { KpiGrid } from '../../../src/components/stats/KpiGrid';
import { MemberBalanceList } from '../../../src/components/stats/MemberBalanceList';
import { TrendChart } from '../../../src/components/stats/TrendChart';
import { StatsEmptyState } from '../../../src/components/stats/StatsEmptyState';

export default function StatsScreen() {
  const [scope, setScope] = useState<StatsScope>('me');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const stats = useStats({ scope, period });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-4 pb-2">
        <Text
          className="italic"
          style={{ fontFamily: 'Nunito_700Bold', fontSize: 24, color: '#5F5475' }}
        >
          Statistiques
        </Text>
      </View>

      <StatsHeader
        scope={scope}
        period={period}
        onScopeChange={setScope}
        onPeriodChange={setPeriod}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {stats.isLoading ? (
          <Loader />
        ) : stats.isEmpty ? (
          <StatsEmptyState />
        ) : (
          <>
            {scope === 'household' && stats.score && (
              <ScoreHero
                score={stats.score.score}
                delta={stats.scoreDelta}
                coachMessage={stats.coachMessage}
              />
            )}
            <KpiGrid kpis={stats.kpis} />
            {scope === 'household' && stats.members.length > 0 && (
              <MemberBalanceList members={stats.members} />
            )}
            {scope === 'household' && stats.trend.length > 0 && (
              <TrendChart points={stats.trend} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4.2: Run lint**

Run: `npm run lint`
Expected: PASS — no new ESLint errors.

- [ ] **Step 4.3: Manual mobile smoke test**

Run: `cd apps/mobile && npx expo start --tunnel`
Steps:
1. Open app on device, navigate to Stats tab
2. Verify Moi tab renders 4 KPIs without crash
3. Tap Foyer → score hero + repartition + trend render
4. Toggle Jour/Semaine → values update without error
5. If household has zero completed tasks, verify empty state shows mascot

- [ ] **Step 4.4: Commit**

```bash
git add apps/mobile/app/\(app\)/stats/index.tsx
git commit -m "feat(mobile): wire stats screen with scope and period tabs"
```

---

## Task 5: Web shared UI components (stateless)

**Files:**
- Create: `apps/web/src/components/stats/StatsHeader.tsx`
- Create: `apps/web/src/components/stats/ScoreHero.tsx`
- Create: `apps/web/src/components/stats/KpiGrid.tsx`
- Create: `apps/web/src/components/stats/MemberBalanceList.tsx`
- Create: `apps/web/src/components/stats/TrendChart.tsx`
- Create: `apps/web/src/components/stats/StatsEmptyState.tsx`

Uses plain Tailwind (no NativeWind), Lavender CSS variables where available, Nunito via existing web font setup.

- [ ] **Step 5.1: `StatsHeader.tsx`**

```tsx
'use client';
import type { StatsScope, StatsPeriod } from '@keurzen/queries';

interface Props {
  scope: StatsScope;
  period: StatsPeriod;
  onScopeChange: (s: StatsScope) => void;
  onPeriodChange: (p: StatsPeriod) => void;
}

export function StatsHeader({ scope, period, onScopeChange, onPeriodChange }: Props) {
  return (
    <div className="px-6 pt-4">
      <div className="flex bg-[#F3F0FF] rounded-xl p-1 mb-6">
        {(['me', 'household'] as const).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              onClick={() => onScopeChange(s)}
              className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition ${
                active ? 'bg-white text-[#5F5475] shadow-sm' : 'text-[#5F5475]/60'
              }`}
            >
              {s === 'me' ? 'Moi' : 'Foyer'}
            </button>
          );
        })}
      </div>

      <div className="flex border-b border-[#DCD7E8]">
        {(['day', 'week'] as const).map((p) => {
          const active = period === p;
          return (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className="flex-1 py-3 relative"
            >
              <span
                className={`text-[10px] uppercase tracking-[0.15em] ${
                  active ? 'text-[#5F5475] font-bold' : 'text-[#5F5475]/50 font-semibold'
                }`}
              >
                {p === 'day' ? 'Jour' : 'Semaine'}
              </span>
              {active && (
                <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#967BB6] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: `ScoreHero.tsx`**

```tsx
interface Props {
  score: number;
  delta: number | null;
  coachMessage: string | null;
}

export function ScoreHero({ score, delta, coachMessage }: Props) {
  return (
    <div className="flex flex-col items-center py-8">
      <p className="uppercase text-[10px] tracking-[0.2em] text-[#5F5475]/50 font-bold">
        Score global
      </p>
      <div className="flex items-baseline mt-3">
        <span className="text-[88px] leading-[96px] font-extrabold text-[#5F5475]">
          {score}
        </span>
        {delta !== null && delta !== 0 && (
          <span className={`ml-2 font-bold text-sm ${delta >= 0 ? 'text-[#81C784]' : 'text-[#E07A5F]'}`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      {coachMessage && (
        <p className="italic text-center px-4 mt-4 text-sm text-[#5F5475]/70">
          « {coachMessage} »
        </p>
      )}
      <div className="w-10 h-px bg-[#DCD7E8] mt-6" />
    </div>
  );
}
```

- [ ] **Step 5.3: `KpiGrid.tsx`**

```tsx
import type { StatsKpi } from '@keurzen/queries';

interface Props {
  kpis: StatsKpi[];
}

export function KpiGrid({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-8 px-6 py-6">
      {kpis.map((k) => (
        <div key={k.key}>
          <p className="uppercase text-[9px] tracking-[0.15em] text-[#5F5475]/50 font-bold">
            {k.label}
          </p>
          <div className="flex items-baseline mt-2">
            <span className="text-3xl font-extrabold text-[#5F5475]">{k.value}</span>
            {k.unit && <span className="ml-1 text-xs text-[#5F5475]/50">{k.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5.4: `MemberBalanceList.tsx`**

```tsx
import type { MemberBalance } from '@keurzen/queries';

interface Props {
  members: MemberBalance[];
}

function labelFor(level: MemberBalance['level']) {
  if (level === 'unbalanced') return { text: 'Charge elevee', color: '#E07A5F' };
  if (level === 'watch') return { text: 'A surveiller', color: '#F4A261' };
  return { text: 'Equilibre ideal', color: '#967BB6' };
}

export function MemberBalanceList({ members }: Props) {
  return (
    <div className="px-6 pt-6">
      <h2 className="uppercase text-xs tracking-[0.2em] font-bold text-[#5F5475] pb-4 border-b border-[#DCD7E8]/50">
        Repartition
      </h2>
      <div className="pt-6 space-y-6">
        {members.map((m) => {
          const pct = Math.round(m.tasksShare * 100);
          const label = labelFor(m.level);
          return (
            <div key={m.userId} className="flex items-center gap-4">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#F3F0FF] flex items-center justify-center text-[#967BB6] font-bold">
                  {m.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-[#5F5475]">{m.name}</span>
                  <span className="text-lg font-bold text-[#5F5475]">{pct}%</span>
                </div>
                <div className="h-[3px] bg-[#F3F0FF] rounded-full mt-2 overflow-hidden">
                  <div style={{ width: `${pct}%`, backgroundColor: label.color }} className="h-full" />
                </div>
                <p
                  className="uppercase mt-2 text-[9px] tracking-[0.12em] font-bold"
                  style={{ color: label.color }}
                >
                  {label.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.5: `TrendChart.tsx` (web — inline SVG, no dep)**

```tsx
import type { StatsTrendPoint } from '@keurzen/queries';

interface Props {
  points: StatsTrendPoint[];
  title?: string;
}

export function TrendChart({ points, title = 'Tendance' }: Props) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const barW = 40;
  const gap = 24;
  const height = 140;
  const width = points.length * barW + (points.length - 1) * gap;

  return (
    <div className="px-6 pt-8">
      <h2 className="uppercase text-xs tracking-[0.2em] font-bold text-[#5F5475] mb-4">
        {title}
      </h2>
      <svg width={width} height={height + 24} viewBox={`0 0 ${width} ${height + 24}`}>
        {points.map((p, i) => {
          const h = (p.value / max) * height;
          const x = i * (barW + gap);
          const y = height - h;
          return (
            <g key={p.label}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill="#967BB6" />
              <text
                x={x + barW / 2}
                y={height + 18}
                textAnchor="middle"
                fontFamily="Nunito"
                fontSize="10"
                fill="rgba(95,84,117,0.5)"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 5.6: `StatsEmptyState.tsx`**

```tsx
export function StatsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-10 py-16">
      <div className="w-24 h-24 rounded-3xl bg-[#F3F0FF] flex items-center justify-center text-5xl">
        🏠
      </div>
      <h2 className="text-center mt-6 text-lg font-bold text-[#5F5475]">
        Pas encore de donnees
      </h2>
      <p className="text-center mt-2 text-sm text-[#5F5475]/70 leading-relaxed max-w-xs">
        Complete quelques taches et tes statistiques s'afficheront ici.
      </p>
    </div>
  );
}
```

- [ ] **Step 5.7: Commit**

```bash
git add apps/web/src/components/stats/
git commit -m "feat(web): add stats UI components"
```

---

## Task 6: Web stats page + sidebar entry

**Files:**
- Create: `apps/web/src/app/(app)/stats/page.tsx`
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 6.1: Create the page**

Create `apps/web/src/app/(app)/stats/page.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useStats, type StatsScope, type StatsPeriod } from '@keurzen/queries';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { ScoreHero } from '@/components/stats/ScoreHero';
import { KpiGrid } from '@/components/stats/KpiGrid';
import { MemberBalanceList } from '@/components/stats/MemberBalanceList';
import { TrendChart } from '@/components/stats/TrendChart';
import { StatsEmptyState } from '@/components/stats/StatsEmptyState';

export default function StatsPage() {
  const [scope, setScope] = useState<StatsScope>('me');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const stats = useStats({ scope, period });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-6 pt-6">
        <h1 className="italic text-2xl font-bold text-[#5F5475]">Statistiques</h1>
      </div>
      <StatsHeader
        scope={scope}
        period={period}
        onScopeChange={setScope}
        onPeriodChange={setPeriod}
      />

      {stats.isLoading ? (
        <div className="py-16 text-center text-[#5F5475]/60">Chargement...</div>
      ) : stats.isEmpty ? (
        <StatsEmptyState />
      ) : (
        <>
          {scope === 'household' && stats.score && (
            <ScoreHero
              score={stats.score.score}
              delta={stats.scoreDelta}
              coachMessage={stats.coachMessage}
            />
          )}
          <KpiGrid kpis={stats.kpis} />
          {scope === 'household' && stats.members.length > 0 && (
            <MemberBalanceList members={stats.members} />
          )}
          {scope === 'household' && stats.trend.length > 0 && (
            <TrendChart points={stats.trend} />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6.2: Add sidebar entry**

Edit `apps/web/src/components/layout/Sidebar.tsx`. Locate the main nav array (around lines 14–19 where `/dashboard`, `/tasks`, `/calendar`, `/lists`, `/budget` are defined). Import `BarChart3` from `lucide-react` in the existing import block, then insert the Stats entry right after `/tasks`:

```ts
{ href: '/stats', icon: BarChart3, label: 'Stats' },
```

- [ ] **Step 6.3: Build web**

Run: `cd apps/web && npm run build`
Expected: PASS — no TS/Next errors.

- [ ] **Step 6.4: Manual web smoke test**

Run: `cd apps/web && npm run dev`
Steps:
1. Open `http://localhost:3000/stats`
2. Verify Moi tab renders 4 KPIs
3. Switch Foyer → score hero + répartition + trend render
4. Sidebar "Stats" link highlights when active
5. Empty state shows when no data

- [ ] **Step 6.5: Commit**

```bash
git add apps/web/src/app/\(app\)/stats/page.tsx apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): add stats page and sidebar entry"
```

---

## Task 7: Final verification (CLAUDE.md loop)

- [ ] **Step 7.1: Lint**

Run: `npm run lint`
Expected: PASS — zero new warnings.

- [ ] **Step 7.2: Tests**

Run: `npm run test`
Expected: PASS — all tests, including the new `statsHelpers` and `useStats` suites.

- [ ] **Step 7.3: Type-check both apps**

Run: `cd apps/mobile && npx tsc --noEmit && cd ../web && npx tsc --noEmit`
Expected: PASS — no TS errors on either side.

- [ ] **Step 7.4: Verify the "do not touch" list was respected**

Run: `git diff --stat main...HEAD`
Expected files touched: only those listed in the File Structure section. Notably **NOT** in the diff:
- `apps/mobile/app/(app)/dashboard/analytics.tsx`
- `apps/mobile/app/(app)/menu/analysis.tsx`
- Any `supabase/migrations/*`
- `apps/mobile/app/(app)/_layout.tsx`

- [ ] **Step 7.5: Write the PR verdict**

In the PR description (or chat), include:

- Plan exécuté : feature Stats V1 (Moi/Foyer × Jour/Semaine)
- Fichiers modifiés : [list from git diff]
- Commandes lancées : `npm run lint` ✅, `npm run test` ✅, `tsc --noEmit` ✅ mobile+web, `npm run build` ✅ web
- Comment tester : voir étapes 4.3 et 6.4
- Risques / points à surveiller : parité mobile/web des composants stats ; performance de `computeStreakDays` sur gros volumes (acceptable V1) ; dette à nettoyer = `dashboard/analytics.tsx` + `menu/analysis.tsx` (ticket de suivi)
- Verdict : **prêt à tester** ou **pas encore prêt**
