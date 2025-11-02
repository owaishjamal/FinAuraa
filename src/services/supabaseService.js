/**
 * Supabase service layer for FinAura data operations
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localComputeNFI, localExplain, localNudges } from '@/utils/nfi';

export class SupabaseService {
  /**
   * Get user profile
   */
  static async getProfile(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { ok: true, data };
    } catch (error) {
      return { ok: false, data: null, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Save NFI computation to history
   */
  static async saveNFIHistory(userId, payload, result, mode = 'local') {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      const { error } = await supabase
        .from('nfi_history')
        .insert({
          user_id: userId,
          monthly_income: payload.monthly_income,
          monthly_spend: payload.monthly_spend,
          savings_balance: payload.savings_balance,
          debt_balance: payload.debt_balance,
          overdraft_count_90d: payload.overdraft_count_90d,
          spend_volatility_30d: payload.spend_volatility_30d,
          budget_adherence_30d: payload.budget_adherence_30d,
          recent_text: payload.recent_text,
          self_reported_stress_0_10: payload.self_reported_stress_0_10,
          sleep_quality_0_10: payload.sleep_quality_0_10,
          nfi: result.nfi,
          finance_subscore: result.finance_subscore,
          emotion_subscore: result.emotion_subscore,
          sentiment: result.sentiment,
          mood_0_100: result.mood_0_100,
          triggers: result.triggers,
          computation_mode: mode
        });

      if (error) throw error;

      // Update profile statistics
      await this.updateProfileStats(userId, result.nfi);

      // Update analytics
      await supabase.rpc('update_analytics_summary', { p_user_id: userId });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Update profile statistics
   */
  static async updateProfileStats(userId, nfi) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      // Get current profile
      const profile = await this.getProfile(userId);
      if (!profile.ok || !profile.data) return { ok: false };

      const current = profile.data;
      const total = current.total_computations || 0;
      const avg = current.average_nfi || 0;
      const best = current.best_nfi || 0;
      const worst = current.worst_nfi || 100;

      // Calculate new average
      const newAvg = (avg * total + nfi) / (total + 1);

      // Update profile
      await supabase
        .from('profiles')
        .update({
          total_computations: total + 1,
          average_nfi: newAvg,
          best_nfi: Math.max(best, nfi),
          worst_nfi: Math.min(worst, nfi)
        })
        .eq('id', userId);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get NFI history
   */
  static async getNFIHistory(userId, limit = 30) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('nfi_history')
        .select('*')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      return { ok: false, data: [], error: error.message };
    }
  }

  /**
   * Compute NFI using enhanced mathematical logic
   */
  static async computeNFI(payload, useLocal = false) {
    // Enhanced mathematical logic (AI-ready but currently uses advanced math)
    const result = localComputeNFI(payload);
    
    // Add trend analysis
    if (isSupabaseConfigured() && !useLocal) {
      // In the future, this can call AI for pattern recognition
      // For now, use statistical analysis
      result.trend_analysis = this.analyzeTrends(payload, result);
    }

    return result;
  }

  /**
   * Analyze trends using mathematical models
   */
  static analyzeTrends(payload, result) {
    // Mathematical trend analysis (future: AI-enhanced)
    const debtRatio = payload.debt_balance / Math.max(payload.savings_balance || 1, 1);
    const savingsRate = (payload.monthly_income - payload.monthly_spend) / Math.max(payload.monthly_income, 1);
    
    return {
      financial_health: savingsRate > 0.2 ? 'excellent' : savingsRate > 0 ? 'good' : 'needs_attention',
      debt_risk: debtRatio > 2 ? 'high' : debtRatio > 1 ? 'moderate' : 'low',
      volatility_risk: payload.spend_volatility_30d > 0.5 ? 'high' : 'moderate',
      recommendations: this.generateRecommendations(payload, result)
    };
  }

  /**
   * Generate recommendations using mathematical logic
   */
  static generateRecommendations(payload, result) {
    const recommendations = [];
    
    const savingsRate = (payload.monthly_income - payload.monthly_spend) / Math.max(payload.monthly_income, 1);
    if (savingsRate < 0.1) {
      recommendations.push({
        priority: 'high',
        category: 'savings',
        message: 'Increase savings rate by reducing discretionary spending',
        impact: 'medium'
      });
    }

    const debtRatio = payload.debt_balance / Math.max(payload.savings_balance || 1, 1);
    if (debtRatio > 1.5) {
      recommendations.push({
        priority: 'high',
        category: 'debt',
        message: 'Focus on debt reduction strategy',
        impact: 'high'
      });
    }

    if (payload.spend_volatility_30d > 0.4) {
      recommendations.push({
        priority: 'medium',
        category: 'stability',
        message: 'Implement budgeting to smooth spending patterns',
        impact: 'medium'
      });
    }

    if (result.emotion_subscore < 50) {
      recommendations.push({
        priority: 'high',
        category: 'wellness',
        message: 'Prioritize stress management and sleep quality',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Get explainability breakdown
   */
  static async getExplain(payload) {
    // Enhanced explainability with mathematical insights
    const contributions = localExplain(payload);
    
    // Add detailed breakdown
    const detailed = {
      ...contributions,
      insights: this.getDetailedInsights(payload, contributions)
    };

    return detailed;
  }

  /**
   * Get detailed insights
   */
  static getDetailedInsights(payload, contributions) {
    const insights = [];

    if (contributions.savings_rate > 30) {
      insights.push('Strong savings rate indicates financial discipline');
    }

    if (contributions.debt_health < 15) {
      insights.push('Debt load is impacting financial health significantly');
    }

    if (contributions.volatility_smoothness > 20) {
      insights.push('Stable spending patterns contribute positively to NFI');
    }

    return insights;
  }

  /**
   * Get personalized nudges
   */
  static async getNudges(nfi, triggers, userId = null) {
    // Ensure triggers is an object
    const safeTriggers = triggers || {};
    
    // Enhanced nudge system with personalization
    let baseNudges = localNudges(nfi, safeTriggers);
    
    // Ensure we always have nudges
    if (!baseNudges || !baseNudges.nudges || baseNudges.nudges.length === 0) {
      // Generate default nudges if none exist
      baseNudges = {
        nudges: nfi >= 70 
          ? ["Great balance! Consider nudging NFI +5 with a small, auto-scheduled investment today."]
          : ["Review your financial inputs and emotional state to improve your NFI score."],
        learned_scores: {}
      };
    }

    if (isSupabaseConfigured() && userId) {
      try {
        // Get user feedback history for personalization (non-blocking)
        try {
          const { data: feedback, error: feedbackError } = await supabase
            .from('nudge_feedback')
            .select('nudge_key, reward')
            .eq('user_id', userId);

          if (!feedbackError && feedback && feedback.length > 0) {
            // Weight nudges based on historical feedback
            const feedbackScores = {};
            feedback.forEach(f => {
              if (!feedbackScores[f.nudge_key]) {
                feedbackScores[f.nudge_key] = 0;
              }
              feedbackScores[f.nudge_key] += f.reward;
            });

            // Sort nudges by feedback scores
            if (baseNudges.nudges) {
              baseNudges.nudges = baseNudges.nudges.sort((a, b) => {
                const keyA = this.getNudgeKey(a);
                const keyB = this.getNudgeKey(b);
                return (feedbackScores[keyB] || 0) - (feedbackScores[keyA] || 0);
              });
            }
          }
        } catch (feedbackErr) {
          console.warn("Error getting feedback for personalization:", feedbackErr);
          // Continue without personalization
        }

        // Save nudges to database (non-blocking - don't fail if this errors)
        if (baseNudges.nudges && baseNudges.nudges.length > 0) {
          try {
            const nudgesToSave = baseNudges.nudges.map(nudge => ({
              user_id: userId,
              nudge_key: this.getNudgeKey(nudge),
              nudge_text: nudge,
              nfi_value: nfi,
              triggers: safeTriggers,
              shown_at: new Date().toISOString()
            }));

            await supabase.from('nudges').insert(nudgesToSave);
          } catch (saveError) {
            console.warn("Error saving nudges to database:", saveError);
            // Continue - saving nudges is not critical
          }
        }
      } catch (err) {
        console.warn("Error in getNudges personalization, returning base nudges:", err);
        // Return base nudges even if personalization fails
      }
    }

    // Ensure we return valid format
    return {
      nudges: baseNudges.nudges || [],
      learned_scores: baseNudges.learned_scores || {}
    };
  }

  /**
   * Get nudge key from text
   */
  static getNudgeKey(nudge) {
    if (nudge.includes('cooling-off')) return 'high_spend';
    if (nudge.includes('Envelope Lock')) return 'low_budget_adherence';
    if (nudge.includes('snowball')) return 'high_debt_ratio';
    if (nudge.includes('Auto-Transfers')) return 'high_volatility';
    if (nudge.includes('Pause')) return 'high_stress';
    if (nudge.includes('Low sleep')) return 'low_sleep';
    if (nudge.includes('Tone suggests')) return 'negative_sentiment';
    return 'other';
  }

  /**
   * Save nudge feedback
   */
  static async saveFeedback(userId, nudgeKey, reward) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      // Get latest nudge for this key
      const { data: nudge } = await supabase
        .from('nudges')
        .select('id')
        .eq('user_id', userId)
        .eq('nudge_key', nudgeKey)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { error } = await supabase
        .from('nudge_feedback')
        .insert({
          user_id: userId,
          nudge_id: nudge?.id || null,
          nudge_key: nudgeKey,
          reward: reward
        });

      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Save transactions from CSV
   */
  static async saveTransactions(userId, transactions) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, saved: 0 };
    }

    try {
      const transactionsToInsert = transactions.map(t => ({
        user_id: userId,
        transaction_date: t.date,
        amount: t.amount,
        category: t.category,
        source: 'csv'
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (error) throw error;

      // Update analytics
      await supabase.rpc('update_analytics_summary', { p_user_id: userId });

      return { ok: true, saved: data?.length || 0 };
    } catch (error) {
      return { ok: false, saved: 0, error: error.message };
    }
  }

  /**
   * Get transactions
   */
  static async getTransactions(userId, limit = 100) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      return { ok: false, data: [], error: error.message };
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalytics(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: null };
    }

    try {
      const { data, error } = await supabase
        .from('analytics_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return { ok: true, data: data || null };
    } catch (error) {
      return { ok: false, data: null, error: error.message };
    }
  }

  /**
   * Update journal streak
   */
  static async updateJournalStreak(userId, hasEntry) {
    if (!isSupabaseConfigured() || !userId || !hasEntry) {
      return { ok: false };
    }

    try {
      const profile = await this.getProfile(userId);
      if (!profile.ok || !profile.data) return { ok: false };

      const today = new Date().toISOString().split('T')[0];
      const lastDate = profile.data.last_journal_date;
      const currentStreak = profile.data.journal_streak || 0;

      let newStreak = currentStreak;
      if (!lastDate) {
        newStreak = 1;
      } else {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(today);
        const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day, no change
          newStreak = currentStreak;
        } else if (diffDays === 1) {
          // Consecutive day
          newStreak = currentStreak + 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }

      await supabase
        .from('profiles')
        .update({
          journal_streak: newStreak,
          last_journal_date: today
        })
        .eq('id', userId);

      // Check for streak achievements
      await this.checkStreakAchievements(userId, newStreak);

      return { ok: true, streak: newStreak };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Check for streak achievements
   */
  static async checkStreakAchievements(userId, streak) {
    if (!isSupabaseConfigured() || !userId) return;

    const milestones = [7, 14, 30, 60, 100];
    if (milestones.includes(streak)) {
      await supabase.from('achievements').insert({
        user_id: userId,
        achievement_type: 'streak',
        achievement_name: `${streak} Day Streak`,
        description: `Maintained journal streak for ${streak} days`,
        metadata: { streak_days: streak }
      });
    }
  }

  // ==================== UNIQUE FEATURES ====================

  /**
   * Calculate emotion-spend correlation
   */
  static async calculateEmotionSpendCorrelation(userId, correlationType = 'stress', days = 30) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, correlation: 0 };
    }

    try {
      const { data, error } = await supabase.rpc('calculate_emotion_spend_correlation', {
        p_user_id: userId,
        p_correlation_type: correlationType,
        p_days: days
      });

      if (error) throw error;

      // Save correlation result
      const correlationValue = data || 0;
      await supabase.from('emotion_spend_correlations').upsert({
        user_id: userId,
        correlation_type: correlationType,
        correlation_value: correlationValue,
        confidence: Math.abs(correlationValue) > 0.3 ? 0.8 : 0.5, // Higher confidence for stronger correlations
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,correlation_type'
      });

      return { ok: true, correlation: data || 0 };
    } catch (error) {
      return { ok: false, correlation: 0, error: error.message };
    }
  }

  /**
   * Get emotion-spend correlations
   */
  static async getEmotionSpendCorrelations(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('emotion_spend_correlations')
        .select('*')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      return { ok: false, data: [], error: error.message };
    }
  }

  /**
   * Calculate emotional risk score
   */
  static async calculateEmotionalRiskScore(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, riskScore: 0 };
    }

    try {
      // Try RPC function first, but fallback to local calculation if it doesn't exist
      let riskScore = 0;
      
      try {
        const { data, error } = await supabase.rpc('calculate_emotional_risk_score', {
          p_user_id: userId
        });

        if (error) {
          // RPC function might not exist - calculate locally
          throw error;
        }

        riskScore = data || 0;
      } catch (rpcError) {
        // Fallback to local calculation
        const profile = await this.getProfile(userId);
        if (profile.ok && profile.data) {
          const { self_reported_stress_0_10, sleep_quality_0_10 } = profile.data;
          
          // Get recent NFI
          const historyResult = await this.getNFIHistory(userId, 1);
          const recentNFI = historyResult.ok && historyResult.data?.[0]?.nfi || 0;
          const recentSentiment = historyResult.ok && historyResult.data?.[0]?.sentiment || 0;
          const recentMood = historyResult.ok && historyResult.data?.[0]?.mood_0_100 || 50;
          
          // Local risk calculation
          riskScore = 0;
          riskScore += (self_reported_stress_0_10 / 10.0) * 30;
          riskScore += ((10 - sleep_quality_0_10) / 10.0) * 25;
          if (recentSentiment < 0) {
            riskScore += Math.abs(recentSentiment) * 20;
          }
          if (recentMood < 50) {
            riskScore += ((50 - recentMood) / 50.0) * 25;
          }
          if (recentNFI < 50) {
            riskScore += ((50 - recentNFI) / 50.0) * 10;
          }
          riskScore = Math.max(0, Math.min(100, riskScore));
        }
      }

      // Update profile (don't fail if this errors)
      try {
        await supabase
          .from('profiles')
          .update({
            emotional_risk_score: riskScore,
            emotional_risk_calculated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } catch (updateError) {
        console.warn("Could not update risk score in profile:", updateError);
      }

      // Record risk event (don't fail if this errors)
      try {
        await supabase.from('emotional_risk_events').insert({
          user_id: userId,
          risk_score: riskScore,
          prediction: this.generateRiskPrediction(riskScore)
        });
      } catch (insertError) {
        console.warn("Could not record risk event:", insertError);
      }

      return { ok: true, riskScore };
    } catch (error) {
      console.warn("Error calculating emotional risk score:", error);
      return { ok: false, riskScore: 0, error: error.message };
    }
  }

  /**
   * Generate risk prediction text
   */
  static generateRiskPrediction(riskScore) {
    if (riskScore >= 75) {
      return "Very high risk of poor financial decisions";
    } else if (riskScore >= 50) {
      return "High risk of impulse spending";
    } else if (riskScore >= 25) {
      return "Moderate risk - stay mindful";
    } else {
      return "Low risk - good emotional state";
    }
  }

  /**
   * Check and activate recovery mode if needed
   */
  static async checkRecoveryMode(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, shouldActivate: false };
    }

    try {
      let shouldActivate = false;
      
      // Try RPC function first, fallback to local check
      try {
        const { data, error } = await supabase.rpc('should_activate_recovery_mode', {
          p_user_id: userId
        });

        if (error) throw error;
        shouldActivate = data || false;
      } catch (rpcError) {
        // Fallback to local check
        const profile = await this.getProfile(userId);
        if (profile.ok && profile.data) {
          const { self_reported_stress_0_10, sleep_quality_0_10 } = profile.data;
          
          // Check negative sentiment streak
          const historyResult = await this.getNFIHistory(userId, 3);
          let negativeSentimentStreak = 0;
          if (historyResult.ok && historyResult.data) {
            negativeSentimentStreak = historyResult.data
              .filter(h => h.sentiment < -0.2)
              .length;
          }
          
          // Activate if: stress >= 8 OR sleep <= 4 OR 3+ negative sentiments
          shouldActivate = self_reported_stress_0_10 >= 8 || 
                          sleep_quality_0_10 <= 4 || 
                          negativeSentimentStreak >= 3;
        }
      }

      if (shouldActivate) {
        // Check if already in recovery mode
        const profile = await this.getProfile(userId);
        if (profile.ok && profile.data && !profile.data.recovery_mode) {
          // Activate recovery mode (don't fail if this errors)
          try {
            await supabase
              .from('profiles')
              .update({
                recovery_mode: true,
                recovery_mode_activated_at: new Date().toISOString()
              })
              .eq('id', userId);

            // Get current NFI
            const { data: nfiData } = await supabase
              .from('nfi_history')
              .select('nfi')
              .eq('user_id', userId)
              .order('computed_at', { ascending: false })
              .limit(1)
              .single();

            // Get trigger reason
            const triggerReason = await this.getRecoveryModeTrigger(userId);
            
            // Create recovery mode session (don't fail if this errors)
            try {
              await supabase.from('recovery_mode_sessions').insert({
                user_id: userId,
                trigger_reason: triggerReason,
                initial_nfi: nfiData?.nfi || 0
              });
            } catch (sessionError) {
              console.warn("Could not create recovery mode session:", sessionError);
            }
          } catch (updateError) {
            console.warn("Could not activate recovery mode:", updateError);
          }
        }
      }

      return { ok: true, shouldActivate };
    } catch (error) {
      console.warn("Error checking recovery mode:", error);
      return { ok: false, shouldActivate: false, error: error.message };
    }
  }

  /**
   * Get recovery mode trigger reason
   */
  static async getRecoveryModeTrigger(userId) {
    const profile = await this.getProfile(userId);
    if (!profile.ok || !profile.data) return 'manual';

    const { self_reported_stress_0_10, sleep_quality_0_10 } = profile.data;

    if (self_reported_stress_0_10 >= 8) return 'high_stress';
    if (sleep_quality_0_10 <= 4) return 'low_sleep';
    return 'negative_sentiment_streak';
  }

  /**
   * Deactivate recovery mode
   */
  static async deactivateRecoveryMode(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      // Get current session
      const { data: session } = await supabase
        .from('recovery_mode_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('deactivated_at', null)
        .order('activated_at', { ascending: false })
        .limit(1)
        .single();

      // Update profile
      await supabase
        .from('profiles')
        .update({
          recovery_mode: false
        })
        .eq('id', userId);

      // Get final NFI
      const { data: nfiData } = await supabase
        .from('nfi_history')
        .select('nfi')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      // Close session
      if (session) {
        const activatedAt = new Date(session.activated_at);
        const now = new Date();
        const durationHours = (now - activatedAt) / (1000 * 60 * 60);

        await supabase
          .from('recovery_mode_sessions')
          .update({
            deactivated_at: new Date().toISOString(),
            final_nfi: nfiData?.nfi || 0,
            duration_hours: durationHours
          })
          .eq('id', session.id);
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Toggle spending lock for category
   */
  static async toggleSpendingLock(userId, category, lock = true, reason = 'manual') {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      // Get current locked categories
      const profile = await this.getProfile(userId);
      if (!profile.ok || !profile.data) return { ok: false };

      let lockedCategories = profile.data.locked_categories || [];
      
      if (lock) {
        // Lock category
        if (!lockedCategories.includes(category)) {
          lockedCategories.push(category);
          
          await supabase.from('spending_locks_history').insert({
            user_id: userId,
            category,
            lock_reason: reason,
            is_active: true
          });
        }
      } else {
        // Unlock category
        lockedCategories = lockedCategories.filter(c => c !== category);
        
        await supabase
          .from('spending_locks_history')
          .update({
            unlocked_at: new Date().toISOString(),
            is_active: false
          })
          .eq('user_id', userId)
          .eq('category', category)
          .is('unlocked_at', null);
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          locked_categories: lockedCategories
        })
        .eq('id', userId);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get active spending locks
   */
  static async getActiveSpendingLocks(userId) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('spending_locks_history')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('locked_at', { ascending: false });

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (error) {
      return { ok: false, data: [], error: error.message };
    }
  }

  /**
   * Save transaction with emotional state
   */
  static async saveTransactionWithEmotion(userId, transaction, emotionalState) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        transaction_date: transaction.date,
        amount: transaction.amount,
        category: transaction.category,
        emotional_state: emotionalState,
        source: transaction.source || 'manual'
      });

      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get timeline events for visualization
   */
  static async getTimelineEvents(userId, days = 30) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false, data: [] };
    }

    try {
      // Get NFI history as timeline events
      const { data: nfiHistory } = await supabase
        .from('nfi_history')
        .select('*')
        .eq('user_id', userId)
        .gte('computed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('computed_at', { ascending: true });

      // Get transactions as timeline events
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      // Get explicit timeline events
      const { data: timelineEvents } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('event_date', { ascending: true });

      // Combine and format
      const events = [];
      
      if (nfiHistory) {
        nfiHistory.forEach(h => {
          events.push({
            id: h.id,
            type: 'nfi_computation',
            date: h.computed_at,
            title: `NFI: ${h.nfi.toFixed(1)}`,
            description: `Finance: ${h.finance_subscore.toFixed(1)}, Emotion: ${h.emotion_subscore.toFixed(1)}`,
            nfi: h.nfi,
            emotion: {
              stress: h.self_reported_stress_0_10,
              sleep: h.sleep_quality_0_10,
              sentiment: h.sentiment,
              mood: h.mood_0_100
            }
          });
        });
      }

      if (transactions) {
        transactions.forEach(t => {
          if (t.amount < 0 && t.emotional_state) {
            events.push({
              id: t.id,
              type: 'transaction',
              date: t.transaction_date,
              title: `${t.category}: ₹${Math.abs(t.amount).toFixed(2)}`,
              description: `Transaction during ${t.emotional_state.stress || '?'}/10 stress`,
              emotion: t.emotional_state
            });
          }
        });
      }

      if (timelineEvents) {
        timelineEvents.forEach(e => events.push(e));
      }

      // Sort by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      return { ok: true, data: events };
    } catch (error) {
      return { ok: false, data: [], error: error.message };
    }
  }

  /**
   * Create timeline event
   */
  static async createTimelineEvent(userId, eventType, title, description, metadata = {}) {
    if (!isSupabaseConfigured() || !userId) {
      return { ok: false };
    }

    try {
      const { error } = await supabase.from('timeline_events').insert({
        user_id: userId,
        event_type: eventType,
        title,
        description,
        metadata
      });

      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

