/**
 * Insights tab component - Enhanced with comprehensive transaction analysis
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Info,
  Target,
  Sparkles,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { parseCsv } from "@/utils/csv";
import { clamp } from "@/utils/sentiment";
import { palette } from "@/constants/palette";
import { SupabaseService } from "@/services/supabaseService";
import { fmt } from "@/utils/formatting";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

export function Insights({
  csv,
  setCsv,
  catTotals,
  setCatTotals,
  setSpend,
  setVol,
  theme,
  user,
  isSupabaseAvailable,
}) {
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFilter, setDateFilter] = useState("30"); // days
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("overview"); // overview, transactions, trends

  // Load transactions from database
  useEffect(() => {
    if (user && isSupabaseAvailable) {
      loadTransactions();
    }
  }, [user, isSupabaseAvailable]);

  const loadTransactions = async () => {
    if (!user || !isSupabaseAvailable) return;
    
    setLoading(true);
    try {
      const result = await SupabaseService.getTransactions(user.id, 500);
      if (result.ok) {
        setTransactions(result.data || []);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCsv = async () => {
    setError("");
    setSuccess("");
    
    try {
      const rows = parseCsv(csv);
      if (!rows.length) {
        setError("No valid transactions found in CSV");
        setCatTotals([]);
        return;
      }

      const byCat = new Map();
      const expenses = [];
      const incomes = [];
      
      for (const r of rows) {
        const amt = Number(r.amount || 0);
        if (amt < 0) {
          // Expense
          expenses.push(Math.abs(amt));
          byCat.set(r.category, (byCat.get(r.category) || 0) + Math.abs(amt));
        } else if (amt > 0) {
          // Income
          incomes.push(amt);
        }
      }

      const cats = Array.from(byCat.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setCatTotals(cats);

      // Calculate spend and volatility
      const sum = expenses.reduce((a, b) => a + b, 0);
      const mean = expenses.length ? sum / expenses.length : 0;
      const variance = expenses.length
        ? expenses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / expenses.length
        : 0;
      const stdev = Math.sqrt(variance);
      const proxyVol = clamp(mean ? stdev / (mean * 2) : 0, 0, 1);

      setSpend(Math.round(sum));
      setVol(Number(proxyVol.toFixed(2)));

      // Save transactions to Supabase if user is logged in
      if (user && isSupabaseAvailable && rows.length > 0) {
        setSaving(true);
        try {
          const result = await SupabaseService.saveTransactions(user.id, rows);
          if (result.ok) {
            setSavedCount(result.saved || 0);
            setSuccess(`Successfully saved ${result.saved} transactions!`);
            await loadTransactions(); // Reload transactions
          } else {
            setError(result.error || "Failed to save transactions");
          }
        } catch (err) {
          setError(err.message || "Error saving transactions");
        } finally {
          setSaving(false);
        }
      } else {
        setSuccess(`Analyzed ${rows.length} transactions. ${cats.length} categories found.`);
      }
    } catch (err) {
      setError(err.message || "Error parsing CSV");
      console.error("CSV analysis error:", err);
    }
  };

  // Filtered and processed data
  const processedData = useMemo(() => {
    const allTransactions = [...transactions];
    
    // Add parsed CSV transactions if available
    if (csv) {
      try {
        const parsed = parseCsv(csv);
        parsed.forEach(t => {
          if (!allTransactions.find(tr => 
            tr.transaction_date === t.date && 
            tr.amount === t.amount && 
            tr.category === t.category
          )) {
            allTransactions.push({
              transaction_date: t.date,
              amount: t.amount,
              category: t.category,
              source: 'csv'
            });
          }
        });
      } catch (e) {
        // Ignore parsing errors for CSV
      }
    }

    // Filter by date
    const days = parseInt(dateFilter) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filtered = allTransactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= cutoffDate;
    });

    // Filter by category
    const categoryFiltered = categoryFilter === "all" 
      ? filtered 
      : filtered.filter(t => t.category === categoryFilter);

    // Separate expenses and income
    const expenses = categoryFiltered.filter(t => Number(t.amount || 0) < 0);
    const income = categoryFiltered.filter(t => Number(t.amount || 0) > 0);

    // Calculate category totals
    const catMap = new Map();
    expenses.forEach(t => {
      const cat = t.category || "Other";
      const amt = Math.abs(Number(t.amount || 0));
      catMap.set(cat, (catMap.get(cat) || 0) + amt);
    });

    const categoryTotals = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Daily spending
    const dailySpend = new Map();
    expenses.forEach(t => {
      const date = t.transaction_date || new Date().toISOString().split('T')[0];
      const amt = Math.abs(Number(t.amount || 0));
      dailySpend.set(date, (dailySpend.get(date) || 0) + amt);
    });

    const dailyData = Array.from(dailySpend.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Monthly totals
    const monthlySpend = new Map();
    expenses.forEach(t => {
      const date = new Date(t.transaction_date || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amt = Math.abs(Number(t.amount || 0));
      monthlySpend.set(monthKey, (monthlySpend.get(monthKey) || 0) + amt);
    });

    const monthlyData = Array.from(monthlySpend.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate statistics
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const avgTransaction = expenses.length ? totalExpenses / expenses.length : 0;
    const largestTransaction = expenses.length 
      ? Math.max(...expenses.map(t => Math.abs(Number(t.amount || 0))))
      : 0;
    
    // Top categories
    const topCategories = categoryTotals.slice(0, 5);

    // Spending insights
    const insights = [];
    if (totalExpenses > 0 && totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1);
      insights.push(`Savings Rate: ${savingsRate}%`);
    }
    if (categoryTotals.length > 0) {
      const topCat = categoryTotals[0];
      const topPercent = ((topCat.value / totalExpenses) * 100).toFixed(1);
      insights.push(`${topCat.name} accounts for ${topPercent}% of spending`);
    }
    if (dailyData.length > 1) {
      const avgDaily = totalExpenses / dailyData.length;
      insights.push(`Average daily spending: ₹${fmt(avgDaily, 0)}`);
    }

    return {
      transactions: categoryFiltered,
      expenses,
      income,
      categoryTotals,
      dailyData,
      monthlyData,
      totalExpenses,
      totalIncome,
      avgTransaction,
      largestTransaction,
      topCategories,
      insights,
      transactionCount: expenses.length,
    };
  }, [transactions, csv, dateFilter, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    if (csv) {
      try {
        parseCsv(csv).forEach(t => {
          if (t.category) cats.add(t.category);
        });
      } catch (e) {}
    }
    return Array.from(cats).sort();
  }, [transactions, csv]);

  const exportTransactions = () => {
    const data = processedData.transactions.map(t => ({
      date: t.transaction_date,
      amount: t.amount,
      category: t.category || "Other"
    }));

    const csv = [
      "date,amount,category",
      ...data.map(t => `${t.date},${t.amount},${t.category}`)
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Insights</h1>
        <p className="text-muted-foreground mt-1">
          Analyze your spending patterns and financial habits
        </p>
      </div>

      {/* Quick Stats */}
      {processedData.totalExpenses > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Expenses</p>
                  <p className="text-xl font-bold mt-1">{fmt(processedData.totalExpenses, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {processedData.transactionCount} transactions
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Income</p>
                  <p className="text-xl font-bold mt-1">{fmt(processedData.totalIncome, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {processedData.totalIncome > 0 ? `${fmt(((processedData.totalExpenses / processedData.totalIncome) * 100), 1)}%` : 'N/A'} spent
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Transaction</p>
                  <p className="text-xl font-bold mt-1">{fmt(processedData.avgTransaction, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Per transaction
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Largest Expense</p>
                  <p className="text-xl font-bold mt-1">{fmt(processedData.largestTransaction, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Single transaction
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CSV Upload Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Transactions
          </CardTitle>
          <CardDescription>
            Upload CSV file or paste transaction data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">CSV Format</Label>
            <p className="text-xs text-muted-foreground">
              Format: <code className="px-1 py-0.5 bg-muted rounded">date,amount,category</code>. 
              Use negative amounts for expenses, positive for income.
            </p>
            <Textarea
              rows={6}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={`date,amount,category\n2025-01-01,-799,Groceries\n2025-01-01,-249,Transport\n2025-01-02,-1299,Utilities\n2025-01-03,-3999,Rent\n2025-01-05,50000,Salary\n2025-01-07,-699,Food`}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const sample = `date,amount,category\n2025-01-01,-799,Groceries\n2025-01-01,-249,Transport\n2025-01-02,-1299,Utilities\n2025-01-03,-3999,Rent\n2025-01-05,50000,Salary\n2025-01-07,-699,Food\n2025-01-08,-1299,Health\n2025-01-10,-2199,Shopping\n2025-01-12,-899,Groceries\n2025-01-15,-499,Transport\n2025-01-18,-599,Entertainment\n2025-01-20,-3999,Rent\n2025-01-22,-1999,Bills`;
                setCsv(sample);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Load Sample Data
            </Button>
            <Button
              className={`bg-gradient-to-r ${palette[theme].grad} text-white shadow-lg hover:shadow-xl`}
              onClick={analyzeCsv}
              disabled={saving || !csv.trim()}
            >
              {saving ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze & Save
                </>
              )}
            </Button>
            {processedData.transactions.length > 0 && (
              <Button variant="outline" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and View Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm">Filters:</Label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md bg-background"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md bg-background"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("overview")}
          >
            Overview
          </Button>
          <Button
            variant={viewMode === "transactions" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("transactions")}
          >
            Transactions
          </Button>
          <Button
            variant={viewMode === "trends" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("trends")}
          >
            Trends
          </Button>
        </div>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <>
          {/* Category Breakdown */}
          {processedData.categoryTotals.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Spending by Category
                  </CardTitle>
                  <CardDescription>
                    Breakdown of expenses by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.categoryTotals.slice(0, 8)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {processedData.categoryTotals.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value) => `₹${fmt(value, 0)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Spending Categories
                  </CardTitle>
                  <CardDescription>
                    Your highest expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData.topCategories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip formatter={(value) => `₹${fmt(value, 0)}`} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {processedData.topCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insights Card */}
          {processedData.insights.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Spending Insights
                </CardTitle>
                <CardDescription>
                  Key findings from your transaction data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedData.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Details */}
          {processedData.categoryTotals.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>
                  Detailed spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processedData.categoryTotals.map((cat, i) => {
                    const percentage = ((cat.value / processedData.totalExpenses) * 100).toFixed(1);
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                            <span className="font-semibold">₹{fmt(cat.value, 0)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[i % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Trends View */}
      {viewMode === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Spending Trend */}
          {processedData.dailyData.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Daily Spending Trend
                </CardTitle>
                <CardDescription>
                  Spending pattern over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processedData.dailyData}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip formatter={(value) => `₹${fmt(value, 0)}`} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorSpend)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Comparison */}
          {processedData.monthlyData.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Spending
                </CardTitle>
                <CardDescription>
                  Compare spending across months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip formatter={(value) => `₹${fmt(value, 0)}`} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Trends */}
          {processedData.categoryTotals.length > 0 && (
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle>Category Spending Over Time</CardTitle>
                <CardDescription>
                  How your spending categories change over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions View */}
      {viewMode === "transactions" && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              {processedData.transactionCount} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedData.transactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No transactions found. Upload CSV data or import from your bank.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Category</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-left p-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.transactions
                      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                      .slice(0, 100)
                      .map((t, i) => {
                        const amount = Number(t.amount || 0);
                        const isExpense = amount < 0;
                        return (
                          <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-2">
                              {new Date(t.transaction_date).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">{t.category || "Other"}</Badge>
                            </td>
                            <td className={`p-2 text-right font-medium ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {isExpense ? (
                                <span className="flex items-center justify-end gap-1">
                                  <ArrowDownRight className="h-3 w-3" />
                                  ₹{fmt(Math.abs(amount), 0)}
                                </span>
                              ) : (
                                <span className="flex items-center justify-end gap-1">
                                  <ArrowUpRight className="h-3 w-3" />
                                  ₹{fmt(amount, 0)}
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge variant={isExpense ? "destructive" : "secondary"}>
                                {isExpense ? "Expense" : "Income"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!csv && processedData.transactions.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Transaction Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file or paste transaction data to get started with insights
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const sample = `date,amount,category\n2025-01-01,-799,Groceries\n2025-01-01,-249,Transport\n2025-01-02,-1299,Utilities\n2025-01-03,-3999,Rent\n2025-01-05,50000,Salary`;
                  setCsv(sample);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Load Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
