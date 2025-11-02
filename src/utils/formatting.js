/**
 * Formatting helper functions
 */
export const fmt = (n, d = 1) => (typeof n === "number" && isFinite(n) ? n.toFixed(d) : "--");

