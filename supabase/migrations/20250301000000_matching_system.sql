-- =============================================================================
-- NGO Hub — Intelligent Matching System
-- Tables: missions, mission_recommendations
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS guards)
-- =============================================================================

-- ============================================================
-- 1. MISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.missions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,                        -- e.g. 'Events', 'HR', 'IT'
  required_skills  TEXT[]  DEFAULT '{}',        -- matches member specialties
  personality_fit  TEXT[]  DEFAULT '{}',        -- DISC types welcome
  schedule_days    TEXT[]  DEFAULT '{}',        -- Mon–Sun keys
  schedule_time    TEXT,                        -- 'matinal' | 'afternoon' | 'full_day'
  duration_weeks   INT     DEFAULT 4,
  points_reward    INT     DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  organization_id  UUID    REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. MISSION RECOMMENDATIONS  (member ↔ mission match)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mission_recommendations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  mission_id  UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,

  -- Computed by the scoring engine
  score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  breakdown   JSONB        NOT NULL DEFAULT '[]',   -- ScoreBreakdown[]

  -- Lifecycle
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'viewed', 'accepted', 'refused')),
  feedback    TEXT,                                 -- reason when refused

  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (member_id, mission_id)
);

-- ============================================================
-- 3. EXTRA COLUMN GUARDS
-- ============================================================
DO $$ BEGIN
  -- Make sure profiles has the columns the scoring engine reads
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='job_title') THEN
    ALTER TABLE public.profiles ADD COLUMN job_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='specialties') THEN
    ALTER TABLE public.profiles ADD COLUMN specialties TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='availability_days') THEN
    ALTER TABLE public.profiles ADD COLUMN availability_days TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='availability_time') THEN
    ALTER TABLE public.profiles ADD COLUMN availability_time TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='personality_type') THEN
    ALTER TABLE public.profiles ADD COLUMN personality_type TEXT
      CHECK (personality_type IN ('Dominant','Influence','Steadiness','Conscientious'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_committee') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_committee TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_activity_type') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_activity_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.missions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_recommendations ENABLE ROW LEVEL SECURITY;

-- ── missions ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Missions: public read active"      ON public.missions;
DROP POLICY IF EXISTS "Missions: authenticated create"    ON public.missions;
DROP POLICY IF EXISTS "Missions: creator or superadmin update" ON public.missions;
DROP POLICY IF EXISTS "Missions: creator or superadmin delete" ON public.missions;

CREATE POLICY "Missions: public read active"
  ON public.missions FOR SELECT
  USING (is_active = true OR created_by = auth.uid()
         OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Missions: authenticated create"
  ON public.missions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Missions: creator or superadmin update"
  ON public.missions FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Missions: creator or superadmin delete"
  ON public.missions FOR DELETE
  USING (
    auth.uid() = created_by
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- ── mission_recommendations ──────────────────────────────────

DROP POLICY IF EXISTS "Recommendations: member read own"         ON public.mission_recommendations;
DROP POLICY IF EXISTS "Recommendations: mission creator read"    ON public.mission_recommendations;
DROP POLICY IF EXISTS "Recommendations: upsert own"             ON public.mission_recommendations;
DROP POLICY IF EXISTS "Recommendations: member update own"       ON public.mission_recommendations;
DROP POLICY IF EXISTS "Recommendations: superadmin all"         ON public.mission_recommendations;

-- Members can read their own recommendations
CREATE POLICY "Recommendations: member read own"
  ON public.mission_recommendations FOR SELECT
  USING (member_id = auth.uid());

-- Mission creator / exec can read all recommendations for their mission
CREATE POLICY "Recommendations: mission creator read"
  ON public.mission_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id
        AND (
          m.created_by = auth.uid()
          OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
        )
    )
  );

-- Members (and the system acting as them) can upsert their own recommendations
CREATE POLICY "Recommendations: upsert own"
  ON public.mission_recommendations FOR INSERT
  WITH CHECK (member_id = auth.uid());

-- Members can update their own recommendation (accept / refuse + feedback)
CREATE POLICY "Recommendations: member update own"
  ON public.mission_recommendations FOR UPDATE
  USING (member_id = auth.uid());

-- Super admins can do everything
CREATE POLICY "Recommendations: superadmin all"
  ON public.mission_recommendations FOR ALL
  USING ((SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- 5. TRIGGERS — auto updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.missions_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS missions_set_updated_at ON public.missions;
CREATE TRIGGER missions_set_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE PROCEDURE public.missions_set_updated_at();

CREATE OR REPLACE FUNCTION public.recommendations_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS recommendations_set_updated_at ON public.mission_recommendations;
CREATE TRIGGER recommendations_set_updated_at
  BEFORE UPDATE ON public.mission_recommendations
  FOR EACH ROW EXECUTE PROCEDURE public.recommendations_set_updated_at();

-- ============================================================
-- 6. SEED — demo missions (safe, will skip duplicates via title check)
-- ============================================================
DO $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Use the first user as creator for seed data (skip if no users)
  SELECT id INTO _admin_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF _admin_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.missions
    (title, description, category, required_skills, personality_fit,
     schedule_days, schedule_time, duration_weeks, points_reward, created_by)
  VALUES
  (
    'Event Coordination Volunteer',
    'Help plan and run our flagship annual youth summit. Tasks include logistics, speaker coordination, and on-site management.',
    'Events',
    ARRAY['Event Planning','Project Management','Communication','Public Speaking'],
    ARRAY['Dominant','Influence'],
    ARRAY['Friday','Saturday','Sunday'],
    'full_day', 8, 150,
    _admin_id
  ),
  (
    'Social Media & Content Creator',
    'Create engaging content, manage posting schedules, and grow our digital presence across LinkedIn, Instagram, and TikTok.',
    'Communication',
    ARRAY['Digital Marketing','Copywriting','SEO','UI/UX Design'],
    ARRAY['Influence','Conscientious'],
    ARRAY['Monday','Wednesday','Friday'],
    'afternoon', 12, 100,
    _admin_id
  ),
  (
    'HR & Recruitment Coordinator',
    'Screen candidates, conduct initial interviews, and onboard new members. Help us build a diverse and talented volunteer team.',
    'HR',
    ARRAY['Human Resources','Communication','Conflict Resolution','Networking'],
    ARRAY['Steadiness','Conscientious'],
    ARRAY['Tuesday','Thursday'],
    'matinal', 6, 80,
    _admin_id
  ),
  (
    'Financial Planning Assistant',
    'Support budget forecasting, expense tracking, and grant reporting. Ideal for accounting or finance students/professionals.',
    'Finance',
    ARRAY['Financial Analysis','Strategic Planning','Data Visualization'],
    ARRAY['Conscientious'],
    ARRAY['Monday','Tuesday','Wednesday','Thursday'],
    'matinal', 4, 60,
    _admin_id
  ),
  (
    'Tech & IT Support Lead',
    'Maintain our internal tools, lead app development sprints, and provide technical support to all departments.',
    'IT',
    ARRAY['Web Development','UI/UX Design','Project Management','SEO'],
    ARRAY['Conscientious','Dominant'],
    ARRAY['Saturday','Sunday'],
    'full_day', 16, 200,
    _admin_id
  ),
  (
    'Training & Coaching Facilitator',
    'Design and deliver workshops on leadership, soft skills, and professional development for our youth members.',
    'Training',
    ARRAY['Training & Coaching','Public Speaking','Soft Skills','Adaptability'],
    ARRAY['Influence','Steadiness'],
    ARRAY['Wednesday','Saturday'],
    'afternoon', 8, 120,
    _admin_id
  )
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 7. REFRESH SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- DONE — missions and mission_recommendations tables are ready.
-- =============================================================================
