/**
 * Emotion-Spend Correlation Analyzer
 * Shows how mood affects spending patterns
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Brain, DollarSign, AlertCircle } from "lucide-react";
import { SupabaseService } from "@/services/supabaseService";
import { fmt } from "@/utils/formatting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell } from "recharts";

const CORRELATION_TYPES = [
  { key: 'stress', label: 'Stress', color: '#ef4444' },
  { key: 'sleep', label: 'Sleep', color: '#3b82f6' },
  { key: 'sentiment', label: 'Sentiment', color: '#10b981' },
  { key: 'mood', label: 'Mood', color: '#8b5cf6' }
];

export function EmotionSpendCorrelation({ userId, stress, sleep, sentiment, mood }) {
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('stress');

  useEffect(() => {
    if (userId) {
      loadCorrelations();
    }
  }, [userId]);

  const loadCorrelations = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Try to load from database first
      const savedResult = await SupabaseService.getEmotionSpendCorrelations(userId);
      if (savedResult.ok && savedResult.data.length > 0) {
        const data = savedResult.data.map(item => ({
          type: item.correlation_type,
          label: CORRELATION_TYPES.find(t => t.key === item.correlation_type)?.label || item.correlation_type,
          color: CORRELATION_TYPES.find(t => t.key === item.correlation_type)?.color || '#666',
          correlation: item.correlation_value || 0,
          ok: true
        }));
        setCorrelations(data);
      } else {
        // Calculate new correlations
        const results = await Promise.all(
          CORRELATION_TYPES.map(type => 
            SupabaseService.calculateEmotionSpendCorrelation(userId, type.key, 30)
          )
        );
        
        const data = results.map((result, i) => ({
          type: CORRELATION_TYPES[i].key,
          label: CORRELATION_TYPES[i].label,
          color: CORRELATION_TYPES[i].color,
          correlation: result.correlation || 0,
          ok: result.ok
        }));
        
        setCorrelations(data);
      }
    } catch (error) {
      console.error('Error loading correlations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelation = (type) => {
    const item = correlations.find(c => c.type === type);
    return item?.correlation || 0;
  };

  const getCorrelationInsight = (type, value) => {
    const absValue = Math.abs(value);
    if (absValue < 0.2) return null;
    
    const direction = value > 0 ? 'increases' : 'decreases';
    const strength = absValue > 0.5 ? 'strongly' : absValue > 0.3 ? '' : 'slightly';
    
    const labels = {
      stress: `When stress is high, spending ${strength} ${direction}`,
      sleep: `When sleep is poor, spending ${strength} ${direction}`,
      sentiment: `When sentiment is negative, spending ${strength} ${direction}`,
      mood: `When mood is low, spending ${strength} ${direction}`
    };
    
    return labels[type];
  };

  const chartData = CORRELATION_TYPES.map(type => ({
    name: type.label,
    correlation: Math.abs(getCorrelation(type.key)) * 100,
    value: getCorrelation(type.key)
  }));

  const currentCorrelation = getCorrelation(selectedType);
  const currentInsight = getCorrelationInsight(selectedType, currentCorrelation);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Emotion-Spend Correlation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Calculating correlations...</div>
        ) : correlations.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Not enough transaction data yet. Save transactions with emotional state to see correlations.
          </div>
        ) : (
          <>
            {/* Correlation Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip formatter={(v) => [`${fmt(v, 1)}%`, 'Correlation Strength']} />
                  <Bar dataKey="correlation" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORRELATION_TYPES[index].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Current Insights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Current State</Badge>
                <div className="text-xs text-muted-foreground">
                  Stress: {stress}/10 • Sleep: {sleep}/10 • Mood: {Math.round(mood || 50)}/100
                </div>
              </div>
              
              {CORRELATION_TYPES.map(type => {
                const corr = getCorrelation(type.key);
                const insight = getCorrelationInsight(type.key, corr);
                if (!insight) return null;
                
                return (
                  <div key={type.key} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    {corr > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-xs font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{insight}</div>
                      <div className="text-xs mt-1">
                        Correlation: {fmt(corr, 2)} ({fmt(Math.abs(corr) * 100, 1)}% strength)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadCorrelations}
              className="w-full"
            >
              Refresh Analysis
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

