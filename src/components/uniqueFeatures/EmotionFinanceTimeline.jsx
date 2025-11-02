/**
 * Emotion-Finance Timeline
 * Visualizes how emotional events correlate with financial decisions over time
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Brain } from "lucide-react";
import { SupabaseService } from "@/services/supabaseService";
import { fmt } from "@/utils/formatting";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ReferenceLine
} from "recharts";

export function EmotionFinanceTimeline({ userId, days = 30 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(days);

  useEffect(() => {
    if (userId) {
      loadTimelineEvents();
    }
  }, [userId, selectedDays]);

  const loadTimelineEvents = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await SupabaseService.getTimelineEvents(userId, selectedDays);
      if (result.ok) {
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const nfiEvents = events.filter(e => e.type === 'nfi_computation');
    return nfiEvents.map(e => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      nfi: e.nfi || 0,
      finance: e.emotion ? (e.nfi * 0.65) : 0, // Approximate
      emotion: e.emotion ? (e.nfi * 0.35) : 0, // Approximate
      stress: e.emotion?.stress || 0,
      sleep: e.emotion?.sleep || 0,
      mood: e.emotion?.mood || 50
    }));
  }, [events]);

  // Find correlations
  const correlations = React.useMemo(() => {
    const transactions = events.filter(e => e.type === 'transaction' && e.emotion);
    const nfiEvents = events.filter(e => e.type === 'nfi_computation');
    
    if (transactions.length < 5 || nfiEvents.length < 5) return null;

    // Find days with high stress + high spending
    const highStressSpending = transactions.filter(t => 
      t.emotion?.stress >= 7 && Math.abs(t.emotion?.amount || 0) > 0
    ).length;

    // Find days with low sleep + high spending
    const lowSleepSpending = transactions.filter(t => 
      t.emotion?.sleep <= 4 && Math.abs(t.emotion?.amount || 0) > 0
    ).length;

    return {
      highStressSpending,
      lowSleepSpending,
      totalTransactions: transactions.length
    };
  }, [events]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Emotion-Finance Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={selectedDays === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDays(7)}
          >
            7 Days
          </Button>
          <Button
            variant={selectedDays === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDays(30)}
          >
            30 Days
          </Button>
          <Button
            variant={selectedDays === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDays(90)}
          >
            90 Days
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Loading timeline...
          </div>
        ) : events.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No timeline data yet. Compute NFI and save transactions to see your timeline.
          </div>
        ) : (
          <>
            {/* NFI Trend Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="nfi" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="NFI"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#ef4444" 
                    strokeWidth={1}
                    name="Stress"
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#3b82f6" 
                    strokeWidth={1}
                    name="Sleep"
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <ReferenceLine y={50} stroke="#666" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Correlations */}
            {correlations && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Pattern Insights
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-medium">High Stress → Spending</div>
                    <div className="text-muted-foreground">
                      {correlations.highStressSpending} of {correlations.totalTransactions} transactions
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Low Sleep → Spending</div>
                    <div className="text-muted-foreground">
                      {correlations.lowSleepSpending} of {correlations.totalTransactions} transactions
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground">
                Recent Events (Last 10)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.slice(-10).reverse().map((event, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                    {event.type === 'nfi_computation' ? (
                      <Brain className="h-3 w-3 mt-0.5 text-purple-500" />
                    ) : event.type === 'transaction' ? (
                      <DollarSign className="h-3 w-3 mt-0.5 text-green-500" />
                    ) : (
                      <Calendar className="h-3 w-3 mt-0.5 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(event.date).toLocaleDateString()} • {event.description}
                      </div>
                      {event.emotion && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Stress: {event.emotion.stress}/10 • Sleep: {event.emotion.sleep}/10
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTimelineEvents}
              className="w-full"
            >
              Refresh Timeline
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

