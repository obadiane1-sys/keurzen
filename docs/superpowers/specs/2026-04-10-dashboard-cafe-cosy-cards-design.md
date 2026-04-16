# Dashboard Redesign — Cafe Cosy Cards

**Date:** 2026-04-10
**Status:** Approved
**Inspiration:** Apple Health Summary — clean modular cards, big numbers, clear hierarchy
**Approach:** Cafe Cosy identity (warm tones, Nunito, rounded cards, brown shadows)

---

## Design Principles

1. **One metric per card** — each card shows one dominant number, readable at a glance
2. **Accent border-left** — 4px colored left border per domain, white card background uniform
3. **Reduced density** — 5 cards instead of 9, detail accessible via chevron/navigation
4. **Cafe Cosy identity** — fond creme `#FAF6F1`, cartes `#FFFDF9`, coins 16px, ombres brunes `rgba(61,44,34,0.06)`, typo Nunito
5. **Dual-platform** — mobile single column, web sidebar + main grid

---

## Color Accents by Domain

| Domain | Color | Token |
|--------|-------|-------|
| Score du foyer | Terracotta `#C4846C` | `terracotta` |
| Charge ressentie (TLX) | Prune `#9B8AA8` | `prune` |
| Taches du jour | Sauge `#8BA888` | `sauge` |
| Repartition | Miel `#D4A959` | `miel` |
| Conseil de la semaine | Miel `#D4A959` | `miel` |

---

## Cards Specification

### Card 1 — Score du foyer (Hero)

- **Accent:** Terracotta border-left
- **Content:**
  - Overline: "SCORE DU FOYER" in terracotta uppercase 11-12px
  - Subtitle: "Cette semaine" in secondary color
  - Circular gauge: simplified ring (terracotta stroke on `#E8DFD5` track), score number large and centered (36px mobile, 48px web sidebar)
  - Label below gauge: status badge pill (e.g. "BON EQUILIBRE" in sauge on sauge/12% background)
  - Chevron → navigates to weekly-review
- **Data:** `computeHouseholdScore()` from `packages/shared`
- **Gauge sizes:** 140px mobile, 180px web sidebar

### Card 2 — Charge ressentie (TLX)

- **Accent:** Prune border-left
- **Content:**
  - Overline: "CHARGE RESSENTIE" in prune
  - Subtitle: "TLX moyen du foyer"
  - Big number: average TLX score (40px) + "/100" muted
  - Delta: week-over-week change (e.g. "↓ 5 pts" in sauge if improved, rose if worsened)
  - Progress bar: prune fill on `#E8DFD5` track, 6px height
  - Chevron → navigates to TLX detail/form
- **Data:** `useCurrentTlx()`, `useTlxDelta()`
- **Empty state:** CTA "Remplir le questionnaire TLX" if no entry this week

### Card 3 — Aujourd'hui (Today Tasks)

- **Accent:** Sauge border-left
- **Content:**
  - Overline: "AUJOURD'HUI" in sauge
  - Big number: remaining task count (40px) + "taches restantes"
  - Task list: max 3 tasks, each in a row with priority dot, task name (13px semibold), assignee name (11px muted)
  - Task rows: `#FAF6F1` background, 10px border-radius
  - "Tout voir ›" link in terracotta top-right
- **Data:** `useTodayTasks()`
- **Empty state:** "Aucune tache aujourd'hui" with mascot or calm message

### Card 4 — Repartition

- **Accent:** Miel border-left
- **Content:**
  - Overline: "REPARTITION" in miel
  - Subtitle: "Equilibre des taches"
  - Per-member rows: name + percentage + horizontal progress bar (8px)
  - Member bar colors: terracotta for first member, prune for second (or use member assigned colors)
  - Chevron → navigates to detail view
- **Data:** `useWeeklyBalance()`
- **Empty state:** "Pas assez de donnees cette semaine"

### Card 5 — Conseil de la semaine

- **Accent:** Miel border-left
- **Content:**
  - Overline: "CONSEIL DE LA SEMAINE" in miel
  - Body text: coaching tip (14px, line-height 1.5-1.6)
  - Link: "Voir le bilan hebdo ›" in terracotta
- **Data:** `useWeeklyTip()` or extracted from weekly report
- **Empty state:** Generic encouragement message

---

## Sections Removed from Current Dashboard

| Former Section | Disposition |
|---------------|-------------|
| Stats strip (streak + today count) | Absorbed into sidebar (web) and score card context |
| TLX 6 dimensions detail | Accessible via TLX card chevron → TLX detail page |
| Recently Done tasks | Accessible via "Tout voir" on tasks page |
| Weekly Report preview | Accessible via "Voir le bilan hebdo" CTA |

---

## Layout — Mobile

```
┌─────────────────────────┐
│ Semaine du 7 avril      │  ← overline, muted, 11px uppercase
│ Tableau de bord    [AV] │  ← title 28px extrabold + avatar circle
├─────────────────────────┤
│ ┌─ terracotta           │
│ │ SCORE DU FOYER        │
│ │   ┌──────┐            │
│ │   │  78  │  gauge     │
│ │   └──────┘            │
│ │  BON EQUILIBRE    ›   │
│ └───────────────────────│
│ ┌─ prune                │
│ │ CHARGE RESSENTIE      │
│ │ 42 /100    ↓ 5 pts    │
│ │ ████████░░░░░░░   ›   │
│ └───────────────────────│
│ ┌─ sauge                │
│ │ AUJOURD'HUI  Tout voir│
│ │ 3 taches restantes    │
│ │ ● Courses      Ouss   │
│ │ ● Machine   Partner   │
│ │ ● Poubelles    Ouss   │
│ └───────────────────────│
│ ┌─ miel                 │
│ │ REPARTITION           │
│ │ Ouss      ██████ 55%  │
│ │ Partner   █████░ 45%  │
│ └───────────────────────│
│ ┌─ miel                 │
│ │ CONSEIL DE LA SEMAINE │
│ │ Pensez a alterner...  │
│ │ Voir le bilan hebdo › │
│ └───────────────────────│
└─────────────────────────┘
```

- Background: `#FAF6F1`
- Card background: `#FFFDF9`
- Card border-radius: 16px
- Card padding: 20-24px
- Card margin-bottom: 16px
- Card shadow: `0 2px 8px rgba(61,44,34,0.06)`
- Scroll: vertical ScrollView with stagger fade animations (keep existing pattern)

---

## Layout — Web

```
┌──────────────┬──────────────────────────────┐
│   SIDEBAR    │         MAIN AREA            │
│   (320px)    │                              │
│   sticky     │  Tableau de bord             │
│              │                              │
│  Score foyer │  ┌─ TLX ─────┬─ Repart ───┐ │
│  ┌────────┐  │  │ 42/100    │ Ouss  55%  │ │
│  │   78   │  │  │ ↓ 5 pts   │ Part  45%  │ │
│  └────────┘  │  └───────────┴────────────┘ │
│ BON EQUIL.   │                              │
│              │  ┌─ Aujourd'hui ────────────┐ │
│ ┌────┬────┐  │  │ 3 taches restantes      │ │
│ │ 5j │ 12 │  │  │ ● Courses   ● Machine   │ │
│ │act │done│  │  │ ● Poubelles             │ │
│ └────┴────┘  │  └─────────────────────────┘ │
│              │                              │
│ [Bilan hebdo]│  ┌─ Conseil ───────────────┐ │
│              │  │ Pensez a alterner...    │ │
│              │  │ Voir le bilan hebdo ›   │ │
│              │  └─────────────────────────┘ │
└──────────────┴──────────────────────────────┘
```

- Sidebar: 320px, `position: sticky; top: 32px`, contains score gauge + 2 stat boxes + CTA
- Main: flex 1, grid 2 columns for TLX + Repartition, full-width for tasks + conseil
- Responsive breakpoint 768px: sidebar goes on top, single column
- Max-width layout: 1200px centered

---

## Component Architecture

### Shared (both platforms)

No new shared packages needed. Existing hooks (`useCurrentTlx`, `useTlxDelta`, `useTodayTasks`, `useWeeklyBalance`, `computeHouseholdScore`) are sufficient.

### Mobile — `apps/mobile/src/components/dashboard/`

| Component | Status | Notes |
|-----------|--------|-------|
| `DashboardCard.tsx` | **New** | Generic wrapper: border-left accent, chevron, shadow, padding |
| `ScoreHeroCard.tsx` | **New** (replaces `HouseholdScoreCard.tsx`) | Simplified gauge 140px + big number + badge |
| `TlxSummaryCard.tsx` | **New** (replaces `TlxDetailCard.tsx`) | Big number + delta + progress bar |
| `TodayTasksCard.tsx` | **New** | Big count + 3 task rows |
| `RepartitionCard.tsx` | **New** | Member bars |
| `WeeklyTipCard.tsx` | **Modify** | Adapt to DashboardCard pattern |
| `CircularGauge.tsx` | **Modify** | Simplify: remove labels, bigger center number |

### Web — `apps/web/src/components/dashboard/`

| Component | Status | Notes |
|-----------|--------|-------|
| `DashboardCard.tsx` | **New** | Same pattern as mobile, Tailwind classes |
| `DashboardSidebar.tsx` | **New** | Sticky sidebar with gauge + stats + CTA |
| `ScoreHeroCard.tsx` | **New** | Web gauge variant (180px, inside sidebar) |
| `TlxSummaryCard.tsx` | **New** (replaces `TlxDetailCard.tsx`) | Same structure, Tailwind |
| `TodayTasksCard.tsx` | **New** (replaces `TodayTasks.tsx`) | Big count + task rows |
| `RepartitionCard.tsx` | **New** (replaces `BalanceCard.tsx`) | Member bars |
| `WeeklyTipCard.tsx` | **Modify** | Adapt to card pattern |
| `CircularGauge.tsx` | **Modify** | Simplify |

### Screen Files

| File | Changes |
|------|---------|
| `apps/mobile/app/(app)/dashboard/index.tsx` | Replace 9 sections with 5 cards, new header |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Sidebar + main grid layout, 4 cards in main |

---

## Header

### Mobile
- Overline: "Semaine du {date}" — 11px uppercase, letter-spacing 1.5px, color `textMuted`
- Title: "Tableau de bord" — 28px extrabold, color `textPrimary`
- Avatar: 40px circle, terracotta background, user initials white — top right
- Spacing: 24px margin-bottom

### Web
- Title: "Tableau de bord" — 22px extrabold in main area header
- Sidebar has its own "Score du foyer" title
- No duplicate avatar (already in app shell/navbar)

---

## Empty States

Each card handles its own empty state:
- **Score:** "Pas encore de donnees" + encouragement
- **TLX:** "Remplir le questionnaire TLX" CTA button
- **Today Tasks:** "Aucune tache aujourd'hui" calm message
- **Repartition:** "Pas assez de donnees cette semaine"
- **Conseil:** Generic encouragement fallback

---

## Animations (Mobile)

Keep existing stagger fade pattern from current dashboard:
- Each card fades in with slight translateY(10px → 0)
- Stagger delay: 80ms between cards
- Duration: 300ms ease-out

---

## Out of Scope

- Pinnable/customizable card order (Apple Health "Pinned" feature)
- Sparklines or trend charts
- Budget snapshot card
- Mental load card
- Notification bell in header (keep if already exists, don't add if not)
- Changes to weekly-review, TLX form, or other sub-pages
