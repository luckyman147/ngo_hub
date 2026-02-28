-- NGOs table for Activist Hub Onboarding
CREATE TABLE IF NOT EXISTS ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mission TEXT NOT NULL,
  description TEXT,
  causes TEXT[] DEFAULT '{}',
  needs TEXT[] DEFAULT '{}',
  region TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Anyone can read active NGOs
CREATE POLICY "Public can read active ngos"
  ON ngos FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid());

-- Only creators can insert their own
CREATE POLICY "Users can create own ngos"
  ON ngos FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Only creators can update their own
CREATE POLICY "Users can update own ngos"
  ON ngos FOR UPDATE
  USING (auth.uid() = creator_id);

-- Only creators can delete their own
CREATE POLICY "Users can delete own ngos"
  ON ngos FOR DELETE
  USING (auth.uid() = creator_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ngos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ngos_updated_at
  BEFORE UPDATE ON ngos
  FOR EACH ROW
  EXECUTE PROCEDURE update_ngos_updated_at();
