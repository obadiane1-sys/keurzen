-- Allow household members to delete (revoke) invitations directly from the client.
-- Replaces the previous approach that used the revoke-invitation Edge Function.

CREATE POLICY "household members can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.is_household_member(household_id));
