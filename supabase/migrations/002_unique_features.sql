-- Migration 002: Unique Features Support
-- Adds tables and columns for emotion-aware financial wellness features

-- Add columns to profiles for new features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_mode BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_mode_activated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_lock_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_lock_stress_threshold INTEGER DEFAULT 7 CHECK (auto_lock_stress_threshold >= 0 AND auto_lock_stress_threshold <= 10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_lock_sleep_threshold INTEGER DEFAULT 5 CHECK (auto_lock_sleep_threshold >= 0 AND auto_lock_sleep_threshold <= 10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emotional_risk_score NUMERIC DEFAULT 0 CHECK (emotional_risk_score >= 0 AND emotional_risk_score <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emotional_risk_calculated_at TIMESTAMPTZ;

-- Add emotional state to transactions for correlation analysis
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS emotional_state JSONB;
-- emotional_state: { stress: 5, sleep: 6, sentiment: 0.2, mood: 65 }

-- Emotion-Spend Correlation Table
CREATE TABLE IF NOT EXISTS emotion_spend_correlations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('stress', 'sleep', 'sentiment', 'mood')),
  correlation_value NUMERIC NOT NULL, -- -1 to 1
  confidence NUMERIC DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(user_id, correlation_type)
);

-- Emotional Risk Events (tracks when risk was predicted and outcomes)
CREATE TABLE IF NOT EXISTS emotional_risk_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
  sleep_level INTEGER CHECK (sleep_level >= 0 AND sleep_level <= 10),
  sentiment NUMERIC,
  mood NUMERIC,
  prediction TEXT, -- What was predicted
  actual_outcome TEXT, -- What actually happened
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  outcome_recorded_at TIMESTAMPTZ,
  is_accurate BOOLEAN
);

-- Timeline Events (for emotion-finance timeline visualization)
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('nfi_computation', 'transaction', 'mood_change', 'life_event', 'goal_achieved', 'nudge_actioned')),
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  nfi_value NUMERIC,
  emotion_state JSONB,
  financial_state JSONB,
  metadata JSONB
);

-- Spending Locks History (tracks when categories were locked/unlocked)
CREATE TABLE IF NOT EXISTS spending_locks_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ,
  lock_reason TEXT, -- 'auto_stress', 'auto_sleep', 'manual', 'recovery_mode'
  is_active BOOLEAN DEFAULT true
);

-- Recovery Mode Sessions
CREATE TABLE IF NOT EXISTS recovery_mode_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  trigger_reason TEXT, -- 'high_stress', 'low_sleep', 'negative_sentiment_streak', 'manual'
  initial_nfi NUMERIC,
  final_nfi NUMERIC,
  duration_hours NUMERIC,
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emotion_spend_user_id ON emotion_spend_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_risk_events_user_id ON emotional_risk_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_risk_events_predicted_at ON emotional_risk_events(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_spending_locks_user_id ON spending_locks_history(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_locks_active ON spending_locks_history(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recovery_mode_sessions_user_id ON recovery_mode_sessions(user_id);

-- Row Level Security
ALTER TABLE emotion_spend_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_locks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_mode_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own emotion-spend correlations"
  ON emotion_spend_correlations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own emotional risk events"
  ON emotional_risk_events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own timeline events"
  ON timeline_events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spending locks"
  ON spending_locks_history FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recovery mode sessions"
  ON recovery_mode_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Function to calculate emotion-spend correlation
CREATE OR REPLACE FUNCTION calculate_emotion_spend_correlation(
  p_user_id UUID,
  p_correlation_type TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS NUMERIC AS $$
DECLARE
  v_correlation NUMERIC;
  v_transactions_count INTEGER;
BEGIN
  -- Calculate correlation between emotion state and spending
  -- Returns correlation coefficient (-1 to 1)
  
  IF p_correlation_type = 'stress' THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 10 THEN
          CORR(t.amount::NUMERIC, (t.emotional_state->>'stress')::NUMERIC)
        ELSE 0
      END,
      COUNT(*)
    INTO v_correlation, v_transactions_count
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.transaction_date >= NOW() - (p_days || ' days')::INTERVAL
      AND t.emotional_state IS NOT NULL
      AND t.emotional_state->>'stress' IS NOT NULL
      AND t.amount < 0; -- Only spending (negative amounts)
  ELSIF p_correlation_type = 'sleep' THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 10 THEN
          CORR(t.amount::NUMERIC, (t.emotional_state->>'sleep')::NUMERIC)
        ELSE 0
      END,
      COUNT(*)
    INTO v_correlation, v_transactions_count
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.transaction_date >= NOW() - (p_days || ' days')::INTERVAL
      AND t.emotional_state IS NOT NULL
      AND t.emotional_state->>'sleep' IS NOT NULL
      AND t.amount < 0;
  ELSIF p_correlation_type = 'sentiment' THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 10 THEN
          CORR(t.amount::NUMERIC, (t.emotional_state->>'sentiment')::NUMERIC)
        ELSE 0
      END,
      COUNT(*)
    INTO v_correlation, v_transactions_count
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.transaction_date >= NOW() - (p_days || ' days')::INTERVAL
      AND t.emotional_state IS NOT NULL
      AND t.emotional_state->>'sentiment' IS NOT NULL
      AND t.amount < 0;
  ELSIF p_correlation_type = 'mood' THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 10 THEN
          CORR(t.amount::NUMERIC, (t.emotional_state->>'mood')::NUMERIC)
        ELSE 0
      END,
      COUNT(*)
    INTO v_correlation, v_transactions_count
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.transaction_date >= NOW() - (p_days || ' days')::INTERVAL
      AND t.emotional_state IS NOT NULL
      AND t.emotional_state->>'mood' IS NOT NULL
      AND t.amount < 0;
  ELSE
    RETURN 0;
  END IF;
  
  -- Return 0 if not enough data
  IF v_transactions_count < 10 THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE(v_correlation, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate emotional risk score
CREATE OR REPLACE FUNCTION calculate_emotional_risk_score(
  p_user_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_stress INTEGER;
  v_sleep INTEGER;
  v_sentiment NUMERIC;
  v_mood NUMERIC;
  v_recent_nfi NUMERIC;
  v_risk_score NUMERIC DEFAULT 0;
BEGIN
  -- Get current emotional state from profile
  SELECT 
    self_reported_stress_0_10,
    sleep_quality_0_10,
    (SELECT sentiment FROM nfi_history WHERE user_id = p_user_id ORDER BY computed_at DESC LIMIT 1),
    (SELECT mood_0_100 FROM nfi_history WHERE user_id = p_user_id ORDER BY computed_at DESC LIMIT 1),
    (SELECT nfi FROM nfi_history WHERE user_id = p_user_id ORDER BY computed_at DESC LIMIT 1)
  INTO v_stress, v_sleep, v_sentiment, v_mood, v_recent_nfi
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate risk score (0-100)
  -- Higher stress = higher risk
  v_risk_score := v_risk_score + (v_stress::NUMERIC / 10.0) * 30;
  
  -- Lower sleep = higher risk
  v_risk_score := v_risk_score + ((10 - v_sleep)::NUMERIC / 10.0) * 25;
  
  -- Negative sentiment = higher risk
  IF v_sentiment < 0 THEN
    v_risk_score := v_risk_score + (ABS(v_sentiment) * 20);
  END IF;
  
  -- Low mood = higher risk
  IF v_mood < 50 THEN
    v_risk_score := v_risk_score + ((50 - v_mood) / 50.0) * 25;
  END IF;
  
  -- Recent poor NFI trends increase risk
  IF v_recent_nfi < 50 THEN
    v_risk_score := v_risk_score + ((50 - v_recent_nfi) / 50.0) * 10;
  END IF;
  
  -- Clamp to 0-100
  v_risk_score := GREATEST(0, LEAST(100, v_risk_score));
  
  RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if recovery mode should be activated
CREATE OR REPLACE FUNCTION should_activate_recovery_mode(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stress INTEGER;
  v_sleep INTEGER;
  v_sentiment NUMERIC;
  v_negative_sentiment_streak INTEGER;
BEGIN
  SELECT 
    self_reported_stress_0_10,
    sleep_quality_0_10,
    (SELECT sentiment FROM nfi_history WHERE user_id = p_user_id ORDER BY computed_at DESC LIMIT 1)
  INTO v_stress, v_sleep, v_sentiment
  FROM profiles
  WHERE id = p_user_id;
  
  -- Count negative sentiment streak
  SELECT COUNT(*) INTO v_negative_sentiment_streak
  FROM nfi_history
  WHERE user_id = p_user_id
    AND sentiment < -0.2
    AND computed_at >= NOW() - INTERVAL '7 days'
  ORDER BY computed_at DESC
  LIMIT 3;
  
  -- Activate if: stress > 8 OR sleep < 4 OR 3+ negative sentiments in a row
  IF v_stress >= 8 OR v_sleep <= 4 OR v_negative_sentiment_streak >= 3 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

