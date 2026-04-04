# AI Weekly Report — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Scope:** AI-powered weekly household report using Claude Haiku, displayed as a card on the dashboard

---

## 1. Overview

An Edge Function `generate-weekly-report` collects weekly analytics data (weekly_stats, tlx_entries, tasks, time_logs, alerts) for each household, sends them to Claude Haiku via the Anthropic API, and stores the structured report in a `weekly_reports` table. The report is displayed as a card at the top of the dashboard with 4 collapsible sections.

**Hybrid generation:** Cron runs Monday 6:05 AM (after compute-weekly-stats at 6:00). Users can also regenerate on demand via a button.

**Model:** Claude Haiku (`claude-haiku-4-5-20251001`), ~$0.003/report, ~1s latency.

---

## 2. Data Model

### Table: `weekly_reports`

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | — |
| `household_id` | UUID NOT NULL FK → households(id) ON DELETE CASCADE | Foyer |
| `week_start` | DATE NOT NULL | Monday of the week |
| `summary` | TEXT NOT NULL | 2-3 sentence global summary |
| `attention_points` | JSONB NOT NULL DEFAULT '[]' | Array of `{ icon: string, text: string, level: 'warning' \| 'info' }` |
| `insights` | JSONB NOT NULL DEFAULT '[]' | Array of `{ text: string, category: string }` |
| `orientations` | JSONB NOT NULL DEFAULT '[]' | Array of `{ text: string, priority: 'high' \| 'medium' }` |
| `model` | TEXT NOT NULL | Model used (e.g. `claude-haiku-4-5-20251001`) |
| `generated_at` | TIMESTAMPTZ NOT NULL | When the AI generated this |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT now() | — |

**Constraints:**
- UNIQUE `(household_id, week_start)` — one report per household per week, upsert on regeneration

**RLS:**
- SELECT: members of the household
- No client INSERT/UPDATE/DELETE — only service_role (Edge Function) writes

---

## 3. TypeScript Types

```ts
export interface AttentionPoint {
  icon: string;
  text: string;
  level: 'warning' | 'info';
}

export interface Insight {
  text: string;
  category: 'imbalance' | 'workload' | 'pattern' | 'improvement';
}

export interface Orientation {
  text: string;
  priority: 'high' | 'medium';
}

export interface WeeklyReport {
  id: string;
  household_id: string;
  week_start: string;
  summary: string;
  attention_points: AttentionPoint[];
  insights: Insight[];
  orientations: Orientation[];
  model: string;
  generated_at: string;
  created_at: string;
}
```

---

## 4. Edge Function: `generate-weekly-report`

### Endpoint
`POST /functions/v1/generate-weekly-report`

### Auth
- Bearer JWT verified
- User must be member of the target household
- Cron uses service_role directly

### Input
```json
{ "household_id": "uuid" }
```

### Data Collection (service_role queries)

1. `weekly_stats` WHERE household_id + week_start → shares, deltas, minutes per member
2. `tlx_entries` WHERE household_id + week_start → TLX scores per member
3. `tasks` WHERE household_id + completed_at in week → categories, zones, priorities, counts
4. `time_logs` WHERE household_id + logged_at in week → actual minutes
5. `alerts` WHERE household_id + week_start → active alerts
6. `household_members` + `profiles` → member names

### System Prompt

```
Tu es le coach bien-être du foyer Keurzen. Ton ton est calme, bienveillant,
factuel et encourageant. Jamais culpabilisant. Tu tutoies les membres.
Tu analyses les données d'une semaine et produis un rapport structuré en JSON.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires.

Structure attendue :
{
  "summary": "2-3 phrases de bilan global de la semaine",
  "attention_points": [
    { "icon": "alert-circle", "text": "...", "level": "warning|info" }
  ],
  "insights": [
    { "text": "...", "category": "imbalance|workload|pattern|improvement" }
  ],
  "orientations": [
    { "text": "...", "priority": "high|medium" }
  ]
}

Règles :
- Maximum 3 attention_points, 3 insights, 3 orientations
- Les orientations sont des suggestions concrètes et actionnables
- Ne jamais pointer un membre du doigt négativement
- Utiliser les prénoms des membres
- Si les données sont insuffisantes, le dire dans le summary et réduire les sections
```

### API Call
- `POST https://api.anthropic.com/v1/messages`
- Model: `claude-haiku-4-5-20251001`
- max_tokens: 1024
- Secret: `ANTHROPIC_API_KEY` (Supabase secret)
- Timeout: 15s

### Output
- Parse JSON response
- Upsert into `weekly_reports` (ON CONFLICT household_id, week_start DO UPDATE)
- Return `{ success: true, report_id: string }`

### Error Handling
- Anthropic timeout/error → return `{ success: false, error: "..." }`, no report created
- Insufficient data (<3 completed tasks AND no TLX entries) → return `{ success: false, error: "insufficient_data" }`, no report
- Invalid JSON from AI → retry once, then fail
- Regeneration → same logic, upsert overwrites previous report

---

## 5. TanStack Query Hooks

### File: `src/lib/queries/reports.ts`

```ts
reportKeys = {
  current: (householdId: string) => ['reports', householdId, 'current'] as const,
};
```

**`useWeeklyReport()`** — fetch the latest report for current household where week_start = current week Monday. `staleTime: 5 * 60 * 1000` (5 min). `enabled: !!currentHousehold?.id`.

**`useRegenerateReport()`** — mutation calling the Edge Function `generate-weekly-report` with `{ household_id }`. On success: invalidate `reportKeys.current`. Auth: Bearer JWT.

---

## 6. UI: WeeklyReportCard

### File: `src/components/dashboard/WeeklyReportCard.tsx`

Integrated at the top of `app/(app)/dashboard/index.tsx`, before existing KPI cards.

### Structure

```
┌─────────────────────────────────────────┐
│  📊  Rapport de la semaine              │
│  Semaine du 31 mars                     │
├─────────────────────────────────────────┤
│  [Summary text - always visible]        │
├─────────────────────────────────────────┤
│  ⚠ Points d'attention            ▼     │  (collapsible)
│  ─ item 1                               │
│  ─ item 2                               │
├─────────────────────────────────────────┤
│  💡 Insights                     ▼     │  (collapsible)
│  ─ item 1                               │
├─────────────────────────────────────────┤
│  🎯 Orientations                 ▼     │  (collapsible)
│  ● item 1 (high)                        │
│  ● item 2 (medium)                      │
├─────────────────────────────────────────┤
│           Regénérer le rapport     ↻    │
└─────────────────────────────────────────┘
```

### Visual Specs

- **Card**: `Card` component, `padding='none'` (custom internal padding), `radius='xl'`
- **Header**: icon `bar-chart-outline` + "Rapport de la semaine" title (fontSize.lg, bold, navy) + week label (fontSize.sm, textMuted)
- **Summary**: `fontSize.base`, `Colors.textPrimary`, padding horizontal `Spacing.lg`
- **Sections**: each has a TouchableOpacity header with icon + label + chevron (rotate animated). Content toggles.
  - Attention points: icon from `item.icon` (Ionicons), `Colors.coral` for warning, `Colors.blue` for info
  - Insights: icon `lightbulb-outline`, `Colors.lavender`
  - Orientations: bullet `●`, `Colors.mint` for high priority, `Colors.textSecondary` for medium
- **Regenerate button**: bottom, `Colors.textMuted`, `fontSize.sm`, icon `refresh-outline`. Loading: ActivityIndicator inline.
- **Dividers**: 1px `Colors.borderLight` between sections

### States

- **Loading**: skeleton placeholder (3 animated lines)
- **No report**: "Pas encore de rapport cette semaine" + mascot (normal expression), compact card
- **Insufficient data**: "Pas assez de données cette semaine pour générer un rapport" + hint to complete tasks/TLX
- **Error**: "Impossible de charger le rapport" + retry button
- **Regenerating**: overlay with ActivityIndicator on the card

---

## 7. Cron Configuration

The `generate-weekly-report` Edge Function is called by a cron at Monday 6:05 AM UTC for each household.

Implementation: either a Supabase `pg_cron` job that calls the Edge Function via `net.http_post`, or a separate cron Edge Function `cron-weekly-reports` that lists all households and calls `generate-weekly-report` for each.

Recommended: follow the same pattern as `compute-weekly-stats` cron.

---

## 8. Files Impacted

| File | Action | Role |
|---|---|---|
| `supabase/migrations/019_weekly_reports.sql` | Create | Table + index + RLS |
| `supabase/functions/generate-weekly-report/index.ts` | Create | Data collection + Claude API + upsert |
| `src/types/index.ts` | Modify | Add WeeklyReport, AttentionPoint, Insight, Orientation |
| `src/lib/queries/reports.ts` | Create | useWeeklyReport, useRegenerateReport |
| `src/components/dashboard/WeeklyReportCard.tsx` | Create | Card with 4 collapsible sections |
| `app/(app)/dashboard/index.tsx` | Modify | Integrate WeeklyReportCard at top |

**Secret to add:** `ANTHROPIC_API_KEY` in Supabase secrets.

---

## 9. Edge Cases

| Case | Behavior |
|---|---|
| No household | Card not rendered |
| No report for current week | "Pas encore de rapport" + mascot |
| < 3 tasks completed, no TLX | Edge Function returns insufficient_data, card shows hint |
| Anthropic API down | Generation fails gracefully, cached report (if any) remains |
| Regeneration while loading | Button disabled during mutation |
| Report already exists | Upsert overwrites on regeneration |
| Member joins mid-week | Next report includes them (data-driven) |
| Invalid JSON from Claude | Retry once, then fail with error |

---

## 10. What Does NOT Change

- `compute-weekly-stats` Edge Function (unchanged, runs independently at 6:00)
- `weekly_stats`, `tlx_entries`, `tasks`, `alerts` tables (read-only access)
- Existing dashboard KPI cards (remain below the report card)
- Any other screen or module
