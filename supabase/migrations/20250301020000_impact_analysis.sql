-- =============================================================================
-- NGO Hub — Impact Analysis System
-- Tables: user_engagements, impact_reports
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS guards)
-- =============================================================================

-- ============================================================
-- 1. USER ENGAGEMENTS
-- Tracks individual actions to quantify user and community impact
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_engagements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id       UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  action_type       TEXT NOT NULL, -- e.g., 'event_attendance', 'task_completed', 'initiative_led'
  hours_contributed NUMERIC(5,2) DEFAULT 0,
  points_earned     INTEGER DEFAULT 0,
  impact_score      NUMERIC(7,2) DEFAULT 0, -- A quantifiable metric of impact
  metadata          JSONB DEFAULT '{}'::jsonb, -- Additional context (e.g., feedback, specific roles)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. IMPACT REPORTS
-- Stores generated reports with aggregated metrics and suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impact_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type          TEXT NOT NULL CHECK (report_type IN ('ngo_summary', 'partner_aggregation', 'user_impact')),
  title                TEXT NOT NULL,
  period_start         DATE,
  period_end           DATE,
  total_hours          NUMERIC(10,2) DEFAULT 0,
  total_volunteers     INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  metrics              JSONB DEFAULT '{}'::jsonb, -- Aggregated indicators (e.g., beneficiaries reached, funds raised)
  suggestions          JSONB DEFAULT '[]'::jsonb, -- AI/System suggestions for improvement
  generated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;

-- ── user_engagements ────────────────────────────────────────

DROP POLICY IF EXISTS "User engagements: members read own or superadmin" ON public.user_engagements;
CREATE POLICY "User engagements: members read own or superadmin"
  ON public.user_engagements FOR SELECT
  USING (
    member_id = auth.uid()
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "User engagements: system/admin manage" ON public.user_engagements;
CREATE POLICY "User engagements: system/admin manage"
  ON public.user_engagements FOR ALL
  USING ((SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true);

-- ── impact_reports ──────────────────────────────────────────

DROP POLICY IF EXISTS "Impact reports: authenticated read" ON public.impact_reports;
CREATE POLICY "Impact reports: authenticated read"
  ON public.impact_reports FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Impact reports: admin manage" ON public.impact_reports;
CREATE POLICY "Impact reports: admin manage"
  ON public.impact_reports FOR ALL
  USING (
    (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
    OR generated_by = auth.uid()
  );

-- ============================================================
-- 4. TRIGGERS (Auto updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_engagements_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS user_engagements_set_updated_at ON public.user_engagements;
CREATE TRIGGER user_engagements_set_updated_at
  BEFORE UPDATE ON public.user_engagements
  FOR EACH ROW EXECUTE PROCEDURE public.user_engagements_set_updated_at();


CREATE OR REPLACE FUNCTION public.impact_reports_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS impact_reports_set_updated_at ON public.impact_reports;
CREATE TRIGGER impact_reports_set_updated_at
  BEFORE UPDATE ON public.impact_reports
  FOR EACH ROW EXECUTE PROCEDURE public.impact_reports_set_updated_at();

-- ============================================================
-- 5. REFRESH SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
