# Architecture / Stack

## Mobile (current focus)
- **Runtime**: Expo SDK 55, React Native 0.83
- **Language**: TypeScript strict
- **Routing**: expo-router 4 (file-based, typed routes)
- **State**: Zustand 5 — `auth.store`, `household.store`, `ui.store`
- **Data fetching**: TanStack Query v5 — hooks in `src/lib/queries/`
- **Forms**: react-hook-form + zod
- **Charts**: victory-native
- **Date handling**: dayjs (locale fr)

## Backend
- **Platform**: Supabase (hosted Postgres)
- **Auth**: Supabase Auth (email/password)
- **Database**: Postgres with Row Level Security (RLS)
- **Migrations**: `supabase/migrations/` — sequential, idempotent
- **Edge Functions**: Deno runtime, `supabase/functions/<name>/index.ts`
- **Scheduled jobs**: Edge Functions triggered by cron (Supabase Dashboard)
- **Email**: Resend API via Edge Function `send-household-invite`
- **Storage**: Supabase Storage (avatar images)

## Edge Functions
| Function | Purpose |
|---|---|
| `send-household-invite` | Send invitation email via Resend |
| `compute-weekly-stats` | Calculate household imbalance stats |
| `mark-overdue-tasks` | Mark tasks as overdue (cron) |
| `morning-digest` | Push notification digest (cron) |

## Design System
- Tokens: `src/constants/tokens.ts` (Colors, Spacing, BorderRadius, Typography, Shadows)
- Components: `src/components/ui/` (Button, Card, Input, Text, Avatar, Badge, Toast, Mascot...)
- No hardcoded values — always use tokens

## Key Directories
```
app/           Expo Router routes (screens)
src/
  components/  UI + feature components
  constants/   Design tokens
  hooks/       Custom React hooks
  lib/
    queries/   TanStack Query hooks (business logic)
    supabase/  Client + DB types
  stores/      Zustand state
  types/       Shared TypeScript types
  utils/       Validation, helpers
supabase/
  functions/   Edge Functions
  migrations/  SQL migrations
  seed/        Dev seed data
.claude/
  settings.json  Permissions & env
  agents/        Sub-agents
  skills/        Slash command skills
docs/
  product/       Vision, DoD, feature rules
  architecture/  Stack, decisions
  qa/            Test checklist
```

## Project principles
- explicit schemas and migrations
- deterministic calculations (weekly stats, TLX)
- household data isolation at DB level (RLS)
- no business logic in UI — hooks and services only
- strong typing everywhere
- premium, calm UX — never noisy
