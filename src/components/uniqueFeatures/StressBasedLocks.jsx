/**
 * Stress-Based Spending Locks
 * Automatically locks discretionary spending when emotional state is poor
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, AlertTriangle, Shield } from "lucide-react";
import { SupabaseService } from "@/services/supabaseService";

const SPENDING_CATEGORIES = [
  'Entertainment', 'Dining Out', 'Shopping', 'Hobbies', 
  'Electronics', 'Fashion', 'Travel', 'Gifts'
];

export function StressBasedLocks({ userId, stress, sleep, lockedCategories = [], onUpdate }) {
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockStress, setAutoLockStress] = useState(7);
  const [autoLockSleep, setAutoLockSleep] = useState(5);
  const [activeLocks, setActiveLocks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSettings();
      loadActiveLocks();
    }
  }, [userId]);

  useEffect(() => {
    if (autoLockEnabled && userId) {
      checkAutoLock();
    }
  }, [autoLockEnabled, stress, sleep, userId]);

  const loadSettings = async () => {
    if (!userId) return;
    
    try {
      const profile = await SupabaseService.getProfile(userId);
      if (profile.ok && profile.data) {
        setAutoLockEnabled(profile.data.auto_lock_enabled || false);
        setAutoLockStress(profile.data.auto_lock_stress_threshold || 7);
        setAutoLockSleep(profile.data.auto_lock_sleep_threshold || 5);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadActiveLocks = async () => {
    if (!userId) return;
    
    try {
      const result = await SupabaseService.getActiveSpendingLocks(userId);
      if (result.ok) {
        setActiveLocks(result.data.map(l => l.category));
      }
    } catch (error) {
      console.error('Error loading locks:', error);
    }
  };

  const checkAutoLock = async () => {
    if (!userId || !autoLockEnabled) return;
    
    const shouldLock = stress >= autoLockStress || sleep <= autoLockSleep;
    const categoriesToLock = SPENDING_CATEGORIES.filter(cat => !activeLocks.includes(cat));
    
    if (shouldLock && categoriesToLock.length > 0) {
      // Auto-lock categories
      setLoading(true);
      try {
        await Promise.all(
          categoriesToLock.map(cat =>
            SupabaseService.toggleSpendingLock(userId, cat, true, `auto_${stress >= autoLockStress ? 'stress' : 'sleep'}`)
          )
        );
        await loadActiveLocks();
        onUpdate?.();
      } catch (error) {
        console.error('Error auto-locking:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCategoryLock = async (category, lock) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await SupabaseService.toggleSpendingLock(userId, category, lock, 'manual');
      await loadActiveLocks();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling lock:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAutoLockSettings = async () => {
    if (!userId) return;
    
    try {
      await SupabaseService.updateProfile(userId, {
        auto_lock_enabled: autoLockEnabled,
        auto_lock_stress_threshold: autoLockStress,
        auto_lock_sleep_threshold: autoLockSleep
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      updateAutoLockSettings();
    }
  }, [autoLockEnabled, autoLockStress, autoLockSleep]);

  const shouldAutoLock = stress >= autoLockStress || sleep <= autoLockSleep;
  const allLocked = SPENDING_CATEGORIES.every(cat => activeLocks.includes(cat));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Stress-Based Spending Locks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-Lock Settings */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Lock Enabled</Label>
              <div className="text-xs text-muted-foreground">
                Locks categories when emotional state is poor
              </div>
            </div>
            <Switch 
              checked={autoLockEnabled} 
              onCheckedChange={setAutoLockEnabled}
            />
          </div>
          
          {autoLockEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Lock when stress ≥ {autoLockStress}/10</Label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={autoLockStress}
                  onChange={(e) => setAutoLockStress(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Lock when sleep ≤ {autoLockSleep}/10</Label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={autoLockSleep}
                  onChange={(e) => setAutoLockSleep(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Current Status */}
        {shouldAutoLock && autoLockEnabled && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div className="flex-1 text-xs">
              <div className="font-medium text-red-600 dark:text-red-400">
                Auto-lock conditions met
              </div>
              <div className="text-muted-foreground">
                Stress: {stress}/10 ≥ {autoLockStress} or Sleep: {sleep}/10 ≤ {autoLockSleep}
              </div>
            </div>
          </div>
        )}

        {/* Locked Categories */}
        <div className="space-y-2">
          <Label className="text-xs">Locked Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {SPENDING_CATEGORIES.map(category => {
              const isLocked = activeLocks.includes(category);
              return (
                <Button
                  key={category}
                  variant={isLocked ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => toggleCategoryLock(category, !isLocked)}
                  disabled={loading}
                  className="justify-start"
                >
                  {isLocked ? (
                    <Lock className="h-3 w-3 mr-2" />
                  ) : (
                    <Unlock className="h-3 w-3 mr-2" />
                  )}
                  {category}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">
            {activeLocks.length} of {SPENDING_CATEGORIES.length} categories locked
          </span>
          {allLocked && (
            <Badge variant="secondary">All Protected</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

