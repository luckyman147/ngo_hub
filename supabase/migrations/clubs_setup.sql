-- =============================================================================
-- NGO Hub — Clubs System: Full Setup (Safe to re-run)
-- Paste this entire file into the Supabase SQL Editor and click "Run"
-- =============================================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Main clubs table
CREATE TABLE IF NOT EXISTS public.clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  logo_url     TEXT,
  region       TEXT,
  president_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-club roles (President, Vice-President, Secretary, Treasurer, etc.)
CREATE TABLE IF NOT EXISTS public.club_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  is_president BOOLEAN NOT NULL DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, name)
);

-- Club membership: pending (join request) or accepted
CREATE TABLE IF NOT EXISTS public.club_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_role_id    UUID REFERENCES public.club_roles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  is_board_member BOOLEAN NOT NULL DEFAULT false,
  message         TEXT,
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, member_id)
);

-- Club events (visible to the public)
CREATE TABLE IF NOT EXISTS public.club_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  location    TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. EXTRA COLUMNS (safe to re-run with IF NOT EXISTS guard)
-- ============================================================

-- Add is_superadmin to profiles if it doesn't exist yet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'is_superadmin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.clubs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events  ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- clubs policies
-- -----------------------------------------------
DROP POLICY IF EXISTS "Clubs: public read"                    ON public.clubs;
DROP POLICY IF EXISTS "Clubs: authenticated create"           ON public.clubs;
DROP POLICY IF EXISTS "Clubs: president update delete"        ON public.clubs;
DROP POLICY IF EXISTS "Clubs: president delete"               ON public.clubs;
DROP POLICY IF EXISTS "Clubs: president or superadmin update" ON public.clubs;
DROP POLICY IF EXISTS "Clubs: president or superadmin delete" ON public.clubs;

CREATE POLICY "Clubs: public read"
  ON public.clubs FOR SELECT
  USING (true);

CREATE POLICY "Clubs: authenticated create"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() = president_id);

CREATE POLICY "Clubs: president or superadmin update"
  ON public.clubs FOR UPDATE
  USING (
    auth.uid() = president_id
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Clubs: president or superadmin delete"
  ON public.clubs FOR DELETE
  USING (
    auth.uid() = president_id
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- -----------------------------------------------
-- club_roles policies
-- -----------------------------------------------
DROP POLICY IF EXISTS "Club roles: read"                      ON public.club_roles;
DROP POLICY IF EXISTS "Club roles: president manage"          ON public.club_roles;
DROP POLICY IF EXISTS "Club roles: board or superadmin manage" ON public.club_roles;

CREATE POLICY "Club roles: read"
  ON public.club_roles FOR SELECT
  USING (true);

CREATE POLICY "Club roles: board or superadmin manage"
  ON public.club_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.clubs c
      JOIN public.club_members cm
        ON cm.club_id = c.id AND cm.member_id = auth.uid()
      WHERE c.id = club_id
        AND cm.status = 'accepted'
        AND (c.president_id = auth.uid() OR cm.is_board_member = true)
    )
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- -----------------------------------------------
-- club_members policies
-- -----------------------------------------------
DROP POLICY IF EXISTS "Club members: read"                      ON public.club_members;
DROP POLICY IF EXISTS "Club members: request join"              ON public.club_members;
DROP POLICY IF EXISTS "Club members: president update"          ON public.club_members;
DROP POLICY IF EXISTS "Club members: board update"              ON public.club_members;
DROP POLICY IF EXISTS "Club members: board or superadmin update" ON public.club_members;
DROP POLICY IF EXISTS "Club members: self or president delete"  ON public.club_members;

CREATE POLICY "Club members: read"
  ON public.club_members FOR SELECT
  USING (
    member_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clubs c
      WHERE c.id = club_id
        AND (
          c.president_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.club_members cm2
            WHERE cm2.club_id = c.id
              AND cm2.member_id = auth.uid()
              AND cm2.status = 'accepted'
          )
        )
    )
  );

CREATE POLICY "Club members: request join"
  ON public.club_members FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Club members: board or superadmin update"
  ON public.club_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.clubs c
      JOIN public.club_members cm
        ON cm.club_id = c.id AND cm.member_id = auth.uid()
      WHERE c.id = club_id
        AND cm.status = 'accepted'
        AND (c.president_id = auth.uid() OR cm.is_board_member = true)
    )
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Club members: self or president delete"
  ON public.club_members FOR DELETE
  USING (
    member_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clubs c
      WHERE c.id = club_id AND c.president_id = auth.uid()
    )
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- -----------------------------------------------
-- club_events policies
-- -----------------------------------------------
DROP POLICY IF EXISTS "Club events: public read"         ON public.club_events;
DROP POLICY IF EXISTS "Club events: club board create"   ON public.club_events;
DROP POLICY IF EXISTS "Club events: club board update delete" ON public.club_events;
DROP POLICY IF EXISTS "Club events: club board update"   ON public.club_events;
DROP POLICY IF EXISTS "Club events: club board delete"   ON public.club_events;
DROP POLICY IF EXISTS "Club events: superadmin all"      ON public.club_events;

CREATE POLICY "Club events: public read"
  ON public.club_events FOR SELECT
  USING (true);

CREATE POLICY "Club events: club board create"
  ON public.club_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.clubs c
      JOIN public.club_members cm
        ON cm.club_id = c.id AND cm.member_id = auth.uid()
      WHERE c.id = club_id
        AND cm.status = 'accepted'
        AND (c.president_id = auth.uid() OR cm.is_board_member = true)
    )
  );

CREATE POLICY "Club events: club board update"
  ON public.club_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.clubs c
      JOIN public.club_members cm
        ON cm.club_id = c.id AND cm.member_id = auth.uid()
      WHERE c.id = club_id
        AND cm.status = 'accepted'
        AND (c.president_id = auth.uid() OR cm.is_board_member = true)
    )
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Club events: club board delete"
  ON public.club_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.clubs c
      JOIN public.club_members cm
        ON cm.club_id = c.id AND cm.member_id = auth.uid()
      WHERE c.id = club_id
        AND cm.status = 'accepted'
        AND (c.president_id = auth.uid() OR cm.is_board_member = true)
    )
    OR (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create a "President" role and add the president as accepted member
-- when a new club is created
CREATE OR REPLACE FUNCTION public.on_club_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the President role for this club
  INSERT INTO public.club_roles (club_id, name, is_president, sort_order)
  VALUES (NEW.id, 'President', true, 0)
  ON CONFLICT (club_id, name) DO NOTHING;

  -- Add the president as an accepted member with the President role
  INSERT INTO public.club_members (club_id, member_id, status, joined_at, club_role_id)
  SELECT NEW.id, NEW.president_id, 'accepted', now(), cr.id
  FROM public.club_roles cr
  WHERE cr.club_id = NEW.id AND cr.is_president = true
  ON CONFLICT (club_id, member_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_club_created ON public.clubs;
CREATE TRIGGER on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW EXECUTE PROCEDURE public.on_club_created();

-- Auto-update updated_at on clubs
CREATE OR REPLACE FUNCTION public.clubs_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clubs_set_updated_at ON public.clubs;
CREATE TRIGGER clubs_set_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE PROCEDURE public.clubs_set_updated_at();

-- Auto-update updated_at on club_members
CREATE OR REPLACE FUNCTION public.club_members_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS club_members_set_updated_at ON public.club_members;
CREATE TRIGGER club_members_set_updated_at
  BEFORE UPDATE ON public.club_members
  FOR EACH ROW EXECUTE PROCEDURE public.club_members_set_updated_at();

-- Auto-update updated_at on club_events
CREATE OR REPLACE FUNCTION public.club_events_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS club_events_set_updated_at ON public.club_events;
CREATE TRIGGER club_events_set_updated_at
  BEFORE UPDATE ON public.club_events
  FOR EACH ROW EXECUTE PROCEDURE public.club_events_set_updated_at();

-- ============================================================
-- 5. REFRESH SCHEMA CACHE
-- ============================================================
-- Forces PostgREST to reload so it can see the new tables immediately.
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- DONE — all clubs tables, RLS policies, functions, and triggers are created.
-- =============================================================================
