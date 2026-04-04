-- Add email column to invitation_codes so the redeem Edge Function
-- can auto-create accounts for unauthenticated invitees.

ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS email TEXT;
