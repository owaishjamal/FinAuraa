/**
 * Recovery Mode
 * Special mode when emotional state is poor - reduces financial pressure
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { SupabaseService } from "@/services/supabaseService";

export function RecoveryMode({ userId, stress, sleep, sentiment, nfi, onUpdate }) {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [triggerReason, setTriggerReason] = useState("");

  useEffect(() => {
    if (userId) {
      checkRecoveryMode();
    }
  }, [userId, stress, sleep, sentiment]);

  const checkRecoveryMode = async () => {
    if (!userId) return;
    
    try {
      const profile = await SupabaseService.getProfile(userId);
      if (profile.ok && profile.data) {
        setIsActive(profile.data.recovery_mode || false);
        if (profile.data.recovery_mode) {
          // Check recovery mode trigger
          const shouldActivate = await SupabaseService.checkRecoveryMode(userId);
          if (shouldActivate.ok) {
            setTriggerReason(getTriggerReason());
          }
        }
      }
    } catch (error) {
      console.error('Error checking recovery mode:', error);
    }
  };

  const getTriggerReason = () => {
    if (stress >= 8) return "High stress detected (≥8/10)";
    if (sleep <= 4) return "Poor sleep quality (≤4/10)";
    if (sentiment < -0.2) return "Negative sentiment streak";
    return "Manual activation";
  };

  const activateRecoveryMode = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const shouldActivate = await SupabaseService.checkRecoveryMode(userId);
      if (shouldActivate.ok && shouldActivate.shouldActivate) {
        setIsActive(true);
        setTriggerReason(getTriggerReason());
        onUpdate?.();
      } else {
        // Manual activation
        await SupabaseService.updateProfile(userId, {
          recovery_mode: true,
          recovery_mode_activated_at: new Date().toISOString()
        });
        setIsActive(true);
        setTriggerReason("Manual activation");
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error activating recovery mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const deactivateRecoveryMode = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await SupabaseService.deactivateRecoveryMode(userId);
      setIsActive(false);
      setTriggerReason("");
      onUpdate?.();
    } catch (error) {
      console.error('Error deactivating recovery mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldAutoActivate = stress >= 8 || sleep <= 4 || sentiment < -0.2;

  if (!isActive && !shouldAutoActivate) {
    return null; // Don't show if not needed
  }

  return (
    <Card className={`border-0 shadow-sm ${isActive ? 'bg-amber-500/10 border-amber-500/20' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Recovery Mode
          {isActive && <Badge variant="secondary" className="ml-auto">Active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive ? (
          <>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                    Recovery Mode Active
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {triggerReason && `Triggered by: ${triggerReason}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">What's Different:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                  <span>Aggressive savings goals are paused</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                  <span>Focus on financial stability over growth</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                  <span>Only gentle reminders are shown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                  <span>Wellness-focused financial guidance</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={deactivateRecoveryMode}
              disabled={loading}
              className="w-full"
            >
              Exit Recovery Mode
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                    Recovery Mode Recommended
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Your emotional state suggests you might benefit from recovery mode:
                  </div>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {stress >= 8 && <li>• High stress: {stress}/10</li>}
                    {sleep <= 4 && <li>• Poor sleep: {sleep}/10</li>}
                    {sentiment < -0.2 && <li>• Negative sentiment detected</li>}
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={activateRecoveryMode}
              disabled={loading}
              className="w-full"
            >
              Activate Recovery Mode
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

