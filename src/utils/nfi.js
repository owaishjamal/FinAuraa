/**
 * NFI (NeuroFinance Index) calculations
 */

import { simpleSentiment, clamp } from './sentiment';

export function localComputeNFI(p) {
  const income = Math.max(1, Number(p.monthly_income || 0));
  const spend = Number(p.monthly_spend || 0);
  const savings = Number(p.savings_balance || 0);
  const debt = Number(p.debt_balance || 0);
  const vol = clamp(Number(p.spend_volatility_30d || 0), 0, 1);
  const adh = clamp(Number(p.budget_adherence_30d || 0), 0, 1);
  const sent = simpleSentiment(p.recent_text || "");
  const stress = clamp(Number(p.self_reported_stress_0_10 || 0), 0, 10);
  const sleep = clamp(Number(p.sleep_quality_0_10 ?? 6), 0, 10);

  const savingsRate = clamp((income - spend) / income, 0, 1.5);
  const debtRatio = Math.min(5, debt / Math.max(savings + 1, 1));
  const finance = 0.45 * (savingsRate) * 100
                + 0.20 * (1 - Math.tanh(debtRatio/3)) * 100
                + 0.20 * (1 - vol) * 100
                + 0.15 * (adh) * 100;

  const mood = (sent + 1) * 50;
  const emotion = 0.55 * mood
                + 0.30 * (100 * (1 - stress/10))
                + 0.15 * (sleep * 10);

  const nfi = 0.65 * finance + 0.35 * emotion;

  const triggers = {
    high_spend: spend / income > 0.8 ? 1 : 0,
    low_budget_adherence: adh < 0.6 ? 1 : 0,
    high_debt_ratio: debtRatio > 1.0 ? 1 : 0,
    high_volatility: vol > 0.4 ? 1 : 0,
    high_stress: stress >= 6 ? 1 : 0,
    low_sleep: sleep <= 4 ? 1 : 0,
    negative_sentiment: sent < -0.2 ? 1 : 0,
  };

  return {
    finance_subscore: Number(finance.toFixed(2)),
    emotion_subscore: Number(emotion.toFixed(2)),
    nfi: Number(nfi.toFixed(2)),
    sentiment: Number(sent.toFixed(3)),
    mood_0_100: Number(mood.toFixed(2)),
    triggers,
  };
}

export function localExplain(p){
  const income = Math.max(1, Number(p.monthly_income || 0));
  const spend = Number(p.monthly_spend || 0);
  const savings = Number(p.savings_balance || 0);
  const debt = Number(p.debt_balance || 0);
  const vol = clamp(Number(p.spend_volatility_30d || 0), 0, 1);
  const adh = clamp(Number(p.budget_adherence_30d || 0), 0, 1);
  const sent = simpleSentiment(p.recent_text || "");
  const stress = clamp(Number(p.self_reported_stress_0_10 || 0), 0, 10);
  const sleep = clamp(Number(p.sleep_quality_0_10 ?? 6), 0, 10);

  const savingsRate = clamp((income - spend) / income, 0, 1.5);
  const debtRatio = Math.min(5, debt / Math.max(savings + 1, 1));
  const mood = (sent + 1) * 50;

  const contributions = {
    savings_rate: 0.45 * savingsRate * 100,
    debt_health: 0.20 * (1 - Math.tanh(debtRatio/3)) * 100,
    volatility_smoothness: 0.20 * (1 - vol) * 100,
    budget_adherence: 0.15 * adh * 100,
    mood: 0.35 * 0.55 * mood,
    stress_buffer: 0.35 * 0.30 * (100 * (1 - stress/10)),
    sleep_support: 0.35 * 0.15 * (sleep * 10),
  };
  return Object.fromEntries(Object.entries(contributions).map(([k,v]) => [k, Number(v.toFixed(2))]));
}

export function loadNudgeScores(){
  try { return JSON.parse(localStorage.getItem("NF_NUDGE_SCORES")||"{}") } catch { return {} }
}

export function saveNudgeScores(s){ 
  localStorage.setItem("NF_NUDGE_SCORES", JSON.stringify(s)); 
}

export function localNudges(nfi, triggers){
  const safeTriggers = triggers || {};
  const base = [];
  
  if (safeTriggers.high_spend) base.push(["high_spend", "You're spending over 80% of income. Try a 24-hour cooling-off rule for non-essentials."]);
  if (safeTriggers.low_budget_adherence) base.push(["low_budget_adherence","Budget adherence slipped. Enable 'Envelope Lock' for the next 7 days?"]);
  if (safeTriggers.high_debt_ratio) base.push(["high_debt_ratio","Debt high relative to savings. Consider a micro-snowball plan with ₹1,000/day extra to high-APR debt."]);
  if (safeTriggers.high_volatility) base.push(["high_volatility","Spending is volatile. Turn on 'Weekly Auto-Transfers' to smooth cashflow."]);
  if (safeTriggers.high_stress) base.push(["high_stress","Stress is elevated. Pause high-stakes decisions for 48 hours and review a calming plan."]);
  if (safeTriggers.low_sleep) base.push(["low_sleep","Low sleep reduces decision quality. Schedule important payments in the afternoon."]);
  if (safeTriggers.negative_sentiment) base.push(["negative_sentiment","Tone suggests frustration. Would you like a gentle check-in and a savings win for today?"]);
  
  // Always provide at least one nudge
  if (!base.length) {
    if (nfi >= 70) {
      base.push(["positive","Great balance! Consider nudging NFI +5 with a small, auto-scheduled investment today."]);
    } else if (nfi >= 50) {
      base.push(["general","Your NFI is decent. Focus on maintaining good financial habits and reducing stress."]);
    } else if (nfi >= 30) {
      base.push(["general","Your NFI needs improvement. Focus on increasing savings rate and reducing debt."]);
    } else {
      base.push(["general","Your NFI is low. Review your financial inputs and consider creating a budget plan."]);
    }
  }

  const learned = loadNudgeScores();
  base.sort((a,b)=> (learned[b[0]]||0) - (learned[a[0]]||0));
  return { nudges: base.map(x=>x[1]), learned_scores: learned };
}

