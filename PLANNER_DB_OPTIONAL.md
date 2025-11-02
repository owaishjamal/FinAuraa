# Planner Database Support - OPTIONAL

## Current Status: ✅ Works Without Database

The Planner page currently uses **local state only** - everything works without any database support:

- ✅ Quick Goal Presets - Hardcoded, no DB needed
- ✅ Interactive Sliders - Local state, no DB needed  
- ✅ Envelope Locks - Local state (resets on page reload)
- ✅ Savings Goal Calculator - Local state (resets on page reload)
- ✅ Debt Payoff Calculator - Local state (resets on page reload)
- ✅ Saved Scenarios - Local state (last 5 in memory, resets on reload)
- ✅ Comparison Charts - Uses existing NFI data

## ❌ What Doesn't Persist

Currently, when you reload the page, you lose:
- Saved scenarios
- Savings goals
- Debt payoff plans
- Envelope locks

## ✅ Optional: Add Database Persistence

If you want to **persist data across sessions**, you can use the existing `goals` table. The schema already supports:

```sql
-- Already exists in your schema!
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'nfi_target', 
    'savings_target', 
    'debt_reduction', 
    'adherence_improvement', 
    'spend_reduction'
  )),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  achieved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
```

## Recommendation

**For now: Keep it local-only** (no migration needed)
- Everything works perfectly
- No database overhead
- Faster performance
- Simpler code

**Later: Add persistence if needed**
- Users complain about losing scenarios
- You want to track goal progress over time
- You want to sync across devices

## Summary

**Answer: NO migration needed for current functionality.**

The Planner works 100% with local state. Database support would only be needed if you want to persist data across sessions.

