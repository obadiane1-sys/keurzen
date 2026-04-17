# Keurzen — Auth, invitation, signup, deep-link rules

**Load this when working on**: `_layout.tsx` routing · `(auth)/*` screens · `join/[token].tsx` · signup flow · Magic Link · invitation edge functions.

---

## Navigation logic — strict order in `_layout.tsx`

```typescript
// 1. No session → login
if (!session) → redirect('/(auth)/login')

// 2. Session + password to set → security setup
if (session && needsPasswordSetup) → redirect('/(app)/settings/security')

// 3. Normal session → dashboard
if (session) → redirect('/(app)/dashboard')
```

`needsPasswordSetup` is a Zustand flag in `authStore`. **Never put this flag in the routing layer itself.**

---

## Magic Link invitation flow

Mandatory sequence in `app/keurzen/join/[token].tsx`:

1. Read token from params
2. Call `accept-invitation` edge function
3. On success → `authStore.setNeedsPasswordSetup(true)`
4. `router.replace('/(app)/settings/security')`

**Never navigate to the dashboard from this file.** The `_layout.tsx` intercepts and confirms redirection via `needsPasswordSetup`.

---

## Signup rules

- Always check the return of `supabase.auth.signUp()`.
- If email already exists → show: *"Un compte existe déjà avec cette adresse. Connectez-vous."*
- **Never show "Compte créé" if creation failed.**
- Handle both cases: email confirmation enabled / disabled.
- Email field pre-filled from an invitation must be locked (non-editable).

---

## Invitation deletion

- Cross on pending invitation → confirmation modal with the concerned email.
- Confirmation → `DELETE FROM invitations WHERE id = $1` only.
- **Zero Auth revocation logic.** Never call any Auth revocation when deleting an invitation.
- Refresh the list after deletion.

---

## Deep link configuration

- Scheme `keurzen://` must be declared in `app.json`.
- Magic Link `redirectTo` must point to `keurzen://keurzen/join`.
- Supabase Dashboard Redirect URLs must include `keurzen://`.
- **Never test deep links on simulator — physical device only.**

---

## Known bugs (track status before claiming a fix)

- Invitation flow: missing post-signup redirect.
- Login failure after re-signup with same credentials.

---

## Hard blocker for App Store / RGPD

Account deletion flow — not optional. See `docs/specs/account-deletion.md` when implementing.
