# Dashboard Keurzen v7 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard on both mobile and web to match the Stitch v7 reference, adding a coaching insights carousel powered by a deterministic Edge Function.

**Architecture:** Vertical scroll layout with 5 sections: greeting header, horizontal insights carousel, score hero card (refactored), 2-column grid (task equity donut + mental load), and upcoming tasks list. Backend adds one Edge Function that computes coaching insights from existing TLX/tasks/weekly-stats data. All UI uses Cafe Cosy design tokens.

**Tech Stack:** Expo/React Native (mobile), Next.js/Tailwind (web), Supabase Edge Functions (Deno), TanStack Query v5, react-native-svg, Ionicons/lucide-react.

**Spec:** `docs/superpowers/specs/2026-04-11-dashboard-v7-redesign-design.md`

---

## File Structure

### Shared
| Action | File | Responsibility |
|---|---|---|
| EDIT | `packages/shared/src/types/index.ts` | Add `CoachingInsight` type |
| NEW | `packages/queries/src/hooks/useCoachingInsights.ts` | TanStack Query hook for insights Edge Function |

### Backend
| Action | File | Responsibility |
|---|---|---|
| NEW | `apps/mobile/supabase/functions/get-coaching-insights/index.ts` | Deterministic rules engine Edge Function |

### Mobile — `apps/mobile/`
| Action | File | Responsibility |
|---|---|---|
| NEW | `src/components/dashboard/InsightCard.tsx` | Single insight card (alert/conseil/wellbeing) |
| NEW | `src/components/dashboard/InsightsCarousel.tsx` | Horizontal FlatList wrapper |
| EDIT | `src/components/dashboard/ScoreHeroCard.tsx` | Refactor: left text + right gauge + blobs |
| NEW | `src/components/dashboard/TaskEquityCard.tsx` | Donut chart with member legend |
| NEW | `src/components/dashboard/MentalLoadCardV2.tsx` | Level text + progress bar (Stitch layout) |
| NEW | `src/components/dashboard/UpcomingTasksCard.tsx` | Task list with circle checkboxes |
| EDIT | `app/(app)/dashboard/index.tsx` | New header + new section order |

### Web — `apps/web/`
| Action | File | Responsibility |
|---|---|---|
| NEW | `src/components/dashboard/InsightCard.tsx` | Single insight card |
| NEW | `src/components/dashboard/InsightsCarousel.tsx` | Horizontal scroll wrapper |
| NEW | `src/components/dashboard/ScoreHeroCard.tsx` | Score card with gauge + blobs |
| NEW | `src/components/dashboard/TaskEquityCard.tsx` | Donut SVG with legend |
| NEW | `src/components/dashboard/MentalLoadCardV2.tsx` | Level text + progress bar |
| NEW | `src/components/dashboard/UpcomingTasksCard.tsx` | Task list with checkboxes |
| EDIT | `src/app/(app)/dashboard/page.tsx` | New layout (remove sidebar, vertical scroll) |

---

## Task 1: Add CoachingInsight type to shared package

**Files:**
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add the CoachingInsight type**

Add at the end of the file, before any closing exports:

```typescript
// ─── Coaching Insights ───
export type InsightType = 'alert' | 'conseil' | 'wellbeing';

export interface CoachingInsight {
  id: string;
  type: InsightType;
  icon: string;
  label: string;
  message: string;
  cta_label: string;
  priority: number;
}
```

- [ ] **Step 2: Verify the build**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | head -20`
Expected: No errors (or pre-existing errors unrelated to our change).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(shared): add CoachingInsight type for dashboard insights"
```

---

## Task 2: Create `get-coaching-insights` Edge Function

**Files:**
- Create: `apps/mobile/supabase/functions/get-coaching-insights/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
/**
 * Keurzen — Edge Function: get-coaching-insights
 *
 * Deterministic rules engine that produces coaching insight cards
 * for the dashboard. No LLM. Reads TLX, tasks, and weekly stats
 * to generate contextual advice.
 *
 * Called by authenticated users. Derives household from auth.uid().
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CoachingInsight {
  id: string;
  type: 'alert' | 'conseil' | 'wellbeing';
  icon: string;
  label: string;
  message: string;
  cta_label: string;
  priority: number;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Authenticate user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user's household
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const householdId = member.household_id;
    const insights: CoachingInsight[] = [];

    // Get current week start (Monday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    // Previous week start
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekStart = prevMonday.toISOString().split('T')[0];

    // Get household members
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id, profiles(full_name)')
      .eq('household_id', householdId);

    const memberNames: Record<string, string> = {};
    for (const m of members ?? []) {
      const profile = m.profiles as { full_name: string | null } | null;
      memberNames[m.user_id] = profile?.full_name?.split(' ')[0] ?? 'Membre';
    }

    // ── Rule 1: TLX Delta Alert ──
    const { data: currentTlx } = await supabase
      .from('tlx_entries')
      .select('user_id, score')
      .eq('household_id', householdId)
      .eq('week_start', weekStart);

    const { data: prevTlx } = await supabase
      .from('tlx_entries')
      .select('user_id, score')
      .eq('household_id', householdId)
      .eq('week_start', prevWeekStart);

    if (currentTlx && prevTlx) {
      for (const entry of currentTlx) {
        const prev = prevTlx.find((p) => p.user_id === entry.user_id);
        if (prev && prev.score > 0) {
          const deltaPct = Math.round(((entry.score - prev.score) / prev.score) * 100);
          if (deltaPct > 10) {
            const name = memberNames[entry.user_id] ?? 'Un membre';
            insights.push({
              id: `tlx-delta-${entry.user_id}`,
              type: 'alert',
              icon: 'warning-outline',
              label: `Attention ${name} !`,
              message: `La charge mentale de ${name} semble augmenter cette semaine (+${deltaPct}%).`,
              cta_label: 'Pense a deleguer',
              priority: 1,
            });
          }
        }
      }
    }

    // ── Rule 2: Task Imbalance ──
    const { data: weeklyStats } = await supabase
      .from('weekly_stats')
      .select('user_id, tasks_share')
      .eq('household_id', householdId)
      .eq('week_start', weekStart);

    if (weeklyStats && weeklyStats.length >= 2) {
      const shares = weeklyStats.map((s) => s.tasks_share);
      const maxShare = Math.max(...shares);
      const minShare = Math.min(...shares);
      if ((maxShare - minShare) > 0.20) {
        insights.push({
          id: 'task-imbalance',
          type: 'conseil',
          icon: 'chatbubble-outline',
          label: 'Conseil',
          message: 'La repartition des taches est desequilibree. Pensez a deleguer.',
          cta_label: 'Voir la repartition',
          priority: 2,
        });
      }
    }

    // ── Rule 3: Task Completion Praise ──
    const todayStr = now.toISOString().split('T')[0];
    const { data: todayDone } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('household_id', householdId)
      .eq('status', 'done')
      .gte('completed_at', `${todayStr}T00:00:00`)
      .lte('completed_at', `${todayStr}T23:59:59`);

    if (todayDone) {
      const counts: Record<string, number> = {};
      for (const t of todayDone) {
        if (t.assigned_to) {
          counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1;
        }
      }
      for (const [userId, count] of Object.entries(counts)) {
        if (count >= 5) {
          const name = memberNames[userId] ?? 'Un membre';
          insights.push({
            id: `praise-${userId}`,
            type: 'wellbeing',
            icon: 'heart-outline',
            label: 'Bien-etre',
            message: `${name} a complete ${count} taches aujourd'hui. Remerciez-le !`,
            cta_label: 'Envoyer un mot doux',
            priority: 3,
          });
        }
      }
    }

    // ── Rule 4: Planning Reminder (Sunday=0 or Monday=1) ──
    if (day === 0 || day === 1) {
      const { data: plannedTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('household_id', householdId)
        .neq('status', 'done')
        .gte('due_date', weekStart)
        .limit(1);

      if (!plannedTasks || plannedTasks.length === 0) {
        insights.push({
          id: 'planning-reminder',
          type: 'conseil',
          icon: 'chatbubble-outline',
          label: 'Conseil',
          message: 'Prenez 15 minutes pour planifier la semaine ensemble.',
          cta_label: 'Planifier',
          priority: 2,
        });
      }
    }

    // ── Rule 5: Fallback ──
    if (insights.length === 0) {
      insights.push({
        id: 'all-good',
        type: 'conseil',
        icon: 'chatbubble-outline',
        label: 'Conseil',
        message: 'Tout va bien ! Continuez sur cette voie.',
        cta_label: 'Voir le tableau de bord',
        priority: 10,
      });
    }

    // Sort by priority (lower first)
    insights.sort((a, b) => a.priority - b.priority);

    return new Response(JSON.stringify(insights), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-coaching-insights error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/supabase/functions/get-coaching-insights/index.ts
git commit -m "feat(backend): add get-coaching-insights Edge Function with deterministic rules"
```

---

## Task 3: Create `useCoachingInsights` hook in shared queries

**Files:**
- Create: `packages/queries/src/hooks/useCoachingInsights.ts`

- [ ] **Step 1: Check existing hook patterns**

Read `packages/queries/src/hooks/useTlx.ts` to understand the pattern for calling Supabase and structuring TanStack Query hooks. The new hook will call the Edge Function via `supabase.functions.invoke('get-coaching-insights')`.

- [ ] **Step 2: Create the hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { CoachingInsight } from '@keurzen/shared';

export const insightKeys = {
  all: (householdId: string) => ['coaching-insights', householdId] as const,
};

export function useCoachingInsights(householdId: string | undefined) {
  return useQuery<CoachingInsight[]>({
    queryKey: insightKeys.all(householdId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-coaching-insights');
      if (error) throw error;
      return data as CoachingInsight[];
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

- [ ] **Step 3: Export the hook from the package barrel**

Check `packages/queries/src/index.ts` (or equivalent barrel file) and add the export:

```typescript
export { useCoachingInsights, insightKeys } from './hooks/useCoachingInsights';
```

- [ ] **Step 4: Commit**

```bash
git add packages/queries/src/hooks/useCoachingInsights.ts packages/queries/src/index.ts
git commit -m "feat(queries): add useCoachingInsights hook for dashboard insights"
```

---

## Task 4: Create mobile InsightCard + InsightsCarousel

**Files:**
- Create: `apps/mobile/src/components/dashboard/InsightCard.tsx`
- Create: `apps/mobile/src/components/dashboard/InsightsCarousel.tsx`

- [ ] **Step 1: Create InsightCard component**

```tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

const typeStyles = {
  alert: {
    bg: `${Colors.rose}1A`,
    borderColor: `${Colors.rose}33`,
    iconColor: Colors.rose,
    ctaColor: Colors.rose,
  },
  conseil: {
    bg: Colors.backgroundCard,
    borderColor: Colors.border,
    iconColor: Colors.miel,
    ctaColor: Colors.terracotta,
  },
  wellbeing: {
    bg: Colors.backgroundCard,
    borderColor: Colors.border,
    iconColor: Colors.rose,
    ctaColor: Colors.terracotta,
  },
} as const;

interface InsightCardProps {
  insight: CoachingInsight;
  onPress?: () => void;
}

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const style = typeStyles[insight.type];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: style.bg, borderColor: style.borderColor },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={insight.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={style.iconColor}
        />
        <Text variant="caption" weight="bold" style={[styles.label, { color: style.iconColor }]}>
          {insight.label.toUpperCase()}
        </Text>
      </View>

      <Text variant="bodySmall" weight="semibold" style={styles.message}>
        {insight.message}
      </Text>

      {onPress && (
        <TouchableOpacity onPress={onPress} style={styles.ctaRow} hitSlop={8}>
          <Text variant="caption" weight="bold" style={{ color: style.ctaColor }}>
            {insight.cta_label}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={style.ctaColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1.2,
  },
  message: {
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
```

- [ ] **Step 2: Create InsightsCarousel component**

```tsx
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing } from '../../constants/tokens';
import { InsightCard } from './InsightCard';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightPress?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightPress }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <View>
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={22} color={Colors.terracotta} />
        <Text variant="h3" weight="bold" style={styles.title}>
          Insights & Actions
        </Text>
      </View>
      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.base }} />}
        renderItem={({ item }) => (
          <InsightCard
            insight={item}
            onPress={onInsightPress ? () => onInsightPress(item) : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/InsightCard.tsx apps/mobile/src/components/dashboard/InsightsCarousel.tsx
git commit -m "feat(mobile): add InsightCard and InsightsCarousel components"
```

---

## Task 5: Refactor mobile ScoreHeroCard to Stitch layout

**Files:**
- Modify: `apps/mobile/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Rewrite ScoreHeroCard with Stitch layout**

Replace the entire file content. The new layout has: decorative blobs, left side (title + score + trend + message), right side (circular gauge with balance icon).

```tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 12;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore ! Continuez sur cette voie.';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
      : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays,
    });
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const score = scoreResult.total;
  const offset = CIRCUMFERENCE * (1 - score / 100);
  // TODO: delta comes from previous week comparison — hardcode 0 for now, will be wired in a follow-up
  const delta = 0;
  const deltaPositive = delta >= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
    >
      <View style={styles.card}>
        {/* Decorative blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text variant="body" weight="bold" style={styles.title}>Score du Foyer</Text>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
        </View>

        {/* Content: left text + right gauge */}
        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <View style={styles.scoreRow}>
              <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
                {score}
              </Text>
              <Text variant="h3" weight="regular" style={styles.scoreMax}>/100</Text>
            </View>

            {delta !== 0 && (
              <View style={styles.trendRow}>
                <Ionicons
                  name={deltaPositive ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={deltaPositive ? Colors.sauge : Colors.rose}
                />
                <Text
                  variant="bodySmall"
                  weight="medium"
                  style={{ color: deltaPositive ? Colors.sauge : Colors.rose }}
                >
                  {deltaPositive ? '+' : ''}{delta}% depuis la sem. derniere
                </Text>
              </View>
            )}

            <Text variant="bodySmall" color="muted" style={styles.coachMessage}>
              {getScoreMessage(score)}
            </Text>
          </View>

          {/* Circular gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
              <Circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS}
                stroke={Colors.gray100}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS}
                stroke={Colors.terracotta}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.gaugeIcon}>
              <Ionicons name="scale-outline" size={28} color={Colors.terracotta} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  blobTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.terracotta}1A`,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.rose}1A`,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    paddingRight: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: Typography.fontSize['4xl'],
    lineHeight: 38,
    color: Colors.textPrimary,
  },
  scoreMax: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  coachMessage: {
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
  },
  gaugeIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat(mobile): refactor ScoreHeroCard to Stitch v7 layout with blobs and balance icon"
```

---

## Task 6: Create mobile TaskEquityCard (donut chart)

**Files:**
- Create: `apps/mobile/src/components/dashboard/TaskEquityCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

const DONUT_SIZE = 96;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MEMBER_COLORS = [Colors.terracotta, Colors.prune, Colors.sauge, Colors.miel];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = members.map((m, i) => ({
    name: m.name.split(' ')[0],
    share: m.tasksShare,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  // Calculate stroke dash offsets for donut segments
  let cumulativeOffset = 0;
  const donutSegments = segments.map((seg) => {
    const dashLength = seg.share * CIRCUMFERENCE;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...seg, dashLength, offset };
  });

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Equite des Taches
      </Text>

      {segments.length >= 2 ? (
        <>
          <View style={styles.donutWrap}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              {donutSegments.map((seg, i) => (
                <Circle
                  key={i}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={RADIUS}
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
                  strokeDashoffset={-seg.offset}
                  rotation={-90}
                  origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
                />
              ))}
            </Svg>
          </View>

          <View style={styles.legend}>
            {segments.map((seg, i) => (
              <View key={i} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text variant="caption" color="muted">{seg.name}</Text>
                </View>
                <Text variant="caption" weight="bold" style={styles.pct}>
                  {Math.round(seg.share * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text variant="bodySmall" color="muted" style={styles.empty}>
          Pas assez de donnees
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  donutWrap: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  legend: {
    gap: Spacing.sm,
    marginTop: 'auto' as unknown as number,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pct: {
    color: Colors.textPrimary,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TaskEquityCard.tsx
git commit -m "feat(mobile): add TaskEquityCard with donut chart"
```

---

## Task 7: Create mobile MentalLoadCardV2 (Stitch layout)

**Files:**
- Create: `apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

function getTlxLevel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: 'Elevee', color: Colors.rose };
  if (score >= 35) return { label: 'Moyenne', color: Colors.miel };
  return { label: 'Faible', color: Colors.sauge };
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const { label, color } = getTlxLevel(score);

  // Find member with highest TLX focus (most tasks or highest delta)
  const focusMember = members.length > 0
    ? members.reduce((a, b) => (Math.abs(b.tasksDelta) > Math.abs(a.tasksDelta) ? b : a))
    : null;

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Charge Mentale
      </Text>

      <View style={styles.center}>
        <Text variant="display" weight="extrabold" style={[styles.levelText, { color }]}>
          {score > 0 ? label : '—'}
        </Text>

        {focusMember && (
          <Text variant="caption" color="muted" style={styles.subtitle}>
            Focus sur {focusMember.name.split(' ')[0]} cette semaine
          </Text>
        )}

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: Typography.fontSize['3xl'],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 16,
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: Spacing.base,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx
git commit -m "feat(mobile): add MentalLoadCardV2 with level text and progress bar"
```

---

## Task 8: Create mobile UpcomingTasksCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useUpdateTaskStatus } from '../../lib/queries/tasks';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const categoryIcons: Record<string, { icon: string; bg: string; color: string }> = {
  cuisine: { icon: 'restaurant-outline', bg: `${Colors.miel}1A`, color: Colors.miel },
  menage: { icon: 'sparkles-outline', bg: `${Colors.rose}1A`, color: Colors.rose },
  courses: { icon: 'cart-outline', bg: `${Colors.terracotta}1A`, color: Colors.terracotta },
  linge: { icon: 'shirt-outline', bg: `${Colors.prune}1A`, color: Colors.prune },
  enfants: { icon: 'people-outline', bg: `${Colors.sauge}1A`, color: Colors.sauge },
  default: { icon: 'checkbox-outline', bg: `${Colors.terracotta}1A`, color: Colors.terracotta },
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'Sans date';
  const d = dayjs(dateStr);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcoming = allTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf())
    .slice(0, 5);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Taches a venir
        </Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={8}>
          <Text variant="bodySmall" weight="bold" style={styles.seeAll}>
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      {upcoming.length > 0 ? (
        <View style={styles.taskList}>
          {upcoming.map((task) => {
            const cat = categoryIcons[task.category] ?? categoryIcons.default;
            const assigneeName = task.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne';
            return (
              <View key={task.id} style={styles.taskRow}>
                <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={cat.color}
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskTitle}>
                    {task.title}
                  </Text>
                  <Text variant="caption" color="muted">
                    {formatDueDate(task.due_date)} • {assigneeName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateStatus({ id: task.id, status: 'done' })}
                  hitSlop={8}
                  accessibilityLabel={`Marquer ${task.title} comme terminee`}
                >
                  <View style={styles.checkbox} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text variant="body" color="muted" style={styles.emptyText}>
            Aucune tache a venir
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
  },
  seeAll: {
    color: Colors.terracotta,
  },
  taskList: {
    gap: Spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginLeft: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx
git commit -m "feat(mobile): add UpcomingTasksCard with circle checkboxes"
```

---

## Task 9: Rewrite mobile dashboard layout

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx`

- [ ] **Step 1: Rewrite the dashboard screen**

Replace the entire file. The new layout has: greeting header with mascot + notification bell, insights carousel, score card, 2-column grid, upcoming tasks.

```tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useCoachingInsights } from '@keurzen/queries';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { InsightsCarousel } from '../../../src/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '../../../src/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '../../../src/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '../../../src/components/dashboard/UpcomingTasksCard';

// ─── Staggered fade-in ──────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  const animsRef = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
    })),
  );

  useEffect(() => {
    const anims = animsRef.current;
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 450,
          delay: i * 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 450,
          delay: i * 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, []);

  return animsRef.current;
}

function FadeSection({
  anim,
  style,
  children,
}: {
  anim: { opacity: Animated.Value; translateY: Animated.Value };
  style?: object | object[];
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={[
        style,
        { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: insights = [] } = useCoachingInsights(household?.id);

  const fadeAnims = useStaggeredFadeIn(6); // header + 5 sections

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text variant="h2">Bienvenue</Text>
          <Mascot size={44} expression="calm" />
        </View>
        <EmptyState
          variant="household"
          expression="normal"
          title="Votre foyer vous attend"
          subtitle="Creez un foyer ou rejoignez-en un avec un code d'invitation."
          action={{ label: 'Creer un foyer', onPress: () => router.navigate('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.terracotta}
            colors={[Colors.terracotta]}
          />
        }
      >
        {/* ── HEADER ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.mascotCircle}>
              <Mascot size={36} expression="calm" />
            </View>
            <View>
              <Text variant="h2" weight="bold" style={styles.greeting}>
                Bonjour, <Text style={styles.firstNameAccent}>{firstName}</Text>
              </Text>
              <Text variant="bodySmall" color="muted">
                Prete a equilibrer votre quotidien ?
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/notifications')}
            style={styles.bellButton}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. INSIGHTS CAROUSEL ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <InsightsCarousel insights={insights} />
        </FadeSection>

        {/* ── 2. SCORE DU FOYER ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.sectionPadded}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 3. GRID: Equity + Mental Load ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.sectionPadded}>
          <View style={styles.gridRow}>
            <TaskEquityCard />
            <View style={{ width: Spacing.base }} />
            <MentalLoadCardV2 />
          </View>
        </FadeSection>

        {/* ── 4. UPCOMING TASKS ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.sectionPadded}>
          <UpcomingTasksCard />
        </FadeSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  mascotCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
  },
  firstNameAccent: {
    color: Colors.terracotta,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionPadded: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\\(app\\)/dashboard/index.tsx
git commit -m "feat(mobile): rewrite dashboard layout with Stitch v7 design (greeting header, insights, grid)"
```

---

## Task 10: Create web InsightCard + InsightsCarousel

**Files:**
- Create: `apps/web/src/components/dashboard/InsightCard.tsx`
- Create: `apps/web/src/components/dashboard/InsightsCarousel.tsx`

- [ ] **Step 1: Create web InsightCard**

```tsx
'use client';

import type { CoachingInsight } from '@keurzen/shared';

const typeStyles = {
  alert: {
    bg: 'bg-rose/10',
    border: 'border-rose/20',
    iconColor: 'text-rose',
    ctaColor: 'text-rose',
  },
  conseil: {
    bg: 'bg-background-card',
    border: 'border-border',
    iconColor: 'text-miel',
    ctaColor: 'text-terracotta',
  },
  wellbeing: {
    bg: 'bg-background-card',
    border: 'border-border',
    iconColor: 'text-rose',
    ctaColor: 'text-terracotta',
  },
} as const;

// Map Ionicon names to lucide-react equivalents
const iconMap: Record<string, string> = {
  'warning-outline': '⚠️',
  'chatbubble-outline': '💬',
  'heart-outline': '❤️',
};

interface InsightCardProps {
  insight: CoachingInsight;
  onClick?: () => void;
}

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const style = typeStyles[insight.type];

  return (
    <div
      className={`min-w-[280px] shrink-0 rounded-2xl p-4 border shadow-card flex flex-col justify-between ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-base ${style.iconColor}`}>
          {iconMap[insight.icon] ?? '💡'}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.iconColor}`}>
          {insight.label}
        </span>
      </div>

      <p className="text-sm font-semibold text-text-primary mb-3">
        {insight.message}
      </p>

      {onClick && (
        <button
          onClick={onClick}
          className={`text-xs font-bold flex items-center gap-1 self-start ${style.ctaColor} hover:opacity-80 transition-opacity`}
        >
          {insight.cta_label}
          <span className="text-sm">→</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create web InsightsCarousel**

```tsx
'use client';

import type { CoachingInsight } from '@keurzen/shared';
import { InsightCard } from './InsightCard';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightClick?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightClick }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary mb-4">
        <span className="text-terracotta">💡</span>
        Insights & Actions
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={onInsightClick ? () => onInsightClick(insight) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/InsightCard.tsx apps/web/src/components/dashboard/InsightsCarousel.tsx
git commit -m "feat(web): add InsightCard and InsightsCarousel components"
```

---

## Task 11: Create web ScoreHeroCard

**Files:**
- Create: `apps/web/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared/utils';
import { useMemo } from 'react';

const GAUGE_R = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

function getScoreMessage(score: number): string {
  if (score >= 80) return "Votre repartition s'ameliore ! Continuez sur cette voie.";
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
      : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays: 0,
    }).total;
  }, [allTasks, balanceMembers, currentTlx]);

  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push('/dashboard/weekly-review')}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-terracotta/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-rose/10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">Score du Foyer</h2>
          <span className="text-text-muted text-sm">ⓘ</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <p className="text-text-primary">
              <span className="font-heading text-4xl font-extrabold">{score}</span>
              <span className="text-xl text-text-muted font-normal">/100</span>
            </p>
            <p className="text-sm text-text-muted mt-3">
              {getScoreMessage(score)}
            </p>
          </div>

          {/* Circular gauge */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={GAUGE_R}
                fill="none"
                stroke="var(--color-border-light)"
                strokeWidth={STROKE}
              />
              <circle
                cx="50" cy="50" r={GAUGE_R}
                fill="none"
                stroke="var(--color-terracotta)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl text-terracotta">⚖️</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat(web): add ScoreHeroCard with circular gauge and blobs"
```

---

## Task 12: Create web TaskEquityCard + MentalLoadCardV2

**Files:**
- Create: `apps/web/src/components/dashboard/TaskEquityCard.tsx`
- Create: `apps/web/src/components/dashboard/MentalLoadCardV2.tsx`

- [ ] **Step 1: Create web TaskEquityCard**

```tsx
'use client';

import { useWeeklyBalance } from '@keurzen/queries';

const DONUT_R = 35;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;
const MEMBER_COLORS = ['var(--color-terracotta)', 'var(--color-prune)', 'var(--color-sauge)', 'var(--color-miel)'];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = members.map((m, i) => ({
    name: m.name.split(' ')[0],
    share: m.tasksShare,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  let cumulativeOffset = 0;
  const donutSegments = segments.map((seg) => {
    const dashLength = seg.share * CIRCUMFERENCE;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...seg, dashLength, offset };
  });

  return (
    <section className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <h3 className="text-sm font-bold text-text-primary text-center mb-4">
        Equite des Taches
      </h3>

      {segments.length >= 2 ? (
        <>
          <div className="flex justify-center mb-4">
            <svg width="96" height="96" className="-rotate-90">
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="48" cy="48" r={DONUT_R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
                  strokeDashoffset={-seg.offset}
                />
              ))}
            </svg>
          </div>

          <div className="space-y-2 mt-auto">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-text-muted">{seg.name}</span>
                </div>
                <span className="font-bold text-text-primary">{Math.round(seg.share * 100)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-text-muted">Pas assez de donnees</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Create web MentalLoadCardV2**

```tsx
'use client';

import { useCurrentTlx, useWeeklyBalance } from '@keurzen/queries';

function getTlxLevel(score: number): { label: string; colorClass: string; barColor: string } {
  if (score >= 65) return { label: 'Elevee', colorClass: 'text-rose', barColor: 'var(--color-rose)' };
  if (score >= 35) return { label: 'Moyenne', colorClass: 'text-miel', barColor: 'var(--color-miel)' };
  return { label: 'Faible', colorClass: 'text-sauge', barColor: 'var(--color-sauge)' };
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const { label, colorClass, barColor } = getTlxLevel(score);

  const focusMember = members.length > 0
    ? members.reduce((a, b) => (Math.abs(b.tasksDelta) > Math.abs(a.tasksDelta) ? b : a))
    : null;

  return (
    <section className="rounded-3xl bg-background-card p-5 shadow-card flex flex-col">
      <h3 className="text-sm font-bold text-text-primary text-center mb-2">
        Charge Mentale
      </h3>

      <div className="flex-1 flex flex-col justify-center items-center">
        <div className={`font-heading text-3xl font-extrabold mb-1 ${colorClass}`}>
          {score > 0 ? label : '\u2014'}
        </div>
        {focusMember && (
          <p className="text-xs text-text-muted text-center leading-tight">
            Focus sur {focusMember.name.split(' ')[0]} cette semaine
          </p>
        )}
        <div className="w-full mt-4 h-2.5 rounded-full bg-border-light overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/TaskEquityCard.tsx apps/web/src/components/dashboard/MentalLoadCardV2.tsx
git commit -m "feat(web): add TaskEquityCard and MentalLoadCardV2 components"
```

---

## Task 13: Create web UpcomingTasksCard

**Files:**
- Create: `apps/web/src/components/dashboard/UpcomingTasksCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const categoryIcons: Record<string, string> = {
  cuisine: '🍳',
  menage: '🧹',
  courses: '🛒',
  linge: '👕',
  enfants: '👶',
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'Sans date';
  const d = dayjs(dateStr);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcoming = allTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf())
    .slice(0, 5);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">Taches a venir</h2>
        <button
          onClick={() => router.push('/tasks')}
          className="text-sm font-bold text-terracotta hover:opacity-80 transition-opacity"
        >
          Voir tout
        </button>
      </div>

      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((task) => {
            const icon = categoryIcons[task.category] ?? '✅';
            const assigneeName = task.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne';
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl bg-background-card p-4 shadow-sm border border-border-light"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{task.title}</h4>
                    <p className="text-xs text-text-muted">
                      {formatDueDate(task.due_date)} • {assigneeName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateStatus({ id: task.id, status: 'done' })}
                  className="w-6 h-6 rounded-full border-2 border-border shrink-0 hover:border-terracotta transition-colors"
                  aria-label={`Marquer ${task.title} comme terminee`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-background-card p-6 shadow-sm text-center">
          <p className="text-sm text-text-muted">Aucune tache a venir</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/UpcomingTasksCard.tsx
git commit -m "feat(web): add UpcomingTasksCard with circle checkboxes"
```

---

## Task 14: Rewrite web dashboard page

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire file. Removes sidebar layout, adopts vertical scroll with all new components.

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import { useCoachingInsights } from '@keurzen/queries';
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '@/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '@/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '@/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { household } = useHouseholdStore();
  const { data: insights = [] } = useCoachingInsights(household?.id);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-background-card shadow-card flex items-center justify-center">
            <span className="text-2xl">🏠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Bonjour, <span className="text-terracotta">{firstName}</span>
            </h1>
            <p className="text-sm text-text-muted">Prete a equilibrer votre quotidien ?</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-background-card shadow-card flex items-center justify-center text-text-primary hover:bg-border-light transition-colors"
        >
          🔔
        </button>
      </header>

      {/* Insights */}
      <InsightsCarousel insights={insights} />

      {/* Score */}
      <ScoreHeroCard />

      {/* Grid: Equity + Mental Load */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <TaskEquityCard />
        <MentalLoadCardV2 />
      </div>

      {/* Upcoming Tasks */}
      <UpcomingTasksCard />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\\(app\\)/dashboard/page.tsx
git commit -m "feat(web): rewrite dashboard page with Stitch v7 layout (greeting, insights, grid)"
```

---

## Task 15: Verify builds on both platforms

- [ ] **Step 1: Run mobile TypeScript check**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit -p apps/mobile/tsconfig.json 2>&1 | head -30`
Expected: No new errors from our changes.

- [ ] **Step 2: Run web build**

Run: `cd /Users/ouss/Keurzen/apps/web && npm run build 2>&1 | tail -30`
Expected: Build succeeds.

- [ ] **Step 3: Fix any issues**

Address TypeScript errors, missing imports, or build failures. Common fixes:
- Import paths for `@keurzen/shared` and `@keurzen/queries` may need adjustment based on actual barrel exports.
- `computeHouseholdScore` import path in web may differ from mobile (check actual export location).
- `useUpdateTaskStatus` might need to be verified in the shared queries package exports.

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors from dashboard v7 redesign"
```
