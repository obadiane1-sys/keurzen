-- Add invited_name column so redeem-invite-code can set the profile name.
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS invited_name TEXT;
