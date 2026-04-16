# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Keurzen dashboard (mobile + web) with a Bevel-inspired visual language — circular gauges, status pills, narrative card, and TLX detail section.

**Architecture:** Create 4 new shared components (CircularGauge, StatusPill, NarrativeCard, TlxDetailCard), then rewrite the dashboard screen on both platforms to use them. No backend changes. All data comes from existing hooks.

**Tech Stack:** React Native + react-native-svg (mobile), CSS conic-gradient (web), existing Keurzen tokens and hooks.

**Spec:** `docs/superpowers/specs/2026-04-05-dashboard-redesign-design.md`

---

## File Structure

### Mobile — New files
| File | Responsibility |
|------|---------------|
| `apps/mobile/src/components/dashboard/CircularGauge.tsx` | SVG circular gauge with arc fill |
| `apps/mobile/src/components/dashboard/StatusPill.tsx` | Pill badge with dot/icon + label |
| `apps/mobile/src/components/dashboard/NarrativeCard.tsx` | Contextual summary card |
| `apps/mobile/src/components/dashboard/TlxDetailCard.tsx` | Charge mentale section with stats + energy bar |

### Mobile — Modified files
| File | Change |
|------|--------|
| `apps/mobile/app/(app)/dashboard/index.tsx` | Full rewrite — new Bevel-style layout |

### Web — New files
| File | Responsibility |
|------|---------------|
| `apps/web/src/components/dashboard/CircularGauge.tsx` | CSS conic-gradient circular gauge |
| `apps/web/src/components/dashboard/StatusPills.tsx` | Status pills row |
| `apps/web/src/components/dashboard/NarrativeCard.tsx` | Contextual summary card |
| `apps/web/src/components/dashboard/TlxDetailCard.tsx` | Charge mentale detail section |

### Web — Modified files
| File | Change |
|------|--------|
| `apps/web/src/app/(app)/dashboard/page.tsx` | Full rewrite — mirror mobile layout |

---

### Task 1: Mobile — CircularGauge component

**Files:**
- Create: `apps/mobile/src/components/dashboard/CircularGauge.tsx`

- [ ] **Step 1: Create CircularGauge component**

```tsx
// apps/mobile/src/components/dashboard/CircularGauge.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Colors, Typography } from '../../constants/tokens';

interface CircularGaugeProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  label: string;
  subtitle?: string;
}

export function CircularGauge({
  value,
  max,
  color,
  size = 80,
  label,
  subtitle,
}: CircularGaugeProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clampedValue / max : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.gray100}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center label */}
        <View style={[styles.centerLabel, { width: size, height: size }]}>
          <Text
            variant="h3"
            weight="extrabold"
            style={{ color, fontSize: size * 0.275, lineHeight: size * 0.3 }}
          >
            {max === 100 ? value : `${Math.round(progress * 100)}%`}
          </Text>
          {subtitle && (
            <Text variant="caption" color="muted" style={{ fontSize: size * 0.11 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Text
        variant="bodySmall"
        weight="semibold"
        color="secondary"
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
  },
});
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -20`
Expected: No errors related to CircularGauge.tsx

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/CircularGauge.tsx
git commit -m "feat(dashboard): add CircularGauge component for mobile"
```

---

### Task 2: Mobile — StatusPill component

**Files:**
- Create: `apps/mobile/src/components/dashboard/StatusPill.tsx`

- [ ] **Step 1: Create StatusPill component**

```tsx
// apps/mobile/src/components/dashboard/StatusPill.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';

interface StatusPillProps {
  label: string;
  dot?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'alert';
}

export function StatusPill({ label, dot, icon, variant = 'default' }: StatusPillProps) {
  const isAlert = variant === 'alert';

  return (
    <View
      style={[
        styles.pill,
        isAlert && styles.alertPill,
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: dot }]} />
      )}
      {icon}
      <Text
        variant="caption"
        style={[
          styles.text,
          isAlert && { color: Colors.rose },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...Shadows.sm,
  },
  alertPill: {
    backgroundColor: Colors.rose + '12',
    borderWidth: 1,
    borderColor: Colors.rose + '30',
    shadowColor: 'transparent',
    elevation: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/StatusPill.tsx
git commit -m "feat(dashboard): add StatusPill component for mobile"
```

---

### Task 3: Mobile — NarrativeCard component

**Files:**
- Create: `apps/mobile/src/components/dashboard/NarrativeCard.tsx`

- [ ] **Step 1: Create NarrativeCard component**

The narrative logic generates a contextual message based on TLX delta and task completion data.

```tsx
// apps/mobile/src/components/dashboard/NarrativeCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';

interface NarrativeCardProps {
  doneTasks: number;
  overdueTasks: number;
  tlxDelta: number | null;
  hasTlx: boolean;
}

function getNarrative(props: NarrativeCardProps): { title: string; body: string; icon: string } {
  const { doneTasks, overdueTasks, tlxDelta, hasTlx } = props;

  if (!hasTlx) {
    return {
      title: 'Bienvenue',
      body: 'Remplis le questionnaire TLX pour suivre ta charge mentale cette semaine.',
      icon: 'hand-right-outline',
    };
  }

  if (tlxDelta !== null && tlxDelta < -5) {
    return {
      title: 'Belle semaine en cours',
      body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} et ta charge mentale a baisse de ${Math.abs(tlxDelta)} points.`,
      icon: 'sparkles-outline',
    };
  }

  if (tlxDelta !== null && tlxDelta > 5) {
    const suffix = overdueTasks > 0
      ? `Il reste ${overdueTasks} tache${overdueTasks > 1 ? 's' : ''} en retard.`
      : 'Prends un moment pour toi.';
    return {
      title: 'Semaine chargee',
      body: `Ta charge mentale a augmente de ${tlxDelta} points. ${suffix}`,
      icon: 'alert-circle-outline',
    };
  }

  return {
    title: 'En bonne voie',
    body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} cette semaine. Continue comme ca !`,
    icon: 'checkmark-circle-outline',
  };
}

export function NarrativeCard(props: NarrativeCardProps) {
  const { title, body, icon } = getNarrative(props);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.miel} />
        <Text variant="label" weight="bold" style={styles.title}>
          {title}
        </Text>
        <Ionicons
          name="expand-outline"
          size={16}
          color={Colors.textMuted}
          style={styles.expandIcon}
        />
      </View>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {body}
      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  body: {
    lineHeight: Typography.fontSize.sm * 1.6,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/NarrativeCard.tsx
git commit -m "feat(dashboard): add NarrativeCard component for mobile"
```

---

### Task 4: Mobile — TlxDetailCard component

**Files:**
- Create: `apps/mobile/src/components/dashboard/TlxDetailCard.tsx`

- [ ] **Step 1: Create TlxDetailCard component**

```tsx
// apps/mobile/src/components/dashboard/TlxDetailCard.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import type { TlxEntry } from '../../types';

interface TlxDetailCardProps {
  currentTlx: TlxEntry | null | undefined;
  tlxDelta: { score: number; delta: number | null; hasComparison: boolean } | null | undefined;
}

function MiniGauge({ value, size = 52 }: { value: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gray100}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.prune}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.miniGaugeCenter, { width: size, height: size }]}>
        <Text variant="label" weight="extrabold" style={{ color: Colors.prune, fontSize: 14 }}>
          {value}
        </Text>
        <Text variant="caption" color="muted" style={{ fontSize: 8 }}>
          Moy
        </Text>
      </View>
    </View>
  );
}

export function TlxDetailCard({ currentTlx, tlxDelta }: TlxDetailCardProps) {
  const router = useRouter();

  if (!currentTlx) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/(app)/dashboard/tlx')}
        activeOpacity={0.85}
      >
        <View style={styles.ctaRow}>
          <Ionicons name="pulse-outline" size={28} color={Colors.prune} />
          <View style={{ flex: 1 }}>
            <Text variant="label">Evaluez votre charge mentale</Text>
            <Text variant="bodySmall" color="muted">
              Remplissez le questionnaire TLX
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  const dimensions = [
    { label: 'Exig.', value: currentTlx.mental_demand, color: Colors.rose },
    { label: 'Effort', value: currentTlx.effort, color: Colors.miel },
    { label: 'Frust.', value: currentTlx.frustration, color: Colors.sauge },
  ];

  // Find max, min, average across all 6 dimensions
  const allValues = [
    currentTlx.mental_demand,
    currentTlx.physical_demand,
    currentTlx.temporal_demand,
    100 - currentTlx.performance, // inverted
    currentTlx.effort,
    currentTlx.frustration,
  ];
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const avgVal = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(app)/dashboard/tlx')}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.statusDot} />
        <Text variant="bodySmall" weight="semibold" style={{ flex: 1 }}>
          Score TLX cette semaine
        </Text>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <Text
            variant="caption"
            style={{ color: tlxDelta.delta > 0 ? Colors.rose : Colors.sauge }}
          >
            {tlxDelta.delta > 0 ? '+' : ''}{tlxDelta.delta} pts
          </Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.rose }}>
            {maxVal}
          </Text>
          <Text variant="caption" color="muted">Max</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.sauge }}>
            {minVal}
          </Text>
          <Text variant="caption" color="muted">Min</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="h3" weight="extrabold" style={{ color: Colors.miel }}>
            {avgVal}
          </Text>
          <Text variant="caption" color="muted">Moy.</Text>
        </View>
        <MiniGauge value={currentTlx.score} />
      </View>

      {/* Energy bar */}
      <View style={styles.energyRow}>
        <Ionicons name="flash" size={16} color={Colors.miel} />
        <View style={styles.energyBarBg}>
          <View
            style={[
              styles.energyBarFill,
              { width: `${Math.min(currentTlx.score, 100)}%` },
            ]}
          />
        </View>
        <Text variant="bodySmall" weight="bold" style={{ color: Colors.prune }}>
          {currentTlx.score}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sauge,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  energyBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.prune,
  },
  miniGaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TlxDetailCard.tsx
git commit -m "feat(dashboard): add TlxDetailCard component for mobile"
```

---

### Task 5: Mobile — Rewrite dashboard screen

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the dashboard screen**

Replace the entire contents of `apps/mobile/app/(app)/dashboard/index.tsx` with:

```tsx
import React, { useEffect, useRef, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks, useOverdueTasks, useTodayTasks } from '../../../src/lib/queries/tasks';
import { useWeeklyBalance } from '../../../src/lib/queries/weekly-stats';
import { useCurrentTlx, useTlxDelta } from '../../../src/lib/queries/tlx';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { CircularGauge } from '../../../src/components/dashboard/CircularGauge';
import { StatusPill } from '../../../src/components/dashboard/StatusPill';
import { NarrativeCard } from '../../../src/components/dashboard/NarrativeCard';
import { TlxDetailCard } from '../../../src/components/dashboard/TlxDetailCard';
import { WeeklyReportCard } from '../../../src/components/dashboard/WeeklyReportCard';

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
          delay: i * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 450,
          delay: i * 50,
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const priorityColors: Record<string, string> = {
  high: Colors.rose,
  urgent: Colors.rose,
  medium: Colors.miel,
  low: Colors.sauge,
};

function formatDateHeader(): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  const now = new Date();
  return `Aujourd'hui, ${now.getDate()} ${months[now.getMonth()]}`;
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: allTasks = [] } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const fadeAnims = useStaggeredFadeIn(9);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const { activeTasks, doneTasks } = useMemo(() => {
    const active: typeof allTasks = [];
    const done: typeof allTasks = [];
    for (const t of allTasks) {
      if (t.status === 'done') done.push(t);
      else active.push(t);
    }
    return { activeTasks: active, doneTasks: done };
  }, [allTasks]);

  // Current user's balance share
  const myBalance = balanceMembers.find((m) => m.userId === profile?.id);
  const balancePercent = myBalance ? Math.round(myBalance.tasksShare * 100) : 0;

  // Weekly progress: done / total
  const weeklyProgress = allTasks.length > 0
    ? Math.round((doneTasks.length / allTasks.length) * 100)
    : 0;

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
        {/* ── 1. HEADER ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="h4" weight="bold" style={styles.dateText}>
              {formatDateHeader()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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

        {/* ── 2. STATUS PILLS ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.pillsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
          >
            <StatusPill dot={Colors.sauge} label={household.name} />
            <StatusPill
              icon={<Ionicons name="clipboard-outline" size={14} color={Colors.textSecondary} />}
              label={`${todayTasks.length} tache${todayTasks.length !== 1 ? 's' : ''} aujourd'hui`}
            />
            {overdueTasks.length > 0 && (
              <StatusPill
                dot={Colors.rose}
                label={`${overdueTasks.length} en retard`}
                variant="alert"
              />
            )}
          </ScrollView>
        </FadeSection>

        {/* ── 3. THREE GAUGES ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.sectionPadded}>
          <View style={styles.gaugesCard}>
            <CircularGauge
              value={currentTlx?.score ?? 0}
              max={100}
              color={Colors.prune}
              label="TLX"
              subtitle="/ 100"
            />
            <CircularGauge
              value={balancePercent}
              max={100}
              color={Colors.sauge}
              label="Balance"
            />
            <CircularGauge
              value={weeklyProgress}
              max={100}
              color={Colors.miel}
              label="Semaine"
            />
          </View>
        </FadeSection>

        {/* ── 4. NARRATIVE CARD ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.sectionPadded}>
          <NarrativeCard
            doneTasks={doneTasks.length}
            overdueTasks={overdueTasks.length}
            tlxDelta={tlxDelta?.delta ?? null}
            hasTlx={!!currentTlx}
          />
        </FadeSection>

        {/* ── 5. CHARGE MENTALE ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Charge mentale
          </Text>
          <TlxDetailCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
        </FadeSection>

        {/* ── 6. TACHES DU JOUR ── */}
        <FadeSection anim={fadeAnims[5]} style={styles.sectionPadded}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="overline" color="muted">Taches du jour</Text>
            {todayTasks.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text variant="caption" style={{ color: Colors.terracotta }}>Tout voir</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.flatCard}>
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 4).map((t, i) => (
                <View key={t.id}>
                  <View style={styles.taskRow}>
                    <View style={[styles.prioDot, { backgroundColor: priorityColors[t.priority] || priorityColors.medium }]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" weight="semibold" numberOfLines={1}>{t.title}</Text>
                      <Text variant="caption" color="muted">
                        {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                      </Text>
                    </View>
                  </View>
                  {i < Math.min(todayTasks.length, 4) - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Aucune tache prevue aujourd'hui
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 7. REPARTITION SEMAINE ── */}
        <FadeSection anim={fadeAnims[6]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Repartition cette semaine
          </Text>
          <View style={styles.flatCard}>
            {balanceMembers.length > 0 ? (
              balanceMembers.map((m, i) => (
                <View key={m.userId}>
                  <View style={styles.memberRow}>
                    <View style={[styles.memberDot, { backgroundColor: m.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" weight="semibold">{m.name.split(' ')[0]}</Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              width: `${Math.round(m.tasksShare * 100)}%`,
                              backgroundColor: m.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text variant="label" weight="bold" style={styles.percentLabel}>
                      {Math.round(m.tasksShare * 100)}%
                    </Text>
                  </View>
                  {i < balanceMembers.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Pas encore de donnees cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 8. TERMINE RECEMMENT ── */}
        <FadeSection anim={fadeAnims[7]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Termine recemment
          </Text>
          <View style={styles.flatCard}>
            {doneTasks.length > 0 ? (
              doneTasks.slice(0, 5).map((t, i) => (
                <View key={t.id}>
                  <View style={styles.doneItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.sauge} />
                    <Text variant="bodySmall" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                      {t.title}
                    </Text>
                    {t.completed_at && (
                      <Text variant="caption" color="muted">
                        {dayjs(t.completed_at).format('DD/MM')}
                      </Text>
                    )}
                  </View>
                  {i < Math.min(doneTasks.length, 5) - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Aucune tache terminee cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 9. RAPPORT HEBDO ── */}
        <FadeSection anim={fadeAnims[8]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Rapport de la semaine
          </Text>
          <WeeklyReportCard />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  dateText: {
    color: Colors.textPrimary,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textInverse,
  },

  // Pills
  pillsRow: {
    marginBottom: Spacing.lg,
  },
  pillsContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },

  // Sections
  sectionPadded: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  // Gauges
  gaugesCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
    ...Shadows.card,
  },

  // Flat card
  flatCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.card,
  },

  // Tasks
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },

  // Balance
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  percentLabel: {
    minWidth: 36,
    textAlign: 'right',
  },

  // Done
  doneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  // Shared
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/mobile/tsconfig.json 2>&1 | head -30`
Expected: No errors in dashboard files

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/dashboard/index.tsx
git commit -m "feat(dashboard): rewrite mobile dashboard with Bevel-inspired layout"
```

---

### Task 6: Web — CircularGauge component

**Files:**
- Create: `apps/web/src/components/dashboard/CircularGauge.tsx`

- [ ] **Step 1: Create CircularGauge for web**

```tsx
// apps/web/src/components/dashboard/CircularGauge.tsx

interface CircularGaugeProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  label: string;
  subtitle?: string;
}

export function CircularGauge({
  value,
  max,
  color,
  size = 80,
  label,
  subtitle,
}: CircularGaugeProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clampedValue / max : 0;
  const degrees = Math.round(progress * 360);
  const displayValue = max === 100 ? value : `${Math.round(progress * 100)}%`;
  const innerSize = size * 0.8;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} 0deg ${degrees}deg, var(--color-gray-100) ${degrees}deg 360deg)`,
        }}
      >
        <div
          className="rounded-full bg-background-card flex flex-col items-center justify-center"
          style={{ width: innerSize, height: innerSize }}
        >
          <span
            className="font-heading font-extrabold leading-none"
            style={{ color, fontSize: size * 0.275 }}
          >
            {displayValue}
          </span>
          {subtitle && (
            <span
              className="text-text-muted"
              style={{ fontSize: size * 0.11 }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-text-secondary">
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/CircularGauge.tsx
git commit -m "feat(dashboard): add CircularGauge component for web"
```

---

### Task 7: Web — StatusPills component

**Files:**
- Create: `apps/web/src/components/dashboard/StatusPills.tsx`

- [ ] **Step 1: Create StatusPills for web**

```tsx
// apps/web/src/components/dashboard/StatusPills.tsx
import { cn } from '@/lib/utils';

interface StatusPillProps {
  label: string;
  dot?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'alert';
}

function StatusPill({ label, dot, icon, variant = 'default' }: StatusPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[7px] rounded-full px-3.5 py-[7px] text-xs font-medium shrink-0',
        variant === 'default' && 'bg-background-card shadow-sm text-text-primary',
        variant === 'alert' && 'bg-rose/[0.07] border border-rose/20 text-rose',
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
      )}
      {icon}
      {label}
    </div>
  );
}

interface StatusPillsRowProps {
  householdName: string;
  todayCount: number;
  overdueCount: number;
}

export function StatusPillsRow({ householdName, todayCount, overdueCount }: StatusPillsRowProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <StatusPill dot="var(--color-sauge)" label={householdName} />
      <StatusPill
        icon={<span className="text-sm">📋</span>}
        label={`${todayCount} tache${todayCount !== 1 ? 's' : ''} aujourd'hui`}
      />
      {overdueCount > 0 && (
        <StatusPill
          dot="var(--color-rose)"
          label={`${overdueCount} en retard`}
          variant="alert"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/StatusPills.tsx
git commit -m "feat(dashboard): add StatusPills component for web"
```

---

### Task 8: Web — NarrativeCard component

**Files:**
- Create: `apps/web/src/components/dashboard/NarrativeCard.tsx`

- [ ] **Step 1: Create NarrativeCard for web**

```tsx
// apps/web/src/components/dashboard/NarrativeCard.tsx
import { Sparkles, AlertCircle, CheckCircle, Hand } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface NarrativeCardProps {
  doneTasks: number;
  overdueTasks: number;
  tlxDelta: number | null;
  hasTlx: boolean;
}

function getNarrative(props: NarrativeCardProps) {
  const { doneTasks, overdueTasks, tlxDelta, hasTlx } = props;

  if (!hasTlx) {
    return {
      title: 'Bienvenue',
      body: 'Remplis le questionnaire TLX pour suivre ta charge mentale cette semaine.',
      Icon: Hand,
    };
  }

  if (tlxDelta !== null && tlxDelta < -5) {
    return {
      title: 'Belle semaine en cours',
      body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} et ta charge mentale a baisse de ${Math.abs(tlxDelta)} points.`,
      Icon: Sparkles,
    };
  }

  if (tlxDelta !== null && tlxDelta > 5) {
    const suffix = overdueTasks > 0
      ? `Il reste ${overdueTasks} tache${overdueTasks > 1 ? 's' : ''} en retard.`
      : 'Prends un moment pour toi.';
    return {
      title: 'Semaine chargee',
      body: `Ta charge mentale a augmente de ${tlxDelta} points. ${suffix}`,
      Icon: AlertCircle,
    };
  }

  return {
    title: 'En bonne voie',
    body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} cette semaine. Continue comme ca !`,
    Icon: CheckCircle,
  };
}

export function NarrativeCard(props: NarrativeCardProps) {
  const { title, body, Icon } = getNarrative(props);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={20} className="text-miel shrink-0" />
        <span className="text-sm font-bold text-text-primary flex-1">{title}</span>
        <span className="text-text-muted text-sm">↗</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/NarrativeCard.tsx
git commit -m "feat(dashboard): add NarrativeCard component for web"
```

---

### Task 9: Web — TlxDetailCard component

**Files:**
- Create: `apps/web/src/components/dashboard/TlxDetailCard.tsx`

- [ ] **Step 1: Create TlxDetailCard for web**

```tsx
// apps/web/src/components/dashboard/TlxDetailCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CircularGauge } from './CircularGauge';
import type { TlxEntry } from '@keurzen/shared';

interface TlxDetailCardProps {
  currentTlx: TlxEntry | null | undefined;
  tlxDelta: { score: number; delta: number | null; hasComparison: boolean } | null | undefined;
}

export function TlxDetailCard({ currentTlx, tlxDelta }: TlxDetailCardProps) {
  const router = useRouter();

  if (!currentTlx) {
    return (
      <Card hoverable onClick={() => router.push('/dashboard/tlx')}>
        <div className="flex items-center gap-4">
          <Zap size={28} className="text-prune shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Evaluez votre charge mentale</p>
            <p className="text-xs text-text-muted">Remplissez le questionnaire TLX</p>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </div>
      </Card>
    );
  }

  const allValues = [
    currentTlx.mental_demand,
    currentTlx.physical_demand,
    currentTlx.temporal_demand,
    100 - currentTlx.performance,
    currentTlx.effort,
    currentTlx.frustration,
  ];
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const avgVal = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);

  return (
    <Card hoverable onClick={() => router.push('/dashboard/tlx')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-sauge shrink-0" />
        <span className="text-sm font-semibold flex-1">Score TLX cette semaine</span>
        {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
          <span
            className="text-xs"
            style={{ color: tlxDelta.delta > 0 ? 'var(--color-rose)' : 'var(--color-sauge)' }}
          >
            {tlxDelta.delta > 0 ? '+' : ''}{tlxDelta.delta} pts
          </span>
        )}
        <ChevronRight size={14} className="text-text-muted shrink-0" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-center">
          <p className="text-xl font-extrabold text-rose">{maxVal}</p>
          <p className="text-[10px] text-text-muted">Max</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-sauge">{minVal}</p>
          <p className="text-[10px] text-text-muted">Min</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-miel">{avgVal}</p>
          <p className="text-[10px] text-text-muted">Moy.</p>
        </div>
        <CircularGauge
          value={currentTlx.score}
          max={100}
          color="var(--color-prune)"
          size={52}
          label=""
        />
      </div>

      {/* Energy bar */}
      <div className="flex items-center gap-2.5">
        <Zap size={16} className="text-miel shrink-0" />
        <div className="flex-1 h-2.5 rounded-full bg-[var(--color-gray-100)] overflow-hidden">
          <div
            className="h-full rounded-full bg-prune"
            style={{ width: `${Math.min(currentTlx.score, 100)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-prune">{currentTlx.score}%</span>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/TlxDetailCard.tsx
git commit -m "feat(dashboard): add TlxDetailCard component for web"
```

---

### Task 10: Web — Rewrite dashboard page

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire contents of `apps/web/src/app/(app)/dashboard/page.tsx` with:

```tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import {
  useTasks,
  useOverdueTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
  useTlxDelta,
  useWeeklyReport,
} from '@keurzen/queries';
import { formatDate } from '@keurzen/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularGauge } from '@/components/dashboard/CircularGauge';
import { StatusPillsRow } from '@/components/dashboard/StatusPills';
import { NarrativeCard } from '@/components/dashboard/NarrativeCard';
import { TlxDetailCard } from '@/components/dashboard/TlxDetailCard';
import { WeeklyReportSection } from '@/components/dashboard/WeeklyReportSection';

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

function formatDateHeader(): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  const now = new Date();
  return `Aujourd'hui, ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, household } = useAuthStore();
  const { data: allTasks = [], isLoading } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const { activeTasks, doneTasks } = useMemo(() => {
    const active: typeof allTasks = [];
    const done: typeof allTasks = [];
    for (const t of allTasks) {
      if (t.status === 'done') done.push(t);
      else active.push(t);
    }
    return { activeTasks: active, doneTasks: done };
  }, [allTasks]);

  const myBalance = balanceMembers.find((m) => m.userId === profile?.id);
  const balancePercent = myBalance ? Math.round(myBalance.tasksShare * 100) : 0;
  const weeklyProgress = allTasks.length > 0
    ? Math.round((doneTasks.length / allTasks.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* 1. Header */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{formatDateHeader()}</h1>
        <Avatar src={profile?.avatar_url} name={profile?.full_name || undefined} size={38} />
      </div>

      {/* 2. Status Pills */}
      <div className="mb-6">
        <StatusPillsRow
          householdName={household?.name ?? 'Mon foyer'}
          todayCount={todayTasks.length}
          overdueCount={overdueTasks.length}
        />
      </div>

      {/* 3. Three Gauges */}
      <Card className="mb-6">
        <div className="flex justify-around items-center py-2">
          <CircularGauge
            value={currentTlx?.score ?? 0}
            max={100}
            color="var(--color-prune)"
            label="TLX"
            subtitle="/ 100"
          />
          <CircularGauge
            value={balancePercent}
            max={100}
            color="var(--color-sauge)"
            label="Balance"
          />
          <CircularGauge
            value={weeklyProgress}
            max={100}
            color="var(--color-miel)"
            label="Semaine"
          />
        </div>
      </Card>

      {/* 4. Narrative Card */}
      <div className="mb-6">
        <NarrativeCard
          doneTasks={doneTasks.length}
          overdueTasks={overdueTasks.length}
          tlxDelta={tlxDelta?.delta ?? null}
          hasTlx={!!currentTlx}
        />
      </div>

      {/* 5. Charge Mentale + 6. Taches du jour — 2 columns on desktop */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Charge mentale
          </p>
          <TlxDetailCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Taches du jour
            </p>
            {todayTasks.length > 0 && (
              <button
                onClick={() => router.push('/tasks')}
                className="text-xs font-medium text-terracotta hover:underline"
              >
                Tout voir
              </button>
            )}
          </div>
          <Card>
            {todayTasks.length > 0 ? (
              <div className="divide-y divide-border-light">
                {todayTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: priorityColors[t.priority] || priorityColors.medium }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-xs text-text-muted">
                        {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Aucune tache prevue aujourd&apos;hui
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* 7. Repartition + 8. Termine recemment — 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Repartition cette semaine
          </p>
          <Card>
            {balanceMembers.length > 0 ? (
              <div className="space-y-3">
                {balanceMembers.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{m.name.split(' ')[0]}</p>
                      <ProgressBar value={Math.round(m.tasksShare * 100)} color={m.color} />
                    </div>
                    <span className="text-sm font-bold tabular-nums min-w-[36px] text-right">
                      {Math.round(m.tasksShare * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Pas encore de donnees cette semaine
              </p>
            )}
          </Card>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Termine recemment
          </p>
          <Card>
            {doneTasks.length > 0 ? (
              <div className="divide-y divide-border-light">
                {doneTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <CheckCircle size={16} className="text-sauge shrink-0" />
                    <p className="flex-1 text-sm text-text-secondary truncate">{t.title}</p>
                    {t.completed_at && (
                      <span className="text-xs text-text-muted shrink-0">
                        {formatDate(t.completed_at, 'DD/MM')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Aucune tache terminee cette semaine
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* 9. Rapport hebdo */}
      <WeeklyReportSection />
    </>
  );
}
```

- [ ] **Step 2: Verify the web build compiles**

Run: `cd /Users/ouss/Keurzen && npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -30`
Expected: No errors in dashboard files

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): rewrite web dashboard with Bevel-inspired layout"
```

---

### Task 11: Verify both platforms

- [ ] **Step 1: Run lint on mobile**

Run: `cd /Users/ouss/Keurzen && npm run lint 2>&1 | tail -20`
Expected: No new errors

- [ ] **Step 2: Run lint on web**

Run: `cd /Users/ouss/Keurzen/apps/web && npm run lint 2>&1 | tail -20`
Expected: No new errors

- [ ] **Step 3: Visual testing checklist**

Test on mobile (Expo):
1. Dashboard loads with all 9 sections
2. Gauges render with correct fill levels
3. Status pills scroll horizontally
4. Narrative card shows contextual message
5. TLX detail card shows Max/Min/Moy + energy bar (or CTA if no TLX)
6. Pull-to-refresh works
7. Navigation: avatar → profile, tasks → tasks, TLX card → TLX screen
8. Empty states render for: no tasks, no TLX, no balance data

Test on web:
1. Same 9 sections render
2. Responsive: 2-column grid on desktop, single column on mobile
3. Gauges use conic-gradient (check in browser DevTools)
4. All navigation links work
5. Empty states match mobile

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(dashboard): address lint and visual fixes"
```
