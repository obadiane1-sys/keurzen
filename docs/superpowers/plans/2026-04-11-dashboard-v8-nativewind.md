# Dashboard V8 NativeWind Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the mobile dashboard with a modern cold palette, NativeWind styling, 3-tab content system, and 5-item bottom nav with FAB.

**Architecture:** NativeWind replaces StyleSheet.create() for all new/modified dashboard components. New design tokens defined in `tailwind.config.js`. Dashboard screen becomes a tab-switching controller with 3 content views (Insights, Stats, Tasks). Bottom nav gets 2 new routes (stats, hub) and a floating FAB.

**Tech Stack:** NativeWind 4, Tailwind CSS 3.4, Expo SDK 55, React Native 0.83, @expo-google-fonts/outfit, @expo/vector-icons (MaterialCommunityIcons), react-native-svg

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `apps/mobile/tailwind.config.js` | NativeWind tokens config |
| `apps/mobile/global.css` | Tailwind base imports |
| `apps/mobile/nativewind-env.d.ts` | TypeScript className support |
| `apps/mobile/src/components/dashboard/DashboardTabs.tsx` | Horizontal tab bar (Insights/Stats/Tasks) |
| `apps/mobile/src/components/dashboard/InsightsTab.tsx` | Tab content: insights carousel + score + upcoming tasks |
| `apps/mobile/src/components/dashboard/StatsTab.tsx` | Tab content: score hero + equity + mental load + trend |
| `apps/mobile/src/components/dashboard/TasksTab.tsx` | Tab content: summary pills + grouped task list |
| `apps/mobile/src/components/dashboard/InsightCardV2.tsx` | Redesigned insight card with badge-icon |
| `apps/mobile/src/components/dashboard/ScoreCardV2.tsx` | Redesigned score card with gauge |
| `apps/mobile/src/components/dashboard/TaskCardV2.tsx` | Redesigned task row card |
| `apps/mobile/src/components/dashboard/TaskSummaryPills.tsx` | Counter pills (to do, overdue, completed) |
| `apps/mobile/src/components/ui/BadgeIcon.tsx` | Reusable badge-icon component |
| `apps/mobile/app/(app)/stats/_layout.tsx` | Stats route layout |
| `apps/mobile/app/(app)/stats/index.tsx` | Stats route placeholder |
| `apps/mobile/app/(app)/hub/_layout.tsx` | Hub route layout |
| `apps/mobile/app/(app)/hub/index.tsx` | Hub route placeholder |

### Modified files
| File | Change |
|---|---|
| `apps/mobile/package.json` | Add nativewind, tailwindcss, @expo-google-fonts/outfit |
| `apps/mobile/babel.config.js` | Add NativeWind preset |
| `apps/mobile/metro.config.js` | Create with NativeWind withNativeWind wrapper |
| `apps/mobile/tsconfig.json` | Add nativewind-env.d.ts |
| `apps/mobile/app/(app)/_layout.tsx` | 5-tab bottom nav with FAB |
| `apps/mobile/app/(app)/dashboard/index.tsx` | Complete rewrite with tab system |

---

## Task 1: Install NativeWind and configure build tools

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/tailwind.config.js`
- Create: `apps/mobile/global.css`
- Create: `apps/mobile/nativewind-env.d.ts`
- Create: `apps/mobile/metro.config.js`
- Modify: `apps/mobile/babel.config.js`
- Modify: `apps/mobile/tsconfig.json`

- [ ] **Step 1: Install NativeWind + Tailwind + Outfit font**

```bash
cd apps/mobile && npx expo install nativewind tailwindcss@~3.4.17 @expo-google-fonts/outfit
```

- [ ] **Step 2: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#00E5FF',
        secondary: '#FFB6C1',
        tertiary: '#FFD700',
        danger: '#FF6B6B',
        success: '#48BB78',
        info: '#4299E1',
        purple: '#9F7AEA',
        background: '#F7F9FC',
        surface: '#FFFFFF',
        'surface-dark': '#2D3748',
        'background-dark': '#1A202C',
        text: '#2D3748',
        'text-muted': '#718096',
        'text-dark': '#F7F9FC',
        'text-muted-dark': '#A0AEC0',
        border: '#E2E8F0',
      },
      fontFamily: {
        display: ['Nunito'],
        'display-bold': ['Nunito-Bold'],
        'display-extrabold': ['Nunito-ExtraBold'],
        'display-semibold': ['Nunito-SemiBold'],
        functional: ['Outfit_400Regular'],
        'functional-medium': ['Outfit_500Medium'],
        'functional-semibold': ['Outfit_600SemiBold'],
        'functional-bold': ['Outfit_700Bold'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'badge': '0 4px 10px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create `nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 5: Create `metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 6: Update `babel.config.js`**

Replace entire content:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Note: NativeWind v4 with the `nativewind/preset` in tailwind config and `withNativeWind` in metro does NOT need a babel plugin. The babel file stays the same.

- [ ] **Step 7: Update `tsconfig.json`**

Add nativewind-env.d.ts to include:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "nativewind-env.d.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "supabase/functions"
  ]
}
```

- [ ] **Step 8: Import global.css in the app entry**

In the root layout file (`apps/mobile/app/_layout.tsx`), add at the top:

```ts
import '../global.css';
```

- [ ] **Step 9: Install dependencies and verify app starts**

```bash
cd apps/mobile && npm install && npx expo start --tunnel
```

Verify: the app loads without errors. Existing screens should work unchanged.

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/tailwind.config.js apps/mobile/global.css apps/mobile/nativewind-env.d.ts apps/mobile/metro.config.js apps/mobile/babel.config.js apps/mobile/tsconfig.json apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/app/_layout.tsx
git commit -m "chore(mobile): setup NativeWind v4 with new design tokens"
```

---

## Task 2: Install Outfit font and load it in app entry

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Read current root layout**

Read `apps/mobile/app/_layout.tsx` to understand the current font loading and splash screen setup.

- [ ] **Step 2: Add Outfit font loading**

Add to the existing font loading block in `_layout.tsx`:

```ts
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
```

Add these to whatever `useFonts` call exists alongside the Nunito fonts:

```ts
Outfit_400Regular,
Outfit_500Medium,
Outfit_600SemiBold,
Outfit_700Bold,
```

- [ ] **Step 3: Verify fonts load**

```bash
cd apps/mobile && npx expo start --tunnel
```

Verify: app loads without font errors. Test with a temporary `<Text style={{ fontFamily: 'Outfit_400Regular' }}>Test</Text>` if needed.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "chore(mobile): load Outfit font family for functional typography"
```

---

## Task 3: Create BadgeIcon reusable component

**Files:**
- Create: `apps/mobile/src/components/ui/BadgeIcon.tsx`

- [ ] **Step 1: Create BadgeIcon component**

```tsx
import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type BadgeIconSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<BadgeIconSize, { container: number; icon: number }> = {
  sm: { container: 24, icon: 14 },
  md: { container: 32, icon: 18 },
  lg: { container: 40, icon: 22 },
  xl: { container: 48, icon: 26 },
};

interface BadgeIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: BadgeIconSize;
  bgClassName?: string;
  iconColor?: string;
}

export function BadgeIcon({
  name,
  size = 'lg',
  bgClassName = 'bg-white border-border',
  iconColor = '#2D3748',
}: BadgeIconProps) {
  const { container, icon } = SIZE_MAP[size];
  return (
    <View
      className={`items-center justify-center rounded-2xl border shadow-badge ${bgClassName}`}
      style={{ width: container, height: container }}
    >
      <MaterialCommunityIcons name={name} size={icon} color={iconColor} />
    </View>
  );
}
```

- [ ] **Step 2: Verify it renders**

Temporarily add `<BadgeIcon name="lightbulb-outline" size="lg" bgClassName="bg-primary/20" iconColor="#00E5FF" />` in the dashboard screen. Verify it renders a rounded icon badge.

- [ ] **Step 3: Remove temp usage and commit**

```bash
git add apps/mobile/src/components/ui/BadgeIcon.tsx
git commit -m "feat(mobile): add BadgeIcon reusable component with NativeWind"
```

---

## Task 4: Create DashboardTabs component

**Files:**
- Create: `apps/mobile/src/components/dashboard/DashboardTabs.tsx`

- [ ] **Step 1: Create DashboardTabs**

```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '../ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type DashboardTabKey = 'insights' | 'stats' | 'tasks';

const TABS: { key: DashboardTabKey; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }[] = [
  { key: 'insights', icon: 'lightbulb-outline', label: 'Insights & Actions' },
  { key: 'stats', icon: 'chart-bar', label: 'My Stats' },
  { key: 'tasks', icon: 'clipboard-check-outline', label: 'Tasks' },
];

interface DashboardTabsProps {
  activeTab: DashboardTabKey;
  onTabChange: (tab: DashboardTabKey) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
      className="mb-8"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`flex-row items-center px-6 py-3 rounded-full border-2 shadow-soft ${
              isActive
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-surface'
            }`}
            activeOpacity={0.7}
          >
            <View
              className={`w-6 h-6 items-center justify-center rounded-2xl ${
                isActive ? 'bg-primary/20' : 'bg-gray-100'
              }`}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={14}
                color={isActive ? '#00E5FF' : '#718096'}
              />
            </View>
            <Text
              className={`ml-2 text-sm font-bold ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify tabs render and switch state**

Temporarily use in dashboard screen:

```tsx
const [activeTab, setActiveTab] = useState<DashboardTabKey>('insights');
// ...
<DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
```

Verify: 3 pills render horizontally, tapping switches the active state styling.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/DashboardTabs.tsx
git commit -m "feat(mobile): add DashboardTabs horizontal tab bar component"
```

---

## Task 5: Create InsightCardV2 component

**Files:**
- Create: `apps/mobile/src/components/dashboard/InsightCardV2.tsx`

- [ ] **Step 1: Create InsightCardV2**

```tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CoachingInsight } from '@keurzen/shared';

const TYPE_CONFIG: Record<string, {
  bgCard: string;
  borderColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  bgIcon: string;
  iconColor: string;
  labelColor: string;
  ctaColor: string;
}> = {
  alert: {
    bgCard: 'bg-[#FFF5F5]',
    borderColor: 'border-danger/20',
    icon: 'alert-circle',
    bgIcon: 'bg-danger/20',
    iconColor: '#FF6B6B',
    labelColor: '#FF6B6B',
    ctaColor: '#FF6B6B',
  },
  conseil: {
    bgCard: 'bg-surface',
    borderColor: 'border-border',
    icon: 'chat-outline',
    bgIcon: 'bg-tertiary/20',
    iconColor: '#FFD700',
    labelColor: '#718096',
    ctaColor: '#00E5FF',
  },
  wellbeing: {
    bgCard: 'bg-surface',
    borderColor: 'border-border',
    icon: 'heart',
    bgIcon: 'bg-secondary/20',
    iconColor: '#FFB6C1',
    labelColor: '#718096',
    ctaColor: '#FFB6C1',
  },
};

interface InsightCardV2Props {
  insight: CoachingInsight;
  onPress?: () => void;
}

export function InsightCardV2({ insight, onPress }: InsightCardV2Props) {
  const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.conseil;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`min-w-[280px] p-5 rounded-3xl border-2 shadow-soft ${config.bgCard} ${config.borderColor}`}
    >
      {/* Header: icon + label */}
      <View className="flex-row items-center mb-4" style={{ gap: 12 }}>
        <BadgeIcon
          name={config.icon}
          size="lg"
          bgClassName={`${config.bgIcon} border-0`}
          iconColor={config.iconColor}
        />
        <Text
          className="uppercase tracking-widest"
          style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: config.labelColor }}
        >
          {insight.label}
        </Text>
      </View>

      {/* Message */}
      <Text
        className="text-base mb-4"
        style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}
        numberOfLines={3}
      >
        {insight.message}
      </Text>

      {/* CTA */}
      <View className="flex-row items-center">
        <Text
          className="uppercase tracking-wider"
          style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: config.ctaColor }}
        >
          {insight.cta_label}
        </Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={config.ctaColor}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/InsightCardV2.tsx
git commit -m "feat(mobile): add InsightCardV2 with typed insight styles"
```

---

## Task 6: Create ScoreCardV2 component

**Files:**
- Create: `apps/mobile/src/components/dashboard/ScoreCardV2.tsx`

- [ ] **Step 1: Create ScoreCardV2**

```tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore ! Continuez sur cette voie.';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

function getTrend(score: number): { label: string; positive: boolean } {
  // Placeholder: in future, compare with last week's score
  if (score >= 60) return { label: `+5% depuis la sem. derniere`, positive: true };
  return { label: `-3% depuis la sem. derniere`, positive: false };
}

export function ScoreCardV2() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const score = useMemo(() => {
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
    }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const coachMessage = getScoreMessage(score);
  const trend = getTrend(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
      activeOpacity={0.8}
      className="bg-surface rounded-3xl p-6 shadow-soft border border-border relative overflow-hidden"
    >
      {/* Decorative blur circle */}
      <View
        className="absolute bg-primary/5 rounded-full"
        style={{ top: -40, right: -40, width: 128, height: 128 }}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 z-10">
        <Text
          className="text-lg"
          style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}
        >
          Score du Foyer
        </Text>
        <BadgeIcon name="information-outline" size="md" />
      </View>

      {/* Content row */}
      <View className="flex-row justify-between items-center z-10">
        {/* Left: score + trend + message */}
        <View className="flex-1 pr-4">
          <View className="flex-row items-end">
            <Text style={{ fontSize: 40, fontFamily: 'Nunito-ExtraBold', color: '#2D3748' }}>
              {score}
            </Text>
            <Text
              style={{ fontSize: 20, fontFamily: 'Nunito', color: '#718096', marginBottom: 4, marginLeft: 2 }}
            >
              /100
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.positive ? '#48BB78' : '#FF6B6B'}
            />
            <Text
              className="ml-1 text-sm"
              style={{
                fontFamily: 'Outfit_500Medium',
                color: trend.positive ? '#48BB78' : '#FF6B6B',
              }}
            >
              {trend.label}
            </Text>
          </View>
          <Text
            className="text-sm mt-3 leading-relaxed"
            style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}
          >
            {coachMessage}
          </Text>
        </View>

        {/* Right: gauge */}
        <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }} className="items-center justify-center">
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#E2E8F0"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#00E5FF"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute">
            <BadgeIcon
              name="scale-balance"
              size="xl"
              bgClassName="bg-primary/10 border-primary/20"
              iconColor="#00E5FF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/ScoreCardV2.tsx
git commit -m "feat(mobile): add ScoreCardV2 with circular gauge and NativeWind"
```

---

## Task 7: Create TaskCardV2 component

**Files:**
- Create: `apps/mobile/src/components/dashboard/TaskCardV2.tsx`

- [ ] **Step 1: Create TaskCardV2**

```tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import type { Task } from '../../types';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const CATEGORY_CONFIG: Record<string, {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  bgClassName: string;
  iconColor: string;
}> = {
  courses: { icon: 'cart', bgClassName: 'bg-primary/10 border-0', iconColor: '#00E5FF' },
  menage: { icon: 'broom', bgClassName: 'bg-secondary/10 border-0', iconColor: '#FFB6C1' },
  cuisine: { icon: 'silverware-fork-knife', bgClassName: 'bg-tertiary/10 border-0', iconColor: '#FFD700' },
  linge: { icon: 'tshirt-crew', bgClassName: 'bg-purple/10 border-0', iconColor: '#9F7AEA' },
  enfants: { icon: 'human-child', bgClassName: 'bg-info/10 border-0', iconColor: '#4299E1' },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category.toLowerCase()] ?? {
    icon: 'checkbox-marked-circle-outline' as const,
    bgClassName: 'bg-gray-100 border-0',
    iconColor: '#718096',
  };
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = dayjs(dueDate);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

interface TaskCardV2Props {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskCardV2({ task, onComplete }: TaskCardV2Props) {
  const config = getCategoryConfig(task.category);
  const assigneeName = task.assigned_profile?.full_name ?? null;
  const dateLabel = formatDueDate(task.due_date);
  const meta = [dateLabel, assigneeName].filter(Boolean).join(' \u00B7 ');

  return (
    <View className="bg-surface p-4 rounded-3xl shadow-soft border border-border/50 flex-row items-center justify-between">
      {/* Left: icon + info */}
      <View className="flex-row items-center flex-1" style={{ gap: 16 }}>
        <BadgeIcon
          name={config.icon}
          size="xl"
          bgClassName={config.bgClassName}
          iconColor={config.iconColor}
        />
        <View className="flex-1">
          <Text
            className="text-sm"
            style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text
            className="uppercase tracking-wider mt-0.5"
            style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#718096' }}
            numberOfLines={1}
          >
            {meta}
          </Text>
        </View>
      </View>

      {/* Right: checkbox */}
      <TouchableOpacity
        onPress={() => onComplete(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-10 h-10 items-center justify-center rounded-2xl bg-gray-50 shadow-badge border border-border"
      >
        <MaterialCommunityIcons name="circle-outline" size={24} color="#CBD5E0" />
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TaskCardV2.tsx
git commit -m "feat(mobile): add TaskCardV2 with category icons and NativeWind"
```

---

## Task 8: Create InsightsTab content view

**Files:**
- Create: `apps/mobile/src/components/dashboard/InsightsTab.tsx`

- [ ] **Step 1: Create InsightsTab**

```tsx
import React, { useMemo } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { InsightCardV2 } from './InsightCardV2';
import { ScoreCardV2 } from './ScoreCardV2';
import { TaskCardV2 } from './TaskCardV2';
import { useCoachingInsights } from '@keurzen/queries';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import type { CoachingInsight } from '@keurzen/shared';

export function InsightsTab() {
  const router = useRouter();
  const { data: insights = [] } = useCoachingInsights();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcomingTasks = useMemo(() => {
    return allTasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      })
      .slice(0, 5);
  }, [allTasks]);

  function handleComplete(id: string) {
    updateStatus({ id, status: 'done' });
  }

  return (
    <View style={{ gap: 32 }}>
      {/* 1. Insights carousel */}
      {insights.length > 0 && (
        <FlatList
          data={insights}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          renderItem={({ item }: { item: CoachingInsight }) => (
            <InsightCardV2 insight={item} />
          )}
        />
      )}

      {/* 2. Score du Foyer */}
      <View className="px-6">
        <ScoreCardV2 />
      </View>

      {/* 3. Upcoming Tasks */}
      <View className="px-6" style={{ gap: 16 }}>
        <View className="flex-row justify-between items-center">
          <Text
            className="text-lg"
            style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}
          >
            Taches a venir
          </Text>
          <Text
            className="uppercase tracking-widest"
            style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#00E5FF' }}
            onPress={() => router.push('/(app)/tasks')}
          >
            Voir tout
          </Text>
        </View>

        {upcomingTasks.length === 0 ? (
          <View className="bg-surface rounded-3xl p-8 shadow-soft border border-border items-center">
            <Text style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
              Aucune tache a venir
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {upcomingTasks.map((task) => (
              <TaskCardV2 key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/InsightsTab.tsx
git commit -m "feat(mobile): add InsightsTab view with carousel, score, and tasks"
```

---

## Task 9: Create TaskSummaryPills component

**Files:**
- Create: `apps/mobile/src/components/dashboard/TaskSummaryPills.tsx`

- [ ] **Step 1: Create TaskSummaryPills**

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../ui/Text';

interface TaskSummaryPillsProps {
  todoCount: number;
  overdueCount: number;
  completedCount: number;
}

export function TaskSummaryPills({ todoCount, overdueCount, completedCount }: TaskSummaryPillsProps) {
  const pills = [
    { label: `${todoCount} a faire`, bgClassName: 'bg-primary/10', textColor: '#00E5FF' },
    { label: `${overdueCount} en retard`, bgClassName: 'bg-danger/10', textColor: '#FF6B6B' },
    { label: `${completedCount} completees`, bgClassName: 'bg-success/10', textColor: '#48BB78' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
    >
      {pills.map((pill) => (
        <View key={pill.label} className={`px-4 py-2 rounded-full ${pill.bgClassName}`}>
          <Text
            style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: pill.textColor }}
          >
            {pill.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TaskSummaryPills.tsx
git commit -m "feat(mobile): add TaskSummaryPills counter component"
```

---

## Task 10: Create StatsTab content view

**Files:**
- Create: `apps/mobile/src/components/dashboard/StatsTab.tsx`

- [ ] **Step 1: Create StatsTab**

This reuses data hooks from existing components but renders with the new NativeWind style.

```tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2 - 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DONUT_SIZE = 120;
const DONUT_STROKE = 24;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const MEMBER_COLORS = ['#00E5FF', '#FFB6C1', '#FFD700', '#9F7AEA'];

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore ! Continuez sur cette voie.';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Des desequilibres a corriger cette semaine.';
  return 'Attention, la repartition est fragile.';
}

function getLoadLevel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: 'Elevee', color: '#FF6B6B' };
  if (score >= 35) return { label: 'Moyenne', color: '#FFD700' };
  return { label: 'Faible', color: '#48BB78' };
}

export function StatsTab() {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const score = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance =
      balanceMembers.length > 0
        ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
        : 0;
    const averageTlx = currentTlx?.score ?? 0;
    return computeHouseholdScore({ completedTasks, totalTasks, maxImbalance, averageTlx, streakDays }).total;
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const coachMessage = getScoreMessage(score);
  const scoreOffset = CIRCUMFERENCE * (1 - score / 100);
  const tlxScore = currentTlx?.score ?? 0;
  const loadLevel = getLoadLevel(tlxScore);

  // Build donut segments for task equity
  const segments = useMemo(() => {
    if (balanceMembers.length < 2) return [];
    let cumulative = 0;
    return balanceMembers.map((m, i) => {
      const dashArray = m.tasksShare * DONUT_CIRCUMFERENCE;
      const dashOffset = DONUT_CIRCUMFERENCE - cumulative;
      cumulative += dashArray;
      return { color: MEMBER_COLORS[i % MEMBER_COLORS.length], dashArray, dashOffset, name: m.name, share: m.tasksShare };
    });
  }, [balanceMembers]);

  return (
    <View className="px-6" style={{ gap: 24 }}>
      {/* 1. Score Hero */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/dashboard/weekly-review')}
        activeOpacity={0.8}
        className="bg-surface rounded-3xl p-6 shadow-soft border border-border items-center"
      >
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Score du Foyer
        </Text>
        <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }} className="items-center justify-center mb-4">
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#E2E8F0" strokeWidth={STROKE_WIDTH} fill="none" />
            <Circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke="#00E5FF" strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={scoreOffset}
              strokeLinecap="round" />
          </Svg>
          <View className="absolute">
            <Text style={{ fontSize: 36, fontFamily: 'Nunito-ExtraBold', color: '#2D3748' }}>{score}</Text>
          </View>
        </View>
        <Text className="text-sm text-center mb-4" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          {coachMessage}
        </Text>
        <Text
          className="uppercase tracking-widest"
          style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#00E5FF' }}
        >
          Voir le bilan hebdo
        </Text>
      </TouchableOpacity>

      {/* 2. Task Equity */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Repartition des taches
        </Text>
        {segments.length === 0 ? (
          <Text className="text-center py-4" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
            Pas assez de donnees
          </Text>
        ) : (
          <>
            <View className="items-center mb-4">
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                <Circle cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
                  stroke="#E2E8F0" strokeWidth={DONUT_STROKE} fill="none" />
                {segments.map((seg, i) => (
                  <Circle key={i} cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
                    stroke={seg.color} strokeWidth={DONUT_STROKE} fill="none"
                    strokeDasharray={`${seg.dashArray} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={seg.dashOffset} rotation={-90}
                    origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`} strokeLinecap="butt" />
                ))}
              </Svg>
            </View>
            <View style={{ gap: 8 }}>
              {balanceMembers.map((member, i) => (
                <View key={member.userId} className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
                  <Text className="flex-1 text-xs" style={{ fontFamily: 'Outfit_500Medium', color: '#2D3748' }}>{member.name}</Text>
                  <Text className="text-xs" style={{ fontFamily: 'Outfit_700Bold', color: '#2D3748' }}>{Math.round(member.tasksShare * 100)}%</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 3. Mental Load */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Charge mentale
        </Text>
        <Text className="text-center mb-2" style={{ fontSize: 28, fontFamily: 'Nunito-ExtraBold', color: loadLevel.color }}>
          {tlxScore === 0 ? '\u2014' : loadLevel.label}
        </Text>
        {/* Progress bar */}
        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <View className="h-1.5 rounded-full" style={{ width: `${Math.min(tlxScore, 100)}%`, backgroundColor: loadLevel.color }} />
        </View>
        {/* Member comparison */}
        {balanceMembers.length >= 2 && (
          <View className="flex-row justify-between mt-4">
            {balanceMembers.slice(0, 2).map((member, i) => (
              <View key={member.userId} className="items-center flex-1">
                <Text className="text-xs mb-1" style={{ fontFamily: 'Outfit_500Medium', color: '#718096' }}>{member.name}</Text>
                <Text className="text-sm" style={{ fontFamily: 'Outfit_700Bold', color: '#2D3748' }}>{Math.abs(member.tasksDelta)} taches</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. Weekly Trend */}
      <View className="bg-surface rounded-3xl p-6 shadow-soft border border-border">
        <Text className="text-lg mb-4" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Tendance de la semaine
        </Text>
        {/* Simple bar chart placeholder using score */}
        <View className="flex-row items-end justify-between" style={{ height: 80, gap: 8 }}>
          {[65, 72, 78, score].map((val, i) => (
            <View key={i} className="flex-1 items-center">
              <View
                className="w-full rounded-t-xl"
                style={{ height: (val / 100) * 60, backgroundColor: i === 3 ? '#00E5FF' : '#E2E8F0' }}
              />
              <Text className="mt-2" style={{ fontSize: 10, fontFamily: 'Outfit_500Medium', color: '#718096' }}>
                {['S-3', 'S-2', 'S-1', 'Auj.'][i]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/StatsTab.tsx
git commit -m "feat(mobile): add StatsTab with score hero, equity, mental load, trend"
```

---

## Task 11: Create TasksTab content view

**Files:**
- Create: `apps/mobile/src/components/dashboard/TasksTab.tsx`

- [ ] **Step 1: Create TasksTab**

```tsx
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskCardV2 } from './TaskCardV2';
import { TaskSummaryPills } from './TaskSummaryPills';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

interface TaskGroup {
  label: string;
  tasks: Array<import('../../types').Task>;
}

function groupTasks(tasks: Array<import('../../types').Task>): TaskGroup[] {
  const today: TaskGroup = { label: "Aujourd'hui", tasks: [] };
  const tomorrow: TaskGroup = { label: 'Demain', tasks: [] };
  const thisWeek: TaskGroup = { label: 'Cette semaine', tasks: [] };

  for (const task of tasks) {
    if (!task.due_date) {
      thisWeek.tasks.push(task);
      continue;
    }
    const d = dayjs(task.due_date);
    if (d.isToday()) today.tasks.push(task);
    else if (d.isTomorrow()) tomorrow.tasks.push(task);
    else thisWeek.tasks.push(task);
  }

  return [today, tomorrow, thisWeek].filter((g) => g.tasks.length > 0);
}

export function TasksTab() {
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const pendingTasks = useMemo(
    () => allTasks.filter((t) => t.status !== 'done').sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }),
    [allTasks],
  );

  const overdueCount = useMemo(
    () => pendingTasks.filter((t) => t.due_date && dayjs(t.due_date).isBefore(dayjs(), 'day')).length,
    [pendingTasks],
  );

  const completedCount = useMemo(
    () => allTasks.filter((t) => t.status === 'done').length,
    [allTasks],
  );

  const groups = useMemo(() => groupTasks(pendingTasks), [pendingTasks]);

  function handleComplete(id: string) {
    updateStatus({ id, status: 'done' });
  }

  return (
    <View style={{ gap: 24 }}>
      {/* Summary pills */}
      <TaskSummaryPills
        todoCount={pendingTasks.length}
        overdueCount={overdueCount}
        completedCount={completedCount}
      />

      {/* Task list or empty state */}
      {pendingTasks.length === 0 ? (
        <View className="px-6 items-center py-16">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
            <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#00E5FF" />
          </View>
          <Text className="text-base mb-2" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
            Aucune tache a venir
          </Text>
          <Text className="text-sm text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
            Ajoutez une tache avec le bouton +
          </Text>
        </View>
      ) : (
        <View className="px-6" style={{ gap: 24 }}>
          {groups.map((group) => (
            <View key={group.label} style={{ gap: 12 }}>
              {/* Group header */}
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Text
                  className="uppercase tracking-widest"
                  style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#718096' }}
                >
                  {group.label}
                </Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* Task cards */}
              <View style={{ gap: 12 }}>
                {group.tasks.map((task) => (
                  <TaskCardV2 key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/TasksTab.tsx
git commit -m "feat(mobile): add TasksTab with grouped tasks and summary pills"
```

---

## Task 12: Create stats and hub route placeholders

**Files:**
- Create: `apps/mobile/app/(app)/stats/_layout.tsx`
- Create: `apps/mobile/app/(app)/stats/index.tsx`
- Create: `apps/mobile/app/(app)/hub/_layout.tsx`
- Create: `apps/mobile/app/(app)/hub/index.tsx`

- [ ] **Step 1: Create stats route**

`apps/mobile/app/(app)/stats/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function StatsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/(app)/stats/index.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';

export default function StatsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Statistiques
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          Page de statistiques detaillees a venir
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create hub route**

`apps/mobile/app/(app)/hub/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function HubLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/(app)/hub/index.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';

export default function HubScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
          Hub
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          Votre centre de commandes
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/stats/ apps/mobile/app/(app)/hub/
git commit -m "feat(mobile): add stats and hub route placeholders"
```

---

## Task 13: Redesign bottom nav with 5 tabs and FAB

**Files:**
- Modify: `apps/mobile/app/(app)/_layout.tsx`

- [ ] **Step 1: Rewrite _layout.tsx with new 5-tab nav and FAB**

Replace the full content of `apps/mobile/app/(app)/_layout.tsx`:

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { Loader } from '../../src/components/ui/Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Text';

const TAB_CONFIG = [
  { name: 'dashboard', label: 'Accueil', icon: 'home' as const },
  { name: 'tasks', label: 'Taches', icon: 'clipboard-check-outline' as const },
  { name: '_fab', label: '', icon: 'plus' as const },
  { name: 'stats', label: 'Stats', icon: 'chart-bar' as const },
  { name: 'hub', label: 'Hub', icon: 'view-grid-outline' as const },
] as const;

function FABButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/tasks/create')}
      activeOpacity={0.85}
      style={styles.fab}
    >
      <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isInitialized) return <Loader fullScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  const tabBarHeight = 56 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          { height: tabBarHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : 4 },
        ],
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: '#00E5FF',
        tabBarInactiveTintColor: '#718096',
      }}
    >
      {TAB_CONFIG.map(({ name, label, icon }) => {
        if (name === '_fab') {
          return (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                href: null,
                tabBarIcon: () => <FABButton />,
                tabBarLabel: () => null,
                tabBarStyle: { display: 'none' },
              }}
            />
          );
        }
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              tabBarLabel: label,
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  name={icon}
                  size={24}
                  color={focused ? '#00E5FF' : '#718096'}
                />
              ),
            }}
          />
        );
      })}
      {/* Hidden from tabs — accessible via Hub */}
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="meals" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

Note: The `_fab` route is registered with `href: null` so it doesn't navigate anywhere. The FAB itself navigates to task creation. Expo Router requires a file for each tab name, so we need a dummy `_fab` file — OR we use a custom tab bar. The simpler approach: use a custom `tabBar` render prop.

**Alternative (custom tabBar):** If the `_fab` approach causes issues with Expo Router (since there's no `_fab` directory), replace the Tabs component with a custom tab bar using the `tabBar` prop. The implementation would be:

```tsx
import { Tabs, Redirect, useRouter } from 'expo-router';

// ... same imports ...

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const visibleTabs = [
    { route: 'dashboard', label: 'Accueil', icon: 'home' as const },
    { route: 'tasks', label: 'Taches', icon: 'clipboard-check-outline' as const },
    { route: 'stats', label: 'Stats', icon: 'chart-bar' as const },
    { route: 'hub', label: 'Hub', icon: 'view-grid-outline' as const },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      {visibleTabs.map((tab, index) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.route);
        const isFocused = state.index === routeIndex;

        // Insert FAB after 2nd tab
        const items = [];
        if (index === 2) {
          items.push(
            <TouchableOpacity
              key="fab"
              onPress={() => router.push('/(app)/tasks/create')}
              activeOpacity={0.85}
              style={styles.fab}
            >
              <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          );
        }

        items.push(
          <TouchableOpacity
            key={tab.route}
            onPress={() => navigation.navigate(tab.route)}
            style={styles.tabItem}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isFocused ? '#00E5FF' : '#718096'}
            />
            <Text style={[styles.label, { color: isFocused ? '#00E5FF' : '#718096' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );

        return items;
      })}
    </View>
  );
}

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) return <Loader fullScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="hub" />
      {/* Hidden routes */}
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="meals" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}
```

Use the custom tabBar approach as it's cleaner with Expo Router.

- [ ] **Step 2: Verify bottom nav renders with 5 items + FAB**

```bash
cd apps/mobile && npx expo start --tunnel
```

Verify: 4 labeled tabs (Accueil, Taches, Stats, Hub) with centered FAB. Tapping FAB navigates to task creation. Each tab navigates correctly.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/_layout.tsx
git commit -m "feat(mobile): redesign bottom nav with 5 tabs, FAB, and MaterialCommunityIcons"
```

---

## Task 14: Rewrite dashboard screen with tab system

**Files:**
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx`

- [ ] **Step 1: Rewrite dashboard/index.tsx**

Replace the full content:

```tsx
import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { DashboardTabs, type DashboardTabKey } from '../../../src/components/dashboard/DashboardTabs';
import { InsightsTab } from '../../../src/components/dashboard/InsightsTab';
import { StatsTab } from '../../../src/components/dashboard/StatsTab';
import { TasksTab } from '../../../src/components/dashboard/TasksTab';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('insights');

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-xl" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
            Bienvenue
          </Text>
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#00E5FF"
            colors={['#00E5FF']}
          />
        }
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-6 pt-8 pb-2">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {/* Avatar */}
            <View className="w-12 h-12 bg-surface rounded-full shadow-soft items-center justify-center border-2 border-primary/20 p-0.5">
              <Mascot size={40} expression="calm" />
            </View>
            <Text className="text-xl" style={{ fontFamily: 'Nunito-Bold', color: '#2D3748' }}>
              Bonjour, <Text style={{ color: '#00E5FF' }}>{firstName}</Text> {'\u2728'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-2xl shadow-badge border border-border bg-surface"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/(app)/notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#2D3748" />
            {/* Red dot for unread */}
            <View
              className="absolute bg-danger rounded-full border-2 border-surface"
              style={{ top: 4, right: 4, width: 10, height: 10 }}
            />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* TAB CONTENT */}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'tasks' && <TasksTab />}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify the full dashboard renders**

```bash
cd apps/mobile && npx expo start --tunnel
```

Verify:
- Header shows avatar + "Bonjour, [Name]" in cyan + notification bell
- 3 tabs render, default is "Insights & Actions"
- Tab switching works, content changes
- Pull-to-refresh works
- Tapping score card navigates to weekly review
- "Voir tout" navigates to tasks
- Bottom nav FAB creates a task

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/dashboard/index.tsx
git commit -m "feat(mobile): rewrite dashboard with 3-tab system and NativeWind styling"
```

---

## Task 15: Verify and fix integration issues

**Files:**
- Potentially any file created/modified above

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run linter**

```bash
cd /Users/ouss/Keurzen && npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ouss/Keurzen && npm run test
```

Fix any test failures related to the changed components.

- [ ] **Step 4: Manual verification on device**

Start the dev server and verify on a physical device or simulator:

1. Dashboard loads without crash
2. Header: avatar, greeting with cyan name, notification bell with red dot
3. Tabs: 3 pills scroll horizontally, active tab has cyan border
4. Tab "Insights & Actions": insight cards scroll horizontally, score card with gauge, upcoming tasks
5. Tab "My Stats": large gauge, donut chart, mental load bar, weekly trend bars
6. Tab "Tasks": summary pills, grouped tasks, empty state
7. Bottom nav: 4 labels + centered FAB, FAB shadow, correct navigation
8. Pull-to-refresh works
9. Dark mode (if applicable): check for readability

- [ ] **Step 5: Final commit with any fixes**

```bash
git add -A
git commit -m "fix(mobile): address integration issues from dashboard v8 redesign"
```
