# Dashboard Analytics Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/dashboard/analytics` page (mobile + web) showing live weekly metrics — household score breakdown, task/time equity, TLX detail, coaching insights, and 4-week trends.

**Architecture:** New route on both platforms. Shared `useAnalyticsTrends` hook in `@keurzen/queries`. Mobile uses SVG bars (no chart lib). Web uses `recharts` for trend lines. Reuses existing InsightCard components. Navigation updated from score cards.

**Tech Stack:** React Native + Expo Router (mobile), Next.js App Router + recharts (web), TanStack Query, @keurzen/shared types, Cafe Cosy design system

---

## File Map

### Create

| File | Purpose |
|------|---------|
| `packages/queries/src/hooks/useAnalyticsTrends.ts` | Shared hook: 4-week weekly_stats + tlx trends |
| `apps/mobile/app/(app)/dashboard/analytics.tsx` | Mobile analytics screen |
| `apps/mobile/src/components/analytics/ScoreBreakdownCard.tsx` | Score hero with dimension breakdown |
| `apps/mobile/src/components/analytics/EquitySection.tsx` | Stacked bar + member list (tasks or time) |
| `apps/mobile/src/components/analytics/TlxDetailSection.tsx` | 6-dimension TLX bars |
| `apps/mobile/src/components/analytics/TrendsSection.tsx` | 4-week SVG mini sparklines |
| `apps/web/src/app/(app)/dashboard/analytics/page.tsx` | Web analytics page |
| `apps/web/src/components/analytics/ScoreBreakdownCard.tsx` | Score hero with dimension breakdown |
| `apps/web/src/components/analytics/EquitySection.tsx` | Stacked bar + member list |
| `apps/web/src/components/analytics/TlxDetailSection.tsx` | 6-dimension TLX bars |
| `apps/web/src/components/analytics/TrendsSection.tsx` | recharts trend lines |

### Modify

| File | Change |
|------|--------|
| `packages/queries/src/index.ts` | Add `export * from './hooks/useAnalyticsTrends'` |
| `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx` | Change route to `analytics` |
| `apps/web/src/components/dashboard/ScoreHeroCard.tsx` | Change route to `/dashboard/analytics` |

---

### Task 1: Shared hook — useAnalyticsTrends

**Files:**
- Create: `packages/queries/src/hooks/useAnalyticsTrends.ts`
- Modify: `packages/queries/src/index.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// packages/queries/src/hooks/useAnalyticsTrends.ts
import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { WeeklyStat, TlxEntry } from '@keurzen/shared';
import { getSupabaseClient } from '../client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export interface WeekTrend {
  weekStart: string;
  weekLabel: string; // "S14", "S15", etc.
  totalTasks: number;
  totalMinutes: number;
  avgTlxScore: number | null;
}

export const analyticsTrendsKeys = {
  trends: (householdId: string, weeks: number) =>
    ['analytics-trends', householdId, weeks] as const,
};

export function useAnalyticsTrends(weeks = 4) {
  const { currentHousehold } = useHouseholdStore();
  const householdId = currentHousehold?.id ?? '';

  return useQuery<WeekTrend[]>({
    queryKey: analyticsTrendsKeys.trends(householdId, weeks),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const currentWeekStart = dayjs().startOf('isoWeek');
      const startDate = currentWeekStart
        .subtract(weeks - 1, 'week')
        .format('YYYY-MM-DD');

      // Fetch weekly stats for the household
      const { data: stats, error: statsErr } = await supabase
        .from('weekly_stats')
        .select('week_start, tasks_count, minutes_total, user_id')
        .eq('household_id', householdId)
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });

      if (statsErr) throw new Error(statsErr.message);

      // Fetch TLX entries for all members
      const { data: tlxEntries, error: tlxErr } = await supabase
        .from('tlx_entries')
        .select('week_start, score, user_id')
        .eq('household_id', householdId)
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });

      if (tlxErr) throw new Error(tlxErr.message);

      // Group by week
      const weekMap = new Map<string, WeekTrend>();

      for (let i = 0; i < weeks; i++) {
        const ws = currentWeekStart.subtract(weeks - 1 - i, 'week');
        const wsStr = ws.format('YYYY-MM-DD');
        const weekLabel = `S${ws.isoWeek()}`;
        weekMap.set(wsStr, {
          weekStart: wsStr,
          weekLabel,
          totalTasks: 0,
          totalMinutes: 0,
          avgTlxScore: null,
        });
      }

      // Aggregate stats (sum across members per week)
      const seenUsers = new Map<string, Set<string>>();
      for (const s of (stats as WeeklyStat[]) ?? []) {
        const entry = weekMap.get(s.week_start);
        if (!entry) continue;
        // Avoid double-counting: track user_id per week
        if (!seenUsers.has(s.week_start)) seenUsers.set(s.week_start, new Set());
        const users = seenUsers.get(s.week_start)!;
        if (users.has(s.user_id)) continue;
        users.add(s.user_id);
        entry.totalTasks += s.tasks_count;
        entry.totalMinutes += s.minutes_total;
      }

      // Aggregate TLX (average across members per week)
      const tlxByWeek = new Map<string, number[]>();
      for (const t of (tlxEntries as TlxEntry[]) ?? []) {
        if (!tlxByWeek.has(t.week_start)) tlxByWeek.set(t.week_start, []);
        tlxByWeek.get(t.week_start)!.push(t.score);
      }
      for (const [ws, scores] of tlxByWeek) {
        const entry = weekMap.get(ws);
        if (entry && scores.length > 0) {
          entry.avgTlxScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
        }
      }

      return Array.from(weekMap.values());
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 2: Export from index**

Add to `packages/queries/src/index.ts`:

```typescript
export * from './hooks/useAnalyticsTrends';
```

- [ ] **Step 3: Verify build**

Run: `cd packages/queries && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/queries/src/hooks/useAnalyticsTrends.ts packages/queries/src/index.ts
git commit -m "feat(queries): add useAnalyticsTrends hook for 4-week trends"
```

---

### Task 2: Mobile — ScoreBreakdownCard

**Files:**
- Create: `apps/mobile/src/components/analytics/ScoreBreakdownCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/mobile/src/components/analytics/ScoreBreakdownCard.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const RING_SIZE = 160;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.sauge;
  if (score >= 40) return Colors.miel;
  return Colors.rose;
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Equilibre';
  if (score >= 40) return 'A surveiller';
  return 'Fragile';
}

const DIMENSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  completion: 'checkmark-circle-outline',
  balance: 'scale-outline',
  tlx: 'brain-outline',
  streak: 'flame-outline',
};

const DIMENSION_LABELS: Record<string, string> = {
  completion: 'Taches',
  balance: 'Equilibre',
  tlx: 'Charge mentale',
  streak: 'Regularite',
};

export function ScoreBreakdownCard() {
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance =
      balanceMembers.length > 0
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

  const scoreColor = getScoreColor(scoreResult.total);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - scoreResult.total / 100);

  return (
    <View style={styles.card}>
      {/* Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.gray100} stopOpacity="1" />
              <Stop offset="1" stopColor={Colors.borderLight} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#bgGrad)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={scoreColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
            {scoreResult.total}
          </Text>
          <Text variant="caption" color="muted">/100</Text>
        </View>
      </View>

      <Text variant="h3" weight="bold" style={[styles.levelLabel, { color: scoreColor }]}>
        {getScoreLevel(scoreResult.total)}
      </Text>

      {/* Dimension breakdown */}
      <View style={styles.dimensionsRow}>
        {Object.entries(scoreResult.dimensions).map(([key, dim]) => (
          <View key={key} style={styles.dimensionItem}>
            <Ionicons
              name={DIMENSION_ICONS[key] ?? 'ellipse-outline'}
              size={20}
              color={Colors.textSecondary}
            />
            <Text variant="h3" weight="bold" style={styles.dimensionValue}>
              {dim.value}
            </Text>
            <Text variant="caption" color="muted" style={styles.dimensionLabel}>
              {DIMENSION_LABELS[key] ?? dim.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  gaugeContainer: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  scoreNumber: {
    fontSize: 44,
    lineHeight: 52,
    color: Colors.textPrimary,
  },
  levelLabel: {
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.xl,
  },
  dimensionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dimensionItem: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  dimensionValue: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  dimensionLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/analytics/ScoreBreakdownCard.tsx
git commit -m "feat(mobile): add ScoreBreakdownCard for analytics page"
```

---

### Task 3: Mobile — EquitySection

**Files:**
- Create: `apps/mobile/src/components/analytics/EquitySection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/mobile/src/components/analytics/EquitySection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import type { MemberBalance } from '@keurzen/queries';

const MEMBER_COLORS = [
  Colors.terracotta,
  Colors.prune,
  Colors.sauge,
  Colors.miel,
  Colors.rose,
];

function getDeltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.10) return Colors.sauge;
  if (abs < 0.20) return Colors.miel;
  return Colors.rose;
}

interface EquitySectionProps {
  title: string;
  members: MemberBalance[];
  shareKey: 'tasksShare' | 'minutesShare';
  deltaKey: 'tasksDelta' | 'minutesDelta';
  countKey?: 'tasksCount' | 'minutesTotal';
}

export function EquitySection({
  title,
  members,
  shareKey,
  deltaKey,
}: EquitySectionProps) {
  if (members.length < 2) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Pas assez de donnees cette semaine
        </Text>
      </View>
    );
  }

  const expectedShare = members.length > 0 ? 1 / members.length : 0;

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        {title}
      </Text>

      {/* Stacked bar */}
      <View style={styles.stackedBar}>
        {members.map((m, i) => {
          const share = m[shareKey];
          const color = m.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
          if (share <= 0) return null;
          return (
            <View
              key={m.userId}
              style={[styles.barSegment, { flex: share, backgroundColor: color }]}
            />
          );
        })}
      </View>

      {/* Member list */}
      <View style={styles.memberList}>
        {members.map((m, i) => {
          const share = m[shareKey];
          const delta = m[deltaKey];
          const color = m.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
          const deltaColor = getDeltaColor(delta);
          const deltaSign = delta > 0 ? '+' : '';

          return (
            <View key={m.userId} style={styles.memberRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text variant="bodySmall" style={styles.memberName} numberOfLines={1}>
                {m.name.split(' ')[0]}
              </Text>
              <Text variant="bodySmall" weight="bold" style={styles.memberPct}>
                {Math.round(share * 100)}%
              </Text>
              <Text variant="caption" color="muted" style={styles.memberExpected}>
                /{Math.round(expectedShare * 100)}%
              </Text>
              <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '1A' }]}>
                <Text
                  variant="caption"
                  weight="semibold"
                  style={[styles.deltaText, { color: deltaColor }]}
                >
                  {deltaSign}{Math.round(delta * 100)}pp
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  barSegment: {
    height: '100%',
  },
  memberList: {
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  memberPct: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    minWidth: 32,
    textAlign: 'right',
  },
  memberExpected: {
    fontSize: Typography.fontSize.xs,
    minWidth: 32,
  },
  deltaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  deltaText: {
    fontSize: Typography.fontSize.xs,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/analytics/EquitySection.tsx
git commit -m "feat(mobile): add EquitySection for task/time equity display"
```

---

### Task 4: Mobile — TlxDetailSection

**Files:**
- Create: `apps/mobile/src/components/analytics/TlxDetailSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/mobile/src/components/analytics/TlxDetailSection.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useCurrentTlx, useTlxDelta } from '../../lib/queries/tlx';

const TLX_DIMENSIONS = [
  { key: 'mental_demand', label: 'Exigence mentale' },
  { key: 'physical_demand', label: 'Exigence physique' },
  { key: 'temporal_demand', label: 'Pression temporelle' },
  { key: 'effort', label: 'Effort' },
  { key: 'frustration', label: 'Frustration' },
  { key: 'performance', label: 'Performance' },
] as const;

function getBarColor(value: number): string {
  if (value < 40) return Colors.sauge;
  if (value <= 70) return Colors.miel;
  return Colors.rose;
}

export function TlxDetailSection() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  if (!currentTlx) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Charge mentale (TLX)
        </Text>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color="muted" style={styles.emptyText}>
            Remplissez le TLX pour voir votre charge mentale
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(app)/dashboard/tlx')}
            activeOpacity={0.7}
          >
            <Text variant="label" weight="bold" style={styles.ctaText}>
              REMPLIR LE TLX
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const score = currentTlx.score;
  const scoreColor = getBarColor(score);

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Charge mentale (TLX)
      </Text>

      {/* Score + delta */}
      <View style={styles.scoreRow}>
        <Text variant="h2" weight="extrabold" style={[styles.scoreValue, { color: scoreColor }]}>
          {score}
        </Text>
        <Text variant="bodySmall" color="muted">/100</Text>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <View style={styles.deltaRow}>
            <Ionicons
              name={tlxDelta.delta > 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={tlxDelta.delta > 0 ? Colors.rose : Colors.sauge}
            />
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: tlxDelta.delta > 0 ? Colors.rose : Colors.sauge }}
            >
              {Math.abs(tlxDelta.delta)} pts
            </Text>
          </View>
        )}
      </View>

      {/* Dimension bars */}
      <View style={styles.dimensions}>
        {TLX_DIMENSIONS.map(({ key, label }) => {
          const value = currentTlx[key];
          const barColor = getBarColor(value);
          return (
            <View key={key} style={styles.dimensionRow}>
              <Text variant="caption" color="secondary" style={styles.dimLabel}>
                {label}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${value}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text variant="caption" weight="semibold" style={styles.dimValue}>
                {value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  scoreValue: {
    fontSize: Typography.fontSize['3xl'],
    lineHeight: Typography.fontSize['3xl'] * 1.2,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
  },
  dimensions: {
    gap: Spacing.md,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dimLabel: {
    width: 110,
    fontSize: Typography.fontSize.xs,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  dimValue: {
    width: 28,
    textAlign: 'right',
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.base,
  },
  emptyText: {
    textAlign: 'center',
  },
  ctaButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.button,
  },
  ctaText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/analytics/TlxDetailSection.tsx
git commit -m "feat(mobile): add TlxDetailSection for analytics page"
```

---

### Task 5: Mobile — TrendsSection

**Files:**
- Create: `apps/mobile/src/components/analytics/TrendsSection.tsx`

Uses simple SVG polylines — no chart library needed on mobile.

- [ ] **Step 1: Create the component**

```tsx
// apps/mobile/src/components/analytics/TrendsSection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useAnalyticsTrends } from '@keurzen/queries';
import type { WeekTrend } from '@keurzen/queries';

const CHART_W = 280;
const CHART_H = 100;
const PAD_X = 24;
const PAD_TOP = 8;
const PAD_BOTTOM = 20;

function buildPoints(
  data: WeekTrend[],
  accessor: (d: WeekTrend) => number | null,
): string {
  const validData = data.filter((d) => accessor(d) !== null);
  if (validData.length < 2) return '';

  const n = data.length;
  const usableW = CHART_W - PAD_X * 2;
  const usableH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const values = data.map((d) => accessor(d) ?? 0);
  const max = Math.max(...values, 1);

  return data
    .map((d, i) => {
      const v = accessor(d) ?? 0;
      const x = PAD_X + (i / (n - 1)) * usableW;
      const y = PAD_TOP + usableH - (v / max) * usableH;
      return `${x},${y}`;
    })
    .join(' ');
}

interface MiniChartProps {
  title: string;
  data: WeekTrend[];
  accessor: (d: WeekTrend) => number | null;
  color: string;
  unit?: string;
}

function MiniChart({ title, data, accessor, color, unit = '' }: MiniChartProps) {
  const points = buildPoints(data, accessor);
  const n = data.length;
  const usableW = CHART_W - PAD_X * 2;

  return (
    <View style={styles.chartCard}>
      <Text variant="caption" weight="semibold" style={styles.chartTitle}>
        {title}
      </Text>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((pct) => {
          const y = PAD_TOP + (CHART_H - PAD_TOP - PAD_BOTTOM) * (1 - pct);
          return (
            <Line
              key={pct}
              x1={PAD_X}
              y1={y}
              x2={CHART_W - PAD_X}
              y2={y}
              stroke={Colors.borderLight}
              strokeWidth={1}
            />
          );
        })}
        {/* Data line */}
        {points ? (
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {/* Data points */}
        {data.map((d, i) => {
          const v = accessor(d);
          if (v === null) return null;
          const values = data.map((dd) => accessor(dd) ?? 0);
          const max = Math.max(...values, 1);
          const usableH = CHART_H - PAD_TOP - PAD_BOTTOM;
          const x = PAD_X + (i / (n - 1)) * usableW;
          const y = PAD_TOP + usableH - (v / max) * usableH;
          return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
        {/* X labels */}
        {data.map((d, i) => {
          const x = PAD_X + (i / (n - 1)) * usableW;
          return (
            <SvgText
              key={i}
              x={x}
              y={CHART_H - 4}
              fontSize={10}
              fill={Colors.textMuted}
              textAnchor="middle"
            >
              {d.weekLabel}
            </SvgText>
          );
        })}
      </Svg>
      {/* Current value */}
      {data.length > 0 && accessor(data[data.length - 1]) !== null && (
        <Text variant="caption" color="muted" style={styles.currentValue}>
          Cette semaine : {accessor(data[data.length - 1])}{unit}
        </Text>
      )}
    </View>
  );
}

export function TrendsSection() {
  const { data: trends = [], isLoading } = useAnalyticsTrends(4);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Evolution sur 4 semaines
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Chargement...
        </Text>
      </View>
    );
  }

  const hasEnoughData = trends.filter((t) => t.totalTasks > 0).length >= 2;

  if (!hasEnoughData) {
    return (
      <View style={styles.card}>
        <Text variant="bodySmall" weight="bold" style={styles.title}>
          Evolution sur 4 semaines
        </Text>
        <Text variant="bodySmall" color="muted" style={styles.emptyText}>
          Les tendances apparaitront apres 2 semaines d'utilisation
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="bodySmall" weight="bold" style={styles.title}>
        Evolution sur 4 semaines
      </Text>
      <MiniChart
        title="Taches completees"
        data={trends}
        accessor={(d) => d.totalTasks}
        color={Colors.terracotta}
      />
      <MiniChart
        title="Charge mentale (TLX)"
        data={trends}
        accessor={(d) => d.avgTlxScore}
        color={Colors.prune}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  chartCard: {
    marginBottom: Spacing.base,
    alignItems: 'center',
  },
  chartTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  currentValue: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/analytics/TrendsSection.tsx
git commit -m "feat(mobile): add TrendsSection with SVG sparklines"
```

---

### Task 6: Mobile — Analytics Screen

**Files:**
- Create: `apps/mobile/app/(app)/dashboard/analytics.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// apps/mobile/app/(app)/dashboard/analytics.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../src/components/ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/tokens';
import { useWeeklyBalance, useCoachingInsights } from '@keurzen/queries';

import { ScoreBreakdownCard } from '../../src/components/analytics/ScoreBreakdownCard';
import { EquitySection } from '../../src/components/analytics/EquitySection';
import { TlxDetailSection } from '../../src/components/analytics/TlxDetailSection';
import { TrendsSection } from '../../src/components/analytics/TrendsSection';
import { InsightCard } from '../../src/components/dashboard/InsightCard';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { members } = useWeeklyBalance();
  const { data: insights = [] } = useCoachingInsights();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Analyse de la semaine
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Score breakdown */}
        <ScoreBreakdownCard />

        {/* 2. Task equity */}
        <EquitySection
          title="Repartition des taches"
          members={members}
          shareKey="tasksShare"
          deltaKey="tasksDelta"
        />

        {/* 3. Time equity */}
        <EquitySection
          title="Repartition du temps"
          members={members}
          shareKey="minutesShare"
          deltaKey="minutesDelta"
        />

        {/* 4. TLX detail */}
        <TlxDetailSection />

        {/* 5. Coaching insights */}
        <View style={styles.section}>
          <Text variant="bodySmall" weight="bold" style={styles.sectionTitle}>
            Conseils du coach
          </Text>
          {insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          ) : (
            <View style={styles.insightFallback}>
              <Text variant="bodySmall" color="muted">
                Tout va bien ! Aucun conseil pour le moment.
              </Text>
            </View>
          )}
        </View>

        {/* 6. Trends */}
        <TrendsSection />

        {/* Link to weekly review */}
        <TouchableOpacity
          style={styles.weeklyReviewLink}
          onPress={() => router.push('/(app)/dashboard/weekly-review')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={18} color={Colors.terracotta} />
          <Text variant="bodySmall" weight="semibold" style={styles.weeklyReviewText}>
            Voir le rapport IA de la semaine
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.terracotta} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  section: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightFallback: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  weeklyReviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  weeklyReviewText: {
    color: Colors.terracotta,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(app)/dashboard/analytics.tsx
git commit -m "feat(mobile): add analytics screen with all 6 sections"
```

---

### Task 7: Web — Install recharts

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install recharts**

Run: `cd apps/web && npm install recharts`

- [ ] **Step 2: Commit**

```bash
git add apps/web/package.json package-lock.json
git commit -m "chore(web): add recharts dependency for analytics charts"
```

---

### Task 8: Web — ScoreBreakdownCard

**Files:**
- Create: `apps/web/src/components/analytics/ScoreBreakdownCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/analytics/ScoreBreakdownCard.tsx
'use client';

import { useMemo } from 'react';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

const GAUGE_R = 56;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const SVG_SIZE = (GAUGE_R + STROKE) * 2;

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-sauge)';
  if (score >= 40) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Equilibre';
  if (score >= 40) return 'A surveiller';
  return 'Fragile';
}

const DIMENSIONS = [
  { key: 'completion', label: 'Taches', emoji: '✅' },
  { key: 'balance', label: 'Equilibre', emoji: '⚖️' },
  { key: 'tlx', label: 'Charge mentale', emoji: '🧠' },
  { key: 'streak', label: 'Regularite', emoji: '🔥' },
] as const;

export function ScoreBreakdownCard() {
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance =
      balanceMembers.length > 0
        ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
        : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays: 0,
    });
  }, [allTasks, balanceMembers, currentTlx]);

  const scoreColor = getScoreColor(scoreResult.total);
  const dashOffset = CIRCUMFERENCE * (1 - scoreResult.total / 100);

  return (
    <div className="rounded-2xl bg-background-card p-6 shadow-card flex flex-col items-center">
      {/* Gauge */}
      <div className="relative mb-4">
        <svg width={SVG_SIZE} height={SVG_SIZE} className="-rotate-90">
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={GAUGE_R}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={GAUGE_R}
            fill="none"
            stroke={scoreColor}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-text-primary">
            {scoreResult.total}
          </span>
          <span className="text-xs text-text-muted">/100</span>
        </div>
      </div>

      <p className="text-lg font-bold mb-5" style={{ color: scoreColor }}>
        {getScoreLevel(scoreResult.total)}
      </p>

      {/* Dimensions */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {DIMENSIONS.map(({ key, label, emoji }) => {
          const dim = scoreResult.dimensions[key];
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-base">{emoji}</span>
              <span className="text-lg font-bold text-text-primary">
                {dim.value}
              </span>
              <span className="text-xs text-text-muted text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/analytics/ScoreBreakdownCard.tsx
git commit -m "feat(web): add ScoreBreakdownCard for analytics page"
```

---

### Task 9: Web — EquitySection

**Files:**
- Create: `apps/web/src/components/analytics/EquitySection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/analytics/EquitySection.tsx
'use client';

import type { MemberBalance } from '@keurzen/queries';

const MEMBER_COLORS = [
  'var(--color-terracotta)',
  'var(--color-prune)',
  'var(--color-sauge)',
  'var(--color-miel)',
  'var(--color-rose)',
];

function getDeltaClasses(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.10) return 'bg-sauge/10 text-sauge';
  if (abs < 0.20) return 'bg-miel/10 text-miel';
  return 'bg-rose/10 text-rose';
}

interface EquitySectionProps {
  title: string;
  members: MemberBalance[];
  shareKey: 'tasksShare' | 'minutesShare';
  deltaKey: 'tasksDelta' | 'minutesDelta';
}

export function EquitySection({ title, members, shareKey, deltaKey }: EquitySectionProps) {
  if (members.length < 2) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">{title}</p>
        <p className="text-sm text-text-muted text-center py-6">
          Pas assez de donnees cette semaine
        </p>
      </div>
    );
  }

  const expectedShare = 1 / members.length;

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">{title}</p>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {members.map((m, i) => {
          const share = m[shareKey];
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          if (share <= 0) return null;
          return (
            <div
              key={m.userId}
              style={{ flex: share, backgroundColor: color }}
            />
          );
        })}
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m, i) => {
          const share = m[shareKey];
          const delta = m[deltaKey];
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          const deltaSign = delta > 0 ? '+' : '';

          return (
            <div key={m.userId} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-text-primary truncate">
                {m.name.split(' ')[0]}
              </span>
              <span className="font-bold text-text-primary">
                {Math.round(share * 100)}%
              </span>
              <span className="text-xs text-text-muted">
                /{Math.round(expectedShare * 100)}%
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getDeltaClasses(delta)}`}>
                {deltaSign}{Math.round(delta * 100)}pp
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/analytics/EquitySection.tsx
git commit -m "feat(web): add EquitySection component for analytics"
```

---

### Task 10: Web — TlxDetailSection

**Files:**
- Create: `apps/web/src/components/analytics/TlxDetailSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/analytics/TlxDetailSection.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCurrentTlx, useTlxDelta } from '@keurzen/queries';

const TLX_DIMENSIONS = [
  { key: 'mental_demand', label: 'Exigence mentale' },
  { key: 'physical_demand', label: 'Exigence physique' },
  { key: 'temporal_demand', label: 'Pression temporelle' },
  { key: 'effort', label: 'Effort' },
  { key: 'frustration', label: 'Frustration' },
  { key: 'performance', label: 'Performance' },
] as const;

function getBarColor(value: number): string {
  if (value < 40) return 'var(--color-sauge)';
  if (value <= 70) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

export function TlxDetailSection() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  if (!currentTlx) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Charge mentale (TLX)
        </p>
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm text-text-muted">
            Remplissez le TLX pour voir votre charge mentale
          </p>
          <button
            onClick={() => router.push('/dashboard/tlx')}
            className="px-5 py-2 bg-terracotta text-text-inverse text-sm font-bold rounded-xl tracking-wide hover:opacity-90 transition-opacity"
          >
            REMPLIR LE TLX
          </button>
        </div>
      </div>
    );
  }

  const score = currentTlx.score;
  const scoreColor = getBarColor(score);

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">
        Charge mentale (TLX)
      </p>

      {/* Score + delta */}
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="text-sm text-text-muted">/100</span>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <span
            className="ml-2 text-xs font-semibold"
            style={{ color: tlxDelta.delta > 0 ? 'var(--color-rose)' : 'var(--color-sauge)' }}
          >
            {tlxDelta.delta > 0 ? '▲' : '▼'} {Math.abs(tlxDelta.delta)} pts
          </span>
        )}
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {TLX_DIMENSIONS.map(({ key, label }) => {
          const value = currentTlx[key as keyof typeof currentTlx] as number;
          const barColor = getBarColor(value);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-text-secondary w-[110px] shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border-light overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${value}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-xs font-semibold text-text-primary w-7 text-right">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/analytics/TlxDetailSection.tsx
git commit -m "feat(web): add TlxDetailSection for analytics page"
```

---

### Task 11: Web — TrendsSection (recharts)

**Files:**
- Create: `apps/web/src/components/analytics/TrendsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/analytics/TrendsSection.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsTrends } from '@keurzen/queries';

export function TrendsSection() {
  const { data: trends = [], isLoading } = useAnalyticsTrends(4);

  const hasEnoughData = trends.filter((t) => t.totalTasks > 0).length >= 2;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Evolution sur 4 semaines
        </p>
        <p className="text-sm text-text-muted text-center py-6">Chargement...</p>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Evolution sur 4 semaines
        </p>
        <p className="text-sm text-text-muted text-center py-6">
          Les tendances apparaitront apres 2 semaines d&apos;utilisation
        </p>
      </div>
    );
  }

  const chartData = trends.map((t) => ({
    week: t.weekLabel,
    tasks: t.totalTasks,
    tlx: t.avgTlxScore,
  }));

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">
        Evolution sur 4 semaines
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks trend */}
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">
            Taches completees
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-background-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="var(--color-terracotta)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-terracotta)' }}
                name="Taches"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TLX trend */}
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">
            Charge mentale (TLX)
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-background-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="tlx"
                stroke="var(--color-prune)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-prune)' }}
                name="TLX"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/analytics/TrendsSection.tsx
git commit -m "feat(web): add TrendsSection with recharts line charts"
```

---

### Task 12: Web — Analytics Page

**Files:**
- Create: `apps/web/src/app/(app)/dashboard/analytics/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/web/src/app/(app)/dashboard/analytics/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useWeeklyBalance, useCoachingInsights } from '@keurzen/queries';

import { ScoreBreakdownCard } from '@/components/analytics/ScoreBreakdownCard';
import { EquitySection } from '@/components/analytics/EquitySection';
import { TlxDetailSection } from '@/components/analytics/TlxDetailSection';
import { TrendsSection } from '@/components/analytics/TrendsSection';
import { InsightCard } from '@/components/dashboard/InsightCard';

export default function AnalyticsPage() {
  const router = useRouter();
  const { members } = useWeeklyBalance();
  const { data: insights = [] } = useCoachingInsights();

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-border-light transition-colors"
        >
          <span className="text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold text-text-primary">
          Analyse de la semaine
        </h1>
      </div>

      {/* 1. Score breakdown */}
      <ScoreBreakdownCard />

      {/* 2-3. Equity grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EquitySection
          title="Repartition des taches"
          members={members}
          shareKey="tasksShare"
          deltaKey="tasksDelta"
        />
        <EquitySection
          title="Repartition du temps"
          members={members}
          shareKey="minutesShare"
          deltaKey="minutesDelta"
        />
      </div>

      {/* 4. TLX detail */}
      <TlxDetailSection />

      {/* 5. Coaching insights */}
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Conseils du coach
        </p>
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            Tout va bien ! Aucun conseil pour le moment.
          </p>
        )}
      </div>

      {/* 6. Trends */}
      <TrendsSection />

      {/* Link to weekly review */}
      <button
        onClick={() => router.push('/dashboard/weekly-review')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-background-card shadow-card hover:opacity-90 transition-opacity"
      >
        <span>📄</span>
        <span className="text-sm font-semibold text-terracotta">
          Voir le rapport IA de la semaine
        </span>
        <span className="text-terracotta">→</span>
      </button>

      <div className="h-8" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/analytics/page.tsx
git commit -m "feat(web): add analytics page with all 6 sections"
```

---

### Task 13: Update navigation — Score cards point to analytics

**Files:**
- Modify: `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx:200`
- Modify: `apps/web/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Update mobile HouseholdScoreCard**

In `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx`, line 200, change:

```typescript
// OLD
onPress={() => router.push('/(app)/dashboard/weekly-review')}
// NEW
onPress={() => router.push('/(app)/dashboard/analytics')}
```

- [ ] **Step 2: Update web ScoreHeroCard**

In `apps/web/src/components/dashboard/ScoreHeroCard.tsx`, change `router.push('/dashboard/weekly-review')` to:

```typescript
router.push('/dashboard/analytics')
```

- [ ] **Step 3: Verify both builds**

Run in parallel:
- `cd apps/mobile && npx tsc --noEmit`
- `cd apps/web && npx tsc --noEmit`

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx apps/web/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat: navigate score cards to analytics instead of weekly-review"
```

---

### Task 14: Verification

- [ ] **Step 1: Lint**

Run: `npm run lint`

- [ ] **Step 2: Build web**

Run: `cd apps/web && npm run build`

- [ ] **Step 3: Manual test plan**

**Mobile:**
1. Open dashboard → tap on score card → should open analytics screen
2. Verify all 6 sections render (score, task equity, time equity, TLX, insights, trends)
3. Verify "Voir le rapport IA" link navigates to weekly-review
4. Test empty states: no TLX filled → CTA shown; < 2 members → equity empty state
5. Tap back arrow → returns to dashboard

**Web:**
1. Open dashboard → click score card → should open `/dashboard/analytics`
2. Verify all 6 sections render with proper Tailwind styling
3. Verify recharts renders trend lines (or empty state if < 2 weeks data)
4. Verify weekly review link works
5. Responsive: check 2-col equity grid collapses to 1-col on mobile viewport

- [ ] **Step 4: Final commit if any fixes needed**
