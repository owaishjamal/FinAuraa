/**
 * Number field input component
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberField({ label, value, onChange, step = 1000, min = 0 }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" step={step} min={min} value={value} onChange={(e) => onChange(parseFloat(e.target.value || "0"))} />
    </div>
  );
}

