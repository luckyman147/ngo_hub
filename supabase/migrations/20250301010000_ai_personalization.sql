-- =============================================================================
-- NGO Hub — AI Personalization Epic
-- Adds AI opt-in toggle to profiles and creates an ai_feedback table
-- =============================================================================

-- 1. Add AI opt-in toggle to profiles (if it doesn't exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'ai_personalization_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ai_personalization_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- 2. Create AI Feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,  -- e.g., 'mission_recommendation', 'burnout_prevention', 'general_tip'
  suggestion_text TEXT NOT NULL,
  rating          TEXT NOT NULL CHECK (rating IN ('helpful', 'unhelpful')),
  comments        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row Level Security for Feedback
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feedback: members can create their own" ON public.ai_feedback;
CREATE POLICY "Feedback: members can create their own"
  ON public.ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Feedback: members can read their own" ON public.ai_feedback;
CREATE POLICY "Feedback: members can read their own"
  ON public.ai_feedback FOR SELECT
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Feedback: superadmins can read all" ON public.ai_feedback;
CREATE POLICY "Feedback: superadmins can read all"
  ON public.ai_feedback FOR SELECT
  USING ((SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true);

-- 4. Reload Schema cache
NOTIFY pgrst, 'reload schema';
