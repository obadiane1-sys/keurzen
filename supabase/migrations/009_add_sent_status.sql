-- ============================================================
-- Keurzen — Add 'sent' to invitations status constraint
--
-- Contexte :
--   L'Edge Function send-household-invite met le status a 'sent'
--   apres l'envoi de l'email. Mais la contrainte CHECK ne
--   l'autorisait pas, causant un echec silencieux de l'UPDATE.
-- ============================================================

-- 1. Remplacer la contrainte CHECK pour inclure 'sent'
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_status_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('pending', 'sent', 'accepted', 'revoked', 'expired'));
