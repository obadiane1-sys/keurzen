-- Plan B hybride — invitees can discover their pending invitation codes.
--
-- Two changes, both scoped to the invitee's own pending codes:
-- 1. RLS policy on invitation_codes for direct SELECT (defense in depth)
-- 2. SECURITY DEFINER RPC get_my_pending_invitations() that joins
--    households + profiles to power the dashboard InvitationBanner.

-- ─── 1. RLS policy : invitees can view their own pending codes ────────────────
-- Adds in OR with members_can_view_codes:
--   - Members keep visibility of all codes for their household
--   - Non-member invitees can only see codes where email matches AND not used AND not expired

CREATE POLICY "invitees_can_view_own_codes"
  ON public.invitation_codes
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND used = false
    AND expires_at > NOW()
  );

-- ─── 2. RPC : get_my_pending_invitations ──────────────────────────────────────
-- Used by the dashboard banner to show "X vous invite à rejoindre Y".
-- SECURITY DEFINER so the join can read households (RLS-restricted to members)
-- and profiles (RLS-restricted to co-members) — bypassed safely because the
-- WHERE clause locks the result to the caller's own email.

CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
RETURNS TABLE (
  code TEXT,
  household_id UUID,
  household_name TEXT,
  inviter_name TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ic.code,
    ic.household_id,
    h.name AS household_name,
    COALESCE(p.full_name, 'Un membre du foyer') AS inviter_name,
    ic.expires_at
  FROM public.invitation_codes ic
  JOIN public.households h ON h.id = ic.household_id
  LEFT JOIN public.profiles p ON p.id = ic.created_by
  WHERE ic.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND ic.used = false
    AND ic.expires_at > NOW();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_invitations() TO authenticated;
