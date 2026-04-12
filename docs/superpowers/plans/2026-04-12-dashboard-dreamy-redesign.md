# Dashboard Dreamy Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing multi-version dashboard (v1–v6) with a clean "Dreamy" redesign on both mobile and web, featuring a new blue/pink palette, new components, and updated bottom navigation.

**Architecture:** Delete all legacy dashboard components (~37 mobile, ~24 web). Create 6 new mobile components and 5 new web components following the Stitch design. Update design tokens on both platforms. Reuse existing shared queries (`computeHouseholdScore`, `useWeeklyBalance`, `useCurrentTlx`, `useTasks`). Mock alert data statically.

**Tech Stack:** React Native + Expo Router (mobile), Next.js + Tailwind CSS (web), TanStack Query v5, Zustand, Supabase, MaterialCommunityIcons (mobile), Fredoka One + Nunito/Open Sans fonts.

---

## File Structure

### Files to DELETE

**Mobile** (`apps/mobile/src/components/dashboard/`):
- `AlertCard.tsx`, `BudgetSnapshot.tsx`, `CircularGauge.tsx`, `DashboardCard.tsx`, `DashboardTabs.tsx`, `DecorativeBlobs.tsx`, `HomeHeartCard.tsx`, `HouseholdScoreCard.tsx`, `Icons.tsx`, `InsightCard.tsx`, `InsightCardV2.tsx`, `InsightsCarousel.tsx`, `InsightsTab.tsx`, `KPICard.tsx`, `MemberAvatar.tsx`, `MentalLoadCard.tsx`, `MentalLoadCardV2.tsx`, `NarrativeCard.tsx`, `ObjectiveProgressSection.tsx`, `ProgressBar.tsx`, `RepartitionCard.tsx`, `ScoreCardV2.tsx`, `ScoreHeroCard.tsx`, `StatusPill.tsx`, `StatsTab.tsx`, `TaskCardV2.tsx`, `TaskEquityCard.tsx`, `TaskSummaryPills.tsx`, `TasksTab.tsx`, `TlxDetailCard.tsx`, `TlxSummaryCard.tsx`, `TodayTasksCard.tsx`, `UpcomingTasks.tsx`, `UpcomingTasksCard.tsx`, `WeeklyBalanceCard.tsx`, `WeeklyReportCard.tsx`, `WeeklyTipCard.tsx`, `constants.ts`

**Web** (`apps/web/src/components/dashboard/`):
- `BalanceCard.tsx`, `CircularGauge.tsx`, `DashboardCard.tsx`, `DashboardSidebar.tsx`, `HomeHeartCard.tsx`, `InsightCard.tsx`, `InsightsCarousel.tsx`, `MentalLoadCardV2.tsx`, `NarrativeCard.tsx`, `ObjectiveProgressSection.tsx`, `RecentlyDone.tsx`, `RepartitionCard.tsx`, `ScoreGauge.tsx`, `ScoreHeroCard.tsx`, `StatusPills.tsx`, `TaskEquityCard.tsx`, `TlxCard.tsx`, `TlxDetailCard.tsx`, `TlxSummaryCard.tsx`, `TodayTasks.tsx`, `TodayTasksCard.tsx`, `UpcomingTasksCard.tsx`, `WeeklyReportSection.tsx`, `WeeklyTipCard.tsx`

### Files to CREATE

**Mobile** (`apps/mobile/src/components/dashboard/`):
- `constants.ts` — Dreamy palette tokens, category icon/color maps
- `DreamHeader.tsx` — Sticky header with mascot, date, name, notification bell
- `HouseholdScoreCard.tsx` — Score gauge card with circular SVG
- `TaskEquityBar.tsx` — Horizontal split bar showing task balance between members
- `AlertCard.tsx` — Mocked alert/plan/social cards
- `UpcomingTasksList.tsx` — Upcoming tasks list with checkboxes

**Web** (`apps/web/src/components/dashboard/`):
- `DreamHeader.tsx` — Header with mascot, date, name, notification bell
- `HouseholdScoreCard.tsx` — Score gauge card with circular SVG
- `TaskEquityBar.tsx` — Horizontal split bar
- `AlertCard.tsx` — Mocked alert/plan/social cards
- `UpcomingTasksList.tsx` — Upcoming tasks list

### Files to MODIFY

- `apps/mobile/src/constants/tokens.ts` — Replace Cafe Cosy palette with Dreamy tokens
- `apps/web/src/app/globals.css` — Replace Cafe Cosy + V2 tokens with Dreamy tokens
- `apps/mobile/app/(app)/dashboard/index.tsx` — New layout using Dreamy components
- `apps/mobile/app/(app)/_layout.tsx` — Update tab bar colors to Dreamy palette
- `apps/web/src/app/(app)/dashboard/page.tsx` — New layout using Dreamy components

---

## Task 1: Delete all legacy dashboard components

**Files:**
- Delete: all 38 files in `apps/mobile/src/components/dashboard/`
- Delete: all 24 files in `apps/web/src/components/dashboard/`

- [ ] **Step 1: Delete mobile legacy components**

```bash
rm apps/mobile/src/components/dashboard/AlertCard.tsx \
   apps/mobile/src/components/dashboard/BudgetSnapshot.tsx \
   apps/mobile/src/components/dashboard/CircularGauge.tsx \
   apps/mobile/src/components/dashboard/DashboardCard.tsx \
   apps/mobile/src/components/dashboard/DashboardTabs.tsx \
   apps/mobile/src/components/dashboard/DecorativeBlobs.tsx \
   apps/mobile/src/components/dashboard/HomeHeartCard.tsx \
   apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx \
   apps/mobile/src/components/dashboard/Icons.tsx \
   apps/mobile/src/components/dashboard/InsightCard.tsx \
   apps/mobile/src/components/dashboard/InsightCardV2.tsx \
   apps/mobile/src/components/dashboard/InsightsCarousel.tsx \
   apps/mobile/src/components/dashboard/InsightsTab.tsx \
   apps/mobile/src/components/dashboard/KPICard.tsx \
   apps/mobile/src/components/dashboard/MemberAvatar.tsx \
   apps/mobile/src/components/dashboard/MentalLoadCard.tsx \
   apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx \
   apps/mobile/src/components/dashboard/NarrativeCard.tsx \
   apps/mobile/src/components/dashboard/ObjectiveProgressSection.tsx \
   apps/mobile/src/components/dashboard/ProgressBar.tsx \
   apps/mobile/src/components/dashboard/RepartitionCard.tsx \
   apps/mobile/src/components/dashboard/ScoreCardV2.tsx \
   apps/mobile/src/components/dashboard/ScoreHeroCard.tsx \
   apps/mobile/src/components/dashboard/StatusPill.tsx \
   apps/mobile/src/components/dashboard/StatsTab.tsx \
   apps/mobile/src/components/dashboard/TaskCardV2.tsx \
   apps/mobile/src/components/dashboard/TaskEquityCard.tsx \
   apps/mobile/src/components/dashboard/TaskSummaryPills.tsx \
   apps/mobile/src/components/dashboard/TasksTab.tsx \
   apps/mobile/src/components/dashboard/TlxDetailCard.tsx \
   apps/mobile/src/components/dashboard/TlxSummaryCard.tsx \
   apps/mobile/src/components/dashboard/TodayTasksCard.tsx \
   apps/mobile/src/components/dashboard/UpcomingTasks.tsx \
   apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx \
   apps/mobile/src/components/dashboard/WeeklyBalanceCard.tsx \
   apps/mobile/src/components/dashboard/WeeklyReportCard.tsx \
   apps/mobile/src/components/dashboard/WeeklyTipCard.tsx \
   apps/mobile/src/components/dashboard/constants.ts
```

- [ ] **Step 2: Delete web legacy components**

```bash
rm apps/web/src/components/dashboard/BalanceCard.tsx \
   apps/web/src/components/dashboard/CircularGauge.tsx \
   apps/web/src/components/dashboard/DashboardCard.tsx \
   apps/web/src/components/dashboard/DashboardSidebar.tsx \
   apps/web/src/components/dashboard/HomeHeartCard.tsx \
   apps/web/src/components/dashboard/InsightCard.tsx \
   apps/web/src/components/dashboard/InsightsCarousel.tsx \
   apps/web/src/components/dashboard/MentalLoadCardV2.tsx \
   apps/web/src/components/dashboard/NarrativeCard.tsx \
   apps/web/src/components/dashboard/ObjectiveProgressSection.tsx \
   apps/web/src/components/dashboard/RecentlyDone.tsx \
   apps/web/src/components/dashboard/RepartitionCard.tsx \
   apps/web/src/components/dashboard/ScoreGauge.tsx \
   apps/web/src/components/dashboard/ScoreHeroCard.tsx \
   apps/web/src/components/dashboard/StatusPills.tsx \
   apps/web/src/components/dashboard/TaskEquityCard.tsx \
   apps/web/src/components/dashboard/TlxCard.tsx \
   apps/web/src/components/dashboard/TlxDetailCard.tsx \
   apps/web/src/components/dashboard/TlxSummaryCard.tsx \
   apps/web/src/components/dashboard/TodayTasks.tsx \
   apps/web/src/components/dashboard/TodayTasksCard.tsx \
   apps/web/src/components/dashboard/UpcomingTasksCard.tsx \
   apps/web/src/components/dashboard/WeeklyReportSection.tsx \
   apps/web/src/components/dashboard/WeeklyTipCard.tsx
```

- [ ] **Step 3: Verify no other files import deleted components**

```bash
grep -r "from.*components/dashboard/" apps/mobile/app/ apps/mobile/src/ --include="*.tsx" --include="*.ts" -l
grep -r "from.*components/dashboard/" apps/web/src/ --include="*.tsx" --include="*.ts" -l
```

Expected: only `apps/mobile/app/(app)/dashboard/index.tsx` and `apps/web/src/app/(app)/dashboard/page.tsx` (which we'll rewrite in later tasks). If other files import deleted components, note them for cleanup.

- [ ] **Step 4: Commit**

```bash
git add -A apps/mobile/src/components/dashboard/ apps/web/src/components/dashboard/
git commit -m "chore: delete all legacy dashboard components (v1-v6)"
```

---

## Task 2: Update design tokens — Dreamy palette

**Files:**
- Modify: `apps/mobile/src/constants/tokens.ts`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Update mobile tokens**

Replace the Colors object in `apps/mobile/src/constants/tokens.ts`. Keep Spacing, BorderRadius, Typography, Shadows, Animation, TouchTarget unchanged. Replace Colors with:

```typescript
export const Colors = {
  // ─── Brand palette (Dreamy) ───
  primary: '#90CAF9',       // CTA, accents actifs, progress, nav active
  accent: '#F4C2C2',        // Accents secondaires, alertes douces
  joy: '#FFF9C4',           // Highlights, badges, warning léger

  // ─── Text ───
  textPrimary: '#4A5568',   // Texte principal (gris-bleu foncé)
  textSecondary: '#5A6A85', // Texte secondaire
  textMuted: '#A0AEC0',     // Placeholders
  textInverse: '#FFFFFF',   // Blanc

  // ─── Background ───
  background: '#FAFCFF',       // Fond global (blanc bleuté)
  backgroundCard: '#F7F9FC',   // Début gradient carte
  backgroundCardEnd: '#EFF3F6', // Fin gradient carte
  backgroundElevated: '#FFFFFF',

  // ─── Border ───
  border: '#E5E9EC',        // Bordures cartes
  borderLight: '#EDF2F7',   // Bordures légères
  borderFocus: '#90CAF9',   // Focus ring

  // ─── Feedback ───
  success: '#81C784',   // Vert doux
  warning: '#FFF9C4',   // Joy
  error: '#F4C2C2',     // Accent
  info: '#90CAF9',      // Primary

  // ─── Member colors ───
  memberColors: [
    '#90CAF9',
    '#F4C2C2',
    '#B39DDB',
    '#80CBC4',
    '#FFE082',
    '#FFAB91',
    '#A5D6A7',
    '#CE93D8',
  ],

  // ─── Gray scale (cool) ───
  gray50: '#FAFCFF',
  gray100: '#EDF2F7',
  gray200: '#E5E9EC',
  gray300: '#CBD5E0',
  gray400: '#A0AEC0',
  gray500: '#5A6A85',
  gray600: '#4A5568',
  gray700: '#2D3748',
  gray800: '#1A202C',
  gray900: '#171923',

  // ─── Transparent overlays ───
  overlay: 'rgba(45, 55, 72, 0.35)',
  overlayLight: 'rgba(45, 55, 72, 0.08)',

  // ─── Component-specific ───
  inputFocusedBg: '#FFFFFF',
  backgroundSubtle: '#EDF2F7',
  placeholder: '#A0AEC0',

} as const;
```

Also update the Shadows to use blue-tinted shadows instead of brown:

```typescript
export const Shadows = {
  sm: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;
```

Update the Typography fontFamily to add Fredoka:

```typescript
fontFamily: {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  title: 'FredokaOne_400Regular',
},
```

Update BorderRadius for the new Dreamy rounded style:

```typescript
export const BorderRadius = {
  sm: 8,
  md: 12,
  input: 12,
  lg: 16,
  card: 24,     // was 16 — Dreamy uses ultra-rounded
  xl: 24,
  button: 16,   // was 12
  '2xl': 32,
  '3xl': 40,    // new — for dream-cards
  fab: 24,      // was 16
  full: 9999,
} as const;
```

- [ ] **Step 2: Update web CSS tokens**

Replace the Cafe Cosy and V2 `@theme` blocks in `apps/web/src/app/globals.css` with Dreamy tokens. Keep the shadcn `@theme inline` block and `:root` variables, but update their values.

Replace the first two `@theme` blocks (lines 8-55) with:

```css
/* ─── Keurzen "Dreamy" tokens ─── */
@theme {
  --color-primary: #90CAF9;
  --color-accent: #F4C2C2;
  --color-joy: #FFF9C4;
  --color-background: #FAFCFF;
  --color-background-card: #F7F9FC;
  --color-background-card-end: #EFF3F6;
  --color-text-primary: #4A5568;
  --color-text-secondary: #5A6A85;
  --color-text-muted: #A0AEC0;
  --color-text-inverse: #FFFFFF;
  --color-border: #E5E9EC;
  --color-border-light: #EDF2F7;

  --shadow-sm: 0 1px 2px rgba(144, 202, 249, 0.08);
  --shadow-md: 0 2px 8px rgba(144, 202, 249, 0.1);
  --shadow-lg: 0 4px 16px rgba(144, 202, 249, 0.12);
  --shadow-card: 0 3px 10px rgba(144, 202, 249, 0.1);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-3xl: 40px;

  --font-heading: 'Fredoka One', cursive;
  --font-body: 'Open Sans', sans-serif;
}
```

Update `:root` shadcn variables (lines 101-152) to match Dreamy:

```css
:root {
  --background: #FAFCFF;
  --foreground: #4A5568;
  --card: #F7F9FC;
  --card-foreground: #4A5568;
  --popover: #FFFFFF;
  --popover-foreground: #4A5568;
  --primary: #90CAF9;
  --primary-foreground: #FFFFFF;
  --secondary: #F4C2C2;
  --secondary-foreground: #4A5568;
  --muted: #EDF2F7;
  --muted-foreground: #5A6A85;
  --accent: #FFF9C4;
  --accent-foreground: #4A5568;
  --destructive: #F4C2C2;
  --border: #E5E9EC;
  --input: #E5E9EC;
  --ring: #90CAF9;
  --chart-1: #90CAF9;
  --chart-2: #F4C2C2;
  --chart-3: #FFF9C4;
  --chart-4: #B39DDB;
  --chart-5: #80CBC4;
  --radius: 0.75rem;
  --sidebar: #FAFCFF;
  --sidebar-foreground: #4A5568;
  --sidebar-primary: #90CAF9;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EDF2F7;
  --sidebar-accent-foreground: #4A5568;
  --sidebar-border: #E5E9EC;
  --sidebar-ring: #90CAF9;
}
```

Update `body` styles and focus-visible:

```css
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Keep the `.tlx-slider` styles but update `box-shadow` colors from brown to blue:
```css
box-shadow: 0 1px 4px rgba(144, 202, 249, 0.15);
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/constants/tokens.ts apps/web/src/app/globals.css
git commit -m "feat: replace Cafe Cosy + V2 tokens with Dreamy palette"
```

---

## Task 3: Create mobile dashboard constants and DreamHeader

**Files:**
- Create: `apps/mobile/src/components/dashboard/constants.ts`
- Create: `apps/mobile/src/components/dashboard/DreamHeader.tsx`

- [ ] **Step 1: Create mobile dashboard constants**

Create `apps/mobile/src/components/dashboard/constants.ts`:

```typescript
import type { TaskCategory } from '../../types';

/**
 * Dreamy dashboard local constants
 */

// Category → icon mapping (MaterialCommunityIcons names)
export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  cleaning: 'broom',
  cooking: 'silverware-fork-knife',
  shopping: 'basket-outline',
  admin: 'file-document-outline',
  children: 'human-male-child',
  pets: 'paw',
  garden: 'flower-outline',
  repairs: 'hammer-wrench',
  health: 'heart-pulse',
  finances: 'wallet-outline',
  other: 'dots-horizontal',
};

// Alternating colors for task row blob icons
export const BLOB_COLORS = ['#90CAF9', '#F4C2C2'] as const;

// Mock alert data
export interface MockAlert {
  id: string;
  type: 'alert' | 'plan' | 'social';
  icon: string;
  label: string;
  title: string;
  actionLabel: string;
  color: string;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: 'alert-1',
    type: 'alert',
    icon: 'alert-outline',
    label: 'Alert',
    title: 'Ta charge mentale semble augmenter (+15%).',
    actionLabel: 'Mesures',
    color: '#F4C2C2',
  },
  {
    id: 'plan-1',
    type: 'plan',
    icon: 'calendar-refresh-outline',
    label: 'Plan',
    title: 'Prenez 15 minutes ce soir pour planifier.',
    actionLabel: 'Détails',
    color: '#90CAF9',
  },
  {
    id: 'social-1',
    type: 'social',
    icon: 'hand-heart-outline',
    label: 'Social',
    title: 'Thomas a complété 5 tâches.\nRemerciez-le !',
    actionLabel: 'Envoyer',
    color: '#90CAF9',
  },
];
```

- [ ] **Step 2: Create DreamHeader component**

Create `apps/mobile/src/components/dashboard/DreamHeader.tsx`:

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';
import { Colors, Shadows } from '../../constants/tokens';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

interface DreamHeaderProps {
  firstName: string;
}

export function DreamHeader({ firstName }: DreamHeaderProps) {
  const router = useRouter();
  const today = dayjs();
  const dateLabel = today.format('dddd D MMMM');
  // Capitalize first letter
  const dateDisplay = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.mascotWrapper}>
          <Mascot size={40} expression="calm" />
        </View>
        <View>
          <Text style={styles.date}>{dateDisplay}</Text>
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.name}>{firstName}</Text>
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.notifButton}
        accessibilityLabel="Notifications"
        onPress={() => router.push('/(app)/notifications')}
      >
        <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.textPrimary} />
        <View style={styles.notifDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotWrapper: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    transform: [{ rotate: '3deg' }],
    ...Shadows.sm,
  },
  date: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  name: {
    color: Colors.accent,
  },
  notifButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/constants.ts apps/mobile/src/components/dashboard/DreamHeader.tsx
git commit -m "feat(mobile): add Dreamy dashboard constants and DreamHeader"
```

---

## Task 4: Create mobile HouseholdScoreCard

**Files:**
- Create: `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx`

- [ ] **Step 1: Create HouseholdScoreCard**

Create `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';

interface HouseholdScoreCardProps {
  score: number;       // 0-100
  trend: number | null; // percentage change, e.g. +5 or -3
}

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HouseholdScoreCard({ score, trend }: HouseholdScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedScore / 100);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Left: text */}
        <View style={styles.textSection}>
          <Text style={styles.label}>Score du Foyer</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{clampedScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          {trend !== null && (
            <View style={styles.trendRow}>
              <View style={styles.trendPill}>
                <MaterialCommunityIcons
                  name={trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </Text>
              </View>
              <Text style={styles.trendLabel}>Semaine</Text>
            </View>
          )}
        </View>

        {/* Right: gauge */}
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background circle */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#FFFFFF"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.primary}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              fill="none"
            />
          </Svg>
          <View style={styles.gaugeIcon}>
            <MaterialCommunityIcons name="scale-balance" size={28} color={Colors.primary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 56,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.textPrimary,
    lineHeight: 60,
  },
  scoreMax: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(144, 202, 249, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  trendLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeIcon: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx
git commit -m "feat(mobile): add Dreamy HouseholdScoreCard with SVG gauge"
```

---

## Task 5: Create mobile TaskEquityBar

**Files:**
- Create: `apps/mobile/src/components/dashboard/TaskEquityBar.tsx`

- [ ] **Step 1: Create TaskEquityBar**

Create `apps/mobile/src/components/dashboard/TaskEquityBar.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';
import type { MemberBalance } from '@keurzen/queries';

interface TaskEquityBarProps {
  members: MemberBalance[];
}

export function TaskEquityBar({ members }: TaskEquityBarProps) {
  if (members.length < 2) return null;

  const member1 = members[0];
  const member2 = members[1];
  const pct1 = Math.round(member1.tasksShare * 100);
  const pct2 = Math.round(member2.tasksShare * 100);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Équité des Tâches</Text>
        <View style={styles.targetBadge}>
          <View style={styles.targetDot} />
          <Text style={styles.targetText}>Cible: 45-55%</Text>
        </View>
      </View>

      {/* Bar */}
      <View style={styles.barContainer}>
        {/* Target zone overlay */}
        <View style={styles.targetZone} />
        {/* Member 1 */}
        <View style={[styles.barSegment, styles.barLeft, { width: `${pct1}%` }]}>
          <Text style={styles.barPercent}>{pct1}%</Text>
        </View>
        {/* Member 2 */}
        <View style={[styles.barSegment, styles.barRight, { width: `${pct2}%` }]}>
          <Text style={[styles.barPercent, { textAlign: 'right' }]}>{pct2}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(144, 202, 249, 0.5)' }]} />
          <View>
            <Text style={styles.memberName}>{member1.name.split(' ')[0]}</Text>
            <Text style={styles.memberMeta}>
              {Math.round(member1.tasksShare * (members.reduce((s, m) => s + (m.tasksShare > 0 ? 1 : 0), 0) > 0 ? members.length : 1))} tâches
            </Text>
          </View>
        </View>
        <View style={[styles.legendItem, { justifyContent: 'flex-end' }]}>
          <View>
            <Text style={[styles.memberName, { textAlign: 'right' }]}>{member2.name.split(' ')[0]}</Text>
            <Text style={[styles.memberMeta, { textAlign: 'right' }]}>
              {Math.round(member2.tasksShare * (members.reduce((s, m) => s + (m.tasksShare > 0 ? 1 : 0), 0) > 0 ? members.length : 1))} tâches
            </Text>
          </View>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(244, 194, 194, 0.5)' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(144, 202, 249, 0.3)',
  },
  targetText: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  barContainer: {
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '45%',
    width: '10%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  barSegment: {
    height: '100%',
    justifyContent: 'center',
  },
  barLeft: {
    backgroundColor: 'rgba(144, 202, 249, 0.4)',
    paddingLeft: 12,
  },
  barRight: {
    backgroundColor: 'rgba(244, 194, 194, 0.4)',
    paddingRight: 12,
  },
  barPercent: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  memberName: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  memberMeta: {
    fontSize: 10,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TaskEquityBar.tsx
git commit -m "feat(mobile): add Dreamy TaskEquityBar with split bar"
```

---

## Task 6: Create mobile AlertCard and UpcomingTasksList

**Files:**
- Create: `apps/mobile/src/components/dashboard/AlertCard.tsx`
- Create: `apps/mobile/src/components/dashboard/UpcomingTasksList.tsx`

- [ ] **Step 1: Create AlertCard**

Create `apps/mobile/src/components/dashboard/AlertCard.tsx`:

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';
import type { MockAlert } from './constants';

interface AlertCardProps {
  alert: MockAlert;
  fullWidth?: boolean;
}

export function AlertCard({ alert, fullWidth }: AlertCardProps) {
  const isSocial = alert.type === 'social';

  if (isSocial && fullWidth) {
    return (
      <View style={[styles.card, styles.socialCard]}>
        <View style={styles.socialContent}>
          <View style={styles.blobIcon}>
            <MaterialCommunityIcons
              name={alert.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={24}
              color={alert.color}
            />
          </View>
          <View style={styles.socialText}>
            <View style={[styles.pill, { borderColor: alert.color }]}>
              <Text style={[styles.pillText, { color: alert.color }]}>{alert.label}</Text>
            </View>
            <Text style={styles.socialTitle}>{alert.title}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>{alert.actionLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.smallCard, { borderTopColor: alert.color }]}>
      <View style={styles.smallHeader}>
        <View style={[styles.pill, { borderColor: alert.color }]}>
          <Text style={[styles.pillText, { color: alert.color }]}>{alert.label}</Text>
        </View>
        <View style={styles.blobIconSmall}>
          <MaterialCommunityIcons
            name={alert.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={14}
            color={alert.color}
          />
        </View>
      </View>
      <Text style={styles.smallTitle}>{alert.title}</Text>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={[styles.actionText, { color: alert.color }]}>
          {alert.actionLabel}{' '}
          <MaterialCommunityIcons name="chevron-right" size={12} color={alert.color} />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  smallCard: {
    padding: 16,
    borderTopWidth: 4,
  },
  smallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  blobIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  blobIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    flex: 1,
  },
  socialTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    ...Shadows.md,
  },
  sendButtonText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
```

- [ ] **Step 2: Create UpcomingTasksList**

Create `apps/mobile/src/components/dashboard/UpcomingTasksList.tsx`:

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';
import { CATEGORY_ICONS, BLOB_COLORS } from './constants';
import type { Task } from '../../types';
import dayjs from 'dayjs';

interface UpcomingTasksListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
}

export function UpcomingTasksList({ tasks, onToggleStatus }: UpcomingTasksListProps) {
  const router = useRouter();

  const upcoming = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches à venir</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tasks')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.list}>
        {upcoming.map((task, index) => {
          const iconName = CATEGORY_ICONS[task.category] ?? 'dots-horizontal';
          const blobColor = BLOB_COLORS[index % BLOB_COLORS.length];
          const assigneeName = (task as any).assigned_profile?.full_name?.split(' ')[0] ?? '';
          const dateLabel = task.due_date
            ? dayjs(task.due_date).isToday()
              ? "Aujourd'hui"
              : dayjs(task.due_date).isTomorrow()
                ? 'Demain'
                : dayjs(task.due_date).format('D MMM')
            : '';

          return (
            <View
              key={task.id}
              style={[
                styles.taskRow,
                index < upcoming.length - 1 && styles.taskRowBorder,
              ]}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.blobIcon, { backgroundColor: blobColor + '30' }]}>
                  <MaterialCommunityIcons
                    name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={blobColor}
                  />
                </View>
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {dateLabel}{assigneeName ? ` · ${assigneeName}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onToggleStatus(task.id)}
                accessibilityLabel={`Marquer ${task.title} comme terminée`}
              >
                <View style={styles.checkboxInner} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  seeAll: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(144, 202, 249, 0.2)',
  },
  list: {
    borderRadius: 32,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  blobIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  taskMeta: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(144, 202, 249, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(144, 202, 249, 0.2)',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/AlertCard.tsx apps/mobile/src/components/dashboard/UpcomingTasksList.tsx
git commit -m "feat(mobile): add Dreamy AlertCard and UpcomingTasksList"
```

---

## Task 7: Rewrite mobile dashboard screen and update tab bar

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx`
- Modify: `apps/mobile/app/(app)/_layout.tsx`

- [ ] **Step 1: Rewrite dashboard/index.tsx**

Replace the entire content of `apps/mobile/app/(app)/dashboard/index.tsx` with:

```tsx
import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks, useUpdateTaskStatus } from '../../../src/lib/queries/tasks';
import { useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { DreamHeader } from '../../../src/components/dashboard/DreamHeader';
import { HouseholdScoreCard } from '../../../src/components/dashboard/HouseholdScoreCard';
import { TaskEquityBar } from '../../../src/components/dashboard/TaskEquityBar';
import { AlertCard } from '../../../src/components/dashboard/AlertCard';
import { UpcomingTasksList } from '../../../src/components/dashboard/UpcomingTasksList';
import { MOCK_ALERTS } from '../../../src/components/dashboard/constants';
import { Colors } from '../../../src/constants/tokens';

export default function DashboardScreen() {
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { data: tlxEntry } = useCurrentTlx();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Mascot size={44} expression="calm" />
        </View>
        <EmptyState
          variant="household"
          expression="normal"
          title="Votre foyer vous attend"
          subtitle="Creez un foyer ou rejoignez-en un avec un code d'invitation."
          action={{ label: 'Creer un foyer', onPress: () => {} }}
        />
      </SafeAreaView>
    );
  }

  // Compute household score
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance = members.length > 0
    ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
    : 0;
  const averageTlx = tlxEntry?.score ?? 0;
  // Simple streak: count consecutive days (simplified — just use 3 as default for now)
  const streakDays = 3;

  const scoreResult = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays,
  });

  // Trend: mock for now (no previous week comparison in this pass)
  const trend = 5;

  const handleToggleStatus = (taskId: string) => {
    updateStatus({ id: taskId, status: 'done' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <DreamHeader firstName={firstName} />

        <View style={styles.gap} />
        <HouseholdScoreCard score={scoreResult.total} trend={trend} />

        <View style={styles.gap} />
        <TaskEquityBar members={members} />

        {/* Alert cards grid */}
        <View style={styles.alertGrid}>
          <View style={styles.alertRow}>
            <View style={styles.alertHalf}>
              <AlertCard alert={MOCK_ALERTS[0]} />
            </View>
            <View style={styles.alertHalf}>
              <AlertCard alert={MOCK_ALERTS[1]} />
            </View>
          </View>
          <AlertCard alert={MOCK_ALERTS[2]} fullWidth />
        </View>

        <View style={styles.gap} />
        <UpcomingTasksList tasks={tasks} onToggleStatus={handleToggleStatus} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  gap: {
    height: 24,
  },
  alertGrid: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 16,
  },
  alertHalf: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Update tab bar colors in _layout.tsx**

In `apps/mobile/app/(app)/_layout.tsx`, update the hardcoded colors to use Dreamy palette:

Replace `color={isFocused ? '#00E5FF' : '#718096'}` with `color={isFocused ? '#90CAF9' : '#A0AEC0'}` (two occurrences — icon and label).

Replace `backgroundColor: '#00E5FF'` in the FAB style with `backgroundColor: '#90CAF9'`.

Replace `shadowColor: '#00E5FF'` in the FAB style with `shadowColor: '#90CAF9'`.

Replace `borderTopColor: '#E2E8F0'` with `borderTopColor: '#E5E9EC'`.

Replace `fontFamily: 'Outfit_700Bold'` with `fontFamily: 'Nunito_700Bold'`.

Add gradient effect to FAB — since React Native doesn't have native gradient on View, use a solid color for now. The FAB should use `backgroundColor: '#90CAF9'`. (A gradient can be added later with `expo-linear-gradient` if desired.)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/dashboard/index.tsx apps/mobile/app/(app)/_layout.tsx
git commit -m "feat(mobile): rewrite dashboard with Dreamy components and update tab bar"
```

---

## Task 8: Create web dashboard components

**Files:**
- Create: `apps/web/src/components/dashboard/DreamHeader.tsx`
- Create: `apps/web/src/components/dashboard/HouseholdScoreCard.tsx`
- Create: `apps/web/src/components/dashboard/TaskEquityBar.tsx`
- Create: `apps/web/src/components/dashboard/AlertCard.tsx`
- Create: `apps/web/src/components/dashboard/UpcomingTasksList.tsx`

- [ ] **Step 1: Create web DreamHeader**

Create `apps/web/src/components/dashboard/DreamHeader.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';

interface DreamHeaderProps {
  firstName: string;
}

export function DreamHeader({ firstName }: DreamHeaderProps) {
  const router = useRouter();
  const today = new Date();
  const dateDisplay = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalized = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl p-0.5 overflow-hidden shadow-sm rotate-3 border border-border">
          <div className="w-full h-full rounded-2xl bg-background-card flex items-center justify-center text-2xl">
            🏠
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-primary font-heading">
            {capitalized}
          </p>
          <p className="text-base font-bold text-text-primary">
            Bonjour, <span className="text-accent">{firstName}</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => router.push('/notifications')}
        className="relative w-10 h-10 flex items-center justify-center bg-white border border-border rounded-full shadow-sm hover:shadow-md transition-shadow"
        aria-label="Notifications"
      >
        <span className="text-base">🔔</span>
        <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-white" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create web HouseholdScoreCard**

Create `apps/web/src/components/dashboard/HouseholdScoreCard.tsx`:

```tsx
'use client';

interface HouseholdScoreCardProps {
  score: number;
  trend: number | null;
}

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HouseholdScoreCard({ score, trend }: HouseholdScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="rounded-[2.5rem] p-5 border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary mb-1 font-heading">
            Score du Foyer
          </h2>
          <div className="flex items-baseline gap-1">
            <p className="text-6xl font-extrabold text-text-primary font-heading leading-none">
              {clamped}
            </p>
            <p className="text-xl font-bold text-primary font-heading">/100</p>
          </div>
          {trend !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-white font-bold bg-primary/80 px-3 py-1 rounded-full flex items-center shadow-inner gap-1">
                {trend >= 0 ? '↑' : '↓'} {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                Semaine
              </p>
            </div>
          )}
        </div>
        <div className="relative w-28 h-28">
          <svg
            className="w-full h-full -rotate-90 drop-shadow-sm"
            viewBox="0 0 112 112"
          >
            <circle
              cx="56" cy="56" r={RADIUS}
              fill="none" stroke="white" strokeWidth={STROKE_WIDTH}
            />
            <circle
              cx="56" cy="56" r={RADIUS}
              fill="none" stroke="var(--color-primary)" strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <span className="text-3xl">⚖️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create web TaskEquityBar**

Create `apps/web/src/components/dashboard/TaskEquityBar.tsx`:

```tsx
'use client';

import type { MemberBalance } from '@keurzen/queries';

interface TaskEquityBarProps {
  members: MemberBalance[];
}

export function TaskEquityBar({ members }: TaskEquityBarProps) {
  if (members.length < 2) return null;

  const m1 = members[0];
  const m2 = members[1];
  const pct1 = Math.round(m1.tasksShare * 100);
  const pct2 = Math.round(m2.tasksShare * 100);

  return (
    <div className="rounded-[2.5rem] p-5 border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary font-heading">
          Équité des Tâches
        </h2>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
          <span className="text-[9px] text-text-secondary font-bold uppercase">
            Cible: 45-55%
          </span>
        </div>
      </div>

      <div className="relative h-8 bg-white/60 rounded-full overflow-hidden flex border border-border shadow-inner">
        <div className="absolute inset-y-0 left-[45%] w-[10%] border-x border-white/40 bg-white/20 z-10" />
        <div className="h-full bg-primary/40 flex items-center px-3" style={{ width: `${pct1}%` }}>
          <span className="text-xs font-bold text-text-primary font-heading">{pct1}%</span>
        </div>
        <div className="h-full bg-accent/40 flex items-center justify-end px-3" style={{ width: `${pct2}%` }}>
          <span className="text-xs font-bold text-text-primary font-heading">{pct2}%</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg bg-primary/50 shadow-sm" />
          <div>
            <p className="text-xs font-bold text-text-primary leading-none">
              {m1.name.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-xs font-bold text-text-primary leading-none">
              {m2.name.split(' ')[0]}
            </p>
          </div>
          <div className="w-3 h-3 rounded-lg bg-accent/50 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create web AlertCard**

Create `apps/web/src/components/dashboard/AlertCard.tsx`:

```tsx
'use client';

interface AlertData {
  id: string;
  type: 'alert' | 'plan' | 'social';
  label: string;
  title: string;
  actionLabel: string;
  color: string;
}

interface AlertCardProps {
  alert: AlertData;
  fullWidth?: boolean;
}

export const MOCK_ALERTS: AlertData[] = [
  {
    id: 'alert-1',
    type: 'alert',
    label: 'Alert',
    title: 'Ta charge mentale semble augmenter (+15%).',
    actionLabel: 'Mesures',
    color: '#F4C2C2',
  },
  {
    id: 'plan-1',
    type: 'plan',
    label: 'Plan',
    title: 'Prenez 15 minutes ce soir pour planifier.',
    actionLabel: 'Détails',
    color: '#90CAF9',
  },
  {
    id: 'social-1',
    type: 'social',
    label: 'Social',
    title: 'Thomas a complété 5 tâches. Remerciez-le !',
    actionLabel: 'Envoyer',
    color: '#90CAF9',
  },
];

export function AlertCard({ alert, fullWidth }: AlertCardProps) {
  if (alert.type === 'social' && fullWidth) {
    return (
      <div className="rounded-[2.5rem] border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card flex items-center justify-between py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-2xl">💝</span>
          </div>
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full border bg-white/50 inline-block mb-1"
              style={{ color: alert.color, borderColor: 'rgba(255,255,255,0.8)' }}
            >
              {alert.label}
            </span>
            <h3 className="text-xs font-bold text-text-primary leading-tight">
              {alert.title}
            </h3>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase font-heading shadow-md hover:scale-105 transition-transform">
          {alert.actionLabel}
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card p-4"
      style={{ borderTopWidth: '4px', borderTopColor: alert.color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full border bg-white/50"
          style={{ color: alert.color, borderColor: 'rgba(255,255,255,0.8)' }}
        >
          {alert.label}
        </span>
        <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
          <span className="text-sm">{alert.type === 'alert' ? '⚠️' : '📅'}</span>
        </div>
      </div>
      <h3 className="text-xs font-bold text-text-primary mb-3 leading-relaxed">
        {alert.title}
      </h3>
      <button
        className="text-[10px] font-bold uppercase tracking-wider font-heading flex items-center gap-1"
        style={{ color: alert.color }}
      >
        {alert.actionLabel} →
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create web UpcomingTasksList**

Create `apps/web/src/components/dashboard/UpcomingTasksList.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

interface Task {
  id: string;
  title: string;
  category: string;
  status: string;
  due_date: string | null;
  assigned_profile?: { full_name?: string } | null;
}

interface UpcomingTasksListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  cleaning: '🧹',
  cooking: '🍳',
  shopping: '🛒',
  admin: '📄',
  children: '👶',
  pets: '🐾',
  garden: '🌱',
  repairs: '🔧',
  health: '❤️',
  finances: '💰',
  other: '📌',
};

const BLOB_COLORS = ['text-primary', 'text-accent'];

export function UpcomingTasksList({ tasks, onToggleStatus }: UpcomingTasksListProps) {
  const router = useRouter();

  const upcoming = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center px-1 mb-3">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-[2px] font-heading">
          Tâches à venir
        </h2>
        <button
          onClick={() => router.push('/tasks')}
          className="text-[10px] font-bold text-primary uppercase font-heading border-b-2 border-primary/20"
        >
          Voir tout
        </button>
      </div>

      <div className="bg-background-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        {upcoming.map((task, index) => {
          const emoji = CATEGORY_EMOJI[task.category] ?? '📌';
          const colorClass = BLOB_COLORS[index % BLOB_COLORS.length];
          const assignee = task.assigned_profile?.full_name?.split(' ')[0] ?? '';
          const dateLabel = task.due_date
            ? dayjs(task.due_date).isToday()
              ? "Aujourd'hui"
              : dayjs(task.due_date).isTomorrow()
                ? 'Demain'
                : dayjs(task.due_date).format('D MMM')
            : '';

          return (
            <div
              key={task.id}
              className={`p-4 flex items-center justify-between hover:bg-white/40 transition-colors ${
                index < upcoming.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center ${colorClass}`}>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{task.title}</h4>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">
                    {dateLabel}{assignee ? ` · ${assignee}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onToggleStatus(task.id)}
                className="w-8 h-8 border-2 border-primary/20 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors"
                aria-label={`Marquer ${task.title} comme terminée`}
              >
                <div className="w-2 h-2 rounded-full bg-primary/20" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/dashboard/
git commit -m "feat(web): create all Dreamy dashboard components"
```

---

## Task 9: Rewrite web dashboard page

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard page**

Replace entire content of `apps/web/src/app/(app)/dashboard/page.tsx` with:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useWeeklyBalance, useCurrentTlx, useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';
import { DreamHeader } from '@/components/dashboard/DreamHeader';
import { HouseholdScoreCard } from '@/components/dashboard/HouseholdScoreCard';
import { TaskEquityBar } from '@/components/dashboard/TaskEquityBar';
import { AlertCard, MOCK_ALERTS } from '@/components/dashboard/AlertCard';
import { UpcomingTasksList } from '@/components/dashboard/UpcomingTasksList';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { data: tlxEntry } = useCurrentTlx();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // Compute score
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance = members.length > 0
    ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
    : 0;
  const averageTlx = tlxEntry?.score ?? 0;
  const streakDays = 3;

  const scoreResult = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays,
  });

  const trend = 5;

  const handleToggle = (id: string) => {
    updateStatus({ id, status: 'done' });
  };

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">
      <DreamHeader firstName={firstName} />
      <HouseholdScoreCard score={scoreResult.total} trend={trend} />
      <TaskEquityBar members={members} />

      {/* Alert cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AlertCard alert={MOCK_ALERTS[0]} />
          <AlertCard alert={MOCK_ALERTS[1]} />
        </div>
        <AlertCard alert={MOCK_ALERTS[2]} fullWidth />
      </div>

      <UpcomingTasksList tasks={tasks} onToggleStatus={handleToggle} />
    </div>
  );
}
```

- [ ] **Step 2: Verify web imports are correct**

Check that all imports resolve:
- `@keurzen/queries` exports `useTasks` and `useUpdateTaskStatus` — verify this. If not, the web page may need to use a different import path. Check with:

```bash
grep -r "export.*useTasks\|export.*useUpdateTaskStatus" packages/queries/src/ --include="*.ts"
```

If `useTasks` or `useUpdateTaskStatus` are not exported from `@keurzen/queries`, update the import to use the correct path (likely `packages/queries` needs these added to its index, or use inline queries).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(app)/dashboard/page.tsx
git commit -m "feat(web): rewrite dashboard page with Dreamy layout"
```

---

## Task 10: Add Fredoka One font loading

**Files:**
- Modify: `apps/mobile/app/_layout.tsx` (root layout — font loading)
- Modify: `apps/web/src/app/layout.tsx` (Next.js root layout)

- [ ] **Step 1: Check current font loading on mobile**

```bash
grep -r "useFonts\|FredokaOne\|Fredoka" apps/mobile/app/_layout.tsx
```

If Fredoka is not loaded, add it to the font loading:

```bash
npx expo install @expo-google-fonts/fredoka-one
```

Then add to the `useFonts` call in the root layout:
```typescript
import { FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';

// In useFonts:
FredokaOne_400Regular,
```

- [ ] **Step 2: Check current font loading on web**

```bash
grep -r "Fredoka\|Open.Sans\|font" apps/web/src/app/layout.tsx
```

If Fredoka One and Open Sans are not loaded, add them via Google Fonts in the `<head>` of the root layout or via `next/font`:

```tsx
import { Fredoka } from 'next/font/google';
import { Open_Sans } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: '700', variable: '--font-heading' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-body' });
```

Apply to `<html className={`${fredoka.variable} ${openSans.variable}`}>`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/_layout.tsx apps/web/src/app/layout.tsx
git commit -m "feat: add Fredoka One font for Dreamy dashboard titles"
```

---

## Task 11: Verify and fix imports

**Files:** Various — fix any broken imports from the deletion/rewrite

- [ ] **Step 1: Check for broken imports on mobile**

```bash
grep -rn "from.*components/dashboard/" apps/mobile/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".expo"
```

Verify each import points to a file that exists. Fix any imports referencing deleted components (e.g., sub-screens like `tlx.tsx`, `weekly-review.tsx`, `analytics.tsx` that may have imported old components).

- [ ] **Step 2: Check for broken imports on web**

```bash
grep -rn "from.*components/dashboard/" apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```

Same verification — fix any broken references.

- [ ] **Step 3: Check that dayjs plugins are available on mobile**

The UpcomingTasksList uses `dayjs().isToday()` and `dayjs().isTomorrow()`. Verify these plugins are imported:

```bash
grep -r "isToday\|isTomorrow" apps/mobile/src/components/dashboard/ --include="*.tsx"
```

If used, add the plugins at the top of `UpcomingTasksList.tsx`:
```typescript
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
```

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve broken imports after dashboard cleanup"
```

---

## Task 12: Lint and verify builds

- [ ] **Step 1: Run lint**

```bash
cd /Users/ouss/Keurzen && npm run lint
```

Fix any lint errors in the new/modified files.

- [ ] **Step 2: Run mobile type check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Fix any TypeScript errors.

- [ ] **Step 3: Run web build**

```bash
cd apps/web && npm run build
```

Fix any build errors.

- [ ] **Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve lint and type errors in Dreamy dashboard"
```
