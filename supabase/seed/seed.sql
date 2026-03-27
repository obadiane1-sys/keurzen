-- ============================================================
-- Keurzen — Seed Script (données de démo)
-- À exécuter UNIQUEMENT en environnement de développement
-- ============================================================

-- ATTENTION : ce script crée des utilisateurs de démo.
-- Les UUIDs sont fixes pour la reproductibilité.

-- ─── Demo Users ───────────────────────────────────────────────────────────────
-- Note : à créer via auth.users manuellement ou Supabase Admin

-- Profils de démo (les UUIDs doivent correspondre à de vrais auth.users)
-- Remplacer par de vrais IDs lors d'un test réel.

DO $$
DECLARE
  user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  user2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  household_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  task1_id UUID := gen_random_uuid();
  task2_id UUID := gen_random_uuid();
  task3_id UUID := gen_random_uuid();
  task4_id UUID := gen_random_uuid();
BEGIN

  -- Insert demo profiles (skip if exists)
  INSERT INTO public.profiles (id, email, full_name, has_seen_onboarding)
  VALUES
    (user1_id, 'alice@demo.keurzen.app', 'Alice Martin', TRUE),
    (user2_id, 'bob@demo.keurzen.app', 'Bob Martin', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- Create demo household
  INSERT INTO public.households (id, name, invite_code, created_by)
  VALUES (household_id, 'Famille Martin', 'DEMO2024', user1_id)
  ON CONFLICT (id) DO NOTHING;

  -- Add members
  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES
    (household_id, user1_id, 'owner', '#FFA69E'),
    (household_id, user2_id, 'member', '#88D4A9')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  -- Demo tasks
  INSERT INTO public.tasks (id, household_id, title, description, assigned_to, due_date, category, zone, priority, estimated_minutes, status, recurrence, created_by)
  VALUES
    (task1_id, household_id, 'Faire les courses', 'Acheter : lait, pain, légumes', user1_id, CURRENT_DATE + 1, 'shopping', 'general', 'high', 60, 'todo', 'weekly', user1_id),
    (task2_id, household_id, 'Nettoyer la salle de bain', NULL, user2_id, CURRENT_DATE, 'cleaning', 'bathroom', 'medium', 30, 'in_progress', 'none', user1_id),
    (task3_id, household_id, 'Payer la facture EDF', NULL, user1_id, CURRENT_DATE - 2, 'finances', 'general', 'urgent', 15, 'overdue', 'none', user2_id),
    (task4_id, household_id, 'Sortir les poubelles', NULL, user2_id, CURRENT_DATE + 3, 'cleaning', 'general', 'low', 10, 'todo', 'weekly', user2_id)
  ON CONFLICT (id) DO NOTHING;

  -- Time logs
  INSERT INTO public.time_logs (task_id, user_id, household_id, minutes, note)
  VALUES
    (task2_id, user2_id, household_id, 20, 'Nettoyage partiel'),
    (task1_id, user1_id, household_id, 45, 'Courses express')
  ON CONFLICT DO NOTHING;

  -- TLX entries
  INSERT INTO public.tlx_entries (user_id, household_id, week_start, mental_demand, physical_demand, temporal_demand, performance, effort, frustration, score)
  VALUES
    (user1_id, household_id, date_trunc('week', CURRENT_DATE)::date, 60, 30, 50, 70, 55, 40, 46),
    (user2_id, household_id, date_trunc('week', CURRENT_DATE)::date, 40, 50, 30, 80, 35, 20, 29)
  ON CONFLICT (user_id, household_id, week_start) DO NOTHING;

  -- Weekly stats
  INSERT INTO public.weekly_stats (household_id, user_id, week_start, tasks_count, total_tasks_week, tasks_share, tasks_delta, minutes_total, total_minutes_week, minutes_share, minutes_delta, expected_share)
  VALUES
    (household_id, user1_id, date_trunc('week', CURRENT_DATE)::date, 3, 5, 0.60, 0.10, 65, 100, 0.65, 0.15, 0.50),
    (household_id, user2_id, date_trunc('week', CURRENT_DATE)::date, 2, 5, 0.40, -0.10, 35, 100, 0.35, -0.15, 0.50)
  ON CONFLICT (household_id, user_id, week_start) DO NOTHING;

  -- Budget expenses
  INSERT INTO public.budget_expenses (household_id, paid_by, amount, category, memo, date)
  VALUES
    (household_id, user1_id, 12500, 'groceries', 'Courses semaine', CURRENT_DATE),
    (household_id, user2_id, 8900, 'energy', 'Facture EDF', CURRENT_DATE - 5),
    (household_id, user1_id, 3500, 'leisure', 'Cinéma', CURRENT_DATE - 3),
    (household_id, user2_id, 5200, 'transport', 'Carburant', CURRENT_DATE - 1)
  ON CONFLICT DO NOTHING;

  -- Notification preferences
  INSERT INTO public.notification_preferences (user_id, morning_digest, task_reminder, overdue_alert, imbalance_alert, digest_hour)
  VALUES
    (user1_id, TRUE, TRUE, TRUE, TRUE, 8),
    (user2_id, TRUE, TRUE, TRUE, FALSE, 9)
  ON CONFLICT (user_id) DO NOTHING;

  -- Tour slides
  INSERT INTO public.tour_slides (page, version, "order", title, body)
  VALUES
    ('dashboard', 1, 1, 'Votre tableau de bord', 'Visualisez en un coup d''œil toutes les tâches du foyer et l''équilibre de la semaine.'),
    ('dashboard', 1, 2, 'Charge mentale', 'La carte TLX vous donne un résumé de votre ressenti hebdomadaire.'),
    ('household', 1, 1, 'Gérez votre foyer', 'Invitez des membres, attribuez des couleurs et définissez les rôles.'),
    ('tlx', 1, 1, 'Le bilan TLX', 'Répondez aux 6 questions une fois par semaine pour suivre votre charge mentale.'),
    ('tlx', 1, 2, 'Interprétez votre score', 'Un score bas indique un ressenti léger. Un score élevé peut signaler un besoin d''équilibrage.')
  ON CONFLICT (page, version, "order") DO NOTHING;

END $$;
