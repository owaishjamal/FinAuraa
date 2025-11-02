/**
 * Diagnostic test cases
 */

export const tests = [
  { name: "Disciplined Saver high NFI", p: { monthly_income:90000, monthly_spend:45000, savings_balance:250000, debt_balance:20000, overdraft_count_90d:0, spend_volatility_30d:0.2, budget_adherence_30d:0.9, recent_text:"Calm and confident", self_reported_stress_0_10:2, sleep_quality_0_10:7 }, expect: (d)=> d.nfi >= 65 && d.nfi <= 100 },
  { name: "Anxious Spender lower NFI", p: { monthly_income:60000, monthly_spend:52000, savings_balance:20000, debt_balance:90000, overdraft_count_90d:2, spend_volatility_30d:0.65, budget_adherence_30d:0.5, recent_text:"anxious and overwhelmed", self_reported_stress_0_10:7, sleep_quality_0_10:4 }, expect: (d)=> d.nfi < 65 },
  { name: "Bounded scores", p: { monthly_income:1, monthly_spend:0, savings_balance:0, debt_balance:0, overdraft_count_90d:0, spend_volatility_30d:1, budget_adherence_30d:0, recent_text:"", self_reported_stress_0_10:0, sleep_quality_0_10:0 }, expect: (d)=> d.nfi >= 0 && d.nfi <= 100 },
  { name: "High savings offsets volatility", p: { monthly_income:120000, monthly_spend:90000, savings_balance:600000, debt_balance:50000, overdraft_count_90d:0, spend_volatility_30d:0.7, budget_adherence_30d:0.75, recent_text:"okay and stable", self_reported_stress_0_10:3, sleep_quality_0_10:7 }, expect: (d)=> d.nfi > 55 },
  { name: "Low sleep & high stress depress score", p: { monthly_income:80000, monthly_spend:60000, savings_balance:50000, debt_balance:50000, overdraft_count_90d:1, spend_volatility_30d:0.4, budget_adherence_30d:0.6, recent_text:"tired worried", self_reported_stress_0_10:9, sleep_quality_0_10:2 }, expect: (d)=> d.nfi < 60 },
  { name: "Debt heavy despite positive mood", p: { monthly_income:60000, monthly_spend:55000, savings_balance:10000, debt_balance:250000, overdraft_count_90d:2, spend_volatility_30d:0.5, budget_adherence_30d:0.55, recent_text:"feeling hopeful and calm", self_reported_stress_0_10:3, sleep_quality_0_10:7 }, expect: (d)=> d.nfi < 55 },
  { name: "Very positive mood → high emotion subscore", p: { monthly_income:70000, monthly_spend:60000, savings_balance:50000, debt_balance:20000, overdraft_count_90d:0, spend_volatility_30d:0.3, budget_adherence_30d:0.65, recent_text:"good great happy calm confident love progress excellent", self_reported_stress_0_10:1, sleep_quality_0_10:8 }, expect: (d)=> d.emotion_subscore > 80 },
  // Added extra guards
  { name: "Zero income guard still bounded", p: { monthly_income:0, monthly_spend:0, savings_balance:0, debt_balance:0, overdraft_count_90d:0, spend_volatility_30d:0.2, budget_adherence_30d:0.5, recent_text:"", self_reported_stress_0_10:0, sleep_quality_0_10:0 }, expect: (d)=> d.nfi >= 0 && d.nfi <= 100 },
  { name: "Severe stress drags emotion", p: { monthly_income:70000, monthly_spend:40000, savings_balance:100000, debt_balance:20000, overdraft_count_90d:0, spend_volatility_30d:0.2, budget_adherence_30d:0.8, recent_text:"sad anxious broke", self_reported_stress_0_10:9, sleep_quality_0_10:2 }, expect: (d)=> d.emotion_subscore < 25 },
  // New additive tests (do not change earlier)
  { name: "High adherence, zero debt, good sleep", p: { monthly_income:100000, monthly_spend:80000, savings_balance:0, debt_balance:0, overdraft_count_90d:0, spend_volatility_30d:0.0, budget_adherence_30d:1.0, recent_text:"", self_reported_stress_0_10:0, sleep_quality_0_10:10 }, expect: (d)=> d.nfi >= 60 },
  { name: "Catastrophic finances & emotion very low NFI", p: { monthly_income:50000, monthly_spend:60000, savings_balance:0, debt_balance:300000, overdraft_count_90d:3, spend_volatility_30d:1.0, budget_adherence_30d:0.0, recent_text:"", self_reported_stress_0_10:10, sleep_quality_0_10:0 }, expect: (d)=> d.nfi < 35 },
];

