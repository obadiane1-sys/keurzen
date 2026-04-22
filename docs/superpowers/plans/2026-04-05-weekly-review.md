# Weekly Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pre-computed weekly metrics to the existing report system, a push notification for report readiness, and a dedicated full-page Weekly Review screen with score, metrics, member breakdown, AI report, and history.

**Architecture:** Enrich the existing `weekly_reports` table with 5 computed columns. Extend `generate-weekly-report` Edge Function to compute and store those metrics. Add a new `send-weekly-review-push` Edge Function (cron Monday 8h). Build a new screen at `app/(app)/dashboard/weekly-review.tsx` consuming enriched data via TanStack Query hooks.

**Tech Stack:** Supabase (Postgres, Edge Functions Deno), Expo Push API, React Native, TanStack Query v5, Zustand, dayjs

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260405120000_enrich_weekly_reports.sql` | Add 5 columns to `weekly_reports` |
| Modify | `supabase/functions/generate-weekly-report/index.ts` | Compute & upsert metrics alongside AI report |
| Create | `supabase/functions/send-weekly-review-push/index.ts` | Cron: send push when review is ready |
| Modify | `src/types/index.ts` | Add `MemberMetric`, enrich `WeeklyReport` |
| Modify | `src/lib/queries/reports.ts` | Add `useWeeklyReview()`, `useWeeklyReviewHistory()` |
| Create | `app/(app)/dashboard/weekly-review.tsx` | Full-page Weekly Review screen |
| Modify | `src/components/dashboard/WeeklyReportCard.tsx` | Add navigation to weekly-review screen |

---

### Task 1: Migration — Enrich `weekly_reports` table

**Files:**
- Create: `supabase/migrations/20260405120000_enrich_weekly_reports.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Enrich weekly_reports with pre-computed metrics
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS total_tasks_completed integer DEFAULT 0;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS total_minutes_logged integer DEFAULT 0;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS avg_tlx_score numeric(5,2) DEFAULT NULL;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS balance_score numeric(5,2) DEFAULT NULL;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS member_metrics jsonb DEFAULT '[]'::jsonb;
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`
Expected: Migration applied successfully, no errors.

- [ ] **Step 3: Verify columns exist**

Run the following SQL via Supabase dashboard or CLI:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'weekly_reports'
ORDER BY ordinal_position;
```
Expected: All 5 new columns present alongside existing ones.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260405120000_enrich_weekly_reports.sql
git commit -m "feat(db): add metrics columns to weekly_reports"
```

---

### Task 2: Enrich `generate-weekly-report` Edge Function

**Files:**
- Modify: `supabase/functions/generate-weekly-report/index.ts:150-302`

- [ ] **Step 1: Add metrics computation after data collection**

After line 146 (after the `Promise.all` block), before the data sufficiency check, add:

```typescript
    // ─── Compute aggregate metrics ───────────────────────────────────────
    const totalTasksCompleted = completedTasks?.length ?? 0;
    const totalMinutesLogged = (timeLogs ?? []).reduce(
      (sum: number, l: any) => sum + (l.minutes ?? 0), 0
    );

    const tlxScores = (tlxEntries ?? []).map((t: any) => t.score).filter(Boolean);
    const avgTlxScore = tlxScores.length > 0
      ? Math.round((tlxScores.reduce((s: number, v: number) => s + v, 0) / tlxScores.length) * 100) / 100
      : null;

    const taskDeltas = (weeklyStats ?? []).map((s: any) => Math.abs(s.tasks_delta ?? 0));
    const balanceScore = taskDeltas.length > 0
      ? Math.max(0, Math.min(100, Math.round(
          (100 - (taskDeltas.reduce((s: number, v: number) => s + v, 0) / taskDeltas.length) * 100) * 100
        ) / 100))
      : null;

    const memberMetricsData = (members ?? []).map((m: any) => {
      const userId = m.user_id;
      const name = memberNames[userId] ?? 'Membre';
      const stat = (weeklyStats ?? []).find((s: any) => s.user_id === userId);
      const tlx = (tlxEntries ?? []).find((t: any) => t.user_id === userId);
      const memberMinutes = (timeLogs ?? [])
        .filter((l: any) => l.user_id === userId)
        .reduce((s: number, l: any) => s + (l.minutes ?? 0), 0);

      return {
        user_id: userId,
        name,
        tasks_count: stat?.tasks_count ?? 0,
        minutes: memberMinutes,
        tlx_score: tlx?.score ?? null,
        tasks_share: stat?.tasks_share ?? 0,
      };
    });
```

- [ ] **Step 2: Add metrics to the upsert call**

Replace the existing upsert block (lines ~283-301) with:

```typescript
    const { data: upserted, error: upsertErr } = await supabase
      .from('weekly_reports')
      .upsert(
        {
          household_id,
          week_start: weekStart,
          summary,
          attention_points,
          insights,
          orientations,
          model: CLAUDE_MODEL,
          generated_at: new Date().toISOString(),
          total_tasks_completed: totalTasksCompleted,
          total_minutes_logged: totalMinutesLogged,
          avg_tlx_score: avgTlxScore,
          balance_score: balanceScore,
          member_metrics: memberMetricsData,
        },
        { onConflict: 'household_id,week_start' }
      )
      .select('id')
      .single();
```

- [ ] **Step 3: Deploy and test**

Run: `npx supabase functions deploy generate-weekly-report`
Expected: Function deployed successfully.

Test via client "Regénérer le rapport" button — verify new columns populated in the DB.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-weekly-report/index.ts
git commit -m "feat(edge): compute and store weekly metrics in generate-weekly-report"
```

---

### Task 3: Create `send-weekly-review-push` Edge Function

**Files:**
- Create: `supabase/functions/send-weekly-review-push/index.ts`

- [ ] **Step 1: Write the Edge Function**

```typescript
/**
 * Keurzen — Edge Function: send-weekly-review-push
 *
 * Sends a push notification to all household members when
 * the weekly review is ready. Triggered by cron Monday 8:00 AM.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  // Compute current week start (Monday)
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().split('T')[0];

  // Get all reports generated this week with balance_score
  const { data: reports } = await supabase
    .from('weekly_reports')
    .select('household_id, balance_score')
    .eq('week_start', weekStart)
    .not('balance_score', 'is', null);

  let sent = 0;

  for (const report of reports ?? []) {
    // Get push tokens for all household members
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', report.household_id);

    if (!members || members.length === 0) continue;

    const userIds = members.map((m: any) => m.user_id);
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    const score = Math.round(report.balance_score ?? 0);
    const emoji = score >= 75 ? '🌟' : score >= 50 ? '📊' : '💪';

    for (const { token } of tokens ?? []) {
      await sendExpoNotification(token, {
        title: `${emoji} Bilan de la semaine disponible`,
        body: `Score d'équilibre : ${score}/100. Découvrez le bilan complet de votre foyer.`,
        data: {
          type: 'weekly_review',
          week_start: weekStart,
          household_id: report.household_id,
        },
      });
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, notifications_sent: sent }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

async function sendExpoNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        ...payload,
      }),
    });
    return await response.json();
  } catch (err) {
    console.error('Push error:', err);
  }
}
```

- [ ] **Step 2: Deploy**

Run: `npx supabase functions deploy send-weekly-review-push`
Expected: Function deployed successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-weekly-review-push/index.ts
git commit -m "feat(edge): add send-weekly-review-push notification function"
```

---

### Task 4: Update TypeScript types

**Files:**
- Modify: `src/types/index.ts:393-404`

- [ ] **Step 1: Add `MemberMetric` interface and enrich `WeeklyReport`**

Replace the existing `WeeklyReport` interface (lines 393-404) with:

```typescript
export interface MemberMetric {
  user_id: string;
  name: string;
  tasks_count: number;
  minutes: number;
  tlx_score: number | null;
  tasks_share: number; // 0-1
}

export interface WeeklyReport {
  id: string;
  household_id: string;
  week_start: string;
  summary: string;
  attention_points: AttentionPoint[];
  insights: Insight[];
  orientations: Orientation[];
  model: string;
  generated_at: string;
  created_at: string;
  // Computed metrics (nullable for older reports)
  total_tasks_completed: number;
  total_minutes_logged: number;
  avg_tlx_score: number | null;
  balance_score: number | null;
  member_metrics: MemberMetric[];
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty`
Expected: No new errors related to `WeeklyReport` usage (existing consumers still work since new fields are additive).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add MemberMetric and enrich WeeklyReport with metrics"
```

---

### Task 5: Add TanStack Query hooks for Weekly Review

**Files:**
- Modify: `src/lib/queries/reports.ts`

- [ ] **Step 1: Add new query keys and hooks**

Append after the existing `useRegenerateReport` function (after line 93):

```typescript
// ─── Weekly Review — Full Report with Metrics ────────────────────────────────

export function useWeeklyReview(weekStart?: string) {
  const { currentHousehold } = useHouseholdStore();
  const defaultWeek = useMemo(() => getCurrentWeekStart(), []);
  const week = weekStart ?? defaultWeek;

  return useQuery({
    queryKey: ['weekly-review', currentHousehold?.id ?? '', week] as const,
    queryFn: async () => {
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

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/reports.ts
git commit -m "feat(queries): add useWeeklyReview and useWeeklyReviewHistory hooks"
```

---

### Task 6: Build Weekly Review screen

**Files:**
- Create: `app/(app)/dashboard/weekly-review.tsx`

- [ ] **Step 1: Create the screen file**

```typescript
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Card } from '../../../src/components/ui/Card';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Loader } from '../../../src/components/ui/Loader';
import { CircularGauge } from '../../../src/components/dashboard/CircularGauge';
import {
  useWeeklyReview,
  useWeeklyReviewHistory,
  useRegenerateReport,
} from '../../../src/lib/queries/reports';
import type { WeeklyReviewSummary } from '../../../src/lib/queries/reports';
import type { AttentionPoint, Insight, Orientation, MemberMetric } from '../../../src/types';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '../../../src/constants/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMascotExpression(score: number | null): 'happy' | 'calm' | 'sleepy' {
  if (score === null) return 'calm';
  if (score >= 75) return 'happy';
  if (score >= 50) return 'calm';
  return 'sleepy';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '—';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Correct';
  return 'À améliorer';
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

// ─── Collapsible Section ──────────────────────────────────────────────────────

function SectionHeader({
  icon,
  iconColor,
  title,
  count,
  expanded,
  onToggle,
}: {
  icon: string;
  iconColor: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({count})</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={14}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Member Bar ───────────────────────────────────────────────────────────────

function MemberBar({ member, index }: { member: MemberMetric; index: number }) {
  const color = Colors.memberColors[index % Colors.memberColors.length];
  const sharePercent = Math.round(member.tasks_share * 100);

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        <View style={[styles.memberDot, { backgroundColor: color }]} />
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberStat}>
          {member.tasks_count} tâche{member.tasks_count !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${sharePercent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.memberPercent}>{sharePercent}%</Text>
    </View>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({
  item,
  onPress,
}: {
  item: WeeklyReviewSummary;
  onPress: () => void;
}) {
  const score = item.balance_score !== null ? Math.round(item.balance_score) : null;
  const scoreColor = score !== null
    ? score >= 75 ? Colors.sauge : score >= 50 ? Colors.miel : Colors.rose
    : Colors.textMuted;

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.historyDate}>Sem. du {formatWeekDate(item.week_start)}</Text>
      <View style={styles.historyRight}>
        {score !== null && (
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{score}</Text>
          </View>
        )}
        <Text style={styles.historyTasks}>{item.total_tasks_completed} tâches</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WeeklyReviewScreen() {
  const { week } = useLocalSearchParams<{ week?: string }>();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(week);

  const { data: review, isLoading, error, refetch } = useWeeklyReview(selectedWeek);
  const { data: history = [] } = useWeeklyReviewHistory(8);
  const regenerate = useRegenerateReport();

  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    insights: true,
    orientations: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <Loader fullScreen />
      </SafeAreaView>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
          <Text variant="body" color="muted" style={styles.stateText}>
            Impossible de charger le bilan
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty ──────────────────────────────────────────────────────────
  if (!review) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <View style={styles.centerState}>
          <Mascot size={80} expression="calm" />
          <Text variant="body" color="muted" style={styles.stateText}>
            Pas encore de bilan cette semaine
          </Text>
          <TouchableOpacity
            onPress={() => regenerate.mutate()}
            style={styles.generateBtn}
            disabled={regenerate.isPending}
          >
            <Text style={styles.generateBtnText}>
              {regenerate.isPending ? 'Génération…' : 'Générer le bilan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Review content ─────────────────────────────────────────────────
  const balanceScore = review.balance_score !== null ? Math.round(review.balance_score) : null;
  const hasMetrics = review.balance_score !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Bilan de la semaine"
        subtitle={`Semaine du ${formatWeekDate(review.week_start)}`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={Colors.terracotta}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Score + Mascot ─────────────────────────────────────── */}
        {hasMetrics && (
          <Card padding="lg" radius="xl" style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <CircularGauge
                value={balanceScore ?? 0}
                max={100}
                color={
                  (balanceScore ?? 0) >= 75
                    ? Colors.sauge
                    : (balanceScore ?? 0) >= 50
                      ? Colors.miel
                      : Colors.rose
                }
                size={90}
                label={`${balanceScore}`}
                subtitle="/100"
              />
              <View style={styles.scoreInfo}>
                <Mascot
                  size={56}
                  expression={getMascotExpression(balanceScore)}
                />
                <Text style={styles.scoreLabel}>{getScoreLabel(balanceScore)}</Text>
                <Text style={styles.scoreSubtitle}>Équilibre du foyer</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── Key Metrics ────────────────────────────────────────── */}
        {hasMetrics && (
          <View style={styles.metricsRow}>
            <MetricCard
              icon="checkmark-done-outline"
              iconColor={Colors.sauge}
              value={String(review.total_tasks_completed)}
              label="Tâches"
            />
            <MetricCard
              icon="time-outline"
              iconColor={Colors.terracotta}
              value={formatMinutes(review.total_minutes_logged)}
              label="Temps"
            />
            <MetricCard
              icon="pulse-outline"
              iconColor={Colors.prune}
              value={review.avg_tlx_score !== null ? String(Math.round(review.avg_tlx_score)) : '—'}
              label="TLX moy."
            />
          </View>
        )}

        {/* ── Member Breakdown ───────────────────────────────────── */}
        {hasMetrics && review.member_metrics.length > 0 && (
          <Card padding="lg" radius="xl" style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Répartition par membre</Text>
            <View style={styles.membersContainer}>
              {review.member_metrics.map((m, i) => (
                <MemberBar key={m.user_id} member={m} index={i} />
              ))}
            </View>
          </Card>
        )}

        {/* ── AI Report: Summary ─────────────────────────────────── */}
        <Card padding="none" radius="xl" style={styles.sectionCard}>
          <View style={styles.reportHeader}>
            <Ionicons name="bar-chart-outline" size={20} color={Colors.prune} />
            <Text style={styles.cardTitle}>Rapport IA</Text>
          </View>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{review.summary}</Text>
          </View>

          {/* Attention Points */}
          {review.attention_points.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="warning-outline"
                iconColor={Colors.rose}
                title="Points d'attention"
                count={review.attention_points.length}
                expanded={expandedSections.attention}
                onToggle={() => toggleSection('attention')}
              />
              {expandedSections.attention && (
                <View style={styles.aiSectionContent}>
                  {review.attention_points.map((item: AttentionPoint, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Ionicons
                        name={(item.icon ?? 'alert-circle') as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={item.level === 'warning' ? Colors.rose : Colors.miel}
                      />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Insights */}
          {review.insights.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="lightbulb-outline"
                iconColor={Colors.prune}
                title="Insights"
                count={review.insights.length}
                expanded={expandedSections.insights}
                onToggle={() => toggleSection('insights')}
              />
              {expandedSections.insights && (
                <View style={styles.aiSectionContent}>
                  {review.insights.map((item: Insight, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Ionicons name="lightbulb-outline" size={16} color={Colors.prune} />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Orientations */}
          {review.orientations.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="compass-outline"
                iconColor={Colors.sauge}
                title="Orientations"
                count={review.orientations.length}
                expanded={expandedSections.orientations}
                onToggle={() => toggleSection('orientations')}
              />
              {expandedSections.orientations && (
                <View style={styles.aiSectionContent}>
                  {review.orientations.map((item: Orientation, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <View style={[
                        styles.bulletDot,
                        { backgroundColor: item.priority === 'high' ? Colors.sauge : Colors.textMuted },
                      ]} />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Regenerate */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.regenerateText}>
              {regenerate.isPending ? 'Régénération…' : 'Regénérer le rapport'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── History ────────────────────────────────────────────── */}
        {history.length > 1 && (
          <Card padding="lg" radius="xl" style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Historique</Text>
            <View style={styles.historyList}>
              {history
                .filter(h => h.week_start !== review.week_start)
                .map(item => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onPress={() => setSelectedWeek(item.week_start)}
                  />
                ))}
            </View>
          </Card>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },

  // Score card
  scoreCard: {
    marginBottom: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreInfo: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  scoreSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  metricValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Section card
  sectionCard: {
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Member bars
  membersContainer: {
    gap: Spacing.md,
  },
  memberRow: {
    gap: Spacing.xs,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  memberName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    flex: 1,
  },
  memberStat: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  memberPercent: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textAlign: 'right',
    width: 36,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // AI Report
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  aiSectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  regenerateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // History
  historyList: {
    gap: Spacing.xs,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: 44,
  },
  historyDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  scoreBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  },
  historyTasks: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // States
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.terracotta,
  },
  generateBtn: {
    backgroundColor: Colors.prune,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/dashboard/weekly-review.tsx
git commit -m "feat(mobile): add WeeklyReviewScreen with score, metrics, report, and history"
```

---

### Task 7: Add navigation from dashboard to Weekly Review

**Files:**
- Modify: `src/components/dashboard/WeeklyReportCard.tsx:135-137`

- [ ] **Step 1: Add navigation import and handler**

At the top of the file, add the router import after existing imports:

```typescript
import { useRouter } from 'expo-router';
```

Inside the `WeeklyReportCard` function, after the `toggleSection` function (line 67), add:

```typescript
  const router = useRouter();
```

- [ ] **Step 2: Make the header touchable to navigate**

Replace the header `<View>` (lines 138-147) with a `TouchableOpacity`:

```typescript
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(app)/dashboard/weekly-review')}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart-outline" size={20} color={Colors.prune} />
          <View>
            <Text style={styles.headerTitle}>Rapport de la semaine</Text>
            <Text style={styles.headerWeek}>Semaine du {weekLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/WeeklyReportCard.tsx
git commit -m "feat(mobile): add navigation from WeeklyReportCard to weekly-review screen"
```

---

### Task 8: Lint and verify

**Files:** All modified files

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: No new errors.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 3: Fix any issues found**

If lint or type errors found, fix them and re-run.

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -u
git commit -m "fix: lint and type fixes for weekly review"
```
