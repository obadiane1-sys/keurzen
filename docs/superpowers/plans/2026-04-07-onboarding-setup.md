# Onboarding Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 4-step onboarding flow that appears once after account creation, collects user preferences (household type, current split, pain point, main goal), and saves them to a dedicated Supabase table before redirecting to the dashboard.

**Architecture:** Single-screen component with `useState<number>` managing 5 views (4 selection steps + completion screen). Redirect triggered from dashboard when `profile.has_seen_onboarding === false`. Data stored in `onboarding_preferences` table with RLS. Dual-platform: mobile (Expo/RN) + web (Next.js), sharing types via `@keurzen/shared` and query logic via `@keurzen/queries`.

**Tech Stack:** Expo SDK 55, React Native, TypeScript strict, Supabase (Postgres + RLS), TanStack Query v5, Zustand, Next.js (web)

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `apps/mobile/supabase/migrations/20260407_create_onboarding_preferences.sql` | DB table + RLS |
| `packages/shared/src/types/onboarding.ts` | Shared TypeScript types |
| `packages/queries/src/services/onboarding.service.ts` | Supabase upsert/fetch logic |
| `packages/queries/src/hooks/useOnboarding.ts` | TanStack mutation + query hooks |
| `apps/mobile/app/(app)/onboarding/setup.tsx` | Mobile onboarding screen |
| `apps/web/src/app/(app)/onboarding/setup/page.tsx` | Web onboarding page |

### Modified files

| File | Change |
|---|---|
| `packages/shared/src/types/index.ts` | Re-export onboarding types |
| `packages/queries/src/index.ts` | Re-export onboarding hooks/services |
| `apps/mobile/app/(app)/dashboard/index.tsx` | Add redirect if `!has_seen_onboarding` |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Add redirect if `!has_seen_onboarding` |

---

### Task 1: Database Migration

**Files:**
- Create: `apps/mobile/supabase/migrations/20260407_create_onboarding_preferences.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Onboarding preferences — stores user answers from the initial setup flow
CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  household_type TEXT,
  current_split TEXT,
  pain_point TEXT,
  main_goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.onboarding_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.onboarding_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.onboarding_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply the migration**

Run: `cd /Users/ouss/Keurzen && npx supabase db push`
Expected: Migration applied successfully, table `onboarding_preferences` created.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/supabase/migrations/20260407_create_onboarding_preferences.sql
git commit -m "feat(db): create onboarding_preferences table with RLS"
```

---

### Task 2: Shared Types

**Files:**
- Create: `packages/shared/src/types/onboarding.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Create the onboarding types file**

```typescript
// ─── Onboarding Preferences ──────────────────────────────────────────────────

export type HouseholdType = 'solo' | 'couple' | 'family' | 'large_family';
export type CurrentSplit = 'mainly_me' | 'equal' | 'varies' | 'starting';
export type PainPoint = 'meals' | 'chores' | 'planning' | 'finances';
export type MainGoal = 'mental_relief' | 'overview' | 'balance' | 'save_time';

export interface OnboardingPreferences {
  id: string;
  user_id: string;
  household_type: HouseholdType | null;
  current_split: CurrentSplit | null;
  pain_point: PainPoint | null;
  main_goal: MainGoal | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Re-export from index**

Add to `packages/shared/src/types/index.ts`:

```typescript
export * from './onboarding';
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/onboarding.ts packages/shared/src/types/index.ts
git commit -m "feat(shared): add OnboardingPreferences types"
```

---

### Task 3: Onboarding Service + Query Hook

**Files:**
- Create: `packages/queries/src/services/onboarding.service.ts`
- Create: `packages/queries/src/hooks/useOnboarding.ts`
- Modify: `packages/queries/src/index.ts`

- [ ] **Step 1: Create the onboarding service**

```typescript
import type { OnboardingPreferences, HouseholdType, CurrentSplit, PainPoint, MainGoal } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

export interface OnboardingAnswers {
  household_type: HouseholdType;
  current_split: CurrentSplit;
  pain_point: PainPoint;
  main_goal: MainGoal;
}

export async function saveOnboardingPreferences(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_preferences')
    .upsert(
      {
        user_id: userId,
        ...answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(error.message);
}

export async function fetchOnboardingPreferences(
  userId: string
): Promise<OnboardingPreferences | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('onboarding_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as OnboardingPreferences;
}
```

- [ ] **Step 2: Create the TanStack Query hook**

```typescript
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@keurzen/stores';
import { saveOnboardingPreferences, type OnboardingAnswers } from '../services/onboarding.service';
import { markOnboardingSeen } from '../services/auth.service';

export function useSaveOnboarding() {
  const { user, profile, setProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (answers: OnboardingAnswers) => {
      if (!user) throw new Error('Not authenticated');
      await saveOnboardingPreferences(user.id, answers);
      await markOnboardingSeen(user.id);
    },
    onSuccess: () => {
      if (profile) {
        setProfile({ ...profile, has_seen_onboarding: true });
      }
    },
  });
}

export function useSkipOnboarding() {
  const { user, profile, setProfile } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await markOnboardingSeen(user.id);
    },
    onSuccess: () => {
      if (profile) {
        setProfile({ ...profile, has_seen_onboarding: true });
      }
    },
  });
}
```

- [ ] **Step 3: Re-export from packages/queries/src/index.ts**

Add these two lines:

```typescript
export * from './services/onboarding.service';
export * from './hooks/useOnboarding';
```

- [ ] **Step 4: Commit**

```bash
git add packages/queries/src/services/onboarding.service.ts packages/queries/src/hooks/useOnboarding.ts packages/queries/src/index.ts
git commit -m "feat(queries): add onboarding service and mutation hooks"
```

---

### Task 4: Mobile Onboarding Screen

**Files:**
- Create: `apps/mobile/app/(app)/onboarding/setup.tsx`

- [ ] **Step 1: Create the onboarding setup screen**

```tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Mascot } from '../../../src/components/ui/Mascot';
import { useAuthStore } from '../../../src/stores/auth.store';
import { markOnboardingSeen } from '../../../src/lib/supabase/auth';
import { supabase } from '../../../src/lib/supabase/client';
import type { HouseholdType, CurrentSplit, PainPoint, MainGoal } from '../../../src/types';

// ─── Step definitions ──────────────────────────────────────────────────────────

interface StepOption<T extends string> {
  emoji: string;
  label: string;
  value: T;
}

interface StepConfig<T extends string> {
  title: string;
  options: StepOption<T>[];
}

const STEPS: [
  StepConfig<HouseholdType>,
  StepConfig<CurrentSplit>,
  StepConfig<PainPoint>,
  StepConfig<MainGoal>,
] = [
  {
    title: 'Comment est compose votre foyer ?',
    options: [
      { emoji: '\u{1F9D1}', label: 'Je vis seul\u00b7e', value: 'solo' },
      { emoji: '\u{1F46B}', label: 'En couple', value: 'couple' },
      { emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}', label: 'Famille avec enfants', value: 'family' },
      { emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', label: 'Grande famille', value: 'large_family' },
    ],
  },
  {
    title: 'Qui gere le foyer aujourd\'hui ?',
    options: [
      { emoji: '\u{1F4AA}', label: 'Principalement moi', value: 'mainly_me' },
      { emoji: '\u{1F91D}', label: 'On se partage equitablement', value: 'equal' },
      { emoji: '\u{1F504}', label: 'Ca varie beaucoup', value: 'varies' },
      { emoji: '\u{1F195}', label: 'On commence a s\'organiser', value: 'starting' },
    ],
  },
  {
    title: 'Qu\'est-ce qui vous prend le plus d\'energie ?',
    options: [
      { emoji: '\u{1F6D2}', label: 'Les courses et repas', value: 'meals' },
      { emoji: '\u{1F9F9}', label: 'Les taches menageres', value: 'chores' },
      { emoji: '\u{1F4C5}', label: 'L\'organisation generale', value: 'planning' },
      { emoji: '\u{1F4B0}', label: 'Les finances du foyer', value: 'finances' },
    ],
  },
  {
    title: 'Qu\'attendez-vous de Keurzen ?',
    options: [
      { emoji: '\u{1F9D8}', label: 'Me decharger l\'esprit', value: 'mental_relief' },
      { emoji: '\u{1F441}\uFE0F', label: 'Avoir une vue d\'ensemble', value: 'overview' },
      { emoji: '\u2696\uFE0F', label: 'Mieux equilibrer avec mon partenaire', value: 'balance' },
      { emoji: '\u26A1', label: 'Gagner du temps au quotidien', value: 'save_time' },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<[
    HouseholdType | null,
    CurrentSplit | null,
    PainPoint | null,
    MainGoal | null,
  ]>([null, null, null, null]);
  const [isSaving, setIsSaving] = useState(false);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSelect = (value: string) => {
    const updated = [...answers] as typeof answers;
    updated[currentStep] = value as typeof updated[typeof currentStep];
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      // Move to completion screen
      animateTransition(() => setCurrentStep(TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      await markOnboardingSeen(user.id);
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
    } catch {
      // Redirect anyway to avoid blocking
    }
    router.replace('/(app)/dashboard');
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Save preferences
      const [household_type, current_split, pain_point, main_goal] = answers;
      if (household_type && current_split && pain_point && main_goal) {
        const { error } = await supabase
          .from('onboarding_preferences')
          .upsert(
            {
              user_id: user.id,
              household_type,
              current_split,
              pain_point,
              main_goal,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        if (error) console.warn('[Keurzen] Failed to save onboarding preferences:', error.message);
      }
      // Mark onboarding as seen
      await markOnboardingSeen(user.id);
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
    } catch {
      // Redirect anyway
    }
    setIsSaving(false);
    router.replace('/(app)/dashboard');
  };

  // ─── Completion screen ─────────────────────────────────────────────────────

  if (currentStep === TOTAL_STEPS) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.centered} showsVerticalScrollIndicator={false}>
          <Mascot size={120} expression="happy" />

          <Text variant="h2" style={styles.title}>
            Tout est pret !
          </Text>

          <Text variant="body" color="secondary" style={styles.subtitle}>
            Keurzen est configure pour vous.{'\n'}Decouvrez votre tableau de bord.
          </Text>

          <Button
            label="Decouvrir Keurzen"
            onPress={handleFinish}
            isLoading={isSaving}
            fullWidth
            size="lg"
            style={styles.cta}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Selection steps ───────────────────────────────────────────────────────

  const step = STEPS[currentStep];
  const selectedValue = answers[currentStep];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with back button + progress */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i <= currentStep ? styles.progressActive : styles.progressInactive,
              ]}
            />
          ))}
        </View>

        <View style={styles.backPlaceholder} />
      </View>

      {/* Step content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="h2" style={styles.stepTitle}>
            {step.title}
          </Text>

          <View style={styles.optionsContainer}>
            {step.options.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'regular'}
                    style={styles.optionLabel}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.terracotta} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <Button
            label="Continuer"
            onPress={handleNext}
            fullWidth
            size="lg"
            disabled={!selectedValue}
          />

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text variant="bodySmall" color="muted">Passer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: TouchTarget.min,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
  },
  progressActive: {
    backgroundColor: Colors.terracotta,
  },
  progressInactive: {
    backgroundColor: Colors.borderLight,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    flexGrow: 1,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    minHeight: TouchTarget.min + Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  optionCardSelected: {
    borderColor: Colors.terracotta,
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  optionLabel: {
    flex: 1,
  },
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  cta: {
    marginTop: Spacing.xl,
  },
  bottomActions: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/ouss/Keurzen/apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `setup.tsx`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/onboarding/setup.tsx
git commit -m "feat(mobile): add onboarding setup multi-step screen"
```

---

### Task 5: Mobile Dashboard Redirect

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx:110-128`

- [ ] **Step 1: Add the redirect logic at the top of DashboardScreen**

At the top of the `DashboardScreen` function (after the hooks, before `fadeAnims`), add:

```typescript
  // Redirect to onboarding if not seen
  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }
```

Also add the `Redirect` import — it's already imported from `expo-router` at the top of the file, but it's used in `_layout.tsx`, not in dashboard. Check if `Redirect` is imported in `dashboard/index.tsx`. If not, add it to the `useRouter` import line:

```typescript
import { useRouter, Redirect } from 'expo-router';
```

The redirect should be placed after `const firstName = ...` (line ~123) and before the `doneTasks` memo, so it fires before rendering the dashboard content.

- [ ] **Step 2: Test the redirect logic**

Manual test:
1. In Supabase, set `has_seen_onboarding = false` for your test user
2. Open the app — dashboard should redirect to the onboarding setup screen
3. Complete the 4 steps — should redirect back to dashboard
4. Reload the app — should go directly to dashboard (no redirect)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/dashboard/index.tsx
git commit -m "feat(mobile): redirect to onboarding setup from dashboard"
```

---

### Task 6: Web Onboarding Page

**Files:**
- Create: `apps/web/src/app/(app)/onboarding/setup/page.tsx`

- [ ] **Step 1: Create the web onboarding page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import { markOnboardingSeen } from '@keurzen/queries';
import type { HouseholdType, CurrentSplit, PainPoint, MainGoal } from '@keurzen/shared';

// ─── Step definitions ──────────────────────────────────────────────────────────

interface StepOption<T extends string> {
  emoji: string;
  label: string;
  value: T;
}

interface StepConfig<T extends string> {
  title: string;
  options: StepOption<T>[];
}

const STEPS: [
  StepConfig<HouseholdType>,
  StepConfig<CurrentSplit>,
  StepConfig<PainPoint>,
  StepConfig<MainGoal>,
] = [
  {
    title: 'Comment est compose votre foyer ?',
    options: [
      { emoji: '\u{1F9D1}', label: 'Je vis seul\u00b7e', value: 'solo' },
      { emoji: '\u{1F46B}', label: 'En couple', value: 'couple' },
      { emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}', label: 'Famille avec enfants', value: 'family' },
      { emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', label: 'Grande famille', value: 'large_family' },
    ],
  },
  {
    title: 'Qui gere le foyer aujourd\'hui ?',
    options: [
      { emoji: '\u{1F4AA}', label: 'Principalement moi', value: 'mainly_me' },
      { emoji: '\u{1F91D}', label: 'On se partage equitablement', value: 'equal' },
      { emoji: '\u{1F504}', label: 'Ca varie beaucoup', value: 'varies' },
      { emoji: '\u{1F195}', label: 'On commence a s\'organiser', value: 'starting' },
    ],
  },
  {
    title: 'Qu\'est-ce qui vous prend le plus d\'energie ?',
    options: [
      { emoji: '\u{1F6D2}', label: 'Les courses et repas', value: 'meals' },
      { emoji: '\u{1F9F9}', label: 'Les taches menageres', value: 'chores' },
      { emoji: '\u{1F4C5}', label: 'L\'organisation generale', value: 'planning' },
      { emoji: '\u{1F4B0}', label: 'Les finances du foyer', value: 'finances' },
    ],
  },
  {
    title: 'Qu\'attendez-vous de Keurzen ?',
    options: [
      { emoji: '\u{1F9D8}', label: 'Me decharger l\'esprit', value: 'mental_relief' },
      { emoji: '\u{1F441}\uFE0F', label: 'Avoir une vue d\'ensemble', value: 'overview' },
      { emoji: '\u2696\uFE0F', label: 'Mieux equilibrer avec mon partenaire', value: 'balance' },
      { emoji: '\u26A1', label: 'Gagner du temps au quotidien', value: 'save_time' },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

// ─── Supabase client helper ────────────────────────────────────────────────────

async function savePreferences(
  userId: string,
  answers: {
    household_type: HouseholdType;
    current_split: CurrentSplit;
    pain_point: PainPoint;
    main_goal: MainGoal;
  }
) {
  const { getSupabaseClient } = await import('@keurzen/queries');
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_preferences')
    .upsert(
      {
        user_id: userId,
        ...answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) console.warn('[Keurzen] Failed to save onboarding preferences:', error.message);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingSetupPage() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<[
    HouseholdType | null,
    CurrentSplit | null,
    PainPoint | null,
    MainGoal | null,
  ]>([null, null, null, null]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (value: string) => {
    const updated = [...answers] as typeof answers;
    (updated as string[])[currentStep] = value;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(TOTAL_STEPS);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      await markOnboardingSeen(user.id);
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
    } catch {
      // Redirect anyway
    }
    router.replace('/dashboard');
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const [household_type, current_split, pain_point, main_goal] = answers;
      if (household_type && current_split && pain_point && main_goal) {
        await savePreferences(user.id, { household_type, current_split, pain_point, main_goal });
      }
      await markOnboardingSeen(user.id);
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
    } catch {
      // Redirect anyway
    }
    setIsSaving(false);
    router.replace('/dashboard');
  };

  // ─── Completion screen ─────────────────────────────────────────────────────

  if (currentStep === TOTAL_STEPS) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-completion">
          <div className="onboarding-mascot">
            <span style={{ fontSize: 80 }}>{'\u{1F3E0}'}</span>
          </div>
          <h1 className="onboarding-completion-title">Tout est pret !</h1>
          <p className="onboarding-completion-subtitle">
            Keurzen est configure pour vous.<br />Decouvrez votre tableau de bord.
          </p>
          <button
            className="onboarding-btn-primary"
            onClick={handleFinish}
            disabled={isSaving}
          >
            {isSaving ? 'Chargement...' : 'Decouvrir Keurzen'}
          </button>
        </div>

        <style jsx>{`
          .onboarding-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-background);
            padding: 2rem;
          }
          .onboarding-completion {
            text-align: center;
            max-width: 420px;
          }
          .onboarding-mascot {
            margin-bottom: 1.5rem;
          }
          .onboarding-completion-title {
            font-family: var(--font-heading);
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--color-text-primary);
            margin-bottom: 0.75rem;
          }
          .onboarding-completion-subtitle {
            font-size: 1rem;
            color: var(--color-text-secondary);
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .onboarding-btn-primary {
            width: 100%;
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 12px;
            background: var(--color-terracotta);
            color: var(--color-text-inverse);
            font-family: var(--font-body);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.15s;
          }
          .onboarding-btn-primary:hover:not(:disabled) {
            opacity: 0.9;
          }
          .onboarding-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  // ─── Selection steps ───────────────────────────────────────────────────────

  const step = STEPS[currentStep];
  const selectedValue = answers[currentStep];

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Header: back + progress */}
        <div className="onboarding-header">
          <div className="onboarding-back">
            {currentStep > 0 && (
              <button className="onboarding-back-btn" onClick={handleBack}>
                &#8592;
              </button>
            )}
          </div>
          <div className="onboarding-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`onboarding-progress-segment ${i <= currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="onboarding-back" />
        </div>

        {/* Title */}
        <h1 className="onboarding-step-title">{step.title}</h1>

        {/* Options */}
        <div className="onboarding-options">
          {step.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                className={`onboarding-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span className="onboarding-option-emoji">{option.emoji}</span>
                <span className="onboarding-option-label">{option.label}</span>
                {isSelected && <CheckCircle size={20} color="var(--color-terracotta)" />}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            className="onboarding-btn-primary"
            onClick={handleNext}
            disabled={!selectedValue}
          >
            Continuer
          </button>
          <button className="onboarding-btn-skip" onClick={handleSkip}>
            Passer
          </button>
        </div>
      </div>

      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-background);
          padding: 2rem;
        }
        .onboarding-container {
          width: 100%;
          max-width: 480px;
        }
        .onboarding-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .onboarding-back {
          width: 44px;
        }
        .onboarding-back-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          font-size: 1.25rem;
          color: var(--color-text-primary);
          cursor: pointer;
          border-radius: 8px;
        }
        .onboarding-back-btn:hover {
          background: var(--color-background-subtle);
        }
        .onboarding-progress {
          flex: 1;
          display: flex;
          gap: 4px;
        }
        .onboarding-progress-segment {
          flex: 1;
          height: 4px;
          border-radius: 9999px;
          background: var(--color-border-light);
          transition: background 0.2s;
        }
        .onboarding-progress-segment.active {
          background: var(--color-terracotta);
        }
        .onboarding-step-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: 2rem;
        }
        .onboarding-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .onboarding-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: var(--color-background-card);
          border: 2px solid transparent;
          border-radius: 16px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(61, 44, 34, 0.06);
          transition: border-color 0.15s;
          text-align: left;
          width: 100%;
          font-family: var(--font-body);
          font-size: 1rem;
          color: var(--color-text-primary);
        }
        .onboarding-option:hover {
          border-color: var(--color-border);
        }
        .onboarding-option.selected {
          border-color: var(--color-terracotta);
        }
        .onboarding-option-emoji {
          font-size: 1.75rem;
          flex-shrink: 0;
        }
        .onboarding-option-label {
          flex: 1;
        }
        .onboarding-actions {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .onboarding-btn-primary {
          width: 100%;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: var(--color-terracotta);
          color: var(--color-text-inverse);
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .onboarding-btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }
        .onboarding-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .onboarding-btn-skip {
          width: 100%;
          padding: 0.75rem;
          border: none;
          background: none;
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--color-text-muted);
          cursor: pointer;
          text-align: center;
        }
        .onboarding-btn-skip:hover {
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(app\)/onboarding/setup/page.tsx
git commit -m "feat(web): add onboarding setup page"
```

---

### Task 7: Web Dashboard Redirect

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx:44-69`

- [ ] **Step 1: Add the redirect logic at the top of DashboardPage**

After the hooks (line ~53), before the `useMemo`, add:

```typescript
  // Redirect to onboarding if not seen
  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }
```

Make sure `router` is already available (it is, line 46: `const router = useRouter()`).

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(web): redirect to onboarding setup from dashboard"
```

---

### Task 8: Add Types to Mobile (mirror shared types)

**Files:**
- Modify: `apps/mobile/src/types/index.ts:248`

- [ ] **Step 1: Add onboarding types to the mobile types file**

After the `TourSeen` interface (line ~268), add:

```typescript
// ─── Onboarding Preferences ─────────────────────────────────────────────────

export type HouseholdType = 'solo' | 'couple' | 'family' | 'large_family';
export type CurrentSplit = 'mainly_me' | 'equal' | 'varies' | 'starting';
export type PainPoint = 'meals' | 'chores' | 'planning' | 'finances';
export type MainGoal = 'mental_relief' | 'overview' | 'balance' | 'save_time';

export interface OnboardingPreferences {
  id: string;
  user_id: string;
  household_type: HouseholdType | null;
  current_split: CurrentSplit | null;
  pain_point: PainPoint | null;
  main_goal: MainGoal | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/types/index.ts
git commit -m "feat(mobile): add OnboardingPreferences types"
```

---

### Task 9: Verification

- [ ] **Step 1: Run lint on mobile**

Run: `cd /Users/ouss/Keurzen/apps/mobile && npm run lint`
Expected: No new errors

- [ ] **Step 2: Run lint on web**

Run: `cd /Users/ouss/Keurzen/apps/web && npm run lint`
Expected: No new errors

- [ ] **Step 3: Manual test scenarios**

**Mobile:**
1. Set `has_seen_onboarding = false` for your test user in Supabase
2. Open the app — should redirect to onboarding setup
3. Select an option on each step, verify "Continuer" enables
4. Navigate back with the chevron, verify previous selection is preserved
5. Complete all 4 steps — should show completion screen with mascot
6. Tap "Decouvrir Keurzen" — should save to `onboarding_preferences` and redirect to dashboard
7. Reload — should go directly to dashboard (no redirect)
8. Test skip: reset `has_seen_onboarding = false`, reopen, tap "Passer" on step 1 — should go to dashboard, no `onboarding_preferences` row created

**Web:**
1. Same flow as mobile but in browser at `/dashboard`
2. Verify responsive layout on mobile viewport
3. Verify hover states on cards
