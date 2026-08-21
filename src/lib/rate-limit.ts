/**
 * In-memory sliding-window rate limiter.
 *
 * LIMITATION — read before relying on this in production:
 * this state lives in a single server process's memory. It works correctly
 * for `next start` (one long-running Node process, which is how this app
 * runs today) but NOT across multiple serverless instances (e.g. Vercel
 * functions), where each cold start gets its own empty counter. For a real
 * multi-instance deployment, replace the Map below with a shared store like
 * Upstash Redis — the checkRateLimit() call signature would stay the same,
 * so nothing that calls it needs to change.
 *
 * This is deliberately a second, independent layer on top of the per-account
 * lockout in auth.ts: the account lockout stops "guess one user's password
 * many times"; this stops "try many different emails from one attacker".
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Clear stale buckets occasionally so this Map doesn't grow forever on a
// long-running server. Cheap: only runs when a new key is checked.
function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key unique identifier for what's being limited, e.g. `login:1.2.3.4`
 * @param limit max allowed attempts within the window
 * @param windowMs window length in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 10_000) sweepExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return { allowed, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/**
 * Best-effort client IP from request headers. Behind Vercel/a proxy this is
 * reliable (x-forwarded-for is set by the platform). In plain local dev
 * without a proxy it may be absent — we fall back to a shared bucket in that
 * case, which is fine for development.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
