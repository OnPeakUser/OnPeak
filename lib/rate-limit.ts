// Simple in-memory fixed-window rate limiter.
//
// State is per-process. On Vercel serverless, each warm instance enforces
// limits independently — still meaningful protection for a small app.
// For cross-instance enforcement, swap the store for Upstash Redis.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Purge expired entries at most once per minute to keep memory bounded.
let lastPurge = 0;
function maybePurge() {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  maybePurge();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}
