/**
 * Accent background decoration component
 */

import React from "react";
import { palette } from "@/constants/palette";

export function AccentBg({ theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className={`absolute -top-24 -left-16 h-64 w-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${palette[theme].grad}`}></div>
      <div className={`absolute bottom-0 -right-10 h-64 w-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${palette[theme].grad}`}></div>
    </div>
  );
}

