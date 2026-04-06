# Weekly Micro-Objectives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a single weekly objective per household every Monday, display it as a progress bar inside the HouseholdScoreCard on both mobile and web dashboards.

**Architecture:** Deterministic rules in a Deno Edge Function (cron Monday 7:00) pick the most important objective based on last week's metrics and persist it to a `weekly_objectives` table. A Postgres RPC refreshes progress on demand. The UI reads the objective via a TanStack Query hook and renders a progress bar section at the bottom of HouseholdScoreCard.

**Tech Stack:** Supabase (Postgres, Edge Functions Deno, RLS), React Native (mobile), Next.js (web), TanStack Query v5, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-04-06-weekly-micro-objectives-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `apps/mobile/supabase/migrations/023_weekly_objectives.sql` | Create | Table, RLS, RPC |
| `apps/mobile/src/types/index.ts` | Modify | Add `WeeklyObjective` type |
| `apps/mobile/src/lib/queries/objectives.ts` | Create | `useWeeklyObjective` hook |
| `apps/mobile/src/components/dashboard/ObjectiveProgressSection.tsx` | Create | Reusable progress bar section |
| `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx` | Modify | Import and render ObjectiveProgressSection |
| `apps/web/src/components/dashboard/ObjectiveProgressSection.tsx` | Create | Web version of progress bar |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Modify | Import hook, pass objective to card area |
| `apps/mobile/supabase/functions/generate-weekly-objective/index.ts` | Create | Edge Function: generate + push |

---

## Task 1: Database Migration

**Files:**
- Create: `apps/mobile/supabase/migrations/023_weekly_objectives.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 023_weekly_objectives.sql
-- Weekly micro-objectives: one objective per household per week

CREATE TABLE IF NOT EXISTS weekly_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  type text NOT NULL CHECK (type IN ('completion', 'balance', 'tlx', 'streak', 'maintenance')),
  target_value numeric NOT NULL,
  baseline_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  achieved boolean NOT NULL DEFAULT false,
  achieved_at timestamptz,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, week_start)
);

-- Index for fast lookup by household + current week
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_household_week
  ON weekly_objectives (household_id, week_start);

-- RLS: members can read their household's objectives
ALTER TABLE weekly_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view household objectives"
  ON weekly_objectives FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for clients — only service_role writes.

-- RPC: refresh objective progress (called by client on dashboard refresh)
CREATE OR REPLACE FUNCTION refresh_objective_progress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_objective record;
  v_current numeric;
  v_week_start date;
  v_week_end date;
  v_achieved boolean;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'no_household');
  END IF;

  -- Current week start (Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  v_week_end := v_week_start + interval '7 days';

  -- Get this week's objective
  SELECT * INTO v_objective
  FROM weekly_objectives
  WHERE household_id = v_household_id
    AND week_start = v_week_start;

  IF v_objective IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'no_objective');
  END IF;

  -- Already achieved — no update needed
  IF v_objective.achieved THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'already_achieved');
  END IF;

  -- Compute current value based on type
  CASE v_objective.type
    WHEN 'completion' THEN
      SELECT
        CASE WHEN count(*) = 0 THEN 0
             ELSE round(count(*) FILTER (WHERE status = 'done')::numeric / count(*)::numeric * 100)
        END INTO v_current
      FROM tasks
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    WHEN 'balance' THEN
      SELECT coalesce(max(abs(tasks_delta)) * 100, 0) INTO v_current
      FROM weekly_stats
      WHERE household_id = v_household_id
        AND week_start = v_week_start;

    WHEN 'tlx' THEN
      SELECT coalesce(avg(score), 0) INTO v_current
      FROM tlx_entries
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    WHEN 'streak' THEN
      -- Count consecutive days backwards from today with at least 1 completed task
      WITH daily AS (
        SELECT DISTINCT (completed_at::date) AS d
        FROM tasks
        WHERE household_id = v_household_id
          AND status = 'done'
          AND completed_at >= CURRENT_DATE - interval '30 days'
      ),
      streak AS (
        SELECT count(*) AS days
        FROM generate_series(0, 29) AS i
        WHERE (CURRENT_DATE - i) IN (SELECT d FROM daily)
          AND NOT EXISTS (
            SELECT 1 FROM generate_series(0, i - 1) AS j
            WHERE (CURRENT_DATE - j) NOT IN (SELECT d FROM daily)
          )
      )
      SELECT coalesce(days, 0) INTO v_current FROM streak;

    WHEN 'maintenance' THEN
      -- Household score: simplified — use completion as proxy
      SELECT
        CASE WHEN count(*) = 0 THEN 100
             ELSE round(count(*) FILTER (WHERE status = 'done')::numeric / count(*)::numeric * 100)
        END INTO v_current
      FROM tasks
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    ELSE
      v_current := 0;
  END CASE;

  -- Check achievement (balance and tlx are inverted: lower is better)
  IF v_objective.type IN ('balance', 'tlx') THEN
    v_achieved := v_current <= v_objective.target_value;
  ELSE
    v_achieved := v_current >= v_objective.target_value;
  END IF;

  -- Update
  UPDATE weekly_objectives
  SET current_value = v_current,
      achieved = v_achieved,
      achieved_at = CASE WHEN v_achieved AND NOT achieved THEN now() ELSE achieved_at END
  WHERE id = v_objective.id;

  RETURN jsonb_build_object(
    'updated', true,
    'current_value', v_current,
    'achieved', v_achieved
  );
END;
$$;
```

- [ ] **Step 2: Apply the migration**

Run: `cd apps/mobile && npx supabase db push`
Expected: Migration applied successfully, table `weekly_objectives` created.

- [ ] **Step 3: Verify the table exists**

Run: `cd apps/mobile && npx supabase db reset --dry-run` or check via Supabase dashboard.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/supabase/migrations/023_weekly_objectives.sql
git commit -m "feat(db): add weekly_objectives table, RLS, and refresh RPC"
```

---

## Task 2: TypeScript Type

**Files:**
- Modify: `apps/mobile/src/types/index.ts`

- [ ] **Step 1: Add WeeklyObjective type**

Add after the `WeeklyStat` interface block (around line 175):

```typescript
// ─── Weekly Objectives ────────────────────────────────────────────────────────

export type ObjectiveType = 'completion' | 'balance' | 'tlx' | 'streak' | 'maintenance';

export interface WeeklyObjective {
  id: string;
  household_id: string;
  week_start: string;
  type: ObjectiveType;
  target_value: number;
  baseline_value: number;
  current_value: number;
  achieved: boolean;
  achieved_at: string | null;
  label: string;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/types/index.ts
git commit -m "feat(types): add WeeklyObjective type"
```

---

## Task 3: Query Hook — Mobile

**Files:**
- Create: `apps/mobile/src/lib/queries/objectives.ts`

- [ ] **Step 1: Create the hook file**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import type { WeeklyObjective } from '../../types';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export const objectiveKeys = {
  current: (householdId: string) => ['weekly-objective', householdId, 'current'] as const,
};

async function fetchAndRefreshObjective(householdId: string): Promise<WeeklyObjective | null> {
  // Refresh progress first
  await supabase.rpc('refresh_objective_progress');

  // Then fetch the updated objective
  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('weekly_objectives')
    .select('*')
    .eq('household_id', householdId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as WeeklyObjective | null;
}

export function useWeeklyObjective() {
  const { currentHousehold } = useHouseholdStore();
  const householdId = currentHousehold?.id ?? '';

  const query = useQuery({
    queryKey: objectiveKeys.current(householdId),
    queryFn: () => fetchAndRefreshObjective(householdId),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 2, // 2 min — refreshed on pull-to-refresh anyway
  });

  const objective = query.data ?? null;

  // Compute progress 0–100
  let progress = 0;
  if (objective) {
    if (objective.achieved) {
      progress = 100;
    } else if (objective.type === 'balance' || objective.type === 'tlx') {
      // Inverted: lower is better. Progress = how far from baseline toward target.
      const range = objective.baseline_value - objective.target_value;
      if (range > 0) {
        progress = Math.min(100, Math.max(0,
          Math.round(((objective.baseline_value - objective.current_value) / range) * 100)
        ));
      }
    } else {
      // Normal: higher is better
      if (objective.target_value > 0) {
        progress = Math.min(100, Math.max(0,
          Math.round((objective.current_value / objective.target_value) * 100)
        ));
      }
    }
  }

  return {
    objective,
    isLoading: query.isLoading,
    isAchieved: objective?.achieved ?? false,
    progress,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/lib/queries/objectives.ts
git commit -m "feat(queries): add useWeeklyObjective hook with progress calculation"
```

---

## Task 4: ObjectiveProgressSection Component — Mobile

**Files:**
- Create: `apps/mobile/src/components/dashboard/ObjectiveProgressSection.tsx`

- [ ] **Step 1: Create the component**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius } from '../../constants/tokens';
import type { ObjectiveType } from '../../types';

const typeColors: Record<ObjectiveType, string> = {
  completion: Colors.sauge,
  balance: Colors.miel,
  tlx: Colors.prune,
  streak: Colors.terracotta,
  maintenance: Colors.sauge,
};

interface ObjectiveProgressSectionProps {
  label: string;
  type: ObjectiveType;
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  progress: number;
  achieved: boolean;
}

export function ObjectiveProgressSection({
  label,
  type,
  currentValue,
  targetValue,
  baselineValue,
  progress,
  achieved,
}: ObjectiveProgressSectionProps) {
  const color = achieved ? Colors.sauge : typeColors[type];
  const isInverted = type === 'balance' || type === 'tlx';

  const displayCurrent = Math.round(currentValue);
  const displayTarget = Math.round(targetValue);
  const displayBaseline = Math.round(baselineValue);

  return (
    <View style={styles.container}>
      <View style={styles.separator} />

      {/* Label row */}
      <View style={styles.labelRow}>
        <Ionicons
          name={achieved ? 'checkmark-circle' : 'flag'}
          size={16}
          color={color}
        />
        <Text
          variant="bodySmall"
          weight="semibold"
          style={{ color: Colors.textPrimary, flex: 1 }}
          numberOfLines={1}
        >
          {achieved ? 'Objectif atteint !' : label}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Bottom labels */}
      <View style={styles.bottomRow}>
        <Text variant="caption" color="muted">
          Sem. derniere : {displayBaseline}{isInverted ? '' : '%'}
        </Text>
        <Text variant="caption" weight="semibold" style={{ color }}>
          {achieved
            ? `${displayCurrent}${isInverted ? '' : '%'}`
            : `${displayCurrent} / ${displayTarget}${isInverted ? '' : '%'}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/ObjectiveProgressSection.tsx
git commit -m "feat(ui): add ObjectiveProgressSection component for mobile"
```

---

## Task 5: Integrate into HouseholdScoreCard — Mobile

**Files:**
- Modify: `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx`

- [ ] **Step 1: Add import at the top of the file**

After the existing imports (around line 12), add:

```typescript
import { useWeeklyObjective } from '../../lib/queries/objectives';
import { ObjectiveProgressSection } from './ObjectiveProgressSection';
```

- [ ] **Step 2: Add hook call inside the component**

Inside `HouseholdScoreCard`, after the `const { data: streakDays = 0 } = useHouseholdStreak();` line (line 45), add:

```typescript
  const { objective, progress, isAchieved } = useWeeklyObjective();
```

- [ ] **Step 3: Render the section before the closing `</View>` of the card**

After the `barsContainer` View closing tag (after line 159 `</View>`), before the card's final closing `</View>` (line 161), add:

```typescript
      {objective && (
        <ObjectiveProgressSection
          label={objective.label}
          type={objective.type}
          currentValue={objective.current_value}
          targetValue={objective.target_value}
          baselineValue={objective.baseline_value}
          progress={progress}
          achieved={isAchieved}
        />
      )}
```

- [ ] **Step 4: Verify the file compiles**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `HouseholdScoreCard.tsx`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx
git commit -m "feat(dashboard): integrate weekly objective into HouseholdScoreCard"
```

---

## Task 6: Query Hook + Component — Web

**Files:**
- Create: `apps/web/src/components/dashboard/ObjectiveProgressSection.tsx`

- [ ] **Step 1: Create the web ObjectiveProgressSection**

```tsx
'use client';

type ObjectiveType = 'completion' | 'balance' | 'tlx' | 'streak' | 'maintenance';

const typeColorVars: Record<ObjectiveType, string> = {
  completion: 'var(--color-sauge)',
  balance: 'var(--color-miel)',
  tlx: 'var(--color-prune)',
  streak: 'var(--color-terracotta)',
  maintenance: 'var(--color-sauge)',
};

interface ObjectiveProgressSectionProps {
  label: string;
  type: ObjectiveType;
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  progress: number;
  achieved: boolean;
}

export function ObjectiveProgressSection({
  label,
  type,
  currentValue,
  targetValue,
  baselineValue,
  progress,
  achieved,
}: ObjectiveProgressSectionProps) {
  const color = achieved ? 'var(--color-sauge)' : typeColorVars[type];
  const isInverted = type === 'balance' || type === 'tlx';
  const unit = isInverted ? '' : '%';

  return (
    <div className="mt-3 border-t border-border-light pt-3">
      {/* Label */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span style={{ color }} className="text-base">
          {achieved ? '✓' : '🎯'}
        </span>
        <span className="text-sm font-semibold text-text-primary truncate">
          {achieved ? 'Objectif atteint !' : label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Bottom labels */}
      <div className="mt-1 flex justify-between">
        <span className="text-[11px] text-text-muted">
          Sem. derniere : {Math.round(baselineValue)}{unit}
        </span>
        <span className="text-[11px] font-semibold" style={{ color }}>
          {achieved
            ? `${Math.round(currentValue)}${unit}`
            : `${Math.round(currentValue)} / ${Math.round(targetValue)}${unit}`}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into web dashboard**

The web dashboard doesn't have a `HouseholdScoreCard` component yet. Add the objective section below the `WeeklyTipCard` in `apps/web/src/app/(app)/dashboard/page.tsx`.

At the top, add imports:

```typescript
import { ObjectiveProgressSection } from '@/components/dashboard/ObjectiveProgressSection';
```

After the existing `@keurzen/queries` import, add:

```typescript
import { useWeeklyObjective } from '@keurzen/queries';
```

Inside `DashboardPage`, after the existing hook calls (around line 50), add:

```typescript
  const { objective, progress, isAchieved } = useWeeklyObjective();
```

After the `{/* 2b. Weekly Tip */}` section (line 96), add:

```tsx
      {/* 2c. Weekly Objective */}
      {objective && (
        <div className="mb-6">
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">🎯</span>
              <span className="font-heading text-base font-bold">Objectif de la semaine</span>
            </div>
            <ObjectiveProgressSection
              label={objective.label}
              type={objective.type}
              currentValue={objective.current_value}
              targetValue={objective.target_value}
              baselineValue={objective.baseline_value}
              progress={progress}
              achieved={isAchieved}
            />
          </Card>
        </div>
      )}
```

**Note:** The web uses `@keurzen/queries` shared package. The `useWeeklyObjective` hook needs to be exported from there. If `@keurzen/queries` re-exports from mobile, the hook from Task 3 will be available. If not, create the same hook at the shared package path — check where `useWeeklyBalance` is exported from and follow the same pattern.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/ObjectiveProgressSection.tsx apps/web/src/app/(app)/dashboard/page.tsx
git commit -m "feat(web): add weekly objective display on web dashboard"
```

---

## Task 7: Edge Function — generate-weekly-objective

**Files:**
- Create: `apps/mobile/supabase/functions/generate-weekly-objective/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
/**
 * Keurzen — Edge Function: generate-weekly-objective
 *
 * Generates a single weekly micro-objective per household based on
 * last week's metrics. Triggered by cron Monday 7:00 AM.
 *
 * Hierarchy: completion > balance > TLX > streak > maintenance.
 * Idempotent: ON CONFLICT DO NOTHING.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ObjectiveResult {
  type: 'completion' | 'balance' | 'tlx' | 'streak' | 'maintenance';
  target_value: number;
  baseline_value: number;
  label: string;
}

serve(async (req: Request) => {
  // Validate cron secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const weekStart = getMonday(now);
  const weekStartStr = formatDate(weekStart);
  const prevWeekStart = addDays(weekStart, -7);
  const prevWeekStartStr = formatDate(prevWeekStart);

  // Get all households
  const { data: households, error: hErr } = await supabase
    .from('households')
    .select('id');

  if (hErr) {
    return errorResponse(hErr.message);
  }

  let created = 0;
  let pushed = 0;

  for (const household of households ?? []) {
    const objective = await computeObjective(supabase, household.id, prevWeekStartStr);

    // Insert (idempotent)
    const { error: insertErr } = await supabase
      .from('weekly_objectives')
      .insert({
        household_id: household.id,
        week_start: weekStartStr,
        type: objective.type,
        target_value: objective.target_value,
        baseline_value: objective.baseline_value,
        current_value: objective.baseline_value,
        label: objective.label,
      })
      .select()
      .maybeSingle();

    // ON CONFLICT → skip (objective already exists)
    if (insertErr?.code === '23505') continue;
    if (insertErr) {
      console.error(`Insert error for ${household.id}:`, insertErr);
      continue;
    }

    created++;

    // Send push notification to all members
    const sentCount = await sendPushToHousehold(supabase, household.id, objective.label);
    pushed += sentCount;
  }

  return new Response(
    JSON.stringify({ success: true, created, pushed, week_start: weekStartStr }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// ─── Objective computation ──────────────────────────────────────────────────

async function computeObjective(
  supabase: any,
  householdId: string,
  prevWeekStart: string
): Promise<ObjectiveResult> {
  // Fetch last week's stats
  const { data: stats } = await supabase
    .from('weekly_stats')
    .select('tasks_share, tasks_delta, total_tasks_week')
    .eq('household_id', householdId)
    .eq('week_start', prevWeekStart);

  // Fetch last week's TLX entries
  const prevWeekEnd = formatDate(addDays(new Date(prevWeekStart), 7));
  const { data: tlxEntries } = await supabase
    .from('tlx_entries')
    .select('score')
    .eq('household_id', householdId)
    .gte('created_at', prevWeekStart)
    .lt('created_at', prevWeekEnd);

  // Fetch streak (consecutive days with completed tasks, going back from yesterday)
  const yesterday = addDays(new Date(), -1);
  const thirtyDaysAgo = formatDate(addDays(yesterday, -30));
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('household_id', householdId)
    .eq('status', 'done')
    .not('completed_at', 'is', null)
    .gte('completed_at', thirtyDaysAgo)
    .order('completed_at', { ascending: false });

  // Compute metrics
  const totalTasks = stats?.[0]?.total_tasks_week ?? 0;
  const totalCompleted = stats?.reduce((sum: number, s: any) =>
    sum + Math.round(s.tasks_share * s.total_tasks_week), 0) ?? 0;
  const completion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 100;

  const maxImbalance = stats?.length > 0
    ? Math.max(...stats.map((s: any) => Math.abs(s.tasks_delta)))
    : 0;

  const avgTlx = tlxEntries?.length > 0
    ? Math.round(tlxEntries.reduce((sum: number, e: any) => sum + e.score, 0) / tlxEntries.length)
    : 0;

  const completedDates = new Set(
    (completedTasks ?? []).map((t: any) =>
      new Date(t.completed_at).toISOString().split('T')[0]
    )
  );
  let streak = 0;
  let checkDate = yesterday;
  while (completedDates.has(formatDate(checkDate))) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  // Apply hierarchy
  // 1. Completion < 80%
  if (completion < 80) {
    const target = Math.min(completion + 10, 90);
    return {
      type: 'completion',
      target_value: target,
      baseline_value: completion,
      label: `Atteindre ${target}% de completion`,
    };
  }

  // 2. Imbalance > 25%
  if (maxImbalance > 0.25) {
    return {
      type: 'balance',
      target_value: 20,
      baseline_value: Math.round(maxImbalance * 100),
      label: 'Reduire le desequilibre sous 20%',
    };
  }

  // 3. TLX > 65
  if (avgTlx > 65) {
    return {
      type: 'tlx',
      target_value: 55,
      baseline_value: avgTlx,
      label: 'Passer la charge mentale sous 55',
    };
  }

  // 4. Streak < 3
  if (streak < 3) {
    return {
      type: 'streak',
      target_value: 5,
      baseline_value: streak,
      label: 'Atteindre 5 jours consecutifs d\'activite',
    };
  }

  // 5. Maintenance (default)
  // Use completion as simplified score proxy
  const score = completion;
  const target = Math.max(score - 5, 50);
  return {
    type: 'maintenance',
    target_value: target,
    baseline_value: score,
    label: `Maintenir le score au-dessus de ${target}`,
  };
}

// ─── Push notifications ─────────────────────────────────────────────────────

async function sendPushToHousehold(
  supabase: any,
  householdId: string,
  objectiveLabel: string
): Promise<number> {
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId);

  if (!members || members.length === 0) return 0;

  const userIds = members.map((m: any) => m.user_id);
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  let sent = 0;
  for (const { token } of tokens ?? []) {
    await sendExpoNotification(token, {
      title: '🎯 Objectif de la semaine',
      body: objectiveLabel,
      data: { type: 'weekly_objective', household_id: householdId },
    });
    sent++;
  }

  return sent;
}

async function sendExpoNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ to: token, sound: 'default', ...payload }),
    });
  } catch (err) {
    console.error('Push error:', err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function errorResponse(message: string) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/supabase/functions/generate-weekly-objective/index.ts
git commit -m "feat(edge): add generate-weekly-objective Edge Function with push"
```

- [ ] **Step 3: Deploy and test**

Run: `cd apps/mobile && npx supabase functions deploy generate-weekly-objective`

To test manually:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-weekly-objective \
  -H "x-cron-secret: <your-cron-secret>" \
  -H "Content-Type: application/json"
```

Expected: `{"success": true, "created": N, "pushed": M, "week_start": "2026-04-06"}`

---

## Task 8: Configure Cron Schedule

- [ ] **Step 1: Add cron job in Supabase Dashboard**

Go to Supabase Dashboard → Database → Extensions → Enable `pg_cron` if not already.

Then in SQL Editor:

```sql
SELECT cron.schedule(
  'generate-weekly-objective',
  '0 7 * * 1',  -- Every Monday at 07:00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-weekly-objective',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Note:** Adapt to match how the existing crons (`compute-weekly-stats`, `send-weekly-review-push`) are configured. Check Supabase Dashboard → Database → Cron Jobs for the exact pattern used.

- [ ] **Step 2: Verify the cron is registered**

Run in SQL Editor: `SELECT * FROM cron.job WHERE jobname = 'generate-weekly-objective';`
Expected: One row with schedule `0 7 * * 1`.

---

## Task 9: End-to-End Verification

- [ ] **Step 1: Test the full flow manually**

1. Call the Edge Function manually (curl from Task 7 Step 3)
2. Open mobile app → Dashboard → HouseholdScoreCard should show the objective section
3. Pull to refresh → `current_value` should update
4. Complete enough tasks to reach the target → section should show "Objectif atteint !"

- [ ] **Step 2: Test empty state**

Delete the objective row from `weekly_objectives` table.
Refresh dashboard → the objective section should be hidden (no crash, no empty card).

- [ ] **Step 3: Test web dashboard**

Open web app → Dashboard → Objective card should appear below the Weekly Tip.
Same states: progress bar, achieved, hidden when no objective.

- [ ] **Step 4: Run lint**

Run: `cd apps/mobile && npm run lint`
Run: `cd apps/web && npm run lint`
Expected: No errors.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address lint and integration issues for weekly objectives"
```
