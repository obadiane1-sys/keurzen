-- Add first_name to invitations for personalized invite emails
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS first_name TEXT;
