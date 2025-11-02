/**
 * Settings tab component
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TestRow } from "@/components/TestRow";
import { tests } from "@/constants/tests";

export function Settings() {
  const [positiveNotifications, setPositiveNotifications] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [coolingOffReminders, setCoolingOffReminders] = useState(true);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Personalization</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <Label>Local Sentiment Only</Label>
            <Switch checked={true} disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label>Positive reinforcement notifications</Label>
            <Switch checked={positiveNotifications} onCheckedChange={setPositiveNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Weekly coach email</Label>
            <Switch checked={weeklyEmail} onCheckedChange={setWeeklyEmail} />
          </div>
          <div className="flex items-center justify-between">
            <Label>24h cooling‑off reminders</Label>
            <Switch checked={coolingOffReminders} onCheckedChange={setCoolingOffReminders} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tests.map((t,i)=> <TestRow key={i} idx={i} t={t} />)}
          <p className="text-xs text-muted-foreground">These quick checks ensure the local engine behaves and NFI stays within [0,100].</p>
        </CardContent>
      </Card>
    </div>
  );
}

