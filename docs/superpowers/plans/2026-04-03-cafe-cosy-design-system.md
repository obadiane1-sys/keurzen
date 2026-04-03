# Cafe Cosy Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the entire Keurzen app from pastel-cold palette to warm "Cafe Cosy" design system (terracotta/sauge/creme).

**Architecture:** The migration is token-driven. Step 1 rewrites `tokens.ts` with new colors and semantic names. Step 2 updates `DESIGN_SYSTEM.md`. Step 3 updates core UI components. Step 4 updates the tab bar. Steps 5-9 update screens by module. All color references go through `Colors.*` tokens, so changing tokens.ts cascades to most code — the remaining work is replacing old token names (`Colors.mint`, `Colors.coral`, etc.) with new semantic names (`Colors.terracotta`, `Colors.sauge`, etc.) in each file.

**Tech Stack:** React Native, Expo, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-03-cafe-cosy-design-system.md`

---

### Task 1: Rewrite design tokens

**Files:**
- Modify: `src/constants/tokens.ts`

- [ ] **Step 1: Rewrite Colors object**

Replace the entire `Colors` object with the Cafe Cosy palette. Keep old names as deprecated aliases at the bottom so nothing breaks during migration.

```typescript
export const Colors = {
  // ─── Brand palette (Cafe Cosy) ───
  terracotta: '#C4846C',   // Accent principal — CTA, FAB, liens actifs
  sauge: '#8BA888',         // Accent secondaire — succes, validation
  miel: '#D4A959',          // Accent tertiaire — warnings, highlights
  rose: '#D4807A',          // Alerte douce — retard, erreurs
  prune: '#9B8AA8',         // Charge mentale — TLX

  // ─── Text ───
  textPrimary: '#3D2C22',   // Brun profond
  textSecondary: '#7A6B5D', // Brun moyen
  textMuted: '#A89888',     // Brun clair
  textInverse: '#FFFDF9',   // Blanc casse

  // ─── Background ───
  background: '#FAF6F1',       // Creme
  backgroundCard: '#FFFDF9',   // Blanc casse
  backgroundElevated: '#FFFDF9',

  // ─── Border ───
  border: '#E8DFD5',        // Sable
  borderLight: '#F0EAE2',   // Sable clair
  borderFocus: '#C4846C',   // Terracotta

  // ─── Feedback ───
  success: '#8BA888',   // Sauge
  warning: '#D4A959',   // Miel
  error: '#D4807A',     // Rose
  info: '#D4A959',      // Miel

  // ─── Member colors ───
  memberColors: [
    '#D4807A',
    '#8BA888',
    '#7EB3C4',
    '#9B8AA8',
    '#D4A959',
    '#C4846C',
    '#C48BA0',
    '#6BA08F',
  ],

  // ─── Gray scale (warm) ───
  gray50: '#FAF6F1',
  gray100: '#F0EAE2',
  gray200: '#E8DFD5',
  gray300: '#B8A99A',
  gray400: '#A89888',
  gray500: '#7A6B5D',
  gray600: '#5C4A3D',
  gray700: '#4A3B30',
  gray800: '#3D2C22',
  gray900: '#2A1D14',

  // ─── Badge text (strong contrast variants) ───
  blueStrong: '#C4846C',
  greenStrong: '#6B8F60',
  redStrong: '#B5584E',
  orangeStrong: '#C4846C',
  blueDeep: '#C4846C',
  redBgLight: '#D4807A1F',

  // ─── Transparent overlays ───
  overlay: 'rgba(61, 44, 34, 0.35)',
  overlayLight: 'rgba(61, 44, 34, 0.08)',

  // ─── Component-specific ───
  inputFocusedBg: '#FFFDF9',
  backgroundSubtle: '#F0EAE2',
  placeholder: '#B8A99A',

  // ─── DEPRECATED aliases (remove after full migration) ───
  mint: '#8BA888',       // → use sauge or terracotta
  coral: '#D4807A',      // → use rose
  blue: '#D4A959',       // → use miel
  lavender: '#9B8AA8',   // → use prune
  navy: '#3D2C22',       // → use textPrimary
} as const;
```

- [ ] **Step 2: Update BorderRadius**

```typescript
export const BorderRadius = {
  sm: 8,
  md: 12,
  input: 12,
  lg: 16,
  card: 16,
  xl: 16,
  button: 12,
  '2xl': 24,
  fab: 16,
  full: 9999,
} as const;
```

- [ ] **Step 3: Update Shadows to warm brown**

```typescript
export const Shadows = {
  sm: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;
```

- [ ] **Step 4: Update Typography fontSize for Display**

Change `'4xl': 32` (already correct) and add display size if needed. Verify `'5xl': 40` stays.

- [ ] **Step 5: Verify file compiles**

Run: `npx tsc --noEmit src/constants/tokens.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/constants/tokens.ts
git commit -m "feat: rewrite design tokens to Cafe Cosy palette"
```

---

### Task 2: Update DESIGN_SYSTEM.md

**Files:**
- Modify: `DESIGN_SYSTEM.md`

- [ ] **Step 1: Replace entire DESIGN_SYSTEM.md content**

Replace with updated palette, typography, spacing, components, and rules matching the spec at `docs/superpowers/specs/2026-04-03-cafe-cosy-design-system.md`. Key changes:

- All color hex values updated to Cafe Cosy
- Shadows use `#3D2C22`
- Cards: no border, warm shadow, `#FFFDF9` background
- Button primary: terracotta
- Input focus: terracotta border
- Border radius: cards 16px, buttons 12px, FAB 16px square-rounded

- [ ] **Step 2: Commit**

```bash
git add DESIGN_SYSTEM.md
git commit -m "docs: update DESIGN_SYSTEM.md to Cafe Cosy"
```

---

### Task 3: Update core UI components

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Text.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/components/ui/DatePicker.tsx`
- Modify: `src/components/ui/Toast.tsx`
- Modify: `src/components/ui/OTPInput.tsx`
- Modify: `src/components/ui/Avatar.tsx`
- Modify: `src/components/ui/ScreenHeader.tsx`
- Modify: `src/components/ui/Loader.tsx`
- Modify: `src/components/ui/Divider.tsx`

- [ ] **Step 1: Update Button.tsx**

Change variant config:
- `primary`: bg `Colors.terracotta` (was `Colors.coral`), text `Colors.textInverse`
- `secondary`: bg `Colors.sauge` (was `Colors.mint`), text `Colors.textInverse` (was `Colors.navy`)
- `outline`: text `Colors.terracotta`, border `Colors.terracotta` (was `Colors.coral`)
- `danger`: bg `Colors.error` (now maps to rose)
- `ghost`: text `Colors.textPrimary` (unchanged value, new hex)

Change disabled opacity from 0.6 to 0.5.

- [ ] **Step 2: Update Input.tsx**

- Border: `Colors.border` (now sable)
- Focus border: `Colors.borderFocus` (now terracotta)
- Placeholder: `Colors.placeholder` or `Colors.textMuted`
- Background: `Colors.backgroundCard`
- Border radius: `BorderRadius.input` (now 12)

- [ ] **Step 3: Update Text.tsx**

Replace any hardcoded color references:
- Navy references → `Colors.textPrimary`
- `#64748B` → `Colors.textSecondary`
- `#94A3B8` → `Colors.textMuted`

- [ ] **Step 4: Update Card.tsx**

- Background: `Colors.backgroundCard`
- Remove `borderWidth` and `borderColor` — replace with `Shadows.card`
- Border radius: `BorderRadius.card` (now 16)

- [ ] **Step 5: Update Badge.tsx**

- Replace any `Colors.mint`, `Colors.coral`, `Colors.lavender`, `Colors.blue` references with `Colors.sauge`, `Colors.rose`, `Colors.prune`, `Colors.miel`

- [ ] **Step 6: Update remaining UI components**

For each of EmptyState, DatePicker, Toast, OTPInput, Avatar, ScreenHeader, Loader, Divider:
- Replace `Colors.mint` → `Colors.terracotta` (for accent/active) or `Colors.sauge` (for success)
- Replace `Colors.coral` → `Colors.rose` (for alerts) or `Colors.terracotta` (for primary action)
- Replace `Colors.lavender` → `Colors.prune`
- Replace `Colors.blue` → `Colors.miel`
- Replace `Colors.navy` → `Colors.textPrimary`
- Replace any hardcoded `#FFFFFF` background → `Colors.backgroundCard`
- Replace any `borderWidth` on cards with shadows

- [ ] **Step 7: Verify no compile errors**

Run: `npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: update all UI components to Cafe Cosy tokens"
```

---

### Task 4: Update tab bar layout

**Files:**
- Modify: `app/(app)/_layout.tsx`

- [ ] **Step 1: Make tab bar mono-accent**

Change `TAB_CONFIG` — all tabs use `Colors.terracotta` as their color instead of individual colors:

```typescript
const TAB_CONFIG = [
  { name: 'dashboard', label: 'Accueil', icon: 'home' as const, color: Colors.terracotta },
  { name: 'tasks', label: 'Taches', icon: 'checkmark-circle' as const, color: Colors.terracotta },
  { name: 'calendar', label: 'Agenda', icon: 'calendar' as const, color: Colors.terracotta },
  { name: 'budget', label: 'Budget', icon: 'wallet' as const, color: Colors.terracotta },
  { name: 'menu', label: 'Menu', icon: 'menu' as const, color: Colors.terracotta },
] as const;
```

- [ ] **Step 2: Update tab bar styles**

- `tabBar.backgroundColor` → `Colors.backgroundCard`
- `tabBar.borderTopColor` → `Colors.border`
- Inactive tint: `Colors.textMuted`

- [ ] **Step 3: Update TabIcon active background**

The `iconWrap` focused background uses `activeColor + '18'` which will now be `#C4846C18` — this is correct (terracotta at ~9% opacity).

- [ ] **Step 4: Commit**

```bash
git add app/(app)/_layout.tsx
git commit -m "feat: tab bar mono-accent terracotta"
```

---

### Task 5: Update dashboard screens

**Files:**
- Modify: `app/(app)/dashboard/index.tsx`
- Modify: `app/(app)/dashboard/tlx.tsx`
- Modify: `src/components/dashboard/WeeklyReportCard.tsx`

- [ ] **Step 1: Update dashboard/index.tsx**

Key changes:
- `tlxColor()` helper: use `Colors.sauge`, `Colors.prune`, `Colors.rose` instead of mint/lavender/coral
- `priorityColors`: high → `Colors.rose`, medium → `Colors.miel`, low → `Colors.sauge`
- RefreshControl tintColor/colors: `Colors.terracotta` (was mint)
- Avatar fallback bg: `Colors.terracotta` (was mint)
- Greeting text color: `Colors.textPrimary` (was navy)
- Alert card: `Colors.rose` + opacity suffixes (was coral)
- StatCard icons: use `Colors.terracotta`, `Colors.rose`, `Colors.miel` as appropriate
- flatCard style: remove `borderWidth` and `borderColor`, add `...Shadows.card`
- TLX circle borderColor uses `tlxColor()` (already updated)
- "Tout voir" link: `Colors.terracotta` (was mint)
- Checkmark icon in done items: `Colors.sauge` (was mint)
- All `Colors.navy` → `Colors.textPrimary`
- Divider color: `Colors.borderLight` (was `Colors.border`)

- [ ] **Step 2: Update dashboard/tlx.tsx**

- Replace all `Colors.mint` → `Colors.sauge` (for low scores)
- Replace all `Colors.coral` → `Colors.rose` (for high scores)
- Replace `Colors.lavender` → `Colors.prune` (TLX accent)
- Sliders/accents: use `Colors.terracotta` for interactive elements

- [ ] **Step 3: Update WeeklyReportCard.tsx**

- Replace color references following the same mapping
- Card style: remove border, add warm shadow

- [ ] **Step 4: Commit**

```bash
git add app/(app)/dashboard/ src/components/dashboard/
git commit -m "feat: dashboard screens Cafe Cosy migration"
```

---

### Task 6: Update tasks module

**Files:**
- Modify: `app/(app)/tasks/index.tsx`
- Modify: `app/(app)/tasks/[id].tsx`
- Modify: `app/(app)/tasks/create.tsx`
- Modify: `app/(app)/tasks/_layout.tsx`
- Modify: `src/components/tasks/TaskCard.tsx`
- Modify: `src/components/tasks/TaskFilters.tsx`
- Modify: `src/components/tasks/TaskCompletionToast.tsx`
- Modify: `src/components/tasks/CompletionRatingSheet.tsx`
- Modify: `src/components/tasks/TaskSuggestions.tsx`

- [ ] **Step 1: Update tasks/index.tsx**

- FAB: `backgroundColor: Colors.terracotta` (was coral), `borderRadius: BorderRadius.fab`
- RefreshControl: `tintColor: Colors.terracotta`
- "Tout voir" links: `Colors.terracotta`

- [ ] **Step 2: Update TaskCard.tsx**

- Priority dot colors: high → `Colors.rose`, medium → `Colors.miel`, low → `Colors.sauge`
- Checkmark/done: `Colors.sauge`
- Card style: remove border, add `Shadows.card`
- Any `Colors.mint` → `Colors.sauge`
- Any `Colors.coral` → `Colors.rose`

- [ ] **Step 3: Update TaskFilters.tsx**

- Active filter pill: `Colors.terracotta` background or tint
- Replace mint/coral references

- [ ] **Step 4: Update remaining task components**

For TaskCompletionToast, CompletionRatingSheet, TaskSuggestions, tasks/[id].tsx, tasks/create.tsx, tasks/_layout.tsx:
- Same color mapping: mint→sauge/terracotta, coral→rose, lavender→prune, blue→miel
- Cards: remove borders, add shadows

- [ ] **Step 5: Commit**

```bash
git add app/(app)/tasks/ src/components/tasks/
git commit -m "feat: tasks module Cafe Cosy migration"
```

---

### Task 7: Update auth screens

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/signup.tsx`
- Modify: `app/(auth)/verify-email.tsx`
- Modify: `app/(auth)/join-code.tsx`
- Modify: `app/(auth)/_layout.tsx`
- Modify: `app/index.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/+not-found.tsx`
- Modify: `app/join/[token].tsx` (if exists)
- Modify: `app/join/[token].web.tsx`
- Modify: `app/join/_layout.tsx`
- Modify: `app/auth/_layout.tsx`

- [ ] **Step 1: Update login.tsx and signup.tsx**

- CTA buttons: now use `Colors.terracotta` through Button component (already updated in Task 3)
- Background: `Colors.background`
- Any `Colors.mint` accent → `Colors.terracotta`
- Link colors: `Colors.terracotta`

- [ ] **Step 2: Update verify-email.tsx and join-code.tsx**

- Same color mapping
- Success feedback: `Colors.sauge`
- Accent: `Colors.terracotta`

- [ ] **Step 3: Update layouts and root files**

For `app/_layout.tsx`, `app/index.tsx`, `app/+not-found.tsx`, `app/(auth)/_layout.tsx`, `app/auth/_layout.tsx`, `app/join/_layout.tsx`, `app/join/[token].tsx`, `app/join/[token].web.tsx`:
- Background colors: `Colors.background`
- Any direct color refs: follow mapping

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/ app/index.tsx app/_layout.tsx app/+not-found.tsx app/join/ app/auth/
git commit -m "feat: auth screens Cafe Cosy migration"
```

---

### Task 8: Update settings, calendar, budget, menu, lists, notifications, onboarding

**Files:**
- Modify: `app/(app)/settings/index.tsx`
- Modify: `app/(app)/settings/profile.tsx`
- Modify: `app/(app)/settings/household.tsx`
- Modify: `app/(app)/settings/security.tsx`
- Modify: `app/(app)/settings/notifications.tsx`
- Modify: `app/(app)/settings/invite.tsx`
- Modify: `app/(app)/settings/help.tsx`
- Modify: `app/(app)/settings/privacy.tsx`
- Modify: `app/(app)/settings/cgu.tsx`
- Modify: `app/(app)/settings/_layout.tsx`
- Modify: `app/(app)/calendar/index.tsx`
- Modify: `app/(app)/calendar/_layout.tsx`
- Modify: `app/(app)/budget/index.tsx`
- Modify: `app/(app)/budget/create.tsx`
- Modify: `app/(app)/budget/_layout.tsx`
- Modify: `app/(app)/menu/index.tsx`
- Modify: `app/(app)/menu/analysis.tsx`
- Modify: `app/(app)/lists/index.tsx`
- Modify: `app/(app)/lists/[id].tsx`
- Modify: `app/(app)/lists/create.tsx`
- Modify: `app/(app)/lists/_layout.tsx`
- Modify: `app/(app)/notifications.tsx`
- Modify: `app/(app)/onboarding/post-join.tsx`
- Modify: `app/(app)/dashboard/_layout.tsx`

- [ ] **Step 1: Update settings screens**

For each settings screen:
- `Colors.mint` accent → `Colors.terracotta`
- `Colors.coral` danger → `Colors.rose`
- Links/toggles: `Colors.terracotta`
- Success: `Colors.sauge`
- Cards: remove borders, add shadows where applicable

- [ ] **Step 2: Update calendar screens**

- Accent colors: `Colors.terracotta`
- Event colors: follow member color palette
- Today highlight: `Colors.terracotta`

- [ ] **Step 3: Update budget screens**

- Same color mapping
- Charts/amounts: semantic colors (sauge for positive, rose for negative, miel for neutral)

- [ ] **Step 4: Update menu screens**

- `app/(app)/menu/index.tsx`: menu row accents → terracotta
- `app/(app)/menu/analysis.tsx`: chart colors → new palette

- [ ] **Step 5: Update lists screens**

- `Colors.mint` → `Colors.terracotta` for accents
- Checkmarks: `Colors.sauge`

- [ ] **Step 6: Update notifications and onboarding**

- `app/(app)/notifications.tsx`: unread dot → `Colors.terracotta`
- `app/(app)/onboarding/post-join.tsx`: accent → `Colors.terracotta`

- [ ] **Step 7: Commit**

```bash
git add app/(app)/settings/ app/(app)/calendar/ app/(app)/budget/ app/(app)/menu/ app/(app)/lists/ app/(app)/notifications.tsx app/(app)/onboarding/ app/(app)/dashboard/_layout.tsx
git commit -m "feat: settings, calendar, budget, menu, lists Cafe Cosy migration"
```

---

### Task 9: Update remaining components and helpers

**Files:**
- Modify: `src/components/menu/MenuRow.tsx`
- Modify: `src/components/menu/MenuSection.tsx`
- Modify: `src/components/menu/QuickActionCard.tsx`
- Modify: `src/components/analysis/TopTasks.tsx`
- Modify: `src/components/analysis/TlxSparkline.tsx`
- Modify: `src/components/analysis/MemberBreakdown.tsx`
- Modify: `src/components/analysis/KPIPills.tsx`
- Modify: `src/components/lists/ListItemRow.tsx`
- Modify: `src/components/lists/ListCard.tsx`
- Modify: `src/components/lists/ShoppingCategorySection.tsx`
- Modify: `src/components/lists/AddItemInput.tsx`
- Modify: `src/components/notifications/NotificationRow.tsx`

- [ ] **Step 1: Update menu components**

- MenuRow: accent → `Colors.terracotta`, icon color → `Colors.textSecondary`
- QuickActionCard: color accents → new palette

- [ ] **Step 2: Update analysis components**

- KPIPills, TopTasks, TlxSparkline, MemberBreakdown: chart/accent colors → Cafe Cosy palette
- TLX colors: sauge (low), miel (medium), rose (high)

- [ ] **Step 3: Update lists components**

- ListCard, ListItemRow, AddItemInput, ShoppingCategorySection: accent colors
- Checkmarks: `Colors.sauge`

- [ ] **Step 4: Update NotificationRow**

- Unread indicator: `Colors.terracotta`
- Type-specific colors: follow mapping

- [ ] **Step 5: Final compile check**

Run: `npx tsc --noEmit 2>&1 | head -50`
Expected: No errors

- [ ] **Step 6: Run lint**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add src/components/menu/ src/components/analysis/ src/components/lists/ src/components/notifications/
git commit -m "feat: remaining components Cafe Cosy migration"
```

---

### Task 10: Remove deprecated aliases and final cleanup

**Files:**
- Modify: `src/constants/tokens.ts`

- [ ] **Step 1: Verify no remaining references to old token names**

Run:
```bash
grep -r "Colors\.\(mint\|coral\|blue\|lavender\|navy\)" --include="*.tsx" --include="*.ts" -l src/ app/
```
Expected: No files (or only tokens.ts itself)

- [ ] **Step 2: Remove deprecated aliases from tokens.ts**

Remove the `// DEPRECATED aliases` section from Colors object if no files reference them.

- [ ] **Step 3: Final compile and lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 4: Commit**

```bash
git add src/constants/tokens.ts
git commit -m "chore: remove deprecated color aliases after Cafe Cosy migration"
```
