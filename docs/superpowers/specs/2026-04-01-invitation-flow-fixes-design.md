# Spec: Invitation Flow Fixes (Palier 1 Stabilization)

**Date:** 2026-04-01
**Status:** Draft
**Scope:** Fix remaining invitation flow issues before starting Palier 2 (Tasks)

---

## Context

Palier 1 (Fondations) is mostly implemented: auth, household creation, invitation flow (magic link + 6-digit codes), join flow. However, several issues remain in the invitation flow that must be resolved before moving to Palier 2.

### Issues addressed

| ID  | Problem | Area |
|-----|---------|------|
| B4  | Post-join flow is abrupt — straight to dashboard with a toast | Join UX |
| B5  | `redeem-invite-code` Edge Function reliability (timeouts, session hangs) | Backend |
| C1  | No onboarding after joining a household | Join UX |
| C3  | Invited user can't set name/avatar before landing in household | Join UX |
| D2  | "Already a member" not handled gracefully, wastes the code | Edge case |
| D3  | Re-invitation creates duplicate active codes for same email | Edge case |

---

## Fix 1: Edge Function Reliability (B5)

### Problem

`redeem-invite-code` does 5 sequential network calls:
1. Validate code in `invitation_codes`
2. Create or find user via `admin.createUser` / `admin.listUsers`
3. Generate magic link via `admin.generateLink`
4. Verify OTP via anon client `auth.verifyOtp`
5. Insert household member

Step 4 uses a separate anon client to verify the hashed token, which is fragile and adds an unnecessary round trip. On the client side, `supabase.auth.setSession` can hang on web.

### Server-side fix

Replace the `generateLink` + anon client `verifyOtp` two-step with a single approach:

- After creating/finding the user, call `admin.generateLink({ type: 'magiclink', email })` to get the `hashed_token`
- Verify the `hashed_token` using the **service role client** instead of an anon client, eliminating the need for a second Supabase client instance
- Remove the anon client creation entirely from the Edge Function

This reduces the critical path from 5 calls to 4 and removes the most fragile step.

### Client-side fix (join-code.tsx)

Make `setSession` more resilient:

- If `setSession` times out (existing 8s race), check if the session was actually set by calling `supabase.auth.getSession()` before declaring failure
- Add one retry attempt before showing an error
- Improve error messaging: distinguish between network timeout vs invalid session vs server error

### Files affected

- `supabase/functions/redeem-invite-code/index.ts` — remove anon client, use service role for OTP verification
- `app/(auth)/join-code.tsx` — improve setSession resilience

---

## Fix 2: Post-Join Welcome Flow (B4 + C1 + C3)

### Problem

After redeeming a code, the user lands on the dashboard with just a toast ("Bienvenue dans le foyer !"). No welcome, no profile setup, no context about what the household contains.

### Design: 3-Step Welcome Flow

#### Step 1 — Welcome screen
- Mascot with happy expression
- "Bienvenue dans [household name] !"
- Avatar row showing existing household members
- Single CTA: "Configurer mon profil"

#### Step 2 — Profile setup
- First name field (pre-filled from `invited_name` if available, editable)
- Color picker for avatar (pick from the existing `MEMBER_COLORS` palette — no photo upload in V1)
- CTA: "Continuer"
- Updates `profiles.full_name` and `household_members.color`

#### Step 3 — Quick orientation
- 3 short bullet points explaining what the household can do:
  - Repartir les taches du foyer equitablement
  - Suivre qui fait quoi, sans prise de tete
  - Mesurer la charge mentale pour mieux s'equilibrer
- Mascot with normal expression
- CTA: "Commencer" — navigates to dashboard

### Navigation

- After successful join (both code-join and magic-link-join), navigate to `/(app)/onboarding/post-join` instead of `/(app)/dashboard`
- A flag `completedJoinOnboardingForHouseholds: string[]` stored in Zustand persisted state (array of household IDs) prevents showing it again for households already onboarded. This allows showing the flow again when joining a different household.
- The flow is skippable (back gesture goes to dashboard) but encouraged

### Not included

- Photo upload (too heavy for V1)
- Dashboard guided tour (existing `tour_slides` system — separate concern)
- Password setup (the `needsPasswordSetup` flow already handles this)

### Files affected

- New: `app/(app)/onboarding/post-join.tsx` — 3-step welcome flow screen
- New: `app/(app)/onboarding/_layout.tsx` — layout for onboarding screens
- `app/(auth)/join-code.tsx` — change post-join navigation target
- `app/join/[token].tsx` — change post-join navigation target
- `src/stores/ui.store.ts` — add `completedJoinOnboardingForHouseholds: string[]` flag (per-household)
- `src/lib/queries/household.ts` — add mutation to update profile name + member color

---

## Fix 3: "Already a Member" Handling (D2)

### Problem

When someone redeems a code but is already in the household:
- The code gets marked as `used`, wasting it
- The user sees a generic toast and is redirected to dashboard

### Server-side fix

In both the `redeem_invitation_code` RPC and the `redeem-invite-code` Edge Function:

- When `already_member` is detected, do NOT mark the code as used
- Return `already_member: true` with the household info (already done)

### Client-side fix

Instead of toast + dashboard redirect, show a dedicated screen:

- Mascot with thinking expression
- "Vous faites deja partie de [household name]"
- Two CTAs:
  - "Aller au dashboard" — navigates to `/(app)/dashboard`
  - "Retour" — navigates back

### Files affected

- `supabase/functions/redeem-invite-code/index.ts` — skip marking code as used when already_member
- `supabase/migrations/016_fix_already_member_code_waste.sql` — new migration to fix RPC so it doesn't mark code as used when already_member
- `app/(auth)/join-code.tsx` — handle `already_member` response with dedicated UI
- `app/join/[token].tsx` — handle `already_member` response with dedicated UI

---

## Fix 4: Re-invitation Duplicate Codes (D3)

### Problem

When sending a new invitation to an email that already has an active (unused + not expired) code for the same household:
- A new code is generated, but the old one remains valid
- Two active codes exist for the same email + household combination
- Client-side check exists but has no server enforcement

### Server-side fix

In the `send-invite-code` Edge Function (or code generation logic):

- Before inserting a new code, expire all existing active codes for the same email + household combination:
  ```sql
  UPDATE invitation_codes
  SET expires_at = NOW()
  WHERE email = $email
    AND household_id = $household_id
    AND used = false
    AND expires_at > NOW();
  ```
- Then insert the new code
- This ensures only one active code per email per household at any time

### Client-side fix

- Update the confirmation dialog copy: "Un code actif existe deja pour [email]. L'ancien code sera annule. Continuer ?"
- Show status badges on recent codes in the invite screen: `Actif` (green) / `Expire` (gray) / `Utilise` (blue)

### Files affected

- `supabase/functions/send-invite-code/index.ts` — expire old codes before generating new one
- `app/(app)/settings/invite.tsx` — update confirmation dialog copy, add status badges to recent codes

---

## Summary of all files affected

### New files
- `app/(app)/onboarding/post-join.tsx`
- `app/(app)/onboarding/_layout.tsx`

### Modified files
- `supabase/functions/redeem-invite-code/index.ts`
- `supabase/functions/send-invite-code/index.ts`
- `app/(auth)/join-code.tsx`
- `app/join/[token].tsx`
- `app/(app)/settings/invite.tsx`
- `src/stores/ui.store.ts`
- `src/lib/queries/household.ts`

### New migration
- `supabase/migrations/016_fix_already_member_code_waste.sql` — fix RPC to not mark code as used when already_member

---

## Implementation order

1. **Fix 1 (B5):** Edge Function reliability — unblocks everything else
2. **Fix 4 (D3):** Re-invitation duplicate codes — small, isolated backend fix
3. **Fix 3 (D2):** Already-a-member handling — backend + client, small scope
4. **Fix 2 (B4+C1+C3):** Post-join welcome flow — largest change, depends on join flow working reliably

---

## How to test

### Fix 1 — Edge Function reliability
- Redeem a valid code on web and mobile
- Verify session is established without timeout
- Test with slow network (throttle in dev tools)
- Verify error messages are specific (not generic "Erreur serveur")

### Fix 2 — Post-join welcome flow
- Join a household via code as a new user → see 3-step welcome
- Join a household via magic link as a new user → see 3-step welcome
- Complete the flow → land on dashboard with profile set
- Close app mid-flow, reopen → flow resumes or skips to dashboard
- Join again (different household) → flow shows again for that household

### Fix 3 — Already a member
- Redeem a code for a household you're already in → see dedicated "already member" screen, not a toast
- Verify the code is NOT marked as used (can be redeemed by someone else)

### Fix 4 — Re-invitation
- Send code to email@test.com → active code created
- Send another code to email@test.com for same household → old code expired, new one active
- Verify old code no longer works when redeemed
- Check invite screen shows correct status badges (Actif/Expire/Utilise)

---

## Risks

- **Session establishment refactor (Fix 1):** Changing how the session is created could break existing join flows. Must test both code-join and magic-link-join paths thoroughly.
- **Post-join navigation change (Fix 2):** Redirecting to onboarding instead of dashboard changes the critical path. Must ensure the flag is persisted correctly so users don't get stuck in a loop.
- **Migration (Fix 3):** Replacing the RPC — must be tested against existing data to ensure no regression.
