-- Migration 012 — Table email_verifications
-- Stocke les codes OTP à 6 chiffres pour la confirmation d'email.
-- Remplace le flow par lien cliquable (vulnérable aux scanners email).

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  verified   BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les lookups par email
CREATE INDEX IF NOT EXISTS email_verifications_email_idx
  ON public.email_verifications (email);

-- RLS : la table est uniquement accessible via service_role (Edge Functions)
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Aucune politique publique — seul service_role peut lire/écrire
-- (les Edge Functions utilisent le service role key)
