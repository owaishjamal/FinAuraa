/**
 * Test row component for diagnostics
 */

import React from "react";
import { localComputeNFI } from "@/utils/nfi";
import { fmt } from "@/utils/formatting";

export function TestRow({ idx, t }) {
  const d = localComputeNFI(t.p);
  const pass = t.expect(d);
  return (
    <div className="text-xs flex items-center justify-between border rounded-md p-2">
      <span>#{idx+1} {t.name}</span>
      <span className={pass?"text-green-500":"text-red-500"}>{pass?"PASS":"FAIL"} · NFI {fmt(d.nfi,1)}</span>
    </div>
  );
}

