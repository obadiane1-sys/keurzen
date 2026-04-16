# Dashboard Cafe Cosy Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard on both mobile and web to use a clean "Cafe Cosy Cards" style — 5 modular cards with big numbers, accent border-left, simplified gauge, and a sticky sidebar on web.

**Architecture:** Replace the current 9-section dashboard with 5 focused cards (Score, TLX, Today Tasks, Repartition, Conseil). Mobile stays single-column. Web gets a sticky sidebar (score gauge + stats + CTA) with a main grid area. Each card is a new component; old components are preserved but no longer imported from the dashboard screen.

**Tech Stack:** React Native + Expo (mobile), Next.js + Tailwind (web), existing design tokens, existing TanStack Query hooks

**Spec:** `docs/superpowers/specs/2026-04-10-dashboard-cafe-cosy-cards-design.md`

---

## File Map

### Mobile — New files
| File | Responsibility |
|------|---------------|
| `apps/mobile/src/components/dashboard/DashboardCard.tsx` | Generic card wrapper with border-left accent, optional chevron, shadow |
| `apps/mobile/src/components/dashboard/ScoreHeroCard.tsx` | Simplified gauge 140px + big number + status badge |
| `apps/mobile/src/components/dashboard/TlxSummaryCard.tsx` | Big TLX number + delta + progress bar |
| `apps/mobile/src/components/dashboard/TodayTasksCard.tsx` | Task count + 3 task rows |
| `apps/mobile/src/components/dashboard/RepartitionCard.tsx` | Member balance bars |

### Mobile — Modified files
| File | Changes |
|------|---------|
| `apps/mobile/app/(app)/dashboard/index.tsx` | Replace 9 sections with 5 cards, new header |

### Web — New files
| File | Responsibility |
|------|---------------|
| `apps/web/src/components/dashboard/DashboardCard.tsx` | Generic card with border-left accent, optional chevron |
| `apps/web/src/components/dashboard/DashboardSidebar.tsx` | Sticky sidebar: gauge + stats + CTA |
| `apps/web/src/components/dashboard/ScoreGauge.tsx` | Simplified SVG ring gauge for sidebar |
| `apps/web/src/components/dashboard/TlxSummaryCard.tsx` | Big number + delta + progress bar |
| `apps/web/src/components/dashboard/TodayTasksCard.tsx` | Task count + task rows |
| `apps/web/src/components/dashboard/RepartitionCard.tsx` | Member balance bars |

### Web — Modified files
| File | Changes |
|------|---------|
| `apps/web/src/app/(app)/dashboard/page.tsx` | New sidebar + main layout, 4 cards in main area |

---

## Task 1: Mobile — DashboardCard wrapper

**Files:**
- Create: `apps/mobile/src/components/dashboard/DashboardCard.tsx`

- [ ] **Step 1: Create DashboardCard component**

```tsx
// apps/mobile/src/components/dashboard/DashboardCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';

interface DashboardCardProps {
  accentColor: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}

export function DashboardCard({ accentColor, children, onPress, style }: DashboardCardProps) {
  const content = (
    <View style={[styles.card, { borderLeftColor: accentColor }, style]}>
      {children}
      {onPress && (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  chevron: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.base,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to DashboardCard

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/DashboardCard.tsx
git commit -m "feat(mobile): add DashboardCard generic wrapper component"
```

---

## Task 2: Mobile — ScoreHeroCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Create ScoreHeroCard component**

```tsx
// apps/mobile/src/components/dashboard/ScoreHeroCard.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 140;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.sauge;
  if (score >= 40) return Colors.miel;
  return Colors.rose;
}

function getStatusLabel(score: number): string {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 60) return 'BON EQUILIBRE';
  if (score >= 40) return 'MOYEN';
  if (score >= 20) return 'A RISQUE';
  return 'FRAGILE';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

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
      streakDays,
    }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const scoreColor = getScoreColor(score);
  const statusLabel = getStatusLabel(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <DashboardCard
      accentColor={Colors.terracotta}
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
    >
      <Text variant="overline" style={styles.overline}>SCORE DU FOYER</Text>
      <Text variant="caption" color="secondary">Cette semaine</Text>

      <View style={styles.gaugeWrap}>
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={Colors.border} strokeWidth={STROKE_WIDTH} fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={scoreColor} strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              strokeLinecap="round" rotation={-90}
              origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.gaugeCenter}>
            <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
              {score}
            </Text>
            <Text variant="caption" color="muted" style={styles.scoreMax}>/100</Text>
          </View>
        </View>
      </View>

      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: `${scoreColor}1F` }]}>
          <Text variant="caption" weight="bold" style={{ color: scoreColor, fontSize: 11, letterSpacing: 0.8 }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.terracotta,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  gaugeWrap: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  gaugeContainer: {
    position: 'relative',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  gaugeCenter: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    lineHeight: 42,
    color: Colors.textPrimary,
  },
  scoreMax: {
    marginTop: -2,
  },
  badgeWrap: {
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat(mobile): add ScoreHeroCard with simplified gauge"
```

---

## Task 3: Mobile — TlxSummaryCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/TlxSummaryCard.tsx`

- [ ] **Step 1: Create TlxSummaryCard component**

```tsx
// apps/mobile/src/components/dashboard/TlxSummaryCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useCurrentTlx, useTlxDelta } from '../../lib/queries/tlx';

export function TlxSummaryCard() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const score = currentTlx?.score ?? null;
  const delta = tlxDelta ?? null;

  // TLX lower is better: negative delta = improvement
  const deltaColor = delta !== null && delta < 0 ? Colors.sauge : delta !== null && delta > 0 ? Colors.rose : Colors.textMuted;
  const deltaLabel = delta !== null
    ? `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)} pts`
    : null;

  if (score === null) {
    return (
      <DashboardCard
        accentColor={Colors.prune}
        onPress={() => router.push('/(app)/dashboard/tlx')}
      >
        <Text variant="overline" style={styles.overline}>CHARGE RESSENTIE</Text>
        <Text variant="body" color="secondary" style={styles.emptyText}>
          Remplir le questionnaire TLX
        </Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      accentColor={Colors.prune}
      onPress={() => router.push('/(app)/dashboard/tlx')}
    >
      <Text variant="overline" style={styles.overline}>CHARGE RESSENTIE</Text>
      <Text variant="caption" color="secondary">TLX moyen du foyer</Text>

      <View style={styles.numberRow}>
        <Text variant="display" weight="extrabold" style={styles.bigNumber}>{score}</Text>
        <Text variant="body" color="muted" style={styles.unit}>/100</Text>
        {deltaLabel && (
          <Text variant="bodySmall" weight="bold" style={[styles.delta, { color: deltaColor }]}>
            {deltaLabel}
          </Text>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: Colors.prune }]} />
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.prune,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.base,
    gap: 6,
  },
  bigNumber: {
    fontSize: 40,
    lineHeight: 46,
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.fontSize.base,
  },
  delta: {
    marginLeft: 'auto',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/TlxSummaryCard.tsx
git commit -m "feat(mobile): add TlxSummaryCard with big number and delta"
```

---

## Task 4: Mobile — TodayTasksCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/TodayTasksCard.tsx`

- [ ] **Step 1: Create TodayTasksCard component**

```tsx
// apps/mobile/src/components/dashboard/TodayTasksCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useTodayTasks } from '../../lib/queries/tasks';

const priorityColors: Record<string, string> = {
  high: Colors.rose,
  urgent: Colors.rose,
  medium: Colors.miel,
  low: Colors.sauge,
};

export function TodayTasksCard() {
  const router = useRouter();
  const todayTasks = useTodayTasks();

  return (
    <DashboardCard accentColor={Colors.sauge}>
      <View style={styles.header}>
        <Text variant="overline" style={styles.overline}>AUJOURD&apos;HUI</Text>
        {todayTasks.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="caption" weight="bold" style={styles.link}>Tout voir ›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.numberRow}>
        <Text variant="display" weight="extrabold" style={styles.bigNumber}>
          {todayTasks.length}
        </Text>
        <Text variant="body" color="secondary" style={styles.unit}>
          {todayTasks.length <= 1 ? 'tache restante' : 'taches restantes'}
        </Text>
      </View>

      {todayTasks.length > 0 ? (
        <View style={styles.taskList}>
          {todayTasks.slice(0, 3).map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <View style={[styles.prioDot, { backgroundColor: priorityColors[t.priority] || Colors.miel }]} />
              <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskName}>
                {t.title}
              </Text>
              <Text variant="caption" color="muted">
                {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="body" color="muted" style={styles.emptyText}>
          Aucune tache aujourd&apos;hui
        </Text>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: {
    color: Colors.sauge,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
  },
  link: {
    color: Colors.terracotta,
    fontSize: Typography.fontSize.xs,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  bigNumber: {
    fontSize: 40,
    lineHeight: 46,
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.fontSize.base,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskName: {
    flex: 1,
    color: Colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/TodayTasksCard.tsx
git commit -m "feat(mobile): add TodayTasksCard with big count and task rows"
```

---

## Task 5: Mobile — RepartitionCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/RepartitionCard.tsx`

- [ ] **Step 1: Create RepartitionCard component**

```tsx
// apps/mobile/src/components/dashboard/RepartitionCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { DashboardCard } from './DashboardCard';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

export function RepartitionCard() {
  const { members: balanceMembers } = useWeeklyBalance();

  return (
    <DashboardCard accentColor={Colors.miel}>
      <Text variant="overline" style={styles.overline}>REPARTITION</Text>
      <Text variant="caption" color="secondary">Equilibre des taches</Text>

      {balanceMembers.length > 0 ? (
        <View style={styles.members}>
          {balanceMembers.map((m) => {
            const pct = Math.round(m.tasksShare * 100);
            return (
              <View key={m.userId} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text variant="bodySmall" weight="bold">{m.name.split(' ')[0]}</Text>
                  <Text variant="bodySmall" weight="bold">{pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text variant="body" color="muted" style={styles.emptyText}>
          Pas assez de donnees cette semaine
        </Text>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: Colors.miel,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1,
    marginBottom: 2,
  },
  members: {
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  memberRow: {},
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/RepartitionCard.tsx
git commit -m "feat(mobile): add RepartitionCard with member balance bars"
```

---

## Task 6: Mobile — Rewrite dashboard screen

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx`

- [ ] **Step 1: Rewrite the dashboard screen**

Replace the entire file content with:

```tsx
// apps/mobile/app/(app)/dashboard/index.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TlxSummaryCard } from '../../../src/components/dashboard/TlxSummaryCard';
import { TodayTasksCard } from '../../../src/components/dashboard/TodayTasksCard';
import { RepartitionCard } from '../../../src/components/dashboard/RepartitionCard';
import { WeeklyTipCard } from '../../../src/components/dashboard/WeeklyTipCard';

// ─── Staggered fade-in ──────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
    })),
  ).current;

  useEffect(() => {
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

  return anims;
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

  const fadeAnims = useStaggeredFadeIn(6); // header + 5 cards

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
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="muted" style={styles.weekLabel}>
              {`SEMAINE DU ${dayjs().startOf('week').format('D MMMM').toUpperCase()}`}
            </Text>
            <Text variant="h2" weight="extrabold" style={styles.title}>
              Tableau de bord
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="body" weight="bold" style={styles.avatarText}>
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. SCORE ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 2. TLX ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <TlxSummaryCard />
        </FadeSection>

        {/* ── 3. TODAY TASKS ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.section}>
          <TodayTasksCard />
        </FadeSection>

        {/* ── 4. REPARTITION ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.section}>
          <RepartitionCard />
        </FadeSection>

        {/* ── 5. CONSEIL ── */}
        <FadeSection anim={fadeAnims[5]} style={styles.section}>
          <WeeklyTipCard />
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
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  weekLabel: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Verify the app starts**

Run: `cd apps/mobile && npx expo start --tunnel` (manual check)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(app\)/dashboard/index.tsx
git commit -m "feat(mobile): rewrite dashboard with 5 Cafe Cosy Cards"
```

---

## Task 7: Web — DashboardCard wrapper

**Files:**
- Create: `apps/web/src/components/dashboard/DashboardCard.tsx`

- [ ] **Step 1: Create DashboardCard component**

```tsx
// apps/web/src/components/dashboard/DashboardCard.tsx
'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  accentColor: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DashboardCard({ accentColor, children, onClick, className }: DashboardCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative rounded-[var(--radius-lg)] bg-background-card p-5 shadow-card border-l-4 text-left',
        onClick && 'w-full cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-md',
        className,
      )}
      style={{ borderLeftColor: accentColor }}
    >
      {children}
      {onClick && (
        <ChevronRight size={18} className="absolute top-5 right-4 text-text-muted" />
      )}
    </Wrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/DashboardCard.tsx
git commit -m "feat(web): add DashboardCard generic wrapper component"
```

---

## Task 8: Web — ScoreGauge + DashboardSidebar

**Files:**
- Create: `apps/web/src/components/dashboard/ScoreGauge.tsx`
- Create: `apps/web/src/components/dashboard/DashboardSidebar.tsx`

- [ ] **Step 1: Create ScoreGauge component**

```tsx
// apps/web/src/components/dashboard/ScoreGauge.tsx
'use client';

interface ScoreGaugeProps {
  score: number;
  color: string;
  size?: number;
}

export function ScoreGauge({ score, color, size = 180 }: ScoreGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--color-border)" strokeWidth={strokeWidth} fill="none"
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
        <span className="font-heading text-[48px] font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-sm text-text-muted -mt-1">/100</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DashboardSidebar component**

```tsx
// apps/web/src/components/dashboard/DashboardSidebar.tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
} from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';
import { ScoreGauge } from './ScoreGauge';

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-sauge)';
  if (score >= 40) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

function getStatusLabel(score: number): string {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 60) return 'BON EQUILIBRE';
  if (score >= 40) return 'MOYEN';
  if (score >= 20) return 'A RISQUE';
  return 'FRAGILE';
}

export function DashboardSidebar() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta ?? 0)))
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

  const scoreColor = getScoreColor(score);
  const statusLabel = getStatusLabel(score);
  const doneTasks = allTasks.filter((t) => t.status === 'done');

  return (
    <aside className="w-80 shrink-0 max-lg:w-full">
      <div className="sticky top-8 rounded-[var(--radius-lg)] bg-background-card p-7 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          Score du foyer
        </p>
        <p className="text-xs text-text-secondary mt-1">Vue d&apos;ensemble</p>

        <div className="flex justify-center my-6">
          <ScoreGauge score={score} color={scoreColor} />
        </div>

        <div className="text-center mb-5">
          <span
            className="inline-block rounded-full px-3.5 py-1 text-xs font-bold"
            style={{ color: scoreColor, backgroundColor: `color-mix(in srgb, ${scoreColor} 12%, transparent)` }}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-background p-3.5 text-center">
            <span className="font-heading text-xl font-extrabold text-text-primary">
              {doneTasks.length}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">Taches faites</p>
          </div>
          <div className="flex-1 rounded-xl bg-background p-3.5 text-center">
            <span className="font-heading text-xl font-extrabold text-text-primary">
              {todayTasks.length}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">Aujourd&apos;hui</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/weekly-review')}
          className="mt-5 w-full rounded-xl bg-terracotta py-3 text-sm font-bold text-white transition-colors hover:bg-terracotta/90"
        >
          Voir le bilan hebdo
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/ScoreGauge.tsx apps/web/src/components/dashboard/DashboardSidebar.tsx
git commit -m "feat(web): add ScoreGauge and DashboardSidebar components"
```

---

## Task 9: Web — TlxSummaryCard

**Files:**
- Create: `apps/web/src/components/dashboard/TlxSummaryCard.tsx`

- [ ] **Step 1: Create TlxSummaryCard component**

```tsx
// apps/web/src/components/dashboard/TlxSummaryCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCurrentTlx, useTlxDelta } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

export function TlxSummaryCard() {
  const router = useRouter();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const score = currentTlx?.score ?? null;
  const delta = tlxDelta ?? null;

  const deltaColor = delta !== null && delta < 0
    ? 'var(--color-sauge)'
    : delta !== null && delta > 0
      ? 'var(--color-rose)'
      : 'var(--color-text-muted)';

  const deltaLabel = delta !== null
    ? `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)} pts`
    : null;

  if (score === null) {
    return (
      <DashboardCard
        accentColor="var(--color-prune)"
        onClick={() => router.push('/dashboard/tlx')}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-prune">
          CHARGE RESSENTIE
        </p>
        <p className="mt-4 text-center text-sm text-text-secondary py-3">
          Remplir le questionnaire TLX
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      accentColor="var(--color-prune)"
      onClick={() => router.push('/dashboard/tlx')}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-prune">
        CHARGE RESSENTIE
      </p>
      <p className="text-xs text-text-secondary mt-0.5">TLX moyen du foyer</p>

      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="font-heading text-[40px] font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-sm text-text-muted">/100</span>
        {deltaLabel && (
          <span className="ml-auto text-sm font-bold" style={{ color: deltaColor }}>
            {deltaLabel}
          </span>
        )}
      </div>

      <div className="mt-2.5 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-prune transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </DashboardCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/TlxSummaryCard.tsx
git commit -m "feat(web): add TlxSummaryCard with big number and delta"
```

---

## Task 10: Web — TodayTasksCard + RepartitionCard

**Files:**
- Create: `apps/web/src/components/dashboard/TodayTasksCard.tsx`
- Create: `apps/web/src/components/dashboard/RepartitionCard.tsx`

- [ ] **Step 1: Create TodayTasksCard**

```tsx
// apps/web/src/components/dashboard/TodayTasksCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTodayTasks } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

export function TodayTasksCard() {
  const router = useRouter();
  const todayTasks = useTodayTasks();

  return (
    <DashboardCard accentColor="var(--color-sauge)">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sauge">
          AUJOURD&apos;HUI
        </p>
        {todayTasks.length > 0 && (
          <button
            onClick={() => router.push('/tasks')}
            className="text-xs font-bold text-terracotta hover:underline"
          >
            Tout voir ›
          </button>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline gap-2 mb-3.5">
        <span className="font-heading text-[40px] font-extrabold leading-none text-text-primary">
          {todayTasks.length}
        </span>
        <span className="text-sm text-text-secondary">
          {todayTasks.length <= 1 ? 'tache restante' : 'taches restantes'}
        </span>
      </div>

      {todayTasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {todayTasks.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 rounded-[10px] bg-background px-3 py-2.5"
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: priorityColors[t.priority] || priorityColors.medium }}
              />
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">
                {t.title}
              </span>
              <span className="text-[11px] text-text-muted">
                {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-text-muted">
          Aucune tache aujourd&apos;hui
        </p>
      )}
    </DashboardCard>
  );
}
```

- [ ] **Step 2: Create RepartitionCard**

```tsx
// apps/web/src/components/dashboard/RepartitionCard.tsx
'use client';

import { useWeeklyBalance } from '@keurzen/queries';
import { DashboardCard } from './DashboardCard';

export function RepartitionCard() {
  const { members: balanceMembers } = useWeeklyBalance();

  return (
    <DashboardCard accentColor="var(--color-miel)">
      <p className="text-[11px] font-bold uppercase tracking-wider text-miel">
        REPARTITION
      </p>
      <p className="text-xs text-text-secondary mt-0.5">Equilibre des taches</p>

      {balanceMembers.length > 0 ? (
        <div className="mt-4 space-y-3">
          {balanceMembers.map((m) => {
            const pct = Math.round(m.tasksShare * 100);
            return (
              <div key={m.userId}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-text-primary">
                    {m.name.split(' ')[0]}
                  </span>
                  <span className="text-sm font-bold text-text-primary">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 py-3 text-center text-sm text-text-muted">
          Pas assez de donnees cette semaine
        </p>
      )}
    </DashboardCard>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/TodayTasksCard.tsx apps/web/src/components/dashboard/RepartitionCard.tsx
git commit -m "feat(web): add TodayTasksCard and RepartitionCard"
```

---

## Task 11: Web — Rewrite dashboard page

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire file content with:

```tsx
// apps/web/src/app/(app)/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useTasks } from '@keurzen/queries';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TlxSummaryCard } from '@/components/dashboard/TlxSummaryCard';
import { TodayTasksCard } from '@/components/dashboard/TodayTasksCard';
import { RepartitionCard } from '@/components/dashboard/RepartitionCard';
import { WeeklyTipCard } from '@/components/dashboard/WeeklyTipCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isLoading } = useTasks();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] gap-8 px-6 py-8 max-lg:flex-col">
      {/* Sticky sidebar with score */}
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <h1 className="mb-6 font-heading text-[22px] font-extrabold text-text-primary">
          Tableau de bord
        </h1>

        {/* TLX + Repartition — 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
          <TlxSummaryCard />
          <RepartitionCard />
        </div>

        {/* Today tasks — full width */}
        <div className="mb-4">
          <TodayTasksCard />
        </div>

        {/* Weekly tip — full width */}
        <WeeklyTipCard />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the web app builds**

Run: `cd apps/web && npm run build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(web): rewrite dashboard with sidebar + Cafe Cosy Cards"
```

---

## Task 12: Verify both platforms + final commit

- [ ] **Step 1: Run lint on both apps**

Run: `npm run lint 2>&1 | tail -30`

Fix any lint errors.

- [ ] **Step 2: Verify mobile TypeScript**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | tail -20`

- [ ] **Step 3: Verify web build**

Run: `cd apps/web && npm run build 2>&1 | tail -20`

- [ ] **Step 4: Manual test checklist**

**Mobile (Expo):**
- [ ] Header shows "SEMAINE DU ..." + "Tableau de bord" + avatar
- [ ] Score card: gauge 140px, big number, terracotta accent, badge, chevron → weekly-review
- [ ] TLX card: big number, delta, prune accent, progress bar
- [ ] Today tasks: count, 3 task rows with dots, sauge accent
- [ ] Repartition: member bars with %, miel accent
- [ ] Conseil: tip text with miel accent
- [ ] Pull-to-refresh works
- [ ] Empty states display correctly (no tasks, no TLX)

**Web (Next.js):**
- [ ] Sidebar sticky at left with gauge 180px, stats, CTA button
- [ ] Main area: TLX + Repartition side by side, tasks full width, conseil full width
- [ ] Responsive: under 1024px sidebar goes on top
- [ ] Under 768px: grid goes single column
- [ ] Navigation: sidebar CTA → weekly-review, TLX card → /dashboard/tlx

- [ ] **Step 5: Final commit if lint fixes were needed**

```bash
git add -A
git commit -m "fix: lint and build fixes for dashboard redesign"
```
