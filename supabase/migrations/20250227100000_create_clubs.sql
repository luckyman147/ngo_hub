-- Clubs system: president creates club, members join (approved by president), per-club roles
-- Assumes profiles table exists (auth.users linked via id)

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  region TEXT,
  president_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-club roles (President, Vice-President, Secretary, Treasurer, Member, etc.)
CREATE TABLE IF NOT EXISTS club_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_president BOOLEAN NOT NULL DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, name)
);

-- Club membership: pending (request) or accepted
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_role_id UUID REFERENCES club_roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  message TEXT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, member_id)
);

-- RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Clubs: anyone can read, authenticated can create
CREATE POLICY "Clubs: public read" ON clubs FOR SELECT USING (true);
CREATE POLICY "Clubs: authenticated create" ON clubs FOR INSERT WITH CHECK (auth.uid() = president_id);
CREATE POLICY "Clubs: president update delete" ON clubs FOR UPDATE USING (auth.uid() = president_id);
CREATE POLICY "Clubs: president delete" ON clubs FOR DELETE USING (auth.uid() = president_id);

-- Club roles: read for club members/pending, manage for president
CREATE POLICY "Club roles: read" ON club_roles FOR SELECT USING (true);
CREATE POLICY "Club roles: president manage" ON club_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM clubs c WHERE c.id = club_id AND c.president_id = auth.uid()));

-- Club members: read for club members, insert (request) for authenticated, update (approve/assign role) for president
CREATE POLICY "Club members: read" ON club_members FOR SELECT
  USING (
    member_id = auth.uid()
    OR EXISTS (SELECT 1 FROM clubs c WHERE c.id = club_id AND c.president_id = auth.uid())
  );
CREATE POLICY "Club members: request join" ON club_members FOR INSERT
  WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Club members: president update" ON club_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM clubs c WHERE c.id = club_id AND c.president_id = auth.uid()));

-- Trigger: create president role and auto-add president on club creation
CREATE OR REPLACE FUNCTION on_club_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_roles (club_id, name, is_president, sort_order)
  VALUES (NEW.id, 'President', true, 0);
  
  INSERT INTO club_members (club_id, member_id, status, joined_at, club_role_id)
  SELECT NEW.id, NEW.president_id, 'accepted', now(), id
  FROM club_roles WHERE club_id = NEW.id AND is_president = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_created ON clubs;
CREATE TRIGGER on_club_created AFTER INSERT ON clubs
  FOR EACH ROW EXECUTE PROCEDURE on_club_created();

-- Updated_at
CREATE OR REPLACE FUNCTION clubs_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS clubs_updated_at ON clubs;
CREATE TRIGGER clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE PROCEDURE clubs_updated_at();
