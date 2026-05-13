import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  RateLimiterMemory,
  type RateLimiterAbstract
} from "rate-limiter-flexible";

/**
 * Storage-agnostic rate limiting.
 *
 * Backend strategy:
 *   - Today: in-process memory (one Node process per VPS, fine for now).
 *   - Tomorrow: set `REDIS_URL` and swap to `RateLimiterRedis` here. Call
 *     sites do not change — they consume the `enforceRateLimit` API.
 *
 * Limiters are keyed by a logical preset name so a single client hitting
 * three different endpoint categories doesn't share a counter across them.
 * The presets below cover the route shapes that exist today; add more as
 * needed rather than passing magic numbers at the call site.
 */

export type RateLimitPreset =
  | "search" // FTS/trigram queries, expensive in Postgres
  | "mutation" // POST that writes (ticket purchase, manual checkout, etc.)
  | "expensive" // CPU/network-bound (PDF gen, image proxy, link preview)
  | "auth" // password/gate-token compare endpoints (brute-force defense)
  | "default"; // everything else

const PRESETS: Record<RateLimitPreset, { points: number; duration: number }> = {
  // points = requests, duration = seconds
  search: { points: 30, duration: 60 },
  mutation: { points: 20, duration: 60 },
  expensive: { points: 10, duration: 60 },
  auth: { points: 10, duration: 60 },
  default: { points: 60, duration: 60 }
};

const limiters: Partial<Record<RateLimitPreset, RateLimiterAbstract>> = {};

function getLimiter(preset: RateLimitPreset): RateLimiterAbstract {
  let limiter = limiters[preset];
  if (!limiter) {
    const cfg = PRESETS[preset];
    // When Redis is wired in, this is the single line to swap:
    //   limiter = new RateLimiterRedis({ storeClient: redisClient, keyPrefix: `rl:${preset}`, ...cfg });
    limiter = new RateLimiterMemory({ keyPrefix: `rl:${preset}`, ...cfg });
    limiters[preset] = limiter;
  }
  return limiter;
}

/**
 * Extract a client identifier. Prefers authenticated user id; falls back to
 * the request IP via standard proxy headers. The fallback is intentionally
 * conservative — when the IP can't be determined, all anonymous traffic
 * shares a counter (better than per-request reset).
 */
function clientKey(req: NextRequest, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
}

export async function enforceRateLimit(
  req: NextRequest,
  preset: RateLimitPreset,
  userId?: string | null
): Promise<RateLimitResult> {
  const limiter = getLimiter(preset);
  const key = clientKey(req, userId);
  const cfg = PRESETS[preset];

  try {
    const res = await limiter.consume(key);
    return {
      ok: true,
      remaining: res.remainingPoints,
      limit: cfg.points,
      resetSeconds: Math.ceil(res.msBeforeNext / 1000)
    };
  } catch (rejection) {
    const r = rejection as { remainingPoints?: number; msBeforeNext?: number };
    return {
      ok: false,
      remaining: r.remainingPoints ?? 0,
      limit: cfg.points,
      resetSeconds: Math.ceil((r.msBeforeNext ?? cfg.duration * 1000) / 1000)
    };
  }
}

/**
 * Convenience wrapper that returns a 429 NextResponse when over the limit,
 * or `null` when the request should proceed. Always sets the standard
 * RateLimit-* response headers (draft-ietf-httpapi-ratelimit-headers).
 */
export async function rateLimitOr429(
  req: NextRequest,
  preset: RateLimitPreset,
  userId?: string | null
): Promise<NextResponse | null> {
  const result = await enforceRateLimit(req, preset, userId);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests", retry_after_seconds: result.resetSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetSeconds),
          "RateLimit-Limit": String(result.limit),
          "RateLimit-Remaining": String(result.remaining),
          "RateLimit-Reset": String(result.resetSeconds)
        }
      }
    );
  }

  return null;
}
