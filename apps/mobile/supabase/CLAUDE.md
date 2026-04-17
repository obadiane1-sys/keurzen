# Keurzen — Supabase backend rules

**Load this when working on**: `apps/mobile/supabase/migrations/**` · `apps/mobile/supabase/functions/**` · any RPC · RLS policy · database schema change.

---

## Migrations — immutability

- **Never modify an existing migration file.** Create a new one that corrects it:
  ```bash
  npx supabase migration new fix_<previous_name>
  ```
- Migrations must be **idempotent**: use `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`.
- Every new table → enable RLS immediately: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Run `npx supabase db lint` before committing a migration.

---

## RLS policies

- Every new table needs SELECT / INSERT / UPDATE / DELETE policies scoped to household members.
- Reference the household membership table, never trust client-provided `household_id`.
- Test policies with a non-owner user before merging.

---

## RPC / functions — security

- `SECURITY DEFINER` RPCs **must** include `SET search_path = public`.
- **Never accept `user_id` as an RPC parameter** — always use `auth.uid()`.
- Edge Functions use `service_role` key (from secrets), **never the anon key**.
- Invitation tokens must be invalidated after use (one-shot).

---

## Business invariants

- **No duplicate weekly stats** — use a unique constraint on `(household_id, week_start)`.
- **Weekly imbalance logic must be deterministic** — same inputs → same output.
- **Notifications must be deduplicated** — check for existing pending notification before creating.
- **Overdue task marking must be safe** — idempotent, tolerant to re-runs.
- **One TLX entry per user per week** — enforce at schema level.
- **Onboarding displayed only once after signup** — flag stored on profile.

---

## Commands

```bash
npx supabase db push                      # apply migrations
npx supabase functions deploy <name>      # deploy Edge Function
npx supabase functions logs <name> --tail # tail logs
npx supabase secrets list                 # list secrets (never print values)
```

---

## Don't

- Don't touch or print secrets.
- Don't bypass RLS in client code (no `service_role` in mobile/web apps).
- Don't add columns without a migration file.
- Don't `DROP TABLE` or `TRUNCATE` without an explicit Ouss instruction.
