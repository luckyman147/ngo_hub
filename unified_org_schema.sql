-- =============================================================================
-- Unified Organization System — Rebuild Script
-- WARNING: This will DELETE ALL EXISTING CLUBS, NGOS, and related data.
-- =============================================================================

-- 1. Cleanup: DROP all existing related tables (with CASCADE)
DROP TABLE IF EXISTS ngo_members CASCADE;
DROP TABLE IF EXISTS ngo_roles CASCADE;
DROP TABLE IF EXISTS ngo_units CASCADE;
DROP TABLE IF EXISTS ngo_unit_types CASCADE;
DROP TABLE IF EXISTS ngos CASCADE;

DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS club_roles CASCADE;
DROP TABLE IF EXISTS club_events CASCADE;
DROP TABLE IF EXISTS club_posts CASCADE;
DROP TABLE IF EXISTS club_comments CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;

DROP TABLE IF EXISTS organizations CASCADE;

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE org_type AS ENUM ('club', 'ngo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Organization Table
CREATE TABLE orgs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  type        org_type NOT NULL,
  mission     text,
  description text,
  logo_url    text,
  website     text,
  region      text,
  parent_id   uuid REFERENCES orgs(id) ON DELETE SET NULL,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- 4. Organizational Structure (Units)
CREATE TABLE org_unit_types (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL, -- e.g., 'Chapter', 'Department', 'Team'
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE org_units (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type_id     uuid NOT NULL REFERENCES org_unit_types(id) ON DELETE CASCADE,
  name        text NOT NULL,
  parent_id   uuid REFERENCES org_units(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- 5. Roles & Permissions
CREATE TABLE org_roles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  permissions text[] DEFAULT '{}', -- Array of permission keys
  is_admin    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- 6. Membership
CREATE TABLE org_members (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id           uuid REFERENCES org_roles(id) ON DELETE SET NULL,
  unit_id           uuid REFERENCES org_units(id) ON DELETE SET NULL,
  status            text DEFAULT 'active', -- 'active', 'pending', 'suspended'
  engagement_points integer DEFAULT 0,
  joined_at         timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now() NOT NULL,
  UNIQUE(org_id, user_id)
);

-- 7. Unified Community & Activity Feed
CREATE TABLE org_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  unit_id     uuid REFERENCES org_units(id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text,
  image_url   text,
  location    text,
  start_at    timestamptz NOT NULL,
  end_at      timestamptz,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE org_posts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  unit_id     uuid REFERENCES org_units(id) ON DELETE SET NULL,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text,
  content     text NOT NULL,
  image_url   text,
  is_pinned   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE org_comments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL REFERENCES org_posts(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- 8. Public RLS (Full Read/Write Access)
-- As requested: "all RLS policies will be fully public (read and write access for anyone)"

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON orgs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_unit_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_unit_types FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_units FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_roles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_posts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE org_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON org_comments FOR ALL USING (true) WITH CHECK (true);
