# Dashboard Editorial Kawaii — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the dashboard (web + mobile) and web sidebar from "Cafe Cosy" to "Editorial Kawaii" design system, using parallel V2 tokens that don't break the rest of the app.

**Architecture:** New `tokensV2.ts` (mobile) and `--v2-*` CSS variables (web) coexist with existing tokens. Dashboard components and sidebar import V2 tokens. No changes to shared packages or non-dashboard screens.

**Tech Stack:** React Native / Expo (mobile), Next.js / Tailwind CSS (web), TypeScript strict

---

### Task 1: Create Mobile Tokens V2

**Files:**
- Create: `apps/mobile/src/constants/tokensV2.ts`

- [ ] **Step 1: Create tokensV2.ts**

```typescript
/**
 * Keurzen Design Tokens V2
 * Editorial Kawaii — "The Tactile Sanctuary"
 */

export const ColorsV2 = {
  // ─── Primary (Teal) ───
  primary: '#007261',
  primaryContainer: '#91eed9',
  onPrimary: '#ffffff',

  // ─── Secondary (Coral) ───
  secondary: '#9d4b53',
  onSecondary: '#ffffff',

  // ─── Tertiary (Violet) ───
  tertiary: '#cab4f3',
  tertiaryContainer: '#e8ddf5',

  // ─── Surfaces ───
  surface: '#fefcf4',
  surfaceContainer: '#f5f4eb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e9e9de',
  surfaceBright: '#fefcf4',

  // ─── Text ───
  onSurface: '#383833',
  onSurfaceVariant: '#6b6b63',

  // ─── Outline ───
  outlineVariant: 'rgba(156,143,128,0.15)',

  // ─── Semantic ───
  error: '#9d4b53',
  success: '#007261',
  warning: '#cab4f3',
} as const;

export const RadiusV2 = {
  sm: 12,
  md: 24,    // 1.5rem — cards, containers
  lg: 24,
  xl: 48,    // 3rem — pill buttons
  full: 9999,
} as const;

export const TypographyV2 = {
  display: {
    letterSpacing: -0.5, // -2%
  },
  body: {
    lineHeight: 1.6,
  },
} as const;

// No shadows in V2 — hierarchy by tonal layering only
export const ShadowsV2 = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type ColorV2Token = keyof typeof ColorsV2;
```

- [ ] **Step 2: Verify file exists**

Run: `ls apps/mobile/src/constants/tokensV2.ts`
Expected: File listed

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/constants/tokensV2.ts
git commit -m "feat: create mobile tokensV2 for Editorial Kawaii design system"
```

---

### Task 2: Add V2 CSS Variables to Web

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add V2 CSS variables block**

Add after the existing `@theme` block (before the `@theme inline` block):

```css
/* ─── Editorial Kawaii V2 tokens ─── */
@theme {
  --color-v2-primary: #007261;
  --color-v2-primary-container: #91eed9;
  --color-v2-on-primary: #ffffff;
  --color-v2-secondary: #9d4b53;
  --color-v2-on-secondary: #ffffff;
  --color-v2-tertiary: #cab4f3;
  --color-v2-tertiary-container: #e8ddf5;
  --color-v2-surface: #fefcf4;
  --color-v2-surface-container: #f5f4eb;
  --color-v2-surface-lowest: #ffffff;
  --color-v2-surface-highest: #e9e9de;
  --color-v2-on-surface: #383833;
  --color-v2-on-surface-variant: #6b6b63;
  --color-v2-outline-variant: rgba(156,143,128,0.15);
  --radius-v2-md: 1.5rem;
  --radius-v2-xl: 3rem;
}
```

- [ ] **Step 2: Verify CSS parses**

Run: `cd apps/web && npx next lint --quiet 2>&1 | head -5`
Expected: No CSS parse errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): add Editorial Kawaii V2 CSS variables"
```

---

### Task 3: Update Web Sidebar

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`
- Modify: `apps/web/src/components/layout/SidebarItem.tsx`

- [ ] **Step 1: Update SidebarItem.tsx**

Replace the entire file content:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ href, icon: Icon, label, collapsed, onNavigate }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-v2-md)] px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-v2-surface-lowest text-v2-primary border border-v2-outline-variant'
          : 'text-v2-on-surface-variant hover:bg-v2-surface hover:text-v2-on-surface border border-transparent',
        collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      {collapsed ? (
        <span className="hidden xl:inline">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Update Sidebar.tsx**

Replace the entire file content:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import {
  Home, CheckCircle, Calendar, List, Wallet,
  Users, Mail, Settings, LogOut, X, MessageCircle,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@keurzen/stores';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/tasks', icon: CheckCircle, label: 'Taches' },
  { href: '/calendar', icon: Calendar, label: 'Agenda' },
  { href: '/lists', icon: List, label: 'Listes' },
  { href: '/budget', icon: Wallet, label: 'Budget' },
];

const HOUSEHOLD_ITEMS = [
  { href: '/settings/household', icon: Users, label: 'Mon foyer' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];

interface SidebarProps {
  asDrawer?: boolean;
  onClose?: () => void;
}

export function Sidebar({ asDrawer, onClose }: SidebarProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const displayName = profile?.full_name || 'Utilisateur';

  if (asDrawer) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-v2-surface-container">
          <div className="flex h-14 items-center gap-2 px-4">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-v2-primary" />
            <span className="text-sm font-semibold tracking-wider text-v2-on-surface">Keurzen</span>
            <button
              onClick={onClose}
              className="ml-auto rounded-[var(--radius-v2-md)] p-1 text-v2-on-surface-variant hover:text-v2-on-surface"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          </div>
          <SidebarContent collapsed={false} router={router} displayName={displayName} onNavigate={onClose} />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen flex-col bg-v2-surface-container transition-all duration-250',
        'lg:w-16 xl:w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-v2-primary" />
        <span className="hidden xl:inline text-sm font-semibold tracking-wider text-v2-on-surface">Keurzen</span>
      </div>
      <SidebarContent collapsed router={router} displayName={displayName} />
    </aside>
  );
}

function SidebarContent({
  collapsed,
  router,
  displayName,
  onNavigate,
}: {
  collapsed: boolean;
  router: ReturnType<typeof useRouter>;
  displayName: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        {/* Section separator — vertical spacing only, no line */}
        <div className="pt-6">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant hidden xl:block">
            Foyer
          </p>
        </div>
        {HOUSEHOLD_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-1 px-2 py-3">
        <button
          onClick={() => {
            router.push('/settings');
            onNavigate?.();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-v2-md)] px-3 py-2 text-sm transition-colors hover:bg-v2-surface',
            collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
          )}
        >
          <Avatar name={displayName} size={28} className="bg-v2-primary-container text-v2-primary" />
          {collapsed ? (
            <span className="hidden xl:inline truncate text-v2-on-surface font-medium">{displayName}</span>
          ) : (
            <span className="truncate text-v2-on-surface font-medium">{displayName}</span>
          )}
        </button>
        <SidebarItem href="/settings" icon={Settings} label="Reglages" collapsed={collapsed} onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate?.()}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-v2-md)] px-3 py-2 text-sm font-medium text-v2-secondary transition-colors hover:bg-v2-secondary/8',
            collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
          )}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {collapsed ? (
            <span className="hidden xl:inline">Se deconnecter</span>
          ) : (
            <span>Se deconnecter</span>
          )}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx apps/web/src/components/layout/SidebarItem.tsx
git commit -m "feat(web): update sidebar to Editorial Kawaii V2 design"
```

---

### Task 4: Update Web InsightCard & InsightsCarousel

**Files:**
- Modify: `apps/web/src/components/dashboard/InsightCard.tsx`
- Modify: `apps/web/src/components/dashboard/InsightsCarousel.tsx`

- [ ] **Step 1: Update InsightCard.tsx**

Replace the entire file content:

```typescript
'use client';

import type { CoachingInsight } from '@keurzen/shared';

// ─── Dot color per type ───────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  alert: 'bg-v2-secondary',
  conseil: 'bg-v2-primary',
  wellbeing: 'bg-v2-tertiary',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: CoachingInsight;
  onClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const dotColor = DOT_COLORS[insight.type] ?? DOT_COLORS.conseil;

  return (
    <div
      className="min-w-[280px] shrink-0 rounded-[var(--radius-v2-md)] bg-v2-surface-container p-5 flex flex-col justify-between cursor-pointer"
      onClick={onClick}
    >
      {/* Dot + label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant">
          {insight.label}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm font-semibold text-v2-on-surface mb-4 flex-1 leading-relaxed">
        {insight.message}
      </p>

      {/* CTA — text only */}
      <button
        className="text-xs font-bold text-v2-primary flex items-center gap-1"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {insight.cta_label} →
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update InsightsCarousel.tsx**

Replace the entire file content:

```typescript
'use client';

import type { CoachingInsight } from '@keurzen/shared';
import { InsightCard } from './InsightCard';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightClick?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightClick }: InsightsCarouselProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant mb-4">
        Insights & Actions
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={() => onInsightClick?.(insight)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/InsightCard.tsx apps/web/src/components/dashboard/InsightsCarousel.tsx
git commit -m "feat(web): restyle InsightCard and InsightsCarousel to Editorial Kawaii V2"
```

---

### Task 5: Update Web ScoreHeroCard

**Files:**
- Modify: `apps/web/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Replace ScoreHeroCard.tsx**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useTasks, useWeeklyBalance, useCurrentTlx } from '@keurzen/queries';
import { computeHouseholdScore } from '@keurzen/shared';

const GAUGE_R = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Excellent equilibre cette semaine !';
  if (score >= 60) return 'Bon equilibre, quelques ajustements possibles.';
  if (score >= 40) return 'Quelques desequilibres a surveiller.';
  return 'Attention, la charge est tres inegale.';
}

export function ScoreHeroCard() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { members } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const maxImbalance =
    members.length > 0
      ? Math.max(...members.map((m) => Math.abs(m.tasksDelta)))
      : 0;
  const averageTlx = currentTlx?.score ?? 0;

  const { total: score } = computeHouseholdScore({
    completedTasks,
    totalTasks,
    maxImbalance,
    averageTlx,
    streakDays: 0,
  });

  const message = getScoreMessage(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 pb-8 border border-v2-outline-variant cursor-pointer transition-colors hover:bg-white -ml-2.5 mr-5"
      onClick={() => router.push('/dashboard/analytics')}
    >
      {/* Soft glow blob */}
      <div className="absolute -top-10 -right-16 w-48 h-48 rounded-full bg-v2-primary-container opacity-12 blur-[60px]" />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant mb-4">
          Score du Foyer
        </p>

        <div className="flex items-center justify-between">
          {/* Left: score + message */}
          <div className="flex-1 pr-4">
            <div>
              <span className="text-[26px] font-extrabold text-v2-on-surface tracking-tight">
                {score}
              </span>
              <span className="text-xl text-v2-on-surface-variant">/100</span>
            </div>
            <p className="text-sm text-v2-on-surface-variant mt-3 leading-relaxed">{message}</p>
          </div>

          {/* Right: circular gauge */}
          <div className="relative" style={{ width: 112, height: 112 }}>
            <svg width={112} height={112} viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx={50} cy={50} r={GAUGE_R}
                fill="none"
                stroke="var(--color-v2-surface-container)"
                strokeWidth={STROKE}
              />
              <circle
                cx={50} cy={50} r={GAUGE_R}
                fill="none"
                stroke="var(--color-v2-primary)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat(web): restyle ScoreHeroCard to Editorial Kawaii V2"
```

---

### Task 6: Update Web TaskEquityCard & MentalLoadCardV2

**Files:**
- Modify: `apps/web/src/components/dashboard/TaskEquityCard.tsx`
- Modify: `apps/web/src/components/dashboard/MentalLoadCardV2.tsx`

- [ ] **Step 1: Replace TaskEquityCard.tsx**

```typescript
'use client';

import { useWeeklyBalance } from '@keurzen/queries';

const DONUT_R = 35;
const DONUT_STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

const MEMBER_COLORS = [
  'var(--color-v2-primary)',
  'var(--color-v2-secondary)',
  'var(--color-v2-tertiary)',
  'var(--color-v2-primary-container)',
];

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-container p-5 pb-7 flex flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant text-center mb-4">
        Repartition
      </p>

      {members.length < 2 ? (
        <p className="text-center text-sm text-v2-on-surface-variant py-4">
          Pas assez de donnees
        </p>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <svg width={96} height={96} viewBox="0 0 100 100" className="-rotate-90">
              {members.map((member, i) => {
                const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
                const share = member.tasksShare;
                const dashArray = CIRCUMFERENCE * share;
                const dashOffset =
                  -CIRCUMFERENCE *
                  members.slice(0, i).reduce((sum, m) => sum + m.tasksShare, 0);

                return (
                  <circle
                    key={member.userId}
                    cx={50} cy={50} r={DONUT_R}
                    fill="none"
                    stroke={color}
                    strokeWidth={DONUT_STROKE}
                    strokeDasharray={`${dashArray} ${CIRCUMFERENCE - dashArray}`}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-2 mt-auto">
            {members.map((member, i) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const pct = Math.round(member.tasksShare * 100);
              return (
                <div key={member.userId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-v2-on-surface-variant">{member.name.split(' ')[0]}</span>
                  </div>
                  <span className="font-bold text-v2-on-surface">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace MentalLoadCardV2.tsx**

```typescript
'use client';

import { useCurrentTlx, useWeeklyBalance } from '@keurzen/queries';

function getScoreLevelLabel(score: number): string {
  if (score >= 65) return 'Elevee';
  if (score >= 35) return 'Moderee';
  return 'Legere';
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const topMember = members[0];
  const levelLabel = getScoreLevelLabel(score);

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 pb-6 border border-v2-outline-variant flex flex-col mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant text-center mb-3">
        Charge mentale
      </p>

      <p className="text-2xl font-extrabold text-v2-on-surface text-center mb-1 tracking-tight">
        {score === 0 ? '—' : levelLabel}
      </p>

      <p className="text-xs text-v2-on-surface-variant text-center">
        {topMember
          ? `Focus sur ${topMember.name.split(' ')[0]} cette semaine`
          : 'Aucune donnee disponible'}
      </p>

      <div className="w-full mt-4 h-1.5 rounded-full bg-v2-surface-container overflow-hidden">
        <div
          className="h-full rounded-full bg-v2-primary transition-all duration-500"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/TaskEquityCard.tsx apps/web/src/components/dashboard/MentalLoadCardV2.tsx
git commit -m "feat(web): restyle TaskEquityCard and MentalLoadCardV2 to Editorial Kawaii V2"
```

---

### Task 7: Update Web UpcomingTasksCard

**Files:**
- Modify: `apps/web/src/components/dashboard/UpcomingTasksCard.tsx`

- [ ] **Step 1: Replace UpcomingTasksCard.tsx**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import { useTasks, useUpdateTaskStatus } from '@keurzen/queries';
import type { Task } from '@keurzen/shared';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    cooking: '🍳', cleaning: '🧹', shopping: '🛒', linge: '👕', children: '👶',
  };
  return map[category] ?? '✅';
}

function formatDueDate(date: string | null): string {
  if (!date) return 'Pas de date';
  const d = dayjs(date);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('DD/MM');
}

export function UpcomingTasksCard() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const upcomingTasks = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf();
    })
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-on-surface-variant">
          A venir
        </p>
        <button
          className="text-sm font-bold text-v2-primary"
          onClick={() => router.push('/tasks')}
        >
          Voir tout
        </button>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-6 border border-v2-outline-variant text-center">
          <p className="text-sm text-v2-on-surface-variant">Aucune tache a venir</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-v2-md)] bg-v2-surface-lowest p-5 pb-7 border border-v2-outline-variant ml-2 -mr-2.5 space-y-3.5">
          {upcomingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={() => updateStatus({ id: task.id, status: 'done' })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const emoji = getCategoryEmoji(task.category);
  const dateLabel = formatDueDate(task.due_date);
  const assigneeName = task.assigned_profile?.full_name?.split(' ')[0];

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-[12px] bg-v2-surface-container flex items-center justify-center shrink-0">
        <span className="text-sm">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-v2-on-surface truncate">{task.title}</p>
        <p className="text-xs text-v2-on-surface-variant">
          {dateLabel}
          {assigneeName ? ` · ${assigneeName}` : ''}
        </p>
      </div>
      <button
        className="w-6 h-6 rounded-full border-2 border-v2-outline-variant hover:border-v2-primary transition-colors shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        aria-label="Marquer comme terminee"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/UpcomingTasksCard.tsx
git commit -m "feat(web): restyle UpcomingTasksCard to Editorial Kawaii V2"
```

---

### Task 8: Create Web HomeHeartCard & Update Dashboard Page

**Files:**
- Create: `apps/web/src/components/dashboard/HomeHeartCard.tsx`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create HomeHeartCard.tsx**

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function HomeHeartCard() {
  const router = useRouter();

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-tertiary-container p-6 pb-8 ml-10">
      <p className="text-sm text-v2-on-surface-variant mb-3">
        Que voulez-vous faire ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/tasks/create')}
          className="rounded-[var(--radius-v2-xl)] bg-v2-primary text-v2-on-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
        >
          Ajouter une tache
        </button>
        <button
          onClick={() => router.push('/dashboard/tlx')}
          className="rounded-[var(--radius-v2-xl)] bg-v2-surface-lowest text-v2-on-surface px-5 py-2.5 text-sm font-semibold border border-v2-outline-variant transition-colors hover:bg-white"
        >
          Remplir le TLX
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace dashboard page.tsx**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@keurzen/stores';
import { useCoachingInsights } from '@keurzen/queries';
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '@/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '@/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '@/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';
import { HomeHeartCard } from '@/components/dashboard/HomeHeartCard';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: insights = [] } = useCoachingInsights();

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-v2-secondary mb-1">
            Bonjour
          </p>
          <h1 className="text-[28px] font-bold text-v2-on-surface tracking-tight">
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-v2-surface-container transition-colors hover:bg-v2-surface-highest"
          aria-label="Notifications"
        >
          <span className="text-base">🔔</span>
        </button>
      </div>

      {/* Insights Carousel */}
      <InsightsCarousel insights={insights} />

      {/* Score Hero — decale gauche */}
      <ScoreHeroCard />

      {/* Equity + Mental Load — asymmetric grid */}
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 max-md:grid-cols-1">
        <TaskEquityCard />
        <MentalLoadCardV2 />
      </div>

      {/* Upcoming Tasks — decale droite */}
      <UpcomingTasksCard />

      {/* Home Heart — off-center droite */}
      <HomeHeartCard />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/HomeHeartCard.tsx apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(web): add HomeHeartCard and update dashboard layout to Editorial Kawaii V2"
```

---

### Task 9: Update Mobile InsightCard & InsightsCarousel

**Files:**
- Modify: `apps/mobile/src/components/dashboard/InsightCard.tsx`
- Modify: `apps/mobile/src/components/dashboard/InsightsCarousel.tsx`

- [ ] **Step 1: Replace InsightCard.tsx**

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightCardProps {
  insight: CoachingInsight;
  onPress?: () => void;
}

const DOT_COLORS: Record<string, string> = {
  alert: ColorsV2.secondary,
  conseil: ColorsV2.primary,
  wellbeing: ColorsV2.tertiary,
};

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const dotColor = DOT_COLORS[insight.type] ?? DOT_COLORS.conseil;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.card}
    >
      {/* Dot + label */}
      <View style={styles.topRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text variant="overline" style={[styles.label, { color: ColorsV2.onSurfaceVariant }]}>
          {insight.label}
        </Text>
      </View>

      {/* Message */}
      <Text
        variant="bodySmall"
        weight="semibold"
        style={styles.message}
        numberOfLines={3}
      >
        {insight.message}
      </Text>

      {/* CTA */}
      <View style={styles.ctaRow}>
        <Text variant="bodySmall" weight="bold" style={styles.ctaText}>
          {insight.cta_label}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={ColorsV2.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: RadiusV2.md,
    backgroundColor: ColorsV2.surfaceContainer,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 2,
  },
  message: {
    color: ColorsV2.onSurface,
    marginBottom: Spacing.md,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    fontSize: Typography.fontSize.sm,
    color: ColorsV2.primary,
  },
});
```

- [ ] **Step 2: Replace InsightsCarousel.tsx**

```typescript
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { InsightCard } from './InsightCard';
import { ColorsV2 } from '../../constants/tokensV2';
import { Spacing } from '../../constants/tokens';
import type { CoachingInsight } from '@keurzen/shared';

interface InsightsCarouselProps {
  insights: CoachingInsight[];
  onInsightPress?: (insight: CoachingInsight) => void;
}

export function InsightsCarousel({ insights, onInsightPress }: InsightsCarouselProps) {
  if (insights.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text
        variant="overline"
        style={styles.title}
      >
        Insights & Actions
      </Text>

      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <InsightCard
            insight={item}
            onPress={() => onInsightPress?.(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.base,
  },
  title: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  separator: {
    width: Spacing.md,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/InsightCard.tsx apps/mobile/src/components/dashboard/InsightsCarousel.tsx
git commit -m "feat(mobile): restyle InsightCard and InsightsCarousel to Editorial Kawaii V2"
```

---

### Task 10: Update Mobile ScoreHeroCard

**Files:**
- Modify: `apps/mobile/src/components/dashboard/ScoreHeroCard.tsx`

- [ ] **Step 1: Replace ScoreHeroCard.tsx**

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, Stop, RadialGradient } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 12;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreMessage(score: number): string {
  if (score >= 80) return 'Votre repartition s\'ameliore !';
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
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/dashboard/weekly-review')}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Soft glow blob */}
      <View style={styles.glowBlob} />

      {/* Overline label */}
      <Text variant="overline" style={styles.overline}>
        Score du Foyer
      </Text>

      {/* Content row */}
      <View style={styles.contentRow}>
        <View style={styles.leftSection}>
          <View style={styles.scoreRow}>
            <Text variant="display" weight="extrabold" style={styles.scoreNumber}>
              {score}
            </Text>
            <Text variant="h3" weight="regular" style={styles.scoreMax}>
              /100
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.coachMessage} numberOfLines={2}>
            {coachMessage}
          </Text>
        </View>

        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={ColorsV2.surfaceContainer}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS}
              stroke={ColorsV2.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
            />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    overflow: 'hidden',
    marginLeft: -10,
    marginRight: 20,
  },
  glowBlob: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: ColorsV2.primaryContainer,
    opacity: 0.12,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 26,
    color: ColorsV2.onSurface,
    letterSpacing: -1,
    lineHeight: 30,
  },
  scoreMax: {
    fontSize: Typography.fontSize.xl,
    color: ColorsV2.onSurfaceVariant,
    marginBottom: 2,
    marginLeft: 2,
  },
  coachMessage: {
    color: ColorsV2.onSurfaceVariant,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/ScoreHeroCard.tsx
git commit -m "feat(mobile): restyle ScoreHeroCard to Editorial Kawaii V2"
```

---

### Task 11: Update Mobile TaskEquityCard & MentalLoadCardV2

**Files:**
- Modify: `apps/mobile/src/components/dashboard/TaskEquityCard.tsx`
- Modify: `apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx`

- [ ] **Step 1: Replace TaskEquityCard.tsx**

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

const DONUT_SIZE = 96;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = DONUT_SIZE / 2;

const MEMBER_COLORS = [
  ColorsV2.primary,
  ColorsV2.secondary,
  ColorsV2.tertiary,
  ColorsV2.primaryContainer,
];

function buildSegments(shares: number[], colors: string[]) {
  let cumulativeOffset = 0;
  return shares.map((share, i) => {
    const dashArray = share * CIRCUMFERENCE;
    const dashOffset = CIRCUMFERENCE - cumulativeOffset;
    cumulativeOffset += dashArray;
    return {
      color: colors[i] ?? MEMBER_COLORS[i % MEMBER_COLORS.length],
      share,
      dashArray,
      dashOffset,
    };
  });
}

export function TaskEquityCard() {
  const { members } = useWeeklyBalance();

  const segments = useMemo(() => {
    if (members.length < 2) return [];
    const colors = members.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]);
    const shares = members.map((m) => m.tasksShare);
    return buildSegments(shares, colors);
  }, [members]);

  if (members.length < 2) {
    return (
      <View style={styles.card}>
        <Text variant="overline" style={styles.title}>Repartition</Text>
        <View style={styles.emptyState}>
          <Text variant="bodySmall" style={styles.emptyText}>Pas assez de donnees</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text variant="overline" style={styles.title}>Repartition</Text>

      <View style={styles.donutContainer}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS}
            stroke={ColorsV2.surfaceContainerLowest}
            strokeWidth={STROKE_WIDTH} fill="none" />
          {segments.map((seg, index) => (
            <Circle key={index}
              cx={CENTER} cy={CENTER} r={RADIUS}
              stroke={seg.color} strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${seg.dashArray} ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.dashOffset}
              rotation={-90} origin={`${CENTER}, ${CENTER}`}
              strokeLinecap="butt" />
          ))}
        </Svg>
      </View>

      <View style={styles.legend}>
        {members.map((member, i) => (
          <View key={member.userId} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }]} />
            <Text variant="caption" numberOfLines={1} style={styles.legendName}>{member.name}</Text>
            <Text variant="caption" style={styles.legendPct}>{Math.round(member.tasksShare * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: ColorsV2.surfaceContainer,
    borderRadius: RadiusV2.md,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  donutContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  legend: {
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: ColorsV2.onSurface,
  },
  legendPct: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: ColorsV2.onSurface,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
  },
});
```

- [ ] **Step 2: Replace MentalLoadCardV2.tsx**

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';

function getLoadLevel(score: number): string {
  if (score >= 65) return 'Elevee';
  if (score >= 35) return 'Moyenne';
  return 'Faible';
}

export function MentalLoadCardV2() {
  const { data: currentTlx } = useCurrentTlx();
  const { members } = useWeeklyBalance();

  const score = currentTlx?.score ?? 0;
  const levelLabel = getLoadLevel(score);

  const focusMember = useMemo(() => {
    if (members.length === 0) return null;
    return members.reduce((prev, curr) =>
      Math.abs(curr.tasksDelta) > Math.abs(prev.tasksDelta) ? curr : prev
    );
  }, [members]);

  return (
    <View style={styles.card}>
      <Text variant="overline" style={styles.title}>Charge mentale</Text>

      <Text variant="display" weight="extrabold" style={styles.levelText}>
        {score === 0 ? '—' : levelLabel}
      </Text>

      {focusMember && (
        <Text variant="bodySmall" style={styles.subtitle} numberOfLines={2}>
          Focus sur {focusMember.name} cette semaine
        </Text>
      )}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(score, 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    marginTop: 8,
  },
  title: {
    textAlign: 'center',
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  levelText: {
    fontSize: Typography.fontSize['2xl'],
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: ColorsV2.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: ColorsV2.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    backgroundColor: ColorsV2.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ColorsV2.primary,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/TaskEquityCard.tsx apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx
git commit -m "feat(mobile): restyle TaskEquityCard and MentalLoadCardV2 to Editorial Kawaii V2"
```

---

### Task 12: Update Mobile UpcomingTasksCard

**Files:**
- Modify: `apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx`

- [ ] **Step 1: Replace UpcomingTasksCard.tsx**

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing, Typography } from '../../constants/tokens';
import { useTasks, useUpdateTaskStatus } from '../../lib/queries/tasks';
import type { Task } from '../../types';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

interface CategoryConfig {
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  cuisine: { icon: 'restaurant-outline' },
  menage: { icon: 'sparkles-outline' },
  courses: { icon: 'cart-outline' },
  linge: { icon: 'shirt-outline' },
  enfants: { icon: 'people-outline' },
};

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_CONFIG[category.toLowerCase()]?.icon ?? 'checkbox-outline';
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = dayjs(dueDate);
  if (d.isToday()) return "Aujourd'hui";
  if (d.isTomorrow()) return 'Demain';
  return d.format('ddd D MMM');
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const icon = getCategoryIcon(task.category);
  const assigneeName = task.assigned_profile?.full_name ?? null;
  const dateLabel = formatDueDate(task.due_date);

  return (
    <View style={styles.taskRow}>
      <View style={styles.categoryIcon}>
        <Ionicons name={icon} size={18} color={ColorsV2.onSurfaceVariant} />
      </View>
      <View style={styles.taskInfo}>
        <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.taskTitle}>
          {task.title}
        </Text>
        <Text variant="caption" style={styles.taskMeta} numberOfLines={1}>
          {[dateLabel, assigneeName].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onComplete(task.id)}
        style={styles.checkbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.checkboxCircle} />
      </TouchableOpacity>
    </View>
  );
}

export function UpcomingTasksCard() {
  const router = useRouter();
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
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="overline" style={styles.overline}>A venir</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/tasks')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="bodySmall" weight="bold" style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {upcomingTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text variant="bodySmall" style={styles.emptyText}>Aucune tache a venir</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {upcomingTasks.map((task, index) => (
            <React.Fragment key={task.id}>
              <TaskRow task={task} onComplete={handleComplete} />
              {index < upcomingTasks.length - 1 && <View style={styles.spacer} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.onSurfaceVariant,
  },
  seeAll: {
    color: ColorsV2.primary,
  },
  card: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    marginLeft: 8,
    marginRight: -10,
  },
  emptyCard: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.md,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: ColorsV2.onSurfaceVariant,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: ColorsV2.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: ColorsV2.onSurface,
    fontSize: Typography.fontSize.sm,
  },
  taskMeta: {
    color: ColorsV2.onSurfaceVariant,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ColorsV2.outlineVariant,
  },
  spacer: {
    height: 14,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx
git commit -m "feat(mobile): restyle UpcomingTasksCard to Editorial Kawaii V2"
```

---

### Task 13: Create Mobile HomeHeartCard & Update Dashboard Screen

**Files:**
- Create: `apps/mobile/src/components/dashboard/HomeHeartCard.tsx`
- Modify: `apps/mobile/app/(app)/dashboard/index.tsx`

- [ ] **Step 1: Create HomeHeartCard.tsx**

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing } from '../../constants/tokens';

export function HomeHeartCard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" style={styles.question}>
        Que voulez-vous faire ?
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(app)/tasks/create')}
          activeOpacity={0.8}
        >
          <Text variant="bodySmall" weight="semibold" style={styles.primaryButtonText}>
            Ajouter une tache
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(app)/dashboard/tlx')}
          activeOpacity={0.8}
        >
          <Text variant="bodySmall" weight="semibold" style={styles.secondaryButtonText}>
            Remplir le TLX
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ColorsV2.tertiaryContainer,
    borderRadius: RadiusV2.md,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    marginLeft: 40,
  },
  question: {
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: ColorsV2.primary,
    borderRadius: RadiusV2.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  primaryButtonText: {
    color: ColorsV2.onPrimary,
  },
  secondaryButton: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.xl,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    color: ColorsV2.onSurface,
  },
});
```

- [ ] **Step 2: Update dashboard index.tsx**

Replace the imports and main content. Key changes:
- Import `ColorsV2` from tokensV2 for the background and refresh control color
- Import `HomeHeartCard`
- Add HomeHeartCard as the 5th section after UpcomingTasksCard
- Change background to `ColorsV2.surface`
- Update header to use V2 overline style
- Update refresh control color to `ColorsV2.primary`

Replace the full file:

```typescript
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
import { Spacing, Typography } from '../../../src/constants/tokens';
import { ColorsV2 } from '../../../src/constants/tokensV2';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { InsightsCarousel } from '../../../src/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '../../../src/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '../../../src/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '../../../src/components/dashboard/UpcomingTasksCard';
import { HomeHeartCard } from '../../../src/components/dashboard/HomeHeartCard';

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
  const { data: insights = [] } = useCoachingInsights();

  const fadeAnims = useStaggeredFadeIn(7); // header + 6 sections

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
            tintColor={ColorsV2.primary}
            colors={[ColorsV2.primary]}
          />
        }
      >
        {/* ── HEADER ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={styles.greetingColumn}>
            <Text variant="overline" style={styles.greetingOverline}>
              Bonjour
            </Text>
            <Text variant="h1" weight="bold" style={styles.greetingName}>
              {firstName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={ColorsV2.onSurfaceVariant} />
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. INSIGHTS CAROUSEL ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.carouselSection}>
          <InsightsCarousel insights={insights} />
        </FadeSection>

        {/* ── 2. SCORE DU FOYER ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 3. GRID: TASK EQUITY + MENTAL LOAD ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.gridRow}>
          <TaskEquityCard />
          <View style={styles.gridSpacer} />
          <MentalLoadCardV2 />
        </FadeSection>

        {/* ── 4. UPCOMING TASKS ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.section}>
          <UpcomingTasksCard />
        </FadeSection>

        {/* ── 5. HOME HEART ── */}
        <FadeSection anim={fadeAnims[5]} style={styles.section}>
          <HomeHeartCard />
        </FadeSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ColorsV2.surface,
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
    paddingBottom: Spacing['2xl'],
  },
  greetingColumn: {},
  greetingOverline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.secondary,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: Typography.fontSize['3xl'],
    color: ColorsV2.onSurface,
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ColorsV2.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselSection: {
    marginBottom: Spacing['2xl'],
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  gridSpacer: {
    width: Spacing.md,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/dashboard/HomeHeartCard.tsx apps/mobile/app/\(app\)/dashboard/index.tsx
git commit -m "feat(mobile): add HomeHeartCard and update dashboard layout to Editorial Kawaii V2"
```
