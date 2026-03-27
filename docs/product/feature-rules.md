# Feature Rules

Rules that apply to every feature in Keurzen, without exception.

## Scope

- implement only what was asked
- do not refactor adjacent code
- do not rename things that are not broken
- do not add dependencies unless strictly necessary

## Typing

- strong TypeScript everywhere
- no `any`, no type assertions without justification
- types in `src/types/index.ts` for shared domain types
- Supabase DB types in `src/lib/supabase/database.types.ts` (auto-generated)

## UI

- use only tokens from `src/constants/tokens.ts` — no hardcoded colors, spacing, or radius
- use existing UI components from `src/components/ui/`
- every screen must handle: loading state, empty state, error state
- touch targets ≥ 44px
- no visual noise — calm, premium tone

## Data

- business logic lives in `src/lib/queries/` (TanStack Query hooks)
- stores (Zustand) are for UI-accessible state only — not for API calls
- invalidate query cache on successful mutations
- use `useMutation` for writes, `useQuery` for reads

## Forms

- react-hook-form + zod for all form validation
- show field-level errors inline, not only via toast
- disable submit button while loading

## Backend

- all writes go through Supabase client (RLS enforced)
- SECURITY DEFINER RPCs for actions that bypass RLS intentionally
- Edge Functions for: email sending, scheduled jobs, heavy computation
- never use service role key client-side

## Household isolation

- every query must be scoped to `household_id`
- RLS policies enforce isolation at DB level
- never expose data across households

## Naming

Use the product vocabulary:
- `household` not `group` / `team` / `space`
- `member` not `user` (in UI copy)
- `task` not `todo` / `item`
- `timeLog` not `entry` / `record`
- `tlxEntry` not `survey`
- `weeklyStat` not `report`
- `invitation` not `invite` (in code)

## Tests

- unit tests for: TLX score calculation, validation utilities, stat computations
- test files in `src/__tests__/`
- no mocking of Supabase for integration paths — test against real DB in dev

## Output

Every feature implementation ends with:
- list of files changed
- risks and follow-ups
- how to test (manual steps)
