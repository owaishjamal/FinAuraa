/**
 * API resolution & fetch wrapper
 */

// -------- Config resolution (no import.meta) --------
function getConfiguredApiBase() {
  try {
    const fromGlobal = (globalThis && (globalThis.FINAURA_API_BASE || (globalThis.__APP_CONFIG__ && globalThis.__APP_CONFIG__.API_BASE))) || "";
    if (fromGlobal) return String(fromGlobal);
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
  } catch {}
  return "";
}

// -------- API resolution & fetch wrapper --------
export function RESOLVE_API() {
  const env = getConfiguredApiBase();
  if (env) return { base: env.replace(/\/$/, ""), useSameOriginApiPrefix: false };
  try {
    const { origin } = new URL(window.location.href);
    return { base: origin, useSameOriginApiPrefix: true };
  } catch {
    return { base: "http://localhost:8000", useSameOriginApiPrefix: false };
  }
}

export async function apiJSON(path, { method = "GET", body } = {}, { timeout = 3500 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const { base, useSameOriginApiPrefix } = RESOLVE_API();
  const candidates = [];
  if (useSameOriginApiPrefix) candidates.push(path.startsWith("/api") ? path : "/api" + path);
  candidates.push(base + path);

  let lastErr;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, json: await res.json(), tried: candidates };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, error: lastErr, tried: candidates };
}

