-- Allow household members to delete (revoke) invitation codes.
-- Fixes: clicking "Supprimer" on a pending invitation did nothing
-- because no FOR DELETE policy existed on invitation_codes.

DROP POLICY IF EXISTS "members_can_delete_codes" ON public.invitation_codes;

CREATE POLICY "members_can_delete_codes" ON public.invitation_codes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = invitation_codes.household_id
        AND hm.user_id = auth.uid()
    )
  );
