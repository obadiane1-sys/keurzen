# Task Creation Bottom Sheet — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Scope:** Redesign `app/(app)/tasks/create.tsx` from full-screen modal to bottom sheet quick-add

---

## 1. Overview

Replace the current full-screen task creation modal with a compact bottom sheet (style Todoist/Things 3). The sheet opens from the FAB "+" on the task list, focuses on speed of capture, and uses progressive disclosure for secondary options.

**Key principles:**
- Compact by default (~35% screen), grows when sub-panels open (~60-70%)
- Barre d'icones horizontale for quick access to all options
- Single sub-panel visible at a time
- No external dependencies — native `Animated` + `PanResponder`
- All tokens from `src/constants/tokens.ts`

---

## 2. Structure

Three vertically stacked zones:

```
┌─────────────────────────────────┐
│          ─── (handle)           │  Zone 1: Handle + Input (top, fixed)
│                                 │
│  Que faut-il faire ?            │
│  ________________________________│
│                                 │
│  ┌─ Sub-panel (if open) ──────┐│  Zone 2: Dynamic content (scrollable)
│  │  Quick chips / calendar /   ││
│  │  avatars / categories ...   ││
│  └─────────────────────────────┘│
│                                 │
│  📅  👤  🏷  🚩  📝   [Ajouter]│  Zone 3: Action bar + CTA (bottom, fixed)
└─────────────────────────────────┘
```

**Overlay:** `Colors.overlay` behind the sheet. Tap = close.

---

## 3. Component Breakdown

### 3.1 Bottom Sheet Container

- **Animated wrapper** using `Animated.Value` for translateY
- **PanResponder** on the handle area for swipe-to-dismiss (threshold: 100px down)
- **KeyboardAvoidingView** wrapping the sheet for keyboard push-up
- **Spring animation** for open/close/resize transitions (`damping: 20, stiffness: 200`)
- Sheet height: dynamic — base compact height + sub-panel height when active
- Background: `Colors.backgroundCard`, top corners `BorderRadius['2xl']`
- Shadow: `Shadows.lg`

### 3.2 Handle Bar

- Centered, `36x4px`, `Colors.gray300`, `borderRadius: full`
- `marginTop: Spacing.sm`, `marginBottom: Spacing.base`
- Touch target includes the full top area of the sheet

### 3.3 Task Name Input

- Full width, no border — just text on `backgroundCard`
- `fontSize: Typography.fontSize.xl` (20), `fontWeight: bold`, `color: Colors.navy`
- Placeholder: "Que faut-il faire ?", `color: Colors.textMuted`
- `autoFocus: true`, `returnKeyType: 'done'`
- Clear button (x icon) when text is non-empty, right-aligned
- `paddingHorizontal: Spacing.lg`

### 3.4 Sub-Panels

One sub-panel visible at a time. Animated slide-in from bottom with spring. Background: `Colors.gray50`. Padding: `Spacing.base` horizontal, `Spacing.md` vertical.

#### 3.4.1 Date Panel

1. **Quick chips** — horizontal ScrollView
   - "Aujourd'hui", "Demain", "Vendredi"
   - Default: `bg: Colors.backgroundCard`, `border: Colors.border`, `text: Colors.textSecondary`
   - Active: `bg: Colors.mint`, `border: Colors.mint`, `text: Colors.textInverse`
   - Radius: `BorderRadius.xl`, padding: `Spacing.base` horizontal, `Spacing.sm` vertical

2. **Mini calendar** — same grid as current implementation
   - Month nav: `Ionicons chevron-back/forward` in `32x32` circle buttons
   - Day cells: `14.285%` width, `38px` max height
   - Selected day: `bg: Colors.mint`, `borderRadius: full`, text white bold
   - Today (unselected): `color: Colors.mint`, bold, small dot underneath
   - Past days: `color: Colors.gray300`, disabled

3. **Time toggle** — row with clock icon + "Heure limite" label + chevron
   - Expands to: period buttons (Matin/Apres-midi/Soir) + hour grid + minute row
   - Active period: `bg: lavender 10%`, `border: Colors.lavender`
   - Active hour/minute: `bg: Colors.mint`, text white

#### 3.4.2 Assignee Panel

- Horizontal ScrollView of avatar items
- Each item: `40x40` avatar circle + name below (`fontSize.xs`)
- Selected: `borderColor: Colors.mint`, `borderWidth: 2.5`, `scale: 1.05`, bg = member color, text white
- Unselected: `bg: Colors.gray100`, `color: Colors.textSecondary`
- Empty state: "Aucun membre dans le foyer" centered text

#### 3.4.3 Category Panel

- Flex-wrap grid of chips
- Each: icon + label, `paddingHorizontal: Spacing.md`, `paddingVertical: Spacing.sm`, `borderRadius: BorderRadius.xl`
- Default: `bg: Colors.backgroundCard`, `border: Colors.border`
- Active: `bg: lavender 10%`, `border: Colors.lavender`, `color: Colors.lavender`, checkmark icon appended
- 11 categories from `categoryLabels` in TaskCard.tsx

#### 3.4.4 Priority Panel

- 3 chips in a row (`flex: 1`, `gap: Spacing.sm`)
- Each: colored dot (8px) + label
- Low: dot `Colors.mint`, bg `mint 8%`, text `#0F6E56`
- Medium: dot `Colors.warning`, bg `#FEF9EC`, text `#854F0B`
- High: dot `Colors.coral`, bg `coral 8%`, text `#993C1D`
- Active: `borderWidth: 2`, `borderColor: dot color`

#### 3.4.5 Note Panel

- TextInput multiline, `minHeight: 80px`
- `border: 1px Colors.border`, `borderRadius: BorderRadius.md`
- `bg: Colors.backgroundCard`, `padding: Spacing.md`
- Placeholder: "Ajouter une note..."

### 3.5 Action Bar

Fixed at bottom of sheet, inside `SafeAreaView edges={['bottom']}`.

**Layout:** Row with 5 icon buttons on the left, CTA button on the right.

**Icon buttons:**
- Size: `38x38px` circle
- Background: semi-transparent section color (same `SECTION_ICONS` map)
- Icons: `calendar-outline`, `person-outline`, `grid-outline`, `flag-outline`, `document-text-outline`
- Size: 18px, color = section stroke color
- When option is set: small indicator dot (6px) top-right of the icon circle
  - Date: mint dot
  - Assignee: mint dot
  - Category: lavender dot
  - Priority: priority color dot
  - Note: gray dot
- Active (panel open): slightly larger scale or highlighted border

**CTA button:**
- Right-aligned, `bg: Colors.mint`, `borderRadius: full`
- Height: `44px`, `paddingHorizontal: Spacing.lg`
- Content: `Ionicons add` (18px) + "Ajouter" text (`fontSize.sm`, bold, white)
- Disabled state: `opacity: 0.4` when title is empty
- Loading state: `ActivityIndicator` replacing content

### 3.6 Overlay

- Full-screen view behind the sheet
- `backgroundColor: Colors.overlay`
- Animated opacity (fade in/out with sheet)
- `onPress: close sheet` (calls `router.back()`)

---

## 4. Animations

All animations use `Animated.spring` with `damping: 20, stiffness: 200, useNativeDriver: true` (except height changes which use `useNativeDriver: false`).

| Transition | What animates |
|---|---|
| Sheet open | translateY from screen bottom to compact position, overlay opacity 0→1 |
| Sheet close | translateY to screen bottom, overlay opacity 1→0 |
| Sub-panel open | Sheet height grows with spring, sub-panel opacity 0→1 |
| Sub-panel close | Sheet height shrinks, sub-panel opacity 1→0 |
| Sub-panel switch | Cross-fade: current out, new in |
| Swipe dismiss | translateY follows finger, spring to close if >100px |

---

## 5. Interaction Flow

1. User taps FAB "+" on task list → sheet slides up, keyboard appears, input focused
2. User types task name → CTA becomes active
3. User taps 📅 → date panel slides in, sheet grows
4. User picks "Demain" → chip activates, mint dot appears on 📅 icon
5. User taps 👤 → date panel slides out, assignee panel slides in
6. User taps an avatar → selected state, mint dot on 👤 icon
7. User taps "Ajouter" → mutation fires, sheet closes with slide-down, toast confirms
8. If error → Alert (mobile) / window.alert (web), sheet stays open

---

## 6. Files Impacted

| File | Change |
|---|---|
| `app/(app)/tasks/create.tsx` | Complete rewrite — bottom sheet architecture |
| `src/constants/tokens.ts` | No change (all tokens already exist) |
| `src/components/tasks/TaskCard.tsx` | No change (categoryLabels import stays) |
| `src/lib/queries/tasks.ts` | No change (useCreateTask stays) |
| `src/stores/household.store.ts` | No change (members access stays) |
| `src/types/index.ts` | No change (TaskFormValues, TaskCategory, TaskPriority stay) |

**Single file change.** All logic, hooks, types, and stores are preserved. Only the UI layer changes.

---

## 7. Edge Cases

| Case | Behavior |
|---|---|
| Empty members list | Assignee panel shows "Aucun membre dans le foyer" |
| Keyboard open + sub-panel | KeyboardAvoidingView pushes sheet up, sub-panel scrollable |
| Very long task name | Input wraps naturally, sheet doesn't grow (input is single-line with truncation) |
| Submit while loading | CTA disabled, shows ActivityIndicator |
| Swipe down during sub-panel | Closes the whole sheet (not just the panel) |
| Web platform | No PanResponder swipe — close via overlay tap or X button. `window.confirm` for errors |
| No due date selected | 📅 icon has no indicator dot, `due_date` sent as `undefined` |

---

## 8. Tokens Reference

All values from `src/constants/tokens.ts`:

- **Colors:** mint, navy, lavender, coral, warning, gray50, gray100, gray300, textMuted, textPrimary, textSecondary, textInverse, backgroundCard, background, border, borderLight, overlay, memberColors
- **Spacing:** xs(4), sm(8), md(12), base(16), lg(20), xl(24)
- **BorderRadius:** sm(8), md(12), lg(16), xl(20), 2xl(24), full(9999)
- **Typography:** fontSize xs→xl, fontWeight medium/semibold/bold
- **Shadows:** sm, md, card, lg
- **TouchTarget:** min(44)

---

## 9. What Does NOT Change

- Business logic (mutations, validation, form values assembly)
- Navigation structure (still navigates via `router.back()` on close/success)
- Types (`TaskFormValues`, `TaskCategory`, `TaskPriority`)
- Hooks (`useCreateTask`, `useHouseholdStore`)
- Other task screens (`index.tsx`, `[id].tsx`, `_layout.tsx`)
- Design tokens file
- Any store or query file
