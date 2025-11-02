-- FinAura Supabase Schema
-- Create tables for user profiles, NFI history, transactions, nudges, and feedback

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- User preferences
  theme TEXT DEFAULT 'indigo' CHECK (theme IN ('indigo', 'emerald', 'amber')),
  dark_mode BOOLEAN DEFAULT true,
  auto_explain BOOLEAN DEFAULT true,
  -- Current financial state (snapshot)
  monthly_income NUMERIC DEFAULT 0,
  monthly_spend NUMERIC DEFAULT 0,
  savings_balance NUMERIC DEFAULT 0,
  debt_balance NUMERIC DEFAULT 0,
  overdraft_count_90d INTEGER DEFAULT 0,
  spend_volatility_30d NUMERIC DEFAULT 0,
  budget_adherence_30d NUMERIC DEFAULT 0,
  -- Emotional state
  recent_text TEXT,
  self_reported_stress_0_10 INTEGER DEFAULT 5 CHECK (self_reported_stress_0_10 >= 0 AND self_reported_stress_0_10 <= 10),
  sleep_quality_0_10 INTEGER DEFAULT 6 CHECK (sleep_quality_0_10 >= 0 AND sleep_quality_0_10 <= 10),
  -- Streak tracking
  journal_streak INTEGER DEFAULT 0,
  last_journal_date DATE,
  -- Analytics
  total_computations INTEGER DEFAULT 0,
  average_nfi NUMERIC DEFAULT 0,
  best_nfi NUMERIC DEFAULT 0,
  worst_nfi NUMERIC DEFAULT 100
);

-- NFI History (tracks all NFI computations)
CREATE TABLE IF NOT EXISTS nfi_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  -- Input data
  monthly_income NUMERIC,
  monthly_spend NUMERIC,
  savings_balance NUMERIC,
  debt_balance NUMERIC,
  overdraft_count_90d INTEGER,
  spend_volatility_30d NUMERIC,
  budget_adherence_30d NUMERIC,
  recent_text TEXT,
  self_reported_stress_0_10 INTEGER,
  sleep_quality_0_10 INTEGER,
  -- Output data
  nfi NUMERIC NOT NULL,
  finance_subscore NUMERIC,
  emotion_subscore NUMERIC,
  sentiment NUMERIC,
  mood_0_100 NUMERIC,
  -- Triggers (stored as JSON)
  triggers JSONB,
  -- Metadata
  computation_mode TEXT DEFAULT 'local' CHECK (computation_mode IN ('local', 'remote')),
  session_id TEXT
);

-- Transactions (from CSV insights)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'import'))
);

-- Nudges (personalized recommendations)
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nudge_key TEXT NOT NULL,
  nudge_text TEXT NOT NULL,
  nfi_value NUMERIC,
  triggers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shown_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Nudge Feedback (learns from user interactions)
CREATE TABLE IF NOT EXISTS nudge_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nudge_id UUID REFERENCES nudges(id) ON DELETE CASCADE,
  nudge_key TEXT NOT NULL,
  reward INTEGER NOT NULL CHECK (reward IN (-1, 1)),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals & Achievements
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('nfi_target', 'savings_target', 'debt_reduction', 'adherence_improvement', 'spend_reduction')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  achieved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Achievements (unlockable badges)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Analytics Summary (pre-computed for performance)
CREATE TABLE IF NOT EXISTS analytics_summary (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  -- NFI trends
  nfi_trend_7d NUMERIC,
  nfi_trend_30d NUMERIC,
  nfi_trend_90d NUMERIC,
  -- Financial health
  savings_rate NUMERIC,
  debt_to_savings_ratio NUMERIC,
  -- Category spending (from transactions)
  top_categories JSONB,
  -- Volatility metrics
  spend_volatility_7d NUMERIC,
  spend_volatility_30d NUMERIC,
  -- Last computed
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nfi_history_user_id ON nfi_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nfi_history_computed_at ON nfi_history(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_user_id ON nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_nudges_active ON nudges(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_nudge_feedback_user_id ON nudge_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id, is_active);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- NFI History policies
CREATE POLICY "Users can view own NFI history"
  ON nfi_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own NFI history"
  ON nfi_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);

-- Nudges policies
CREATE POLICY "Users can view own nudges"
  ON nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own nudges"
  ON nudges FOR ALL
  USING (auth.uid() = user_id);

-- Nudge Feedback policies
CREATE POLICY "Users can manage own feedback"
  ON nudge_feedback FOR ALL
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Analytics Summary policies
CREATE POLICY "Users can view own analytics"
  ON analytics_summary FOR SELECT
  USING (auth.uid() = user_id);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update analytics summary
CREATE OR REPLACE FUNCTION update_analytics_summary(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_trend_7d NUMERIC;
  v_trend_30d NUMERIC;
  v_trend_90d NUMERIC;
  v_top_categories JSONB;
BEGIN
  -- Calculate NFI trends
  SELECT AVG(nfi) INTO v_trend_7d
  FROM nfi_history
  WHERE user_id = p_user_id AND computed_at >= NOW() - INTERVAL '7 days';
  
  SELECT AVG(nfi) INTO v_trend_30d
  FROM nfi_history
  WHERE user_id = p_user_id AND computed_at >= NOW() - INTERVAL '30 days';
  
  SELECT AVG(nfi) INTO v_trend_90d
  FROM nfi_history
  WHERE user_id = p_user_id AND computed_at >= NOW() - INTERVAL '90 days';
  
  -- Get top categories
  SELECT jsonb_object_agg(category, total)
  INTO v_top_categories
  FROM (
    SELECT category, SUM(ABS(amount)) as total
    FROM transactions
    WHERE user_id = p_user_id AND amount < 0
      AND transaction_date >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY total DESC
    LIMIT 5
  ) subq;
  
  -- Upsert analytics summary
  INSERT INTO analytics_summary (
    user_id, nfi_trend_7d, nfi_trend_30d, nfi_trend_90d, top_categories, computed_at
  )
  VALUES (
    p_user_id, v_trend_7d, v_trend_30d, v_trend_90d, v_top_categories, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nfi_trend_7d = EXCLUDED.nfi_trend_7d,
    nfi_trend_30d = EXCLUDED.nfi_trend_30d,
    nfi_trend_90d = EXCLUDED.nfi_trend_90d,
    top_categories = EXCLUDED.top_categories,
    computed_at = EXCLUDED.computed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

