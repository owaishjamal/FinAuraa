/**
 * CSV parsing utilities
 */

export function parseCsv(text) {
  // very small parser: date,amount,category
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase();
  const rows = lines.slice(1);
  const idx = (name) => header?.split(",").findIndex(h => h.trim() === name);
  const idate = idx("date"), iamount = idx("amount"), icat = idx("category");
  const out = [];
  for (const r of rows) {
    const parts = r.split(",").map(s=>s.trim());
    if (parts.length < 3) continue;
    out.push({
      date: parts[idate ?? 0] || "",
      amount: Number(parts[iamount ?? 1] || 0),
      category: parts[icat ?? 2] || "Other",
    });
  }
  return out;
}

