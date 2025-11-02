/**
 * Local sentiment analysis
 */

// -------- Local sentiment + NFI (fallback engine) --------
const POSITIVE_WORDS = new Set([
  "good","great","happy","calm","relaxed","confident","excellent","love","win","progress","secure","control","satisfied","optimistic","hope"
]);
const NEGATIVE_WORDS = new Set([
  "bad","sad","stressed","anxious","angry","worried","panic","fear","lose","broke","debt","guilty","regret","overwhelmed","nervous"
]);

export function simpleSentiment(text) {
  const t = (text || "").toLowerCase().split(/\s+/).map(s => s.replace(/[.,!?;:()\[\]"']+/g, ""));
  let score = 0;
  for (const tok of t) {
    if (POSITIVE_WORDS.has(tok)) score += 1;
    if (NEGATIVE_WORDS.has(tok)) score -= 1;
  }
  if (score === 0) return 0;
  return Math.max(-1, Math.min(1, score / (1 + Math.abs(score))));
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

