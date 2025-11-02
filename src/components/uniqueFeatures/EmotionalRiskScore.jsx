/**
 * Emotional Risk Score
 * Predicts likelihood of poor financial decisions based on emotional state
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { SupabaseService } from "@/services/supabaseService";
import { fmt } from "@/utils/formatting";

export function EmotionalRiskScore({ userId, stress, sleep, sentiment, mood, nfi }) {
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState("");

  useEffect(() => {
    if (userId) {
      calculateRisk();
    }
  }, [userId, stress, sleep, sentiment, mood, nfi]);

  const calculateRisk = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await SupabaseService.calculateEmotionalRiskScore(userId);
      if (result.ok) {
        setRiskScore(result.riskScore);
        setPrediction(SupabaseService.generateRiskPrediction(result.riskScore));
      } else {
        // Calculate locally if backend unavailable
        const localRisk = calculateLocalRisk();
        setRiskScore(localRisk);
        setPrediction(getLocalPrediction(localRisk));
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      const localRisk = calculateLocalRisk();
      setRiskScore(localRisk);
      setPrediction(getLocalPrediction(localRisk));
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalRisk = () => {
    // Local risk calculation (simplified version)
    let risk = 0;
    
    // Higher stress = higher risk (30% weight)
    risk += (stress / 10.0) * 30;
    
    // Lower sleep = higher risk (25% weight)
    risk += ((10 - sleep) / 10.0) * 25;
    
    // Negative sentiment = higher risk (20% weight)
    if (sentiment < 0) {
      risk += Math.abs(sentiment) * 20;
    }
    
    // Low mood = higher risk (25% weight)
    const moodValue = mood || ((sentiment + 1) * 50);
    if (moodValue < 50) {
      risk += ((50 - moodValue) / 50.0) * 25;
    }
    
    // Recent poor NFI trends increase risk (10% weight)
    if (nfi && nfi < 50) {
      risk += ((50 - nfi) / 50.0) * 10;
    }
    
    return Math.max(0, Math.min(100, risk));
  };

  const getLocalPrediction = (score) => {
    if (score >= 75) {
      return "Very high risk of poor financial decisions";
    } else if (score >= 50) {
      return "High risk of impulse spending";
    } else if (score >= 25) {
      return "Moderate risk - stay mindful";
    } else {
      return "Low risk - good emotional state";
    }
  };

  const getRiskColor = (score) => {
    if (score >= 75) return "text-red-600 dark:text-red-400";
    if (score >= 50) return "text-orange-600 dark:text-orange-400";
    if (score >= 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getRiskBadge = (score) => {
    if (score >= 75) return { label: "Very High", variant: "destructive" };
    if (score >= 50) return { label: "High", variant: "destructive" };
    if (score >= 25) return { label: "Moderate", variant: "secondary" };
    return { label: "Low", variant: "secondary" };
  };

  const riskBadge = getRiskBadge(riskScore);
  const suggestions = getSuggestions(riskScore);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Emotional Risk Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {fmt(riskScore, 0)}
              <span className="text-sm text-muted-foreground ml-2">/ 100</span>
            </div>
            <Badge variant={riskBadge.variant}>{riskBadge.label}</Badge>
          </div>
          
          <Progress value={riskScore} className="h-3" />
          
          <div className={`text-sm font-medium ${getRiskColor(riskScore)}`}>
            {prediction}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-medium text-muted-foreground">Risk Factors</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${stress >= 7 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
              <div className="font-medium">Stress</div>
              <div className="text-muted-foreground">{stress}/10</div>
              {stress >= 7 && <div className="text-red-600 dark:text-red-400">High</div>}
            </div>
            <div className={`p-2 rounded ${sleep <= 5 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
              <div className="font-medium">Sleep</div>
              <div className="text-muted-foreground">{sleep}/10</div>
              {sleep <= 5 && <div className="text-red-600 dark:text-red-400">Low</div>}
            </div>
            <div className={`p-2 rounded ${sentiment < -0.2 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
              <div className="font-medium">Sentiment</div>
              <div className="text-muted-foreground">{fmt(sentiment, 2)}</div>
              {sentiment < -0.2 && <div className="text-red-600 dark:text-red-400">Negative</div>}
            </div>
            <div className={`p-2 rounded ${(mood || 50) < 50 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
              <div className="font-medium">Mood</div>
              <div className="text-muted-foreground">{Math.round(mood || 50)}/100</div>
              {(mood || 50) < 50 && <div className="text-red-600 dark:text-red-400">Low</div>}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {riskScore >= 50 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                  Suggestions
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSuggestions(riskScore) {
  if (riskScore >= 75) {
    return [
      "Enable spending locks for discretionary categories",
      "Wait 24 hours before making purchases over ₹5000",
      "Focus on stress reduction activities",
      "Consider recovery mode for financial stability"
    ];
  } else if (riskScore >= 50) {
    return [
      "Be mindful of impulse spending triggers",
      "Take a break before major financial decisions",
      "Review your budget before purchasing"
    ];
  } else {
    return [
      "Maintain good emotional balance",
      "Continue monitoring your emotional state"
    ];
  }
}

