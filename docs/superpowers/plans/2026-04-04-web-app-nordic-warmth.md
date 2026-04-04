# Keurzen Web App — Nordic Warmth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium web app (Next.js 15) for Keurzen inside a Turborepo monorepo, sharing business logic with the existing Expo mobile app via shared packages.

**Architecture:** Turborepo monorepo with `apps/mobile` (existing Expo), `apps/web` (new Next.js 15), and `packages/shared`, `packages/queries`, `packages/stores`. The web app uses Tailwind CSS 4 with the Nordic Warmth design tokens, Instrument Sans + Inter fonts, and a sidebar navigation pattern.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS 4, Zustand 5, TanStack Query v5, Supabase SSR (`@supabase/ssr`), Lucide React, Framer Motion, TypeScript strict.

**Design spec:** `docs/superpowers/specs/2026-04-04-web-app-nordic-warmth-design.md`

---

## Phase 1: Monorepo Setup & Shared Packages

### Task 1: Initialize Turborepo root

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore` (root)

- [ ] **Step 1: Initialize the monorepo root**

Create root `package.json` with npm workspaces:

```json
{
  "name": "keurzen-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true
  }
}
```

- [ ] **Step 4: Install turbo and verify**

```bash
npm install
npx turbo --version
```

Expected: Turbo version 2.x prints successfully.

- [ ] **Step 5: Commit**

```bash
git add package.json turbo.json tsconfig.base.json
git commit -m "chore: initialize Turborepo monorepo root"
```

---

### Task 2: Move existing mobile app to apps/mobile

**Files:**
- Move: entire current project → `apps/mobile/`

- [ ] **Step 1: Create apps directory and move mobile code**

Move all existing mobile app files (except monorepo root config) into `apps/mobile/`. This includes `app/`, `src/`, `supabase/`, `assets/`, `app.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, and `package.json`.

```bash
mkdir -p apps/mobile
# Move all mobile-specific files and directories
mv app apps/mobile/
mv src apps/mobile/
mv supabase apps/mobile/
mv assets apps/mobile/
mv app.json apps/mobile/
mv babel.config.js apps/mobile/
mv metro.config.js apps/mobile/
mv tsconfig.json apps/mobile/
mv package-lock.json apps/mobile/
# Move the existing package.json as apps/mobile/package.json
mv package.json apps/mobile/package.json
```

Note: keep `docs/`, `.claude/`, `CLAUDE.md`, `ROADMAP.md`, `DESIGN_SYSTEM.md` at root.

- [ ] **Step 2: Update apps/mobile/package.json name**

Change the `"name"` field to `"keurzen-mobile"`.

- [ ] **Step 3: Verify mobile app still works**

```bash
cd apps/mobile && npm install && npx expo start --web
```

Expected: Expo dev server starts without errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: move mobile app to apps/mobile"
```

---

### Task 3: Create packages/shared (types, constants, utils)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/tokens.ts`
- Create: `packages/shared/src/utils/index.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@keurzen/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "dayjs": "^1.11.13",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Copy types from mobile**

Copy `apps/mobile/src/types/index.ts` → `packages/shared/src/types/index.ts`.

This file is already platform-agnostic — it only defines TypeScript interfaces with no RN imports.

- [ ] **Step 4: Create shared tokens**

Create `packages/shared/src/constants/tokens.ts` with platform-agnostic values:

```ts
/**
 * Keurzen Design Tokens — Platform agnostic
 * Web and Mobile each consume these raw values through their own theming system.
 */

export const colors = {
  // ─── Brand (Web: Nordic Warmth / Mobile: Cafe Cosy) ───
  terracotta: { mobile: '#C4846C', web: '#C07A62' },
  sauge: { mobile: '#8BA888', web: '#82A47E' },
  miel: { mobile: '#D4A959', web: '#CFA24F' },
  rose: { mobile: '#D4807A', web: '#CF7B74' },
  prune: { mobile: '#9B8AA8', web: '#9585A3' },

  // ─── Text ───
  textPrimary: { mobile: '#3D2C22', web: '#2D1F17' },
  textSecondary: { mobile: '#7A6B5D', web: '#6B5D50' },
  textMuted: { mobile: '#A89888', web: '#9E8F80' },
  textInverse: '#FFFDF9',

  // ─── Background ───
  background: { mobile: '#FAF6F1', web: '#FDFBF8' },
  backgroundCard: { mobile: '#FFFDF9', web: '#FFFFFF' },

  // ─── Border ───
  border: { mobile: '#E8DFD5', web: '#EBE5DD' },
  borderLight: { mobile: '#F0EAE2', web: '#F3EDE6' },

  // ─── Feedback ───
  success: { mobile: '#8BA888', web: '#82A47E' },
  warning: { mobile: '#D4A959', web: '#CFA24F' },
  error: { mobile: '#D4807A', web: '#CF7B74' },

  // ─── Member colors (shared) ───
  memberColors: [
    '#D4807A', '#8BA888', '#7EB3C4', '#9B8AA8',
    '#D4A959', '#C4846C', '#C48BA0', '#6BA08F',
  ],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
```

- [ ] **Step 5: Create shared utils**

Create `packages/shared/src/utils/index.ts`:

```ts
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

export function formatDate(date: string, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

export function getCurrentWeekStart(): string {
  return dayjs().startOf('isoWeek').format('YYYY-MM-DD');
}

export function getPreviousWeekStart(): string {
  return dayjs().startOf('isoWeek').subtract(1, 'week').format('YYYY-MM-DD');
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export function mapPriority(p: string): 'high' | 'medium' | 'low' {
  if (p === 'high' || p === 'urgent') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
}

export function tlxColor(score: number, platform: 'mobile' | 'web' = 'web'): string {
  const { colors: c } = require('./index');
  const sauge = typeof c.sauge === 'string' ? c.sauge : c.sauge[platform];
  const prune = typeof c.prune === 'string' ? c.prune : c.prune[platform];
  const rose = typeof c.rose === 'string' ? c.rose : c.rose[platform];
  if (score <= 33) return sauge;
  if (score <= 66) return prune;
  return rose;
}

export function computeTlxScore(values: {
  mental_demand: number;
  physical_demand: number;
  temporal_demand: number;
  performance: number;
  effort: number;
  frustration: number;
}): number {
  const invertedPerformance = 100 - values.performance;
  const sum =
    values.mental_demand +
    values.physical_demand +
    values.temporal_demand +
    invertedPerformance +
    values.effort +
    values.frustration;
  return Math.round(sum / 6);
}
```

- [ ] **Step 6: Create barrel export**

Create `packages/shared/src/index.ts`:

```ts
export * from './types/index';
export * from './constants/tokens';
export * from './utils/index';
```

- [ ] **Step 7: Run typecheck**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat: create @keurzen/shared package (types, tokens, utils)"
```

---

### Task 4: Create packages/stores

**Files:**
- Create: `packages/stores/package.json`
- Create: `packages/stores/tsconfig.json`
- Create: `packages/stores/src/auth.store.ts`
- Create: `packages/stores/src/household.store.ts`
- Create: `packages/stores/src/ui.store.ts`
- Create: `packages/stores/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@keurzen/stores",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@keurzen/shared": "*",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@supabase/supabase-js": "^2.101.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create auth.store.ts**

Copy from `apps/mobile/src/stores/auth.store.ts` — this store has no RN-specific imports, it works as-is. Update the type import path:

```ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@keurzen/shared';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setProfile: (profile) =>
    set({ profile }),
  setLoading: (isLoading) =>
    set({ isLoading }),
  setInitialized: (isInitialized) =>
    set({ isInitialized }),
  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
    }),
}));
```

- [ ] **Step 3: Create household.store.ts**

```ts
import { create } from 'zustand';
import type { Household, HouseholdMember } from '@keurzen/shared';

interface HouseholdState {
  currentHousehold: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;

  setHousehold: (household: Household | null) => void;
  setMembers: (members: HouseholdMember[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  currentHousehold: null,
  members: [],
  isLoading: false,

  setHousehold: (currentHousehold) => set({ currentHousehold }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ currentHousehold: null, members: [], isLoading: false }),
}));
```

- [ ] **Step 4: Create ui.store.ts (web-only, no Platform import)**

The mobile ui.store.ts imports `Platform` from `react-native`. The shared version is minimal — each app extends it:

```ts
import { create } from 'zustand';

interface UiState {
  activeToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeToast: null,
  showToast: (message, type = 'info') =>
    set({ activeToast: { message, type } }),
  hideToast: () => set({ activeToast: null }),
}));
```

- [ ] **Step 5: Create barrel export**

```ts
export { useAuthStore } from './auth.store';
export { useHouseholdStore } from './household.store';
export { useUiStore } from './ui.store';
```

- [ ] **Step 6: Typecheck**

```bash
cd packages/stores && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/stores
git commit -m "feat: create @keurzen/stores package (auth, household, ui)"
```

---

### Task 5: Create packages/queries (services + hooks)

**Files:**
- Create: `packages/queries/package.json`
- Create: `packages/queries/tsconfig.json`
- Create: `packages/queries/src/services/auth.service.ts`
- Create: `packages/queries/src/services/task.service.ts`
- Create: `packages/queries/src/services/household.service.ts`
- Create: `packages/queries/src/services/list.service.ts`
- Create: `packages/queries/src/hooks/useTasks.ts`
- Create: `packages/queries/src/hooks/useHousehold.ts`
- Create: `packages/queries/src/hooks/useLists.ts`
- Create: `packages/queries/src/hooks/useTlx.ts`
- Create: `packages/queries/src/hooks/useWeeklyStats.ts`
- Create: `packages/queries/src/hooks/useNotifications.ts`
- Create: `packages/queries/src/hooks/useReports.ts`
- Create: `packages/queries/src/client.ts`
- Create: `packages/queries/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@keurzen/queries",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@keurzen/shared": "*",
    "@keurzen/stores": "*",
    "@supabase/supabase-js": "^2.101.0",
    "@tanstack/react-query": "^5.95.0",
    "dayjs": "^1.11.13"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  },
  "peerDependencies": {
    "react": ">=18"
  }
}
```

- [ ] **Step 2: Create client.ts (injectable Supabase client)**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function setSupabaseClient(client: SupabaseClient): void {
  _client = client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) throw new Error('@keurzen/queries: Supabase client not initialized. Call setSupabaseClient() first.');
  return _client;
}
```

This allows each app (mobile/web) to inject its own Supabase client with its own auth strategy.

- [ ] **Step 3: Create services**

Create `packages/queries/src/services/auth.service.ts`:

```ts
import { getSupabaseClient } from '../client';
import type { Profile } from '@keurzen/shared';

export async function sendOtpForLogin(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { data: isRegistered } = await supabase.rpc('check_email_registered', { p_email: email });
  if (!isRegistered) return { error: 'Aucun compte trouve avec cette adresse. Creez un compte.' };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) return { error: error.message };
  return { error: null };
}

export async function sendOtp(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { error: error.message };
  return { error: null };
}

export async function verifyOtp(email: string, token: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('expired') || msg.includes('invalid')) {
      return { error: 'Code invalide ou expire. Demandez un nouveau code.' };
    }
    return { error: error.message };
  }
  return { error: null };
}

export async function signUp(email: string, fullName: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { full_name: fullName } },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { error: error.message };
  return { error: null };
}
```

Create `packages/queries/src/services/task.service.ts`, `household.service.ts`, `list.service.ts` following the same pattern — extract the raw Supabase calls from the existing mobile query files, replacing `import { supabase }` with `getSupabaseClient()`. Each service function takes explicit parameters instead of reading from stores.

- [ ] **Step 4: Create query hooks**

Port the existing hooks from `apps/mobile/src/lib/queries/*.ts`. The hooks import from `@keurzen/stores` instead of relative paths, and call service functions that use `getSupabaseClient()` internally.

Example for `packages/queries/src/hooks/useTasks.ts` — same logic as `apps/mobile/src/lib/queries/tasks.ts` but with updated imports:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../client';
import { useHouseholdStore, useAuthStore } from '@keurzen/stores';
import type { Task, TaskFormValues, TaskStatus } from '@keurzen/shared';
import dayjs from 'dayjs';

export const taskKeys = {
  all: ['tasks'] as const,
  byHousehold: (householdId: string) => ['tasks', householdId] as const,
  byId: (id: string) => ['tasks', 'detail', id] as const,
};

// ... (same implementation as mobile, using getSupabaseClient() instead of imported supabase)
```

Apply the same pattern for all hooks: `useHousehold.ts`, `useLists.ts`, `useTlx.ts`, `useWeeklyStats.ts`, `useNotifications.ts`, `useReports.ts`.

- [ ] **Step 5: Create barrel export**

```ts
export { setSupabaseClient, getSupabaseClient } from './client';
export * from './services/auth.service';
export * from './hooks/useTasks';
export * from './hooks/useHousehold';
export * from './hooks/useLists';
export * from './hooks/useTlx';
export * from './hooks/useWeeklyStats';
export * from './hooks/useNotifications';
export * from './hooks/useReports';
```

- [ ] **Step 6: Typecheck**

```bash
cd packages/queries && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/queries
git commit -m "feat: create @keurzen/queries package (services + hooks)"
```

---

### Task 6: Update mobile app to import from shared packages

**Files:**
- Modify: `apps/mobile/package.json` — add workspace dependencies
- Modify: `apps/mobile/src/lib/queries/tasks.ts` — re-export from `@keurzen/queries`
- Modify: `apps/mobile/src/stores/auth.store.ts` — re-export from `@keurzen/stores`

- [ ] **Step 1: Add workspace deps to mobile package.json**

Add to `dependencies`:

```json
"@keurzen/shared": "*",
"@keurzen/stores": "*",
"@keurzen/queries": "*"
```

- [ ] **Step 2: Update mobile to re-export or import from shared packages**

For a smooth migration, make each mobile file re-export from the shared package. Example for `apps/mobile/src/stores/auth.store.ts`:

```ts
// Re-export shared store — mobile uses the same implementation
export { useAuthStore } from '@keurzen/stores';
```

Do the same for `household.store.ts`. The `ui.store.ts` stays mobile-specific (it uses `Platform` from `react-native`).

For query hooks, the mobile versions may have some mobile-specific logic (like importing `Colors` from mobile tokens). For V1, keep the mobile files as they are and only verify the shared packages compile. Migration of mobile imports is a separate task post-V1.

- [ ] **Step 3: Run mobile app to verify no regressions**

```bash
cd apps/mobile && npx expo start --web
```

Expected: App starts, no import errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "chore: wire mobile app to shared packages"
```

---

## Phase 2: Next.js Web App Scaffold

### Task 7: Initialize Next.js app

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "keurzen-web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@keurzen/shared": "*",
    "@keurzen/stores": "*",
    "@keurzen/queries": "*",
    "@supabase/ssr": "^0.6.0",
    "@supabase/supabase-js": "^2.101.0",
    "@tanstack/react-query": "^5.95.0",
    "lucide-react": "^0.510.0",
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.72.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.12",
    "dayjs": "^1.11.13"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create tailwind.config.ts with Nordic Warmth tokens**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terracotta: '#C07A62',
        sauge: '#82A47E',
        miel: '#CFA24F',
        rose: '#CF7B74',
        prune: '#9585A3',
        background: '#FDFBF8',
        'background-card': '#FFFFFF',
        'text-primary': '#2D1F17',
        'text-secondary': '#6B5D50',
        'text-muted': '#9E8F80',
        border: '#EBE5DD',
        'border-light': '#F3EDE6',
      },
      fontFamily: {
        heading: ['var(--font-instrument-sans)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(45, 31, 23, 0.04)',
        md: '0 2px 8px rgba(45, 31, 23, 0.05)',
        lg: '0 4px 16px rgba(45, 31, 23, 0.07)',
        card: '0 1px 4px rgba(45, 31, 23, 0.04), 0 0 0 1px rgba(45, 31, 23, 0.03)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Create globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #FDFBF8;
  color: #2D1F17;
  font-family: var(--font-inter), sans-serif;
}

/* Focus ring */
*:focus-visible {
  outline: 2px solid #C07A62;
  outline-offset: 2px;
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, box-shadow, transform, opacity;
  transition-duration: 150ms;
  transition-timing-function: ease;
}
```

- [ ] **Step 4: Create root layout with fonts**

Create `apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Instrument_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Keurzen',
  description: 'Gestion de foyer premium — equite, visibilite, charge mentale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${instrumentSans.variable} ${inter.variable}`}>
      <body className="bg-background text-text-primary font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create providers.tsx (TanStack Query + Supabase init)**

Create `apps/web/src/app/providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { setSupabaseClient } from '@keurzen/queries';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase client for the web
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
setSupabaseClient(supabase);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Create a placeholder home page**

Create `apps/web/src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="font-heading text-4xl font-bold text-text-primary">
        Keurzen
      </h1>
    </div>
  );
}
```

- [ ] **Step 7: Install and verify**

```bash
cd apps/web && npm install && npm run dev
```

Expected: Next.js dev server starts on port 3000. Page shows "Keurzen" in Instrument Sans.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold Next.js web app with Nordic Warmth tokens"
```

---

### Task 8: Supabase auth for web (SSR + middleware)

**Files:**
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/middleware.ts`
- Create: `apps/web/src/middleware.ts`

- [ ] **Step 1: Create server-side Supabase client**

Create `apps/web/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

- [ ] **Step 2: Create browser Supabase client**

Create `apps/web/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create middleware helper**

Create `apps/web/src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = request.nextUrl.pathname === '/';

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create Next.js middleware**

Create `apps/web/src/middleware.ts`:

```ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/supabase apps/web/src/middleware.ts
git commit -m "feat: add Supabase SSR auth with middleware"
```

---

## Phase 3: Web UI Components

### Task 9: Core UI components

**Files:**
- Create: `apps/web/src/components/ui/Button.tsx`
- Create: `apps/web/src/components/ui/Input.tsx`
- Create: `apps/web/src/components/ui/Card.tsx`
- Create: `apps/web/src/components/ui/Badge.tsx`
- Create: `apps/web/src/components/ui/Avatar.tsx`
- Create: `apps/web/src/components/ui/Modal.tsx`
- Create: `apps/web/src/components/ui/EmptyState.tsx`
- Create: `apps/web/src/components/ui/Toast.tsx`
- Create: `apps/web/src/components/ui/StatCard.tsx`
- Create: `apps/web/src/components/ui/ProgressBar.tsx`

- [ ] **Step 1: Create Button component**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-terracotta text-white hover:bg-terracotta/90 active:scale-[0.98]',
  secondary: 'bg-background border border-border text-text-primary hover:bg-border-light',
  ghost: 'text-text-secondary hover:bg-border-light',
  danger: 'bg-rose text-white hover:bg-rose/90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-sm',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-45 pointer-events-none',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  ),
);
Button.displayName = 'Button';
```

- [ ] **Step 2: Create cn utility**

Create `apps/web/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Add `clsx` and `tailwind-merge` to `apps/web/package.json` dependencies.

- [ ] **Step 3: Create remaining UI components**

Create each component following the same pattern — Tailwind classes matching the Nordic Warmth tokens, proper typing, `cn()` for className merging. Each component is a focused file under `apps/web/src/components/ui/`.

Input: label, error state, left icon (Lucide), focus ring terracotta.
Card: shadow-card, hover translateY(-1px), rounded-lg.
Badge: colored dot + text, variants for priority/status.
Avatar: image with fallback initials, rounded-full.
Modal: dialog overlay with backdrop, centered card.
EmptyState: icon + title + subtitle + optional CTA button.
Toast: fixed bottom-right, auto-dismiss, success/error/info variants.
StatCard: icon + value + label, vertical layout.
ProgressBar: horizontal bar with percentage fill.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui apps/web/src/lib/utils.ts
git commit -m "feat: add core web UI components (Nordic Warmth)"
```

---

### Task 10: Sidebar navigation

**Files:**
- Create: `apps/web/src/components/layout/Sidebar.tsx`
- Create: `apps/web/src/components/layout/SidebarItem.tsx`
- Create: `apps/web/src/components/layout/BottomNav.tsx`
- Create: `apps/web/src/components/layout/PageHeader.tsx`
- Create: `apps/web/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create SidebarItem**

```tsx
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
}

export function SidebarItem({ href, icon: Icon, label, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-terracotta/12 text-terracotta'
          : 'text-text-secondary hover:bg-terracotta/8 hover:text-text-primary',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
```

- [ ] **Step 2: Create Sidebar**

```tsx
'use client';

import { useState } from 'react';
import { Home, CheckCircle, Calendar, List, Users, Mail, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@keurzen/stores';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/tasks', icon: CheckCircle, label: 'Taches' },
  { href: '/calendar', icon: Calendar, label: 'Agenda' },
  { href: '/lists', icon: List, label: 'Listes' },
];

const HOUSEHOLD_ITEMS = [
  { href: '/settings/household', icon: Users, label: 'Mon foyer' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuthStore();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-background transition-all duration-250',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-2.5 w-2.5 rounded-full bg-terracotta" />
        {!collapsed && <span className="font-heading text-sm font-semibold tracking-wider">Keurzen</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-sm p-1 text-text-muted hover:text-text-primary"
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}

        <div className="my-3 h-px bg-border-light" />

        {HOUSEHOLD_ITEMS.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-border-light px-2 py-3">
        <SidebarItem href="/settings" icon={Settings} label="Reglages" collapsed={collapsed} />
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-rose transition-colors hover:bg-rose/8',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {!collapsed && <span>Se deconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create PageHeader**

```tsx
import { Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative rounded-sm p-2 text-text-primary hover:bg-border-light">
          <Bell size={20} />
        </button>
        <Avatar size={36} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AppShell (sidebar + content area)**

```tsx
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1080px] px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create BottomNav for mobile breakpoint**

A simpler bottom navigation bar shown only on `< 768px` screens, hidden otherwise. Uses the same nav items as the sidebar.

- [ ] **Step 6: Wire AppShell into the authenticated layout**

Create `apps/web/src/app/(app)/layout.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/layout apps/web/src/app/\(app\)
git commit -m "feat: add sidebar navigation and AppShell layout"
```

---

## Phase 4: V1 Pages

### Task 11: Auth pages (login, signup, verify OTP)

**Files:**
- Create: `apps/web/src/app/auth/login/page.tsx`
- Create: `apps/web/src/app/auth/signup/page.tsx`
- Create: `apps/web/src/app/auth/verify/page.tsx`
- Create: `apps/web/src/app/auth/layout.tsx`

- [ ] **Step 1: Create auth layout**

Centered card layout (max-width 440px), no sidebar. Keurzen branding at top.

- [ ] **Step 2: Create login page**

Email input + "Envoyer le code" button. Calls `sendOtpForLogin` from `@keurzen/queries`. On success, redirect to `/auth/verify?email=...`.

- [ ] **Step 3: Create signup page**

Full name + email inputs. Calls `signUp` from `@keurzen/queries`. Redirects to verify.

- [ ] **Step 4: Create verify OTP page**

6-digit OTP input. Calls `verifyOtp`. On success, hydrate auth store and redirect to `/dashboard`.

- [ ] **Step 5: Verify login flow end-to-end**

Open http://localhost:3000/auth/login, submit email, receive OTP, verify, arrive at dashboard.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/auth
git commit -m "feat: add auth pages (login, signup, verify OTP)"
```

---

### Task 12: Dashboard page

**Files:**
- Create: `apps/web/src/app/(app)/dashboard/page.tsx`
- Create: `apps/web/src/components/dashboard/StatsRow.tsx`
- Create: `apps/web/src/components/dashboard/BalanceCard.tsx`
- Create: `apps/web/src/components/dashboard/TlxCard.tsx`
- Create: `apps/web/src/components/dashboard/TodayTasks.tsx`
- Create: `apps/web/src/components/dashboard/RecentlyDone.tsx`
- Create: `apps/web/src/components/dashboard/WeeklyReport.tsx`

- [ ] **Step 1: Create dashboard page**

Uses `PageHeader` with greeting + name. Renders StatsRow (3 cards), then a 2-column grid with BalanceCard + TlxCard, then TodayTasks + RecentlyDone, then WeeklyReport full-width.

All data from `@keurzen/queries` hooks: `useTasks`, `useOverdueTasks`, `useTodayTasks`, `useWeeklyBalance`, `useCurrentTlx`, `useTlxDelta`, `useUnreadCount`, `useWeeklyReport`.

- [ ] **Step 2: Create StatsRow**

3-column grid of StatCard components. Responsive: 3 → 2 → 1 columns.

- [ ] **Step 3: Create BalanceCard**

Member bars with color dots, percentage, progress bar. Uses `useWeeklyBalance()`.

- [ ] **Step 4: Create TlxCard**

TLX score circle + delta text. Links to TLX page (V2).

- [ ] **Step 5: Create TodayTasks and RecentlyDone**

List components with priority dots, member names, dates.

- [ ] **Step 6: Create WeeklyReport**

Renders the AI weekly report summary, attention points, insights.

- [ ] **Step 7: Verify dashboard renders with data**

Log in, verify dashboard shows stats, tasks, balance. Test empty states.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard apps/web/src/components/dashboard
git commit -m "feat: add dashboard page with stats, balance, TLX, tasks"
```

---

### Task 13: Tasks page (list + split view + create)

**Files:**
- Create: `apps/web/src/app/(app)/tasks/page.tsx`
- Create: `apps/web/src/components/tasks/TaskList.tsx`
- Create: `apps/web/src/components/tasks/TaskRow.tsx`
- Create: `apps/web/src/components/tasks/TaskDetail.tsx`
- Create: `apps/web/src/components/tasks/TaskFilters.tsx`
- Create: `apps/web/src/components/tasks/CreateTaskModal.tsx`
- Create: `apps/web/src/components/tasks/SplitView.tsx`

- [ ] **Step 1: Create tasks page with SplitView layout**

PageHeader with "+ Creer" button. Tabs: Toutes | Aujourd'hui | En retard | Faites. Search bar + filters. SplitView: list left, detail panel right (>= 1024px) or modal (< 1024px).

- [ ] **Step 2: Create TaskList and TaskRow**

TaskRow shows: checkbox, title, assignee avatar, due date, priority dot. Click opens detail in split panel.

- [ ] **Step 3: Create TaskDetail (inline editable)**

Title, description, assignee (dropdown), due date (date picker), priority (select), recurrence, category, zone. All editable inline using `useUpdateTask()`.

- [ ] **Step 4: Create TaskFilters**

Search input + dropdowns: priority, category, assignee. Filter the task list client-side.

- [ ] **Step 5: Create CreateTaskModal**

Modal with form: title, description, assignee, due date, priority, category, zone, recurrence. Uses `useCreateTask()`.

- [ ] **Step 6: Test full CRUD flow**

Create task → appears in list → click to see detail → edit inline → mark as done → appears in "Faites" tab → delete.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(app\)/tasks apps/web/src/components/tasks
git commit -m "feat: add tasks page with split view, CRUD, filters"
```

---

### Task 14: Calendar page

**Files:**
- Create: `apps/web/src/app/(app)/calendar/page.tsx`
- Create: `apps/web/src/components/calendar/CalendarGrid.tsx`
- Create: `apps/web/src/components/calendar/CalendarDay.tsx`
- Create: `apps/web/src/components/calendar/DayTaskList.tsx`

- [ ] **Step 1: Create calendar page**

PageHeader with month navigation (← Avril 2026 →) and Semaine/Mois toggle. Default: month view.

- [ ] **Step 2: Create CalendarGrid**

7-column CSS grid. Each cell is a CalendarDay showing the date number and colored dots for tasks (color = assigned member color).

- [ ] **Step 3: Create DayTaskList**

Shown below the grid when a day is clicked. Lists tasks for that day with priority, assignee, status.

- [ ] **Step 4: Verify calendar renders with task data**

Create tasks with due dates, verify dots appear on correct days, click to see task list.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(app\)/calendar apps/web/src/components/calendar
git commit -m "feat: add calendar page with month grid and day task list"
```

---

### Task 15: Lists page

**Files:**
- Create: `apps/web/src/app/(app)/lists/page.tsx`
- Create: `apps/web/src/app/(app)/lists/[id]/page.tsx`
- Create: `apps/web/src/components/lists/ListCard.tsx`
- Create: `apps/web/src/components/lists/ListDetail.tsx`
- Create: `apps/web/src/components/lists/ListItemRow.tsx`
- Create: `apps/web/src/components/lists/CreateListModal.tsx`

- [ ] **Step 1: Create lists index page**

PageHeader with "+ Creer" button. Grid of ListCards (3 cols desktop, 2 tablet, 1 mobile). Each card shows emoji + title + item count.

- [ ] **Step 2: Create list detail page**

`/lists/[id]` — shows list title, items as checklist. Add item input at bottom. Toggle checked, delete items.

- [ ] **Step 3: Create CreateListModal**

Title + type (shopping/todo/custom) + optional emoji/color.

- [ ] **Step 4: Test CRUD flow**

Create list → see in grid → open → add items → check items → delete list.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(app\)/lists apps/web/src/components/lists
git commit -m "feat: add shared lists pages with CRUD"
```

---

### Task 16: Settings pages

**Files:**
- Create: `apps/web/src/app/(app)/settings/page.tsx`
- Create: `apps/web/src/app/(app)/settings/profile/page.tsx`
- Create: `apps/web/src/app/(app)/settings/household/page.tsx`
- Create: `apps/web/src/app/(app)/settings/invite/page.tsx`
- Create: `apps/web/src/app/(app)/settings/security/page.tsx`
- Create: `apps/web/src/app/(app)/settings/layout.tsx`

- [ ] **Step 1: Create settings layout**

Centered single-column layout, max-width 640px. Sub-navigation at top: Profil | Foyer | Invitations | Securite.

- [ ] **Step 2: Create profile page**

Avatar upload, full name edit, email (read-only). Uses `updateProfile` from `@keurzen/queries`.

- [ ] **Step 3: Create household page**

Household name, list of members with colors, "Quitter le foyer" button.

- [ ] **Step 4: Create invite page**

Email input + send button. List of pending invitations with revoke action.

- [ ] **Step 5: Create security page**

Password change form (if applicable to OTP-based auth — may be simplified to "Gerer la session").

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(app\)/settings
git commit -m "feat: add settings pages (profile, household, invitations, security)"
```

---

## Phase 5: Polish & Deploy

### Task 17: Responsive breakpoints

**Files:**
- Modify: `apps/web/src/components/layout/AppShell.tsx`
- Modify: `apps/web/src/components/layout/Sidebar.tsx`
- Modify: `apps/web/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Implement responsive sidebar behavior**

- `>= 1280px`: Sidebar expanded (240px)
- `1024-1279px`: Sidebar collapsed (64px, icons only)
- `768-1023px`: Sidebar hidden, hamburger opens drawer overlay
- `< 768px`: No sidebar, BottomNav visible

Use Tailwind responsive classes (`xl:`, `lg:`, `md:`) and a `useMediaQuery` hook or CSS-only approach.

- [ ] **Step 2: Test all breakpoints**

Resize browser through all breakpoints. Verify navigation adapts, content fills available space.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout
git commit -m "feat: implement responsive sidebar breakpoints"
```

---

### Task 18: Auth init hook for web

**Files:**
- Create: `apps/web/src/hooks/useAuthInit.ts`
- Modify: `apps/web/src/app/providers.tsx`

- [ ] **Step 1: Create web-specific useAuthInit**

Similar to mobile's `useAuthInit` but using `@supabase/ssr` browser client. Listens to `onAuthStateChange`, hydrates `useAuthStore`.

```ts
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@keurzen/stores';
import { fetchProfile } from '@keurzen/queries';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function useAuthInit() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);
}
```

- [ ] **Step 2: Wire into Providers**

Call `useAuthInit()` inside the `Providers` component.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks apps/web/src/app/providers.tsx
git commit -m "feat: add web auth init hook"
```

---

### Task 19: Empty states and loading states

**Files:**
- Modify: All page files in `apps/web/src/app/(app)/`

- [ ] **Step 1: Add loading states**

Each page shows a skeleton or spinner while data is loading. Use `isLoading` from TanStack Query hooks.

- [ ] **Step 2: Add empty states**

Each page shows an EmptyState component when data is empty:
- Dashboard: "Votre foyer vous attend" with CTA to create household
- Tasks: "Aucune tache" with CTA to create
- Calendar: "Rien de prevu ce mois"
- Lists: "Aucune liste" with CTA to create

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app
git commit -m "feat: add loading and empty states to all pages"
```

---

### Task 20: Vercel deployment config

**Files:**
- Create: `apps/web/vercel.json`
- Modify: `turbo.json` (add vercel remote cache if needed)
- Create: `apps/web/.env.example`

- [ ] **Step 1: Create vercel.json**

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "cd ../.. && npx turbo build --filter=keurzen-web"
}
```

- [ ] **Step 2: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd apps/web && npm run build
```

Expected: Next.js build completes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/vercel.json apps/web/.env.example
git commit -m "chore: add Vercel deployment config"
```

---

## Summary

| Phase | Tasks | Description |
|---|---|---|
| 1 | 1-6 | Monorepo setup, shared packages, mobile migration |
| 2 | 7-8 | Next.js scaffold, auth SSR |
| 3 | 9-10 | UI components, sidebar navigation |
| 4 | 11-16 | Auth pages, Dashboard, Tasks, Calendar, Lists, Settings |
| 5 | 17-20 | Responsive, auth init, empty states, deploy |

Total: 20 tasks, ~5 phases.
