/**
 * Tiny in-process per-user rate limiter.
 *
 * Used to keep a single authenticated user from spamming expensive
 * endpoints (e.g. `read-all`, which issues a bulk UPDATE with no
 * document-count ceiling). Scoped per `(bucket, userId)` so different
 * endpoints don't share the same window.
 *
 * Limitations to keep in mind:
 *   - Single-process. When the deployment goes multi-instance, this
 *     stops being authoritative (each replica has its own map). At
 *     that point swap the backing store for Redis with `INCR + EXPIRE`
 *     or `SETNX`; the public API here is shaped to accept that
 *     replacement without callers changing.
 *   - Coarse window: just a "last call" timestamp. Sufficient for
 *     "no more than once every N seconds" semantics. If we need
 *     token-bucket / leaky-bucket later, evolve the type here.
 *
 * Memory hygiene: stale entries are evicted lazily on each call past
 * the eviction threshold, so a long-lived process doesn't accumulate
 * one entry per user-ever.
 */

const STATE = new Map<string, number>();
const EVICTION_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const EVICT_EVERY = 256; // amortized — sweep once per N calls
let callsSinceLastSweep = 0;

const keyOf = (bucket: string, userId: string) => `${bucket}::${userId}`;

const maybeSweep = (nowMs: number) => {
  callsSinceLastSweep += 1;
  if (callsSinceLastSweep < EVICT_EVERY) return;
  callsSinceLastSweep = 0;
  for (const [k, t] of STATE) {
    if (nowMs - t > EVICTION_THRESHOLD_MS) STATE.delete(k);
  }
};

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds the caller should wait before retrying. 0 when allowed. */
  retryAfterMs: number;
}

/**
 * Probe + record. If the user's last successful call for `bucket` is
 * within `intervalMs`, returns `{ allowed: false }` and does NOT update
 * the timestamp (so a flood of denied probes can't keep the window
 * sliding). On allow, the timestamp is set to now.
 */
export const userRateLimit = (
  bucket: string,
  userId: string,
  intervalMs: number,
  nowMs: number = Date.now()
): RateLimitResult => {
  maybeSweep(nowMs);
  const k = keyOf(bucket, userId);
  const last = STATE.get(k);
  if (last !== undefined && nowMs - last < intervalMs) {
    return { allowed: false, retryAfterMs: intervalMs - (nowMs - last) };
  }
  STATE.set(k, nowMs);
  return { allowed: true, retryAfterMs: 0 };
};

/** Test-only: clear all state between tests. */
export const __resetUserRateLimit = () => {
  STATE.clear();
  callsSinceLastSweep = 0;
};
