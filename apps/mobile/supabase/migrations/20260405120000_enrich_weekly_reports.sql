-- ============================================================
-- Enrich weekly_reports with pre-computed metrics
--
-- Adds summary metrics so the mobile Weekly Review screen
-- can display them without client-side computation.
-- ============================================================

ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS total_tasks_completed integer DEFAULT 0;
ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS total_minutes_logged integer DEFAULT 0;
ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS avg_tlx_score numeric(5,2) DEFAULT NULL;
ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS balance_score numeric(5,2) DEFAULT NULL;
ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS member_metrics jsonb DEFAULT '[]'::jsonb;
