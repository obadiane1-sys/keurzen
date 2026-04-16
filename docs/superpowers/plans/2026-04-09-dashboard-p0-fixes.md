# Dashboard P0 Fixes — Score Centralization + Weekly Review Web

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two critical dashboard issues: (A) centralize the household score algorithm so mobile and web show the same score, (B) create the missing weekly-review page on web.

**Architecture:** Move `computeHouseholdScore()` from `apps/mobile/src/lib/utils/householdScore.ts` to `packages/shared/src/utils/householdScore.ts`, re-export it, then import from shared on both platforms. For weekly-review, add `useWeeklyReview` + `useWeeklyReviewHistory` hooks to `packages/queries`, then create the web page at `apps/web/src/app/(app)/dashboard/weekly-review/page.tsx` mirroring mobile's structure with Tailwind + lucide-react. Also upgrade `WeeklyReportSection` with collapsible sections.

**Tech Stack:** TypeScript, React, Next.js (App Router), TanStack Query v5, Tailwind CSS, lucide-react, Zustand, Supabase

---

## Task 1: Move `computeHouseholdScore` to `packages/shared`

**Files:**
- Create: `packages/shared/src/utils/householdScore.ts`
- Modify: `packages/shared/src/utils/index.ts`
- Modify: `packages/shared/src/index.ts` (verify re-export)
- Modify: `apps/mobile/src/lib/utils/householdScore.ts` (replace with re-export)
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx` (replace inline score calc)

- [ ] **Step 1: Create `packages/shared/src/utils/householdScore.ts`**

Copy the entire file from mobile verbatim — types + logic:

```typescript
/**
 * Household Score — score composite du foyer
 *
 * 4 dimensions pondérées :
 * - Complétion (35%) : tâches terminées / total
 * - Équilibre (30%) : écart max de répartition entre membres
 * - TLX (25%) : charge mentale moyenne inversée
 * - Streak (10%) : jours consécutifs avec au moins 1 tâche complétée
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScoreDimension {
  label: string;
  value: number; // 0–100
  weight: number;
}

export interface HouseholdScoreResult {
  total: number; // 0–100
  dimensions: {
    completion: ScoreDimension;
    balance: ScoreDimension;
    tlx: ScoreDimension;
    streak: ScoreDimension;
  };
}

export interface HouseholdScoreInput {
  /** Number of completed tasks this week */
  completedTasks: number;
  /** Total tasks this week */
  totalTasks: number;
  /** Max absolute tasks_delta among members (0–1 scale) */
  maxImbalance: number;
  /** Average TLX score across household members (0–100) */
  averageTlx: number;
  /** Consecutive days with at least 1 completed task */
  streakDays: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WEIGHTS = {
  completion: 0.35,
  balance: 0.30,
  tlx: 0.25,
  streak: 0.10,
} as const;

/** Streak cap — beyond this, score maxes out */
const STREAK_CAP = 7;

// ─── Computation ─────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(Math.max(v, min), max);
}

export function computeHouseholdScore(input: HouseholdScoreInput): HouseholdScoreResult {
  const { completedTasks, totalTasks, maxImbalance, averageTlx, streakDays } = input;

  // 1. Complétion: done / total (100 if no tasks)
  const completionValue = totalTasks > 0
    ? clamp(Math.round((completedTasks / totalTasks) * 100))
    : 100;

  // 2. Équilibre: inverse of max imbalance (0 = perfect, 0.5+ = worst)
  //    Map [0, 0.5] → [100, 0]
  const balanceValue = clamp(Math.round((1 - Math.min(maxImbalance, 0.5) * 2) * 100));

  // 3. TLX: inversé — high TLX = bad → low score
  const tlxValue = clamp(Math.round(100 - averageTlx));

  // 4. Streak: linear up to STREAK_CAP days
  const streakValue = clamp(Math.round((Math.min(streakDays, STREAK_CAP) / STREAK_CAP) * 100));

  const dimensions = {
    completion: { label: 'Completion', value: completionValue, weight: WEIGHTS.completion },
    balance: { label: 'Equilibre', value: balanceValue, weight: WEIGHTS.balance },
    tlx: { label: 'Charge mentale', value: tlxValue, weight: WEIGHTS.tlx },
    streak: { label: 'Regularite', value: streakValue, weight: WEIGHTS.streak },
  };

  const total = Math.round(
    Object.values(dimensions).reduce((sum, d) => sum + d.value * d.weight, 0),
  );

  return { total: clamp(total), dimensions };
}
```

- [ ] **Step 2: Export from `packages/shared/src/utils/index.ts`**

Add at the end of the file:

```typescript
export { computeHouseholdScore } from './householdScore';
export type { HouseholdScoreInput, HouseholdScoreResult, ScoreDimension } from './householdScore';
```

- [ ] **Step 3: Replace mobile's `householdScore.ts` with a re-export**

Replace the entire content of `apps/mobile/src/lib/utils/householdScore.ts` with:

```typescript
// Canonical implementation lives in @keurzen/shared
export {
  computeHouseholdScore,
  type HouseholdScoreInput,
  type HouseholdScoreResult,
  type ScoreDimension,
} from '@keurzen/shared';
```

- [ ] **Step 4: Replace web's inline score calc with shared function**

In `apps/web/src/app/(app)/dashboard/page.tsx`:

1. Add import: `import { computeHouseholdScore } from '@keurzen/shared';`
2. Replace the `weeklyScore` useMemo block (lines 143–162) with:

```typescript
const weeklyScore = useMemo(() => {
  const totalTasks = allTasks.length;
  const completedTasks = doneTasks.length;
  const maxImbalance = balanceMembers.length > 0
    ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta ?? 0)))
    : 0;
  const averageTlx = currentTlx?.score ?? 0;

  const result = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays: 0, // TODO: share useHouseholdStreak to packages/queries
  });
  return result.total;
}, [allTasks, doneTasks, balanceMembers, currentTlx]);
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/ouss/Keurzen && npm run build --filter=@keurzen/shared`
Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/utils/householdScore.ts packages/shared/src/utils/index.ts apps/mobile/src/lib/utils/householdScore.ts apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "fix: centralize computeHouseholdScore in packages/shared

Mobile and web were computing the household score with different
algorithms (different weights, missing streak factor on web).
Now both platforms use the same canonical implementation."
```

---

## Task 2: Add `useWeeklyReview` + `useWeeklyReviewHistory` to `packages/queries`

**Files:**
- Modify: `packages/queries/src/hooks/useReports.ts` (add hooks)
- Modify: `packages/queries/src/index.ts` (verify exports)

The mobile has these hooks in `apps/mobile/src/lib/queries/reports.ts` but `packages/queries` only has `useWeeklyReport` and `useRegenerateReport`. The web page needs `useWeeklyReview` and `useWeeklyReviewHistory`.

- [ ] **Step 1: Add hooks to `packages/queries/src/hooks/useReports.ts`**

Append after `useRegenerateReport`:

```typescript
// ─── Weekly Review — Full Report with Metrics ────────────────────────────────

export function useWeeklyReview(weekStart?: string) {
  const { currentHousehold } = useHouseholdStore();
  const defaultWeek = useMemo(() => getCurrentWeekStart(), []);
  const week = weekStart ?? defaultWeek;

  return useQuery({
    queryKey: ['weekly-review', currentHousehold?.id ?? '', week] as const,
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('household_id', currentHousehold!.id)
        .eq('week_start', week)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as WeeklyReport | null;
    },
    enabled: !!currentHousehold?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Weekly Review History ───────────────────────────────────────────────────

export interface WeeklyReviewSummary {
  id: string;
  week_start: string;
  balance_score: number | null;
  total_tasks_completed: number;
  generated_at: string;
}

export function useWeeklyReviewHistory(limit = 8) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: ['weekly-review-history', currentHousehold?.id ?? '', limit] as const,
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, week_start, balance_score, total_tasks_completed, generated_at')
        .eq('household_id', currentHousehold!.id)
        .order('week_start', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as WeeklyReviewSummary[];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 5 * 60 * 1000,
  });
}
```

Ensure the file has `import { useMemo } from 'react';` and `import { getCurrentWeekStart } from '@keurzen/shared';` at the top (add if missing).

- [ ] **Step 2: Verify exports are picked up**

Check `packages/queries/src/index.ts` — it already has `export * from './hooks/useReports';`, so `useWeeklyReview`, `useWeeklyReviewHistory`, and `WeeklyReviewSummary` will be auto-exported.

- [ ] **Step 3: Commit**

```bash
git add packages/queries/src/hooks/useReports.ts
git commit -m "feat(queries): add useWeeklyReview and useWeeklyReviewHistory hooks

These were only available in mobile's local queries. Now shared so
the web weekly-review page can use them."
```

---

## Task 3: Create web weekly-review page

**Files:**
- Create: `apps/web/src/app/(app)/dashboard/weekly-review/page.tsx`

This page mirrors the mobile `weekly-review.tsx` structure: score gauge + mascot label, 3 metric cards, member breakdown, AI report with collapsible sections, regenerate button, history list.

- [ ] **Step 1: Create the page**

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCheck,
  Clock,
  Activity,
  AlertTriangle,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import {
  useWeeklyReview,
  useWeeklyReviewHistory,
  useRegenerateReport,
} from '@keurzen/queries';
import type { WeeklyReviewSummary } from '@keurzen/queries';
import type { AttentionPoint, Insight, Orientation, MemberMetric } from '@keurzen/shared';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--color-sauge)';
  if (score >= 50) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '\u2014';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Correct';
  return '\u00c0 am\u00e9liorer';
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function formatWeekDate(weekStart: string): string {
  return new Date(weekStart).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

const MEMBER_COLORS = [
  'var(--color-terracotta)',
  'var(--color-sauge)',
  'var(--color-prune)',
  'var(--color-miel)',
  'var(--color-rose)',
];

// ─── Score Gauge (SVG) ───────────────────────────────────────────────────────

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--color-border-light)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-xs text-text-muted">/100</span>
      </div>
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-background/50 transition-colors min-h-[44px]"
      >
        <Icon size={16} className="shrink-0" style={{ color: iconColor }} />
        <span className="flex-1 text-sm font-semibold text-text-secondary">{title}</span>
        <span className="text-xs text-text-muted">({count})</span>
        <Chevron size={14} className="text-text-muted" />
      </button>
      {expanded && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

// ─── History Item ────────────────────────────────────────────────────────────

function HistoryItem({
  item,
  onPress,
}: {
  item: WeeklyReviewSummary;
  onPress: () => void;
}) {
  const score = item.balance_score !== null ? Math.round(item.balance_score) : null;
  const scoreColor = score !== null ? getScoreColor(score) : undefined;

  return (
    <button
      onClick={onPress}
      className="flex w-full items-center justify-between py-3 border-b border-border-light last:border-b-0 hover:bg-background/50 transition-colors min-h-[44px]"
    >
      <span className="text-sm text-text-primary">
        Sem. du {formatWeekDate(item.week_start)}
      </span>
      <div className="flex items-center gap-2">
        {score !== null && (
          <span
            className="px-2 py-0.5 text-xs font-bold rounded"
            style={{ backgroundColor: scoreColor + '20', color: scoreColor }}
          >
            {score}
          </span>
        )}
        <span className="text-xs text-text-muted">{item.total_tasks_completed} taches</span>
        <ChevronRight size={14} className="text-text-muted" />
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WeeklyReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get('week') ?? undefined;
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(weekParam);

  const { data: review, isLoading, error, refetch } = useWeeklyReview(selectedWeek);
  const { data: history = [] } = useWeeklyReviewHistory(8);
  const regenerate = useRegenerateReport();

  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    insights: true,
    orientations: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-terracotta mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex h-64 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-terracotta mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-text-muted">Impossible de charger le bilan</p>
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-terracotta hover:underline"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────
  if (!review) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-terracotta mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-text-muted">Pas encore de bilan cette semaine</p>
          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="rounded-full bg-prune px-6 py-2.5 text-sm font-bold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
          >
            {regenerate.isPending ? 'Generation...' : 'Generer le bilan'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Review content ───────────────────────────────────────────────
  const balanceScore = review.balance_score !== null ? Math.round(review.balance_score) : null;
  const hasMetrics = review.balance_score !== null;
  const scoreColor = balanceScore !== null ? getScoreColor(balanceScore) : 'var(--color-text-muted)';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-terracotta"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="text-right">
          <h1 className="font-heading text-lg font-bold text-text-primary">
            Bilan de la semaine
          </h1>
          <p className="text-xs text-text-muted">
            Semaine du {formatWeekDate(review.week_start)}
          </p>
        </div>
      </div>

      {/* Score + Label */}
      {hasMetrics && (
        <Card className="mb-4">
          <div className="flex items-center justify-around py-2">
            <ScoreGauge score={balanceScore ?? 0} color={scoreColor} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-text-primary">
                {getScoreLabel(balanceScore)}
              </span>
              <span className="text-xs text-text-muted">Equilibre du foyer</span>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="flex flex-col items-center py-4 gap-1">
            <CheckCheck size={20} className="text-sauge" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {review.total_tasks_completed}
            </span>
            <span className="text-xs text-text-muted">Taches</span>
          </Card>
          <Card className="flex flex-col items-center py-4 gap-1">
            <Clock size={20} className="text-terracotta" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {formatMinutes(review.total_minutes_logged)}
            </span>
            <span className="text-xs text-text-muted">Temps</span>
          </Card>
          <Card className="flex flex-col items-center py-4 gap-1">
            <Activity size={20} className="text-prune" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {review.avg_tlx_score !== null ? Math.round(review.avg_tlx_score) : '\u2014'}
            </span>
            <span className="text-xs text-text-muted">TLX moy.</span>
          </Card>
        </div>
      )}

      {/* Member Breakdown */}
      {hasMetrics && review.member_metrics.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-bold text-text-primary mb-3">Repartition par membre</p>
          <div className="space-y-3">
            {review.member_metrics.map((m: MemberMetric, i: number) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const sharePercent = Math.round(m.tasks_share * 100);
              return (
                <div key={m.user_id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-text-primary flex-1">{m.name}</span>
                    <span className="text-xs text-text-muted">
                      {m.tasks_count} tache{m.tasks_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={sharePercent} color={color} />
                    <span className="text-xs font-semibold text-text-secondary w-9 text-right tabular-nums">
                      {sharePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AI Report */}
      <Card className="mb-4 !p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <BarChart3 size={18} className="text-prune" />
          <span className="text-sm font-bold text-text-primary">Rapport IA</span>
        </div>
        <p className="px-4 pb-3 text-sm text-text-primary leading-relaxed">
          {review.summary}
        </p>

        {/* Attention Points */}
        {review.attention_points.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={AlertTriangle}
              iconColor="var(--color-rose)"
              title="Points d'attention"
              count={review.attention_points.length}
              expanded={expandedSections.attention}
              onToggle={() => toggleSection('attention')}
            >
              {review.attention_points.map((item: AttentionPoint, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: item.level === 'warning' ? 'var(--color-rose)' : 'var(--color-miel)' }}
                  />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Insights */}
        {review.insights.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={Lightbulb}
              iconColor="var(--color-prune)"
              title="Insights"
              count={review.insights.length}
              expanded={expandedSections.insights}
              onToggle={() => toggleSection('insights')}
            >
              {review.insights.map((item: Insight, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-prune" />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Orientations */}
        {review.orientations.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={Compass}
              iconColor="var(--color-sauge)"
              title="Orientations"
              count={review.orientations.length}
              expanded={expandedSections.orientations}
              onToggle={() => toggleSection('orientations')}
            >
              {review.orientations.map((item: Orientation, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.priority === 'high'
                        ? 'var(--color-sauge)'
                        : 'var(--color-text-muted)',
                    }}
                  />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Regenerate */}
        <div className="h-px bg-border-light" />
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-sm text-text-muted hover:text-terracotta transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={regenerate.isPending ? 'animate-spin' : ''} />
          {regenerate.isPending ? 'Regeneration...' : 'Regenerer le rapport'}
        </button>
      </Card>

      {/* History */}
      {history.length > 1 && (
        <Card className="mb-8">
          <p className="text-sm font-bold text-text-primary mb-2">Historique</p>
          {history
            .filter((h) => h.week_start !== review.week_start)
            .map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onPress={() => setSelectedWeek(item.week_start)}
              />
            ))}
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify page loads**

Run: `cd /Users/ouss/Keurzen/apps/web && npm run build`
Expected: No build errors. The page should be accessible at `/dashboard/weekly-review`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/weekly-review/page.tsx
git commit -m "feat(web): create weekly-review page

Mirrors the mobile weekly-review screen with score gauge, 3 key
metrics, member breakdown, collapsible AI report sections, regenerate
button, and history list. Uses shared queries from @keurzen/queries."
```

---

## Task 4: Upgrade `WeeklyReportSection` on web with collapsible sections + CTA

**Files:**
- Modify: `apps/web/src/components/dashboard/WeeklyReportSection.tsx`

Currently this component is a flat static display. Upgrade it to match mobile's `WeeklyReportCard`: collapsible sections + link to weekly-review.

- [ ] **Step 1: Rewrite `WeeklyReportSection.tsx`**

Replace the entire file with:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWeeklyReport } from '@keurzen/queries';
import { Card } from '@/components/ui/Card';

export function WeeklyReportSection() {
  const router = useRouter();
  const { data: report, isLoading } = useWeeklyReport();
  const [expanded, setExpanded] = useState({
    attention: false,
    insights: false,
    orientations: false,
  });

  const toggle = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading || !report) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Rapport de la semaine
        </p>
        <button
          onClick={() => router.push('/dashboard/weekly-review')}
          className="text-xs font-medium text-terracotta hover:underline"
        >
          Voir le bilan complet
        </button>
      </div>
      <Card className="!p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <BarChart3 size={16} className="text-prune" />
          <span className="text-sm font-bold text-text-primary">Rapport IA</span>
        </div>

        {/* Summary */}
        <p className="px-4 pb-3 text-sm text-text-secondary leading-relaxed">
          {report.summary}
        </p>

        {/* Attention points */}
        {report.attention_points.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('attention')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <AlertTriangle size={14} className="text-miel shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">
                Points d&apos;attention
              </span>
              <span className="text-xs text-text-muted">({report.attention_points.length})</span>
              {expanded.attention
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.attention && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.attention_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={12} className="mt-0.5 text-miel shrink-0" />
                    <p className="text-sm text-text-secondary">{point.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Insights */}
        {report.insights.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('insights')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <Lightbulb size={14} className="text-prune shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">Insights</span>
              <span className="text-xs text-text-muted">({report.insights.length})</span>
              {expanded.insights
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.insights && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lightbulb size={12} className="mt-0.5 text-prune shrink-0" />
                    <p className="text-sm text-text-secondary">{insight.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Orientations */}
        {report.orientations.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('orientations')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <Compass size={14} className="text-terracotta shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">Orientations</span>
              <span className="text-xs text-text-muted">({report.orientations.length})</span>
              {expanded.orientations
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.orientations && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.orientations.map((orientation, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Compass size={12} className="mt-0.5 text-terracotta shrink-0" />
                    <p className="text-sm text-text-secondary">{orientation.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/ouss/Keurzen/apps/web && npm run build`
Expected: No build errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/WeeklyReportSection.tsx
git commit -m "feat(web): upgrade WeeklyReportSection with collapsible sections + CTA

Adds collapsible attention/insights/orientations sections and a
'Voir le bilan complet' link to the weekly-review page, matching
the mobile WeeklyReportCard behavior."
```

---

## Task 5: Final verification

- [ ] **Step 1: Full build check**

Run: `cd /Users/ouss/Keurzen && npm run build`
Expected: All packages and apps build without errors.

- [ ] **Step 2: Lint check**

Run: `cd /Users/ouss/Keurzen && npm run lint`
Expected: No new lint errors.

- [ ] **Step 3: Manual test plan**

**Web:**
1. Go to `/dashboard` — verify the score matches the 4-dimension formula (completion 35%, balance 30%, TLX 25%, streak 10%)
2. Click "VOIR LES DETAILS" on the hero card — should navigate to `/dashboard/weekly-review`
3. On weekly-review: verify score gauge, 3 metric cards, member breakdown, AI report with collapsible sections, regenerate button, history list
4. Click a history item — should switch the displayed week
5. On dashboard, scroll to "Rapport de la semaine" — verify collapsible sections work and "Voir le bilan complet" link navigates correctly

**Mobile:**
1. Go to Dashboard — verify score hasn't changed (same algorithm, now from shared)
2. Tap "VOIR LES DETAILS" — weekly-review screen still works
3. Verify all dashboard sections render correctly
