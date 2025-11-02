/**
 * Dashboard tab component - Enhanced UI/UX
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  Brain,
  Sparkles,
  ShieldCheck,
  Bell,
  BadgeCheck,
  TrendingUp,
  Settings2,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  TrendingDown,
  Target,
  AlertTriangle,
  Info,
  Zap,
  DollarSign,
  PiggyBank,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { NumberField } from "@/components/NumberField";
import { fmt } from "@/utils/formatting";
import { clamp } from "@/utils/sentiment";
import { palette } from "@/constants/palette";
import { EmotionSpendCorrelation } from "@/components/uniqueFeatures/EmotionSpendCorrelation";
import { StressBasedLocks } from "@/components/uniqueFeatures/StressBasedLocks";
import { EmotionalRiskScore } from "@/components/uniqueFeatures/EmotionalRiskScore";
import { RecoveryMode } from "@/components/uniqueFeatures/RecoveryMode";
import { EmotionFinanceTimeline } from "@/components/uniqueFeatures/EmotionFinanceTimeline";

export function Dashboard({
  // State
  income, setIncome,
  spend, setSpend,
  savings, setSavings,
  debt, setDebt,
  od, setOd,
  vol, setVol,
  adh, setAdh,
  text, setText,
  stress, setStress,
  sleep, setSleep,
  // Results
  res,
  explain,
  nudges,
  scores,
  loading,
  alerts,
  history,
  streak,
  // Actions
  compute,
  sendFeedback,
  forceMode,
  setForceMode,
  autoExplain,
  setAutoExplain,
  theme,
  // User
  user,
  onProfileUpdate,
}) {
  const contributions = React.useMemo(() => {
    if (!explain) return [];
    return Object.entries(explain).map(([k, v]) => ({ 
      name: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
      value: Math.max(0, v) 
    }));
  }, [explain]);

  const nudgeKey = (n) =>
    n.includes("cooling-off") ? "high_spend" :
    n.includes("Envelope Lock") ? "low_budget_adherence" :
    n.includes("snowball") ? "high_debt_ratio" :
    n.includes("Auto-Transfers") ? "high_volatility" :
    n.includes("Pause") ? "high_stress" :
    n.includes("Low sleep") ? "low_sleep" :
    n.includes("Tone suggests") ? "negative_sentiment" : "other";

  const presets = {
    "Anxious Spender": { monthly_income: 60000, monthly_spend: 52000, savings_balance: 20000, debt_balance: 90000, overdraft_count_90d: 2, spend_volatility_30d: 0.65, budget_adherence_30d: 0.5, recent_text: "Feeling anxious and overwhelmed about bills", self_reported_stress_0_10: 7, sleep_quality_0_10: 4 },
    "Disciplined Saver": { monthly_income: 90000, monthly_spend: 45000, savings_balance: 250000, debt_balance: 20000, overdraft_count_90d: 0, spend_volatility_30d: 0.2, budget_adherence_30d: 0.9, recent_text: "Calm and confident about my plan", self_reported_stress_0_10: 2, sleep_quality_0_10: 7 },
    "Impulsive Weekend": { monthly_income: 70000, monthly_spend: 58000, savings_balance: 80000, debt_balance: 60000, overdraft_count_90d: 1, spend_volatility_30d: 0.8, budget_adherence_30d: 0.6, recent_text: "Got excited and bought gadgets impulsively", self_reported_stress_0_10: 5, sleep_quality_0_10: 5 },
  };

  const applyPreset = (name) => {
    const p = presets[name];
    setIncome(p.monthly_income);
    setSpend(p.monthly_spend);
    setSavings(p.savings_balance);
    setDebt(p.debt_balance);
    setOd(p.overdraft_count_90d);
    setVol(p.spend_volatility_30d);
    setAdh(p.budget_adherence_30d);
    setText(p.recent_text);
    setStress(p.self_reported_stress_0_10);
    setSleep(p.sleep_quality_0_10);
  };

  const getNFIStatus = (nfi) => {
    if (nfi >= 80) return { label: "Excellent", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" };
    if (nfi >= 60) return { label: "Good", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" };
    if (nfi >= 40) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10" };
    return { label: "Needs Attention", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  };

  const nfiStatus = res?.nfi ? getNFIStatus(res.nfi) : null;
  const savingsRate = income > 0 ? ((income - spend) / income * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Section with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Wellness Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your financial and emotional health in one place</p>
        </div>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-background/60 backdrop-blur-sm">
          <CardContent className="pt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="autoExplain" className="text-sm">Auto-explanation</Label>
              <Switch id="autoExplain" checked={autoExplain} onCheckedChange={setAutoExplain} />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Mode</Badge>
              <Button 
                variant={forceMode==="auto"?"default":"outline"} 
                size="sm"
                onClick={()=>setForceMode("auto")} 
                className="h-8"
              >
                Auto
              </Button>
              <Button 
                variant={forceMode==="remote"?"default":"outline"} 
                size="sm"
                onClick={()=>setForceMode("remote")} 
                className="h-8"
              >
                Remote
              </Button>
              <Button 
                variant={forceMode==="local"?"default":"outline"} 
                size="sm"
                onClick={()=>setForceMode("local")} 
                className="h-8"
              >
                Local
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      {res && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Monthly Savings</p>
                  <p className="text-xl font-bold mt-1">{fmt(income - spend, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {savingsRate >= 0 ? `${fmt(savingsRate, 1)}%` : 'Negative'} savings rate
                  </p>
                </div>
                <PiggyBank className="h-8 w-8 text-green-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Debt</p>
                  <p className="text-xl font-bold mt-1">{fmt(debt, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {savings > 0 ? `${fmt((debt / savings) * 100, 1)}%` : 'N/A'} of savings
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-red-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Budget Adherence</p>
                  <p className="text-xl font-bold mt-1">{fmt(adh * 100, 0)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {adh >= 0.7 ? 'On track' : adh >= 0.5 ? 'Needs work' : 'Off track'}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Spending Stability</p>
                  <p className="text-xl font-bold mt-1">{fmt((1 - vol) * 100, 0)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vol <= 0.3 ? 'Stable' : vol <= 0.6 ? 'Moderate' : 'Volatile'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financial & Emotional Inputs */}
        <div className="space-y-6">
          {/* Financial Data Card */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                Financial Information
              </CardTitle>
              <CardDescription className="text-xs">
                Enter your current financial situation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Monthly Income</Label>
                  <NumberField label="" value={income} onChange={setIncome} />
                  <p className="text-xs text-muted-foreground">Your total monthly earnings</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Monthly Spending</Label>
                  <NumberField label="" value={spend} onChange={setSpend} />
                  <p className="text-xs text-muted-foreground">Total expenses this month</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Savings Balance</Label>
                  <NumberField label="" value={savings} onChange={setSavings} />
                  <p className="text-xs text-muted-foreground">Current savings account balance</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Debt Balance</Label>
                  <NumberField label="" value={debt} onChange={setDebt} />
                  <p className="text-xs text-muted-foreground">Total outstanding debt</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Budget Adherence</Label>
                  <div className="space-y-2">
                    <NumberField label="" value={adh} step={0.05} onChange={setAdh} />
                    <Progress value={adh * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">How well you stick to your budget (0-1)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Spending Volatility</Label>
                  <div className="space-y-2">
                    <NumberField label="" value={vol} step={0.05} onChange={setVol} />
                    <Progress value={vol * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">Consistency of spending (0-1)</p>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2">
                <Label className="text-xs font-medium mb-2 block">Quick Actions</Label>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={()=> setDebt(Math.max(0, debt-5000))}
                    className="text-xs"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Pay ₹5k Debt
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={()=> setSavings(savings+3000)}
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Save ₹3k
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={()=> setVol(clamp(vol-0.05,0,1))}
                    className="text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Reduce Volatility
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emotional State Card */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                Emotional Wellbeing
              </CardTitle>
              <CardDescription className="text-xs">
                How are you feeling about your finances today?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Daily Reflection</Label>
                <Textarea 
                  rows={3} 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Describe how you're feeling about your financial decisions today..."
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Your thoughts help us understand your emotional state
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Stress Level</Label>
                  <NumberField label="" value={stress} step={1} onChange={setStress} />
                  <div className="space-y-1">
                    <Progress value={stress * 10} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {stress < 4 ? 'Low' : stress < 7 ? 'Moderate' : 'High'} stress
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Sleep Quality</Label>
                  <NumberField label="" value={sleep} step={1} onChange={setSleep} />
                  <div className="space-y-1">
                    <Progress value={sleep * 10} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {sleep >= 7 ? 'Good' : sleep >= 5 ? 'Fair' : 'Poor'} sleep
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Compute button clicked');
                  if (!loading) {
                    compute();
                  }
                }} 
                disabled={loading} 
                size="lg"
                type="button"
                className={`w-full bg-gradient-to-r ${palette[theme].grad} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    Computing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Calculate NFI Score
                  </>
                )}
              </Button>
              {loading && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Processing your financial data...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: NFI Display & Analysis */}
        <div className="space-y-6">
          {/* NFI Main Card */}
          <Card className="border-0 shadow-lg overflow-hidden border-t-4" style={{ borderTopColor: res?.nfi ? (res.nfi >= 80 ? '#10b981' : res.nfi >= 60 ? '#3b82f6' : res.nfi >= 40 ? '#f59e0b' : '#ef4444') : '#6b7280' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-6 w-6" />
                    NeuroFinance Index
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Your holistic financial wellness score
                  </CardDescription>
                </div>
                {nfiStatus && (
                  <Badge className={`${nfiStatus.bg} ${nfiStatus.color} border-0`}>
                    {nfiStatus.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NFI Score Display */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="55%" 
                      outerRadius="100%" 
                      data={[{ name: 'NFI', value: Math.max(0, Math.min(100, res?.nfi ?? 0)) }]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <defs>
                        <linearGradient id={`nfiGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={res?.nfi >= 60 ? "#3b82f6" : res?.nfi >= 40 ? "#f59e0b" : "#ef4444"} />
                          <stop offset="100%" stopColor={res?.nfi >= 60 ? "#8b5cf6" : res?.nfi >= 40 ? "#f97316" : "#dc2626"} />
                        </linearGradient>
                      </defs>
                      <PolarAngleAxis 
                        type="number" 
                        domain={[0, 100]} 
                        angleAxisId={0} 
                        tick={false} 
                      />
                      <RadialBar 
                        background={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        dataKey="value" 
                        cornerRadius={16}
                        fill={`url(#nfiGradient-${theme})`}
                      />
                      <ChartTooltip 
                        formatter={(v)=>[`${fmt(v,1)}`,`NFI Score`]} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-5xl font-extrabold">{fmt(res?.nfi ?? 0, 1)}</div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                    {res?.nfi !== undefined && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {res.nfi >= 80 ? '🎉 Excellent' : res.nfi >= 60 ? '✅ Good' : res.nfi >= 40 ? '⚠️ Fair' : '📊 Needs Improvement'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Financial Health</Label>
                    <span className="text-sm font-semibold">{fmt(res?.finance_subscore ?? 0, 1)}</span>
                  </div>
                  <Progress value={res?.finance_subscore ?? 0} className="h-2.5" />
                  <p className="text-xs text-muted-foreground">
                    Based on savings, debt, and spending patterns
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Emotional Wellbeing</Label>
                    <span className="text-sm font-semibold">{fmt(res?.emotion_subscore ?? 0, 1)}</span>
                  </div>
                  <Progress value={res?.emotion_subscore ?? 0} className="h-2.5" />
                  <p className="text-xs text-muted-foreground">
                    Based on mood, stress, and sleep quality
                  </p>
                </div>
              </div>

              {!res && (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Enter your financial and emotional data, then click "Calculate NFI Score"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contribution Breakdown */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Score Breakdown</CardTitle>
              <CardDescription className="text-xs">
                See what factors contribute to your NFI score
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {contributions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contributions} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip 
                      formatter={(v)=>[fmt(v,1),"Points"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]}
                      fill={`hsl(var(--primary))`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground">Calculate NFI to see breakdown</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Recent Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Your NFI score over time in this session
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} hide />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <ChartTooltip 
                      formatter={(v)=>[`${fmt(v,1)}`, "NFI"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nfi" 
                      stroke={`hsl(var(--primary))`}
                      strokeWidth={3}
                      dot={{ r: 4, fill: `hsl(var(--primary))` }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground">Trend will appear after multiple calculations</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Insights & Actions */}
        <div className="space-y-6">
          {/* Unique Features */}
          {user && (
            <>
              <EmotionalRiskScore
                userId={user.id}
                stress={stress}
                sleep={sleep}
                sentiment={res?.sentiment || 0}
                mood={res?.mood_0_100 || 50}
                nfi={res?.nfi || 0}
              />
              
              <RecoveryMode
                userId={user.id}
                stress={stress}
                sleep={sleep}
                sentiment={res?.sentiment || 0}
                nfi={res?.nfi || 0}
                onUpdate={onProfileUpdate}
              />
              
              <StressBasedLocks
                userId={user.id}
                stress={stress}
                sleep={sleep}
                lockedCategories={[]}
                onUpdate={onProfileUpdate}
              />
            </>
          )}

          {/* Personalized Recommendations */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription className="text-xs">
                Tailored advice based on your current situation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!nudges || nudges.length === 0) ? (
                <div className="text-center py-8">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Calculate your NFI score to receive personalized recommendations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nudges.map((n, i) => {
                    const key = nudgeKey(n);
                    const sc = scores?.[key] ?? 0;
                    return (
                      <div 
                        key={i} 
                        className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm leading-relaxed flex-1">{n}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {fmt(sc, 1)}
                            </Badge>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7"
                              onClick={() => sendFeedback(key, +1)} 
                              aria-label="Helpful"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7"
                              onClick={() => sendFeedback(key, -1)} 
                              aria-label="Not helpful"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Alerts */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Important Alerts
              </CardTitle>
              <CardDescription className="text-xs">
                Areas that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!alerts || alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <span>No active alerts - you're doing great!</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {alerts.map((a, i) => (
                    <Badge 
                      key={i} 
                      variant="destructive" 
                      className="flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journal Streak */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-background to-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-5 w-5" />
                Journal Streak
              </CardTitle>
              <CardDescription className="text-xs">
                Keep the momentum going!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <span className="text-2xl font-bold">{streak}</span>
                </div>
                <div>
                  <p className="font-semibold">{streak} day{streak !== 1 ? 's' : ''} streak</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Write in your journal daily to maintain your streak
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preset Examples */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Try Example Scenarios</CardTitle>
          <CardDescription className="text-xs">
            Click a preset to see how different financial situations affect your NFI score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(presets).map((k) => (
              <Button 
                key={k} 
                variant="outline" 
                size="sm"
                onClick={()=>applyPreset(k)}
                className="h-9"
              >
                {k}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unique Features: Full Width Below */}
      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmotionSpendCorrelation
            userId={user.id}
            stress={stress}
            sleep={sleep}
            sentiment={res?.sentiment || 0}
            mood={res?.mood_0_100 || 50}
          />
          
          <EmotionFinanceTimeline
            userId={user.id}
            days={30}
          />
        </div>
      )}
    </div>
  );
}
