-- ============================================================
-- Keurzen — In-app notifications
--
-- Table pour stocker les notifications in-app (digest, alertes,
-- rappels de tâches, etc.) consultables dans le centre de notifs.
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  type        text NOT NULL,          -- 'task_reminder' | 'overdue' | 'digest' | 'imbalance' | 'invitation' | 'system'
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb DEFAULT '{}'::jsonb,  -- payload libre (task_id, etc.)
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user
  ON public.in_app_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_unread
  ON public.in_app_notifications(user_id, read)
  WHERE read = false;

-- 3. RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own notifications" ON public.in_app_notifications;
CREATE POLICY "users can read own notifications"
  ON public.in_app_notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can update own notifications" ON public.in_app_notifications;
CREATE POLICY "users can update own notifications"
  ON public.in_app_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can insert (Edge Functions)
DROP POLICY IF EXISTS "service can insert notifications" ON public.in_app_notifications;
CREATE POLICY "service can insert notifications"
  ON public.in_app_notifications FOR INSERT
  WITH CHECK (true);
