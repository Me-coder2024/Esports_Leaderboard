-- =====================================================
-- Tournament Scoring App — Supabase Database Setup
-- Run this in the Supabase SQL Editor (Dashboard > SQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS tournaments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  game        TEXT NOT NULL CHECK (game IN ('FREE_FIRE', 'BGMI')),
  banner_url  TEXT,
  total_matches INT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'SETUP' CHECK (status IN ('SETUP', 'IN_PROGRESS', 'COMPLETED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id    UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name        TEXT NOT NULL,
  team_leader_name TEXT NOT NULL,
  logo_url         TEXT
);

CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_number   INT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),

  UNIQUE(tournament_id, match_number)
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

CREATE TABLE IF NOT EXISTS match_results (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id           UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id            UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  placement          INT NOT NULL,
  kills              INT NOT NULL DEFAULT 0,
  placement_points   INT NOT NULL DEFAULT 0,
  elimination_points INT NOT NULL DEFAULT 0,
  total_points       INT NOT NULL DEFAULT 0,

  UNIQUE(match_id, team_id),
  UNIQUE(match_id, placement)
);

CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_team ON match_results(team_id);

-- =====================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Allow all operations via service key (API routes)
-- Allow public read on tournaments, teams, matches, match_results
-- =====================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read match_results" ON match_results FOR SELECT USING (true);

-- Full access for service role (used by API routes)
CREATE POLICY "Service full access tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access match_results" ON match_results FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET for logos/banners (optional)
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('tournament-assets', 'tournament-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read from the bucket
CREATE POLICY "Public read tournament assets" ON storage.objects 
  FOR SELECT USING (bucket_id = 'tournament-assets');

-- Allow authenticated uploads (via service key from API routes)
CREATE POLICY "Service upload tournament assets" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'tournament-assets');
