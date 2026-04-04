# Invitation Flow Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the remaining Palier 1 invitation flow issues — Edge Function reliability, post-join welcome onboarding, "already a member" handling, and duplicate code prevention — so the foundations are solid before starting Palier 2 (Tasks).

**Architecture:** Four independent fixes applied sequentially. Fix 1 (backend reliability) unblocks the rest. Fix 4 (duplicate codes) and Fix 3 (already-member) are small isolated changes. Fix 2 (post-join onboarding) is the largest, adding a new 3-step screen flow after joining a household.

**Tech Stack:** Supabase Edge Functions (Deno), Expo Router, React Native, Zustand, TanStack Query

**Spec:** `docs/superpowers/specs/2026-04-01-invitation-flow-fixes-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `app/(app)/onboarding/_layout.tsx` | Stack layout for onboarding screens |
| `app/(app)/onboarding/post-join.tsx` | 3-step welcome flow after joining a household |

### Modified files
| File | Changes |
|------|---------|
| `supabase/functions/redeem-invite-code/index.ts` | Remove anon client, use service role for OTP verify; skip marking code as used when already_member |
| `supabase/functions/send-invite-code/index.ts` | Expire old active codes before generating new one |
| `app/(auth)/join-code.tsx` | Resilient setSession, already-member UI, navigate to post-join onboarding |
| `app/join/[token].tsx` | Already-member UI, navigate to post-join onboarding |
| `src/stores/ui.store.ts` | Add `completedJoinOnboardingForHouseholds` persisted state |
| `src/lib/queries/household.ts` | Add `useUpdateProfile` mutation for name + color update |
| `app/(app)/settings/invite.tsx` | Updated re-invitation dialog copy, status badges on recent codes |

### New migration
| File | Purpose |
|------|---------|
| `supabase/migrations/016_fix_already_member_code_waste.sql` | Fix RPC to not mark code as used when already_member |

---

## Task 1: Fix Edge Function Reliability (B5 — Server Side)

**Files:**
- Modify: `supabase/functions/redeem-invite-code/index.ts`

- [ ] **Step 1: Remove anon client and use service role for OTP verification**

Replace the current `generateLink` + anon client `verifyOtp` pattern. In `supabase/functions/redeem-invite-code/index.ts`, replace lines 131-157 (the session generation block) with:

```typescript
  // ── Generer une session via magic link (service role only) ──────────────

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink error:', linkError?.message);
    return json({ error: 'Impossible de generer la session' }, 500);
  }

  // Verify the OTP using the same admin client (service role)
  // This eliminates the need for a separate anon client
  const { data: otpData, error: otpError } = await adminClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (otpError || !otpData.session) {
    console.error('verifyOtp error:', otpError?.message);
    return json({ error: 'Impossible d\'etablir la session' }, 500);
  }
```

Also remove these lines that are no longer needed (the anon client creation around lines 144-147):

```typescript
  // DELETE THIS BLOCK:
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
```

- [ ] **Step 2: Deploy and test the Edge Function**

Run:
```bash
npx supabase functions deploy redeem-invite-code --no-verify-jwt
```

Test manually: generate a code via the invite screen, then redeem it in the join-code screen. Verify the session is established.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/redeem-invite-code/index.ts
git commit -m "$(cat <<'EOF'
fix: use service role client for OTP verification in redeem-invite-code

Removes the fragile anon client + verifyOtp pattern. Now uses the
admin (service role) client for the entire flow, eliminating one
client instantiation and reducing failure points.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix Edge Function Reliability (B5 — Client Side)

**Files:**
- Modify: `app/(auth)/join-code.tsx`

- [ ] **Step 1: Make setSession resilient with fallback check**

In `app/(auth)/join-code.tsx`, replace the current `setSession` block (lines 154-167) with a more resilient version:

```typescript
      // Establish session if we don't already have one
      if (!session && payload.access_token && payload.refresh_token) {
        let sessionEstablished = false;

        try {
          await Promise.race([
            supabase.auth.setSession({
              access_token: payload.access_token,
              refresh_token: payload.refresh_token,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 8_000),
            ),
          ]);
          sessionEstablished = true;
        } catch {
          // setSession may have succeeded despite timeout — verify
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            sessionEstablished = true;
          } else {
            // One retry attempt
            try {
              await Promise.race([
                supabase.auth.setSession({
                  access_token: payload.access_token,
                  refresh_token: payload.refresh_token,
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('timeout')), 8_000),
                ),
              ]);
              sessionEstablished = true;
            } catch {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              sessionEstablished = !!retrySession;
            }
          }
        }

        if (!sessionEstablished) {
          setError('Impossible d\'etablir la session. Verifiez votre connexion et reessayez.');
          setIsJoining(false);
          return;
        }
      }
```

- [ ] **Step 2: Test on web (where setSession is most fragile)**

Run: `npx expo start --web`

Test: redeem a valid code. Verify session is established without timeout errors. Throttle network in dev tools to test the retry path.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/join-code.tsx
git commit -m "$(cat <<'EOF'
fix: add resilient setSession with fallback check and retry

If setSession times out, checks if the session was actually set
before retrying. Adds one retry attempt before showing an error.
Improves reliability on web where setSession can hang.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Expire Old Codes on Re-invitation (D3 — Server Side)

**Files:**
- Modify: `supabase/functions/send-invite-code/index.ts`

- [ ] **Step 1: Add code expiration before generating new code**

In `supabase/functions/send-invite-code/index.ts`, add the following block right before the code generation loop (before line 221 `let code: string = '';`):

```typescript
  // ── Expire any existing active codes for this email + household ───────

  const { error: expireError } = await adminClient
    .from('invitation_codes')
    .update({ expires_at: new Date().toISOString() })
    .eq('email', email)
    .eq('household_id', household_id)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString());

  if (expireError) {
    console.error('Failed to expire old codes:', expireError.message);
    // Non-blocking — continue with new code generation
  }
```

- [ ] **Step 2: Deploy and test**

Run:
```bash
npx supabase functions deploy send-invite-code --no-verify-jwt
```

Test: send a code to test@example.com, then send another code to test@example.com for the same household. Verify the first code is expired (check `invitation_codes` table).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-invite-code/index.ts
git commit -m "$(cat <<'EOF'
fix: expire old active codes before generating new invitation code

When sending a new invite to an email that already has an active code
for the same household, the old code is now expired first. This ensures
only one active code per email per household at any time.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update Re-invitation UI (D3 — Client Side)

**Files:**
- Modify: `app/(app)/settings/invite.tsx`

- [ ] **Step 1: Update confirmation dialog copy**

In `app/(app)/settings/invite.tsx`, replace the confirmation dialog messages (lines 96-101) with updated copy:

```typescript
  const handleSend = async () => {
    if (checkDuplicate()) {
      const trimmedEmail = email.trim().toLowerCase();
      if (Platform.OS === 'web') {
        if (window.confirm(`Un code actif existe deja pour ${trimmedEmail}. L'ancien code sera annule. Continuer ?`)) {
          await doSend();
        }
      } else {
        Alert.alert(
          'Code existant',
          `Un code actif existe deja pour ${trimmedEmail}. L'ancien code sera annule. Continuer ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Renvoyer', onPress: doSend },
          ],
        );
      }
      return;
    }
    await doSend();
  };
```

- [ ] **Step 2: Add status badges to recent codes**

In `app/(app)/settings/invite.tsx`, add a helper function and a section to display recent codes with status badges. Add this after the `handleCopyCode` function (around line 114):

```typescript
  const getCodeStatus = (code: InvitationCode): { label: string; color: string } => {
    if (code.used) return { label: 'Utilise', color: Colors.blue };
    if (new Date(code.expires_at) < new Date()) return { label: 'Expire', color: Colors.textMuted };
    return { label: 'Actif', color: Colors.mint };
  };
```

Add the import for `InvitationCode` at the top of the file:

```typescript
import type { InvitationCode } from '../../../src/types';
```

Then, in the JSX, after the success card's "Inviter une autre personne" button (around line 188), add a recent codes section inside the `sentResult` conditional:

```typescript
            {/* Recent codes */}
            {recentCodes && recentCodes.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Codes recents</Text>
                {recentCodes.slice(0, 5).map((c) => {
                  const status = getCodeStatus(c);
                  return (
                    <View key={c.id} style={styles.recentRow}>
                      <Text style={styles.recentEmail}>{c.email ?? 'Sans email'}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
```

Add these styles to the StyleSheet:

```typescript
  recentSection: { marginTop: Spacing['2xl'], width: '100%' },
  recentTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.md },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
```

- [ ] **Step 3: Also show recent codes section in the form view (not just success)**

Move the recent codes section to appear after both the success card AND the form. Replace the structure so the recent codes block appears outside the `sentResult` ternary, right before `bottomNote`:

```typescript
        {/* Recent codes — always visible */}
        {recentCodes && recentCodes.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Codes recents</Text>
            {recentCodes.slice(0, 5).map((c) => {
              const status = getCodeStatus(c);
              return (
                <View key={c.id} style={styles.recentRow}>
                  <Text style={styles.recentEmail}>{c.email ?? 'Sans email'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.bottomNote}>...</Text>
```

- [ ] **Step 4: Test the UI**

Run: `npx expo start --tunnel`

Test:
1. Open invite screen with no recent codes → no section shown
2. Send a code → success state shows, recent codes section appears with "Actif" badge
3. Send another code to same email → confirmation dialog with new copy → old code shows "Expire"

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/settings/invite.tsx
git commit -m "$(cat <<'EOF'
fix: update re-invitation dialog copy and add status badges

Updated confirmation dialog to inform user the old code will be
cancelled. Added status badges (Actif/Expire/Utilise) to recent
codes list on invite screen for better visibility.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Fix "Already a Member" — Server Side (D2)

**Files:**
- Modify: `supabase/functions/redeem-invite-code/index.ts`
- Create: `supabase/migrations/016_fix_already_member_code_waste.sql`

- [ ] **Step 1: Fix the Edge Function to not mark code as used when already_member**

In `supabase/functions/redeem-invite-code/index.ts`, move the "mark code as used" block inside the `else` branch (only when actually joining). Replace the current block (lines 160-199) with:

```typescript
  // ── Rejoindre le foyer ────────────────────────────────────────────────

  const { data: existingMember } = await adminClient
    .from('household_members')
    .select('id')
    .eq('household_id', invite.household_id)
    .eq('user_id', userId)
    .maybeSingle();

  let alreadyMember = false;

  if (existingMember) {
    alreadyMember = true;
    // Do NOT mark the code as used — it can still be used by someone else
  } else {
    const { count } = await adminClient
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', invite.household_id);

    const color = MEMBER_COLORS[((count ?? 0) % MEMBER_COLORS.length)];

    const { error: insertError } = await adminClient
      .from('household_members')
      .insert({
        household_id: invite.household_id,
        user_id: userId,
        role: 'member',
        color,
      });

    if (insertError) {
      console.error('insert member error:', insertError.message);
      return json({ error: 'Impossible de rejoindre le foyer' }, 500);
    }

    // Only mark code as used when actually joining
    await adminClient
      .from('invitation_codes')
      .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('id', invite.id);
  }
```

- [ ] **Step 2: Create migration to fix the RPC**

Create `supabase/migrations/016_fix_already_member_code_waste.sql`:

```sql
-- Fix: do not mark invitation code as used when user is already a member.
-- The code should remain available for the intended recipient.

CREATE OR REPLACE FUNCTION public.redeem_invitation_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code        invitation_codes%ROWTYPE;
  v_household   households%ROWTYPE;
  v_member_count INTEGER;
  v_color       TEXT;
  v_colors      TEXT[] := ARRAY[
    '#FFA69E', '#88D4A9', '#AFCBFF', '#BCA7FF',
    '#FCD34D', '#6EE7B7', '#F9A8D4', '#93C5FD'
  ];
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifie');
  END IF;

  -- Recherche du code (trim + exact match)
  SELECT * INTO v_code
    FROM public.invitation_codes
    WHERE code = trim(p_code)
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Code invalide');
  END IF;

  IF v_code.used THEN
    RETURN jsonb_build_object('error', 'Ce code a deja ete utilise');
  END IF;

  IF v_code.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Ce code a expire');
  END IF;

  -- Verifier si deja membre — do NOT mark code as used
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_code.household_id AND user_id = v_uid
  ) THEN
    SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;
    RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', TRUE);
  END IF;

  -- Attribuer une couleur
  SELECT COUNT(*) INTO v_member_count
    FROM public.household_members WHERE household_id = v_code.household_id;
  v_color := v_colors[((v_member_count) % array_length(v_colors, 1)) + 1];

  -- Inserer le membre
  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES (v_code.household_id, v_uid, 'member', v_color);

  -- Marquer le code comme utilise (only when actually joining)
  UPDATE public.invitation_codes
    SET used = true, used_by = v_uid, used_at = now()
    WHERE id = v_code.id;

  -- Retourner le foyer
  SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;

  RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', FALSE);
END;
$$;
```

- [ ] **Step 3: Apply migration and deploy**

Run:
```bash
npx supabase db push
npx supabase functions deploy redeem-invite-code --no-verify-jwt
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/016_fix_already_member_code_waste.sql supabase/functions/redeem-invite-code/index.ts
git commit -m "$(cat <<'EOF'
fix: do not waste invitation code when user is already a member

Both the Edge Function and the RPC now skip marking the code as used
when the user is already a household member. The code remains available
for the intended recipient.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Fix "Already a Member" — Client Side (D2)

**Files:**
- Modify: `app/(auth)/join-code.tsx`
- Modify: `app/join/[token].tsx`

- [ ] **Step 1: Add already-member UI state to join-code.tsx**

In `app/(auth)/join-code.tsx`, add a new state variable after the existing state declarations (around line 33):

```typescript
  const [alreadyMemberHousehold, setAlreadyMemberHousehold] = useState<string | null>(null);
```

Then, in the `handleSubmit` success handler (around line 171), replace the `already_member` handling:

```typescript
      if (payload.already_member) {
        setAlreadyMemberHousehold(payload.household?.name ?? 'ce foyer');
        setIsJoining(false);
        return;
      }
```

- [ ] **Step 2: Add the already-member screen render in join-code.tsx**

Add a new render block before the main return (before line 190 `return (`), after the `handleSubmit` function:

```typescript
  // ─── Already member screen ──────────────────────────────────────────────────

  if (alreadyMemberHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.alreadyMemberContainer}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.alreadyMemberTitle}>
            Deja membre
          </Text>
          <Text variant="body" color="secondary" style={styles.alreadyMemberSubtitle}>
            Vous faites deja partie de {alreadyMemberHousehold}.
          </Text>
          <Button
            label="Aller au dashboard"
            onPress={() => router.replace('/(app)/dashboard')}
            fullWidth
            style={styles.alreadyMemberBtn}
          />
          <Button
            label="Retour"
            variant="ghost"
            onPress={() => {
              setAlreadyMemberHousehold(null);
              setDigits(Array(CODE_LENGTH).fill(''));
            }}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }
```

Add these styles to the StyleSheet:

```typescript
  alreadyMemberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  alreadyMemberTitle: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  alreadyMemberSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  alreadyMemberBtn: {
    marginTop: Spacing.lg,
  },
```

- [ ] **Step 3: Add already-member handling to join/[token].tsx**

In `app/join/[token].tsx`, update the `joinByToken` success handler (around line 103). Replace the current `.then(...)` block:

```typescript
    joinByToken
      .mutateAsync(token)
      .then(({ alreadyMember, household }) => {
        setPendingInviteToken(null);
        if (alreadyMember) {
          setStatus('already_member');
          setHouseholdName(household?.name ?? 'ce foyer');
        } else {
          showToast('Bienvenue dans le foyer !', 'success');
          router.replace('/(app)/dashboard');
        }
      })
```

Add the new state variables at the top of the component (after line 34):

```typescript
  const [householdName, setHouseholdName] = useState('');
```

Update the status type (line 32):

```typescript
  const [status, setStatus] = useState<'waiting' | 'joining' | 'error' | 'already_member'>('waiting');
```

Add the already-member render block before the error render (before line 134):

```typescript
  if (status === 'already_member') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.title}>Deja membre</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Vous faites deja partie de {householdName}.
          </Text>
          <Button
            label="Aller au dashboard"
            variant="primary"
            onPress={() => router.replace('/(app)/dashboard')}
            style={styles.btn}
          />
          <Button
            label="Retour a l'accueil"
            variant="ghost"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }
```

- [ ] **Step 4: Test both flows**

Test join-code.tsx: enter a code for a household you're already in → see "Deja membre" screen with Mascot, dashboard button, and back button.

Test join/[token].tsx: open a magic link for a household you're already in → see "Deja membre" screen.

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/join-code.tsx app/join/\[token\].tsx
git commit -m "$(cat <<'EOF'
fix: show dedicated screen when user is already a household member

Instead of a toast + dashboard redirect, both join-code and join-token
screens now show a clear "Deja membre" screen with Mascot and options
to navigate to dashboard or go back.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add Post-Join Onboarding Store State

**Files:**
- Modify: `src/stores/ui.store.ts`

- [ ] **Step 1: Add completedJoinOnboardingForHouseholds to the store**

In `src/stores/ui.store.ts`, add localStorage helpers for the new state. After the existing `INVITE_CODE_KEY` constant (line 4), add:

```typescript
const ONBOARDING_KEY = 'keurzen_completed_join_onboarding';

function readOnboardingFromStorage(): string[] {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(ONBOARDING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function writeOnboardingToStorage(ids: string[]): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(ids));
  }
}
```

Add to the `UiState` interface (after `setPendingInviteCode`):

```typescript
  // Household IDs for which the user has completed the post-join onboarding
  completedJoinOnboardingForHouseholds: string[];
  markJoinOnboardingComplete: (householdId: string) => void;
```

Add to the store creation (after `setPendingInviteCode` implementation):

```typescript
  completedJoinOnboardingForHouseholds: readOnboardingFromStorage(),
  markJoinOnboardingComplete: (householdId) => {
    set((state) => {
      const updated = [...state.completedJoinOnboardingForHouseholds, householdId];
      writeOnboardingToStorage(updated);
      return { completedJoinOnboardingForHouseholds: updated };
    });
  },
```

Consumers check directly via the array:

```typescript
const completedHouseholds = useUiStore((s) => s.completedJoinOnboardingForHouseholds);
const hasCompleted = completedHouseholds.includes(householdId);
// Or outside React: useUiStore.getState().completedJoinOnboardingForHouseholds.includes(id)
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/ui.store.ts
git commit -m "$(cat <<'EOF'
feat: add completedJoinOnboardingForHouseholds to UI store

Tracks which households the user has completed post-join onboarding
for. Persisted in localStorage on web. Supports showing onboarding
again when joining a different household.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add Profile Update Mutation

**Files:**
- Modify: `src/lib/queries/household.ts`

- [ ] **Step 1: Add useUpdateMemberProfile mutation**

In `src/lib/queries/household.ts`, add the following mutation after `useHouseholdMembers` (after line 81):

```typescript
// ─── Update Profile (name + member color) ────────────────────────────────────

interface UpdateMemberProfileInput {
  fullName: string;
  color: string;
}

export function useUpdateMemberProfile() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ fullName, color }: UpdateMemberProfileInput) => {
      if (!user) throw new Error('Non authentifie');
      if (!currentHousehold) throw new Error('Aucun foyer');

      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) throw new Error(profileError.message);

      // Update member color
      const { error: memberError } = await supabase
        .from('household_members')
        .update({ color })
        .eq('household_id', currentHousehold.id)
        .eq('user_id', user.id);

      if (memberError) throw new Error(memberError.message);
    },
    onSuccess: async () => {
      if (!currentHousehold) return;

      // Refresh members list in store
      const { data: members } = await supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', currentHousehold.id);

      if (members) setMembers(members as HouseholdMember[]);

      qc.invalidateQueries({ queryKey: householdKeys.members(currentHousehold.id) });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries/household.ts
git commit -m "$(cat <<'EOF'
feat: add useUpdateMemberProfile mutation for name + color

Used by the post-join onboarding flow to let invited users set their
name and pick a color before landing on the dashboard.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create Post-Join Onboarding Screen

**Files:**
- Create: `app/(app)/onboarding/_layout.tsx`
- Create: `app/(app)/onboarding/post-join.tsx`

- [ ] **Step 1: Create the onboarding layout**

Create `app/(app)/onboarding/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
```

- [ ] **Step 2: Create the post-join screen**

Create `app/(app)/onboarding/post-join.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Loader } from '../../../src/components/ui/Loader';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { useUpdateMemberProfile } from '../../../src/lib/queries/household';

const STEPS = ['welcome', 'profile', 'orientation'] as const;
type Step = typeof STEPS[number];

export default function PostJoinOnboardingScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { user } = useAuthStore();
  const { markJoinOnboardingComplete } = useUiStore();
  const updateProfile = useUpdateMemberProfile();

  const [step, setStep] = useState<Step>('welcome');

  // Profile setup state
  const currentMember = members.find((m) => m.user_id === user?.id);
  const [fullName, setFullName] = useState(
    currentMember?.profile?.full_name ?? ''
  );
  const [selectedColor, setSelectedColor] = useState(
    currentMember?.color ?? Colors.memberColors[0]
  );

  const householdName = currentHousehold?.name ?? 'votre foyer';
  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  const handleFinish = () => {
    if (currentHousehold) {
      markJoinOnboardingComplete(currentHousehold.id);
    }
    router.replace('/(app)/dashboard');
  };

  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) return;

    try {
      await updateProfile.mutateAsync({ fullName: trimmedName, color: selectedColor });
      setStep('orientation');
    } catch {
      // Silently continue — profile can be updated later in settings
      setStep('orientation');
    }
  };

  // ─── Step 1: Welcome ──────────────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.centered} showsVerticalScrollIndicator={false}>
          <Mascot size={120} expression="happy" />

          <Text variant="h2" style={styles.title}>
            Bienvenue dans {householdName} !
          </Text>

          {otherMembers.length > 0 && (
            <View style={styles.memberRow}>
              {otherMembers.slice(0, 4).map((m) => (
                <Avatar
                  key={m.id}
                  name={m.profile?.full_name}
                  color={m.color}
                  size="lg"
                />
              ))}
            </View>
          )}

          {otherMembers.length > 0 && (
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {otherMembers.map((m) => m.profile?.full_name ?? 'Membre').join(', ')}{' '}
              {otherMembers.length === 1 ? 'vous attend' : 'vous attendent'} !
            </Text>
          )}

          <Button
            label="Configurer mon profil"
            onPress={() => setStep('profile')}
            fullWidth
            size="lg"
            style={styles.cta}
          />

          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text variant="bodySmall" color="muted">Passer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step 2: Profile setup ────────────────────────────────────────────────

  if (step === 'profile') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.profileContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text variant="h2" style={styles.profileTitle}>Votre profil</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Comment souhaitez-vous apparaitre dans le foyer ?
          </Text>

          {/* Preview */}
          <View style={styles.previewRow}>
            <Avatar name={fullName || '?'} color={selectedColor} size="xl" />
            <Text variant="h4" style={{ marginTop: Spacing.sm }}>
              {fullName || 'Votre prenom'}
            </Text>
          </View>

          {/* Name input */}
          <TextInput
            style={styles.input}
            placeholder="Prenom"
            placeholderTextColor={Colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Color picker */}
          <Text variant="label" style={styles.colorLabel}>Couleur</Text>
          <View style={styles.colorRow}>
            {Colors.memberColors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                activeOpacity={0.7}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Continuer"
            onPress={handleSaveProfile}
            isLoading={updateProfile.isPending}
            fullWidth
            size="lg"
            style={styles.cta}
            disabled={!fullName.trim()}
          />

          <TouchableOpacity onPress={() => setStep('orientation')} style={styles.skipBtn}>
            <Text variant="bodySmall" color="muted">Passer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step 3: Orientation ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.centered} showsVerticalScrollIndicator={false}>
        <Mascot size={100} expression="calm" />

        <Text variant="h2" style={styles.title}>
          Keurzen en 3 points
        </Text>

        <View style={styles.bulletList}>
          <BulletPoint
            icon="swap-horizontal-outline"
            text="Repartir les taches du foyer equitablement"
          />
          <BulletPoint
            icon="people-outline"
            text="Suivre qui fait quoi, sans prise de tete"
          />
          <BulletPoint
            icon="heart-outline"
            text="Mesurer la charge mentale pour mieux s'equilibrer"
          />
        </View>

        <Button
          label="Commencer"
          onPress={handleFinish}
          fullWidth
          size="lg"
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Bullet Point Component ───────────────────────────────────────────────────

function BulletPoint({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIcon}>
        <Ionicons name={icon} size={20} color={Colors.mint} />
      </View>
      <Text variant="body" style={styles.bulletText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  memberRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  cta: {
    marginTop: Spacing.xl,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },

  // Profile step
  profileContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
  },
  profileTitle: {
    marginBottom: Spacing.xs,
  },
  previewRow: {
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.xl,
  },
  colorLabel: {
    marginBottom: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.navy,
  },

  // Orientation step
  bulletList: {
    width: '100%',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bulletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mint + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/onboarding/_layout.tsx app/\(app\)/onboarding/post-join.tsx
git commit -m "$(cat <<'EOF'
feat: add 3-step post-join onboarding flow

Welcome screen with mascot + member list, profile setup (name + color
picker), and quick orientation (3 bullet points). Skippable at each
step. Navigates to dashboard on completion.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Wire Post-Join Navigation

**Files:**
- Modify: `app/(auth)/join-code.tsx`
- Modify: `app/join/[token].tsx`

- [ ] **Step 1: Update join-code.tsx to navigate to onboarding**

In `app/(auth)/join-code.tsx`, replace the post-join navigation (the `router.replace('/(app)/dashboard')` line after the non-already-member success path, around line 177):

```typescript
      // Navigate to post-join onboarding (or dashboard if already completed)
      const householdId = (payload.household as { id?: string })?.id;
      if (householdId) {
        const { completedJoinOnboardingForHouseholds } = useUiStore.getState();
        if (completedJoinOnboardingForHouseholds.includes(householdId)) {
          router.replace('/(app)/dashboard');
        } else {
          router.replace('/(app)/onboarding/post-join');
        }
      } else {
        router.replace('/(app)/dashboard');
      }
```

Remove the `showToast('Bienvenue dans le foyer !', 'success')` call that precedes this navigation — the onboarding screen itself serves as the welcome.

- [ ] **Step 2: Update join/[token].tsx to navigate to onboarding**

In `app/join/[token].tsx`, update the non-already-member success handler. Replace:

```typescript
          showToast('Bienvenue dans le foyer !', 'success');
          router.replace('/(app)/dashboard');
```

With:

```typescript
          const { completedJoinOnboardingForHouseholds } = useUiStore.getState();
          if (household && completedJoinOnboardingForHouseholds.includes(household.id)) {
            showToast('Bienvenue dans le foyer !', 'success');
            router.replace('/(app)/dashboard');
          } else {
            router.replace('/(app)/onboarding/post-join');
          }
```

- [ ] **Step 3: Test the full flow**

Test as a new user:
1. Get an invite code from another member
2. Enter code in join-code screen
3. Session established → navigate to post-join onboarding (NOT dashboard)
4. Step 1: Welcome with mascot + member list → "Configurer mon profil"
5. Step 2: Enter name, pick color → "Continuer"
6. Step 3: See 3 bullet points → "Commencer" → dashboard

Test as a returning user:
1. Get another code for the same household
2. Enter code → see "Deja membre" screen (from Task 6)

Test skip:
1. On step 1, tap "Passer" → go to dashboard
2. Join a different household → onboarding shows again

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/join-code.tsx app/join/\[token\].tsx
git commit -m "$(cat <<'EOF'
feat: wire post-join navigation to onboarding flow

After successfully joining a household, users are now redirected to
the onboarding flow instead of the dashboard. Users who have already
completed onboarding for that household go directly to dashboard.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Final Integration Test

**Files:** None (testing only)

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: no new errors

- [ ] **Step 2: Run tests**

```bash
npm run test
```

Expected: all existing tests pass

- [ ] **Step 3: Full manual test — Code join flow**

1. User A creates a household and sends an invite code to User B
2. User B enters the code → session established (no timeout)
3. User B sees post-join onboarding (3 steps)
4. User B sets name + picks color → saved correctly
5. User B lands on dashboard → sees household and other member

- [ ] **Step 4: Full manual test — Edge cases**

1. User B enters the same code again → "Deja membre" screen, code NOT wasted
2. User A sends a new code to the same email → old code expired, new one active
3. User A checks invite screen → sees status badges (Actif/Expire/Utilise)

- [ ] **Step 5: Full manual test — Magic link flow**

1. User A sends a magic link invitation
2. User B clicks the link → session extracted → post-join onboarding
3. Complete onboarding → dashboard

- [ ] **Step 6: Final commit if any fixes needed**

If any issues found during testing, fix and commit with descriptive message.
