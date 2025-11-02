/**
 * Planner tab component - Enhanced with interactive features
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Lock,
  TrendingUp,
  TrendingDown,
  Zap,
  Calculator,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PiggyBank,
  CreditCard,
  Calendar,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { fmt } from "@/utils/formatting";
import { clamp } from "@/utils/sentiment";
import { localComputeNFI } from "@/utils/nfi";
import { palette } from "@/constants/palette";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from "recharts";

export function Planner({
  payload,
  deltaAdh,
  setDeltaAdh,
  deltaSpend,
  setDeltaSpend,
  deltaVol,
  setDeltaVol,
  simNfi,
  setSimNfi,
  res,
  adh,
  setAdh,
  theme,
}) {
  const [lockedCategories, setLockedCategories] = useState(new Set());
  const [scenarios, setScenarios] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [debtPayoffMonths, setDebtPayoffMonths] = useState(12);
  const [activeGoal, setActiveGoal] = useState(null);

  // Quick goal presets
  const goalPresets = [
    {
      name: "Save ₹10k/month",
      deltaSpend: -10000,
      deltaAdh: 0.1,
      deltaVol: -0.1,
      icon: PiggyBank,
    },
    {
      name: "Cut Spending 20%",
      deltaSpend: payload.monthly_spend * -0.2,
      deltaAdh: 0.15,
      deltaVol: -0.15,
      icon: TrendingDown,
    },
    {
      name: "Debt Free in 6mo",
      deltaSpend: payload.debt_balance / -6,
      deltaAdh: 0.2,
      deltaVol: -0.2,
      icon: CreditCard,
    },
    {
      name: "Stable Cashflow",
      deltaVol: -0.25,
      deltaAdh: 0.1,
      deltaSpend: 0,
      icon: BarChart3,
    },
  ];

  const categories = ["Dining Out", "Gadgets", "Fashion", "Travel Fun", "Entertainment", "Subscriptions"];

  const simulate = () => {
    const sim = { ...payload };
    sim.budget_adherence_30d = clamp(sim.budget_adherence_30d + deltaAdh, 0, 1);
    sim.monthly_spend = Math.max(0, sim.monthly_spend + deltaSpend);
    sim.spend_volatility_30d = clamp(sim.spend_volatility_30d + deltaVol, 0, 1);

    const d = localComputeNFI(sim);
    setSimNfi(d.nfi);
    
    // Add to scenarios for comparison
    const scenario = {
      name: `Scenario ${scenarios.length + 1}`,
      nfi: d.nfi,
      deltaAdh,
      deltaSpend,
      deltaVol,
      timestamp: new Date().toLocaleTimeString(),
    };
    setScenarios([...scenarios.slice(-4), scenario]);
  };

  const applyGoalPreset = (preset) => {
    setDeltaSpend(preset.deltaSpend || 0);
    setDeltaAdh(preset.deltaAdh || 0);
    setDeltaVol(preset.deltaVol || 0);
    setActiveGoal(preset.name);
    setTimeout(() => simulate(), 100);
  };

  const toggleCategoryLock = (category) => {
    const newLocked = new Set(lockedCategories);
    if (newLocked.has(category)) {
      newLocked.delete(category);
      setAdh(Math.max(0.1, adh - 0.02));
    } else {
      newLocked.add(category);
      setAdh(Math.min(1, adh + 0.03));
    }
    setLockedCategories(newLocked);
  };

  // Calculate savings timeline
  const savingsTimeline = useMemo(() => {
    if (!savingsGoal || savingsGoal <= 0) return [];
    const monthlySavings = payload.monthly_income - payload.monthly_spend - deltaSpend;
    if (monthlySavings <= 0) return [];
    
    const months = [];
    let current = payload.savings_balance;
    for (let i = 0; i <= 24 && current < savingsGoal; i++) {
      months.push({
        month: i,
        savings: Math.round(current),
        goal: savingsGoal,
      });
      current += monthlySavings;
    }
    return months;
  }, [savingsGoal, payload, deltaSpend]);

  // Calculate debt payoff
  const debtPayoffData = useMemo(() => {
    if (!payload.debt_balance || payload.debt_balance <= 0) return null;
    const monthlyPayment = payload.debt_balance / debtPayoffMonths;
    const monthlySavings = Math.max(0, payload.monthly_income - payload.monthly_spend - deltaSpend);
    
    if (monthlySavings < monthlyPayment) {
      return { feasible: false, months: debtPayoffMonths, payment: monthlyPayment };
    }
    
    return {
      feasible: true,
      months: debtPayoffMonths,
      payment: monthlyPayment,
      requiredSavings: monthlyPayment - (monthlySavings * 0.3), // Use 30% of savings
    };
  }, [payload, deltaSpend, debtPayoffMonths]);

  // Calculate impact metrics
  const impactMetrics = useMemo(() => {
    if (!simNfi || !res) return null;
    const nfiDelta = simNfi - res.nfi;
    const projectedSavings = payload.monthly_income - (payload.monthly_spend + deltaSpend);
    const monthsToGoal = savingsGoal > 0 && projectedSavings > 0 
      ? Math.ceil((savingsGoal - payload.savings_balance) / projectedSavings) 
      : null;
    
    return {
      nfiImprovement: nfiDelta,
      projectedSavings: projectedSavings,
      monthsToGoal,
      adherenceImprovement: deltaAdh,
      volatilityReduction: -deltaVol,
    };
  }, [simNfi, res, deltaSpend, deltaAdh, deltaVol, savingsGoal, payload]);

  // Chart data for comparison
  const comparisonData = useMemo(() => {
    const data = [
      { metric: "Current", nfi: res?.nfi || 0, finance: res?.finance_subscore || 0, emotion: res?.emotion_subscore || 0 },
    ];
    if (simNfi !== null) {
      const simResult = localComputeNFI({
        ...payload,
        budget_adherence_30d: clamp(payload.budget_adherence_30d + deltaAdh, 0, 1),
        monthly_spend: Math.max(0, payload.monthly_spend + deltaSpend),
        spend_volatility_30d: clamp(payload.spend_volatility_30d + deltaVol, 0, 1),
      });
      data.push({
        metric: "Projected",
        nfi: simNfi,
        finance: simResult.finance_subscore,
        emotion: simResult.emotion_subscore,
      });
    }
    return data;
  }, [res, simNfi, payload, deltaAdh, deltaSpend, deltaVol]);

  return (
    <div className="space-y-4">
      {/* Quick Goal Presets */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-background/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Quick Goal Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {goalPresets.map((preset) => {
              const Icon = preset.icon;
              const isActive = activeGoal === preset.name;
              return (
                <Button
                  key={preset.name}
                  variant={isActive ? "default" : "outline"}
                  className={`h-auto py-3 flex flex-col gap-2 rounded-xl ${isActive ? `bg-gradient-to-r ${palette[theme].grad}` : ""}`}
                  onClick={() => applyGoalPreset(preset)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{preset.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Simulator Card */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Goal Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Interactive Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Budget Adherence Δ</Label>
                  <Badge variant="outline">{fmt(deltaAdh, 2)}</Badge>
                </div>
                <input
                  type="range"
                  min="-0.2"
                  max="0.2"
                  step="0.01"
                  value={deltaAdh}
                  onChange={(e) => {
                    setDeltaAdh(parseFloat(e.target.value));
                    setActiveGoal(null);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-0.2</span>
                  <span>0</span>
                  <span>+0.2</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Monthly Spend Δ (₹)</Label>
                  <Badge variant="outline">{fmt(deltaSpend, 0)}</Badge>
                </div>
                <input
                  type="range"
                  min={payload.monthly_spend * -0.5}
                  max={payload.monthly_spend * 0.2}
                  step={500}
                  value={deltaSpend}
                  onChange={(e) => {
                    setDeltaSpend(parseFloat(e.target.value));
                    setActiveGoal(null);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Cut {fmt(payload.monthly_spend * 0.5, 0)}</span>
                  <span>₹0</span>
                  <span>+{fmt(payload.monthly_spend * 0.2, 0)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Volatility Δ</Label>
                  <Badge variant="outline">{fmt(deltaVol, 2)}</Badge>
                </div>
                <input
                  type="range"
                  min="-0.3"
                  max="0.1"
                  step="0.01"
                  value={deltaVol}
                  onChange={(e) => {
                    setDeltaVol(parseFloat(e.target.value));
                    setActiveGoal(null);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-0.3</span>
                  <span>0</span>
                  <span>+0.1</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Simulate Button and Results */}
            <div className="flex items-center gap-3">
              <Button
                onClick={simulate}
                className={`flex-1 rounded-2xl bg-gradient-to-r ${palette[theme].grad}`}
                size="lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Simulate NFI Impact
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDeltaAdh(0);
                  setDeltaSpend(0);
                  setDeltaVol(0);
                  setSimNfi(null);
                  setActiveGoal(null);
                }}
              >
                Reset
              </Button>
            </div>

            {simNfi !== null && res && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Projected NFI</div>
                    <div className="text-2xl font-bold">{fmt(simNfi, 1)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {simNfi > res.nfi ? (
                      <>
                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                        <Badge variant="secondary" className="text-green-600">
                          +{fmt(simNfi - res.nfi, 1)}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-5 w-5 text-red-500" />
                        <Badge variant="outline" className="text-red-600">
                          {fmt(simNfi - res.nfi, 1)}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Impact Metrics */}
                {impactMetrics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-xs text-muted-foreground">Projected Savings</div>
                      <div className="text-lg font-semibold">₹{fmt(impactMetrics.projectedSavings, 0)}/mo</div>
                    </div>
                    {impactMetrics.monthsToGoal && (
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="text-xs text-muted-foreground">Months to Goal</div>
                        <div className="text-lg font-semibold">{impactMetrics.monthsToGoal} months</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Tools */}
        <div className="space-y-4">
          {/* Envelope Locks */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> Envelope Locks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Lock categories to improve budget adherence (+{fmt(lockedCategories.size * 3, 0)}%).
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => {
                  const isLocked = lockedCategories.has(category);
                  return (
                    <Button
                      key={category}
                      size="sm"
                      variant={isLocked ? "default" : "outline"}
                      className={`rounded-xl justify-start ${isLocked ? `bg-gradient-to-r ${palette[theme].grad}` : ""}`}
                      onClick={() => toggleCategoryLock(category)}
                    >
                      {isLocked ? (
                        <Lock className="h-3 w-3 mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {category}
                    </Button>
                  );
                })}
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span>Adherence Boost:</span>
                  <Badge variant="secondary">+{fmt(lockedCategories.size * 3, 0)}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings Goal Calculator */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" /> Savings Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Target Amount (₹)</Label>
                <Input
                  type="number"
                  value={savingsGoal || ""}
                  onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                  placeholder="Enter goal"
                  className="mt-1"
                />
              </div>
              {savingsTimeline.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Achievable in {savingsTimeline.length} months
                  </div>
                  <Progress
                    value={(Math.min(savingsTimeline[savingsTimeline.length - 1]?.savings || 0, savingsGoal) / savingsGoal) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debt Payoff Calculator */}
          {payload.debt_balance > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> Debt Payoff
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Pay off in (months)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={debtPayoffMonths}
                    onChange={(e) => setDebtPayoffMonths(parseInt(e.target.value) || 12)}
                    className="mt-1"
                  />
                </div>
                {debtPayoffData && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs">
                      Required payment: <strong>₹{fmt(debtPayoffData.payment, 0)}/mo</strong>
                    </div>
                    {debtPayoffData.feasible ? (
                      <Badge variant="secondary" className="w-full justify-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Achievable
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="w-full justify-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Increase savings needed
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comparison Chart */}
      {comparisonData.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> NFI Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="nfi" fill={`hsl(var(--primary))`} name="NFI Score" />
                <Bar dataKey="finance" fill={`hsl(var(--secondary))`} name="Finance" />
                <Bar dataKey="emotion" fill={`hsl(var(--accent))`} name="Emotion" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Saved Scenarios */}
      {scenarios.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Saved Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-card cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setDeltaAdh(scenario.deltaAdh);
                    setDeltaSpend(scenario.deltaSpend);
                    setDeltaVol(scenario.deltaVol);
                    setSimNfi(scenario.nfi);
                  }}
                >
                  <div className="text-xs text-muted-foreground mb-1">{scenario.name}</div>
                  <div className="text-lg font-bold">{fmt(scenario.nfi, 1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{scenario.timestamp}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

