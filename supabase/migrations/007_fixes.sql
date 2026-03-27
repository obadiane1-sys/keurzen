-- ============================================================
-- Keurzen — Migration 007 : correctifs anomalies détectées
-- ============================================================

-- ── C2/M9 — Déduplication des alertes ────────────────────────────────────────
-- Ajoute week_start pour identifier la semaine de calcul.
-- La contrainte UNIQUE empêche les doublons si le cron tourne plusieurs fois.

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS week_start DATE;

ALTER TABLE public.alerts
  DROP CONSTRAINT IF EXISTS alerts_unique_week;

ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_unique_week
    UNIQUE (household_id, user_id, type, week_start);

-- ── M10 — Index composite sur time_logs(household_id, logged_at) ─────────────
-- Évite un full scan lors du filtre .gte('logged_at', weekStart) dans compute-weekly-stats.

CREATE INDEX IF NOT EXISTS time_logs_household_logged_at_idx
  ON public.time_logs(household_id, logged_at);

-- ── M11 — Index composite sur tasks(household_id, completed_at) ──────────────
-- Évite un full scan lors du filtre .gte('completed_at', weekStart).

CREATE INDEX IF NOT EXISTS tasks_household_completed_at_idx
  ON public.tasks(household_id, completed_at);

-- ── M12 — RLS budget_expenses UPDATE : restreindre au créateur ───────────────
-- Avant : tout membre pouvait modifier la dépense d'un autre.
-- Après  : seul l'auteur (paid_by) peut modifier sa propre dépense.

DROP POLICY IF EXISTS "Members can update household expenses" ON public.budget_expenses;

CREATE POLICY "Expense creator can update their expense"
  ON public.budget_expenses FOR UPDATE
  USING (paid_by = auth.uid());
