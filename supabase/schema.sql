-- ============================================================
-- MindCompass AI — Supabase Database Schema
-- ============================================================
-- Security:
--   - Row Level Security (RLS) enabled on ALL tables.
--   - Every policy enforces: user_id = auth.uid()
--   - Users can NEVER read or write another user's data.
--   - input validation: constraints on score ranges and required fields.
-- ============================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- Table: user_profiles
-- Stores exam preparation profile (not auth data)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  exam_type        TEXT NOT NULL CHECK (exam_type IN ('JEE','NEET','UPSC','CAT','GATE','CUET','Board Exams')),
  exam_date        DATE NOT NULL,
  stress_level     SMALLINT NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
  avg_sleep        NUMERIC(4,1) NOT NULL CHECK (avg_sleep BETWEEN 0 AND 16),
  confidence       SMALLINT NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  check_in_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Row Level Security: users can only access their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Table: daily_metrics
-- One row per user per day — enforced by UNIQUE constraint
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score       SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  energy_score     SMALLINT NOT NULL CHECK (energy_score BETWEEN 1 AND 10),
  confidence_score SMALLINT NOT NULL CHECK (confidence_score BETWEEN 1 AND 10),
  sleep_hours      NUMERIC(4,1) NOT NULL CHECK (sleep_hours BETWEEN 0 AND 16),
  study_hours      NUMERIC(4,1) NOT NULL CHECK (study_hours BETWEEN 0 AND 24),
  check_in_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, check_in_date)  -- one check-in per day enforced at DB level
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON public.daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON public.daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Table: journal_entries
-- Sensitive data: encrypted at rest (Supabase default)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  entry_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journals"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Table: ai_insights
-- Stores structured Gemini analysis results per check-in
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotions             JSONB NOT NULL DEFAULT '[]',
  dominant_emotion     TEXT NOT NULL DEFAULT '',
  emotional_summary    TEXT NOT NULL DEFAULT '',
  coping_strategy      JSONB NOT NULL DEFAULT '{}',
  mindfulness_exercise JSONB NOT NULL DEFAULT '{}',
  encouragement        TEXT NOT NULL DEFAULT '',
  score_inputs         JSONB NOT NULL DEFAULT '{}',
  safety_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  insight_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, insight_date)
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Table: readiness_scores
-- Mental Readiness Score history (calculated client-side, stored here)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  components  JSONB NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL DEFAULT '',
  score_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, score_date)
);

ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON public.readiness_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON public.readiness_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON public.readiness_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Table: weekly_summaries
-- AI-generated weekly pattern summaries (generated every 7th check-in)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,
  week_ending  DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_ending)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly summaries"
  ON public.weekly_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries"
  ON public.weekly_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Performance Indexes
-- efficient loops: indexes on the most queried columns
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date
  ON public.daily_metrics (user_id, check_in_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
  ON public.journal_entries (user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_date
  ON public.ai_insights (user_id, insight_date DESC);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_user_date
  ON public.readiness_scores (user_id, score_date DESC);

-- ─────────────────────────────────────────────
-- Updated-at trigger for user_profiles
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
