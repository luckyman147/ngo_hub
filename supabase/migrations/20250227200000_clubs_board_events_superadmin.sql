-- Add is_board_member to club_members (board can accept/reject)
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS is_board_member BOOLEAN NOT NULL DEFAULT false;

-- Super admin: add column to profiles (set via SQL for first super admin)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false;

-- Club events (public, shown on landing and dashboard)
CREATE TABLE IF NOT EXISTS club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club events: public read" ON club_events FOR SELECT USING (true);
CREATE POLICY "Club events: club board create" ON club_events FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM clubs c
    JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true)
  )
);
CREATE POLICY "Club events: club board update delete" ON club_events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clubs c
    JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true)
  )
);
CREATE POLICY "Club events: club board delete" ON club_events FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM clubs c
    JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true)
  )
);

-- Super admin can do everything on club_events
CREATE POLICY "Club events: superadmin all" ON club_events FOR ALL
  USING ((SELECT is_superadmin FROM profiles WHERE id = auth.uid()) = true);

CREATE OR REPLACE FUNCTION club_events_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS club_events_updated_at ON club_events;
CREATE TRIGGER club_events_updated_at BEFORE UPDATE ON club_events FOR EACH ROW EXECUTE PROCEDURE club_events_updated_at();

-- Update RLS: president OR board can approve/reject
DROP POLICY IF EXISTS "Club members: president update" ON club_members;
CREATE POLICY "Club members: board update" ON club_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clubs c
    JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true)
  )
);

-- Super admin can manage all clubs and members
DROP POLICY IF EXISTS "Clubs: president update delete" ON clubs;
CREATE POLICY "Clubs: president or superadmin update" ON clubs FOR UPDATE USING (
  auth.uid() = president_id OR (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) = true
);
DROP POLICY IF EXISTS "Clubs: president delete" ON clubs;
CREATE POLICY "Clubs: president or superadmin delete" ON clubs FOR DELETE USING (
  auth.uid() = president_id OR (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "Club roles: president manage" ON club_roles;
CREATE POLICY "Club roles: board or superadmin manage" ON club_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM clubs c JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true))
  OR (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "Club members: board update" ON club_members;
CREATE POLICY "Club members: board or superadmin update" ON club_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clubs c JOIN club_members cm ON cm.club_id = c.id AND cm.member_id = auth.uid()
    WHERE c.id = club_id AND cm.status = 'accepted' AND (c.president_id = auth.uid() OR cm.is_board_member = true)
  )
  OR (SELECT is_superadmin FROM profiles WHERE id = auth.uid()) = true
);
