import { headers as nextHeaders } from "next/headers";
import {
  RateLimiterMemory,
  type RateLimiterAbstract
} from "rate-limiter-flexible";

/**
 * Rate limiting for React Server Actions.
 *
 * Server actions don't expose a `NextRequest`, so the API-route helper
 * (`rateLimitOr429` / `enforceRateLimit`) can't be reused directly. This
 * module mirrors the same preset table and `RateLimiterMemory` strategy
 * but reads the client IP from `next/headers` instead of a request
 * object — same identity model, same in-process state, same swap path
 * to `RateLimiterRedis` later.
 *
 * Audit refs: C2 (claim action brute-force), H1 (gate action
 * brute-force). Both server actions held 48h passwords accessible by
 * parallel POSTs.
 */

export type ServerActionRateLimitPreset = "auth" | "mutation";

const PRESETS: Record<
  ServerActionRateLimitPreset,
  { points: number; duration: number }
> = {
  // Mirrors `rateLimit.ts` PRESETS. Server actions get the same auth
  // and mutation budgets as their REST-route equivalents so a client
  // can't slip between channels to amplify their effective rate.
  auth: { points: 10, duration: 60 },
  mutation: { points: 20, duration: 60 }
};

const limiters: Partial<
  Record<ServerActionRateLimitPreset, RateLimiterAbstract>
> = {};

function getLimiter(
  preset: ServerActionRateLimitPreset
): RateLimiterAbstract {
  let limiter = limiters[preset];
  if (!limiter) {
    const cfg = PRESETS[preset];
    limiter = new RateLimiterMemory({ keyPrefix: `rl-sa:${preset}`, ...cfg });
    limiters[preset] = limiter;
  }
  return limiter;
}

/**
 * Resolve a client identifier for the current server-action invocation.
 * Prefers the explicit `userId` argument (signed-in callers). Falls back
 * to the request IP via the standard proxy headers — mirrors the REST
 * helper's `clientKey`.
 */
async function clientKey(userId: string | null | undefined): Promise<string> {
  if (userId) return `u:${userId}`;
  const headerStore = await nextHeaders();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

export interface ServerActionRateLimitResult {
  ok: boolean;
  /** Seconds until the bucket refills enough for one more request. */
  resetSeconds: number;
}

/**
 * Consume one point from the limiter bucket for the current actor. Pass
 * `userId` when the action knows who the caller is; otherwise the
 * helper falls back to the request IP.
 */
export async function enforceServerActionRateLimit(
  preset: ServerActionRateLimitPreset,
  userId?: string | null
): Promise<ServerActionRateLimitResult> {
  const limiter = getLimiter(preset);
  const key = await clientKey(userId);
  const cfg = PRESETS[preset];

  try {
    const res = await limiter.consume(key);
    return { ok: true, resetSeconds: Math.ceil(res.msBeforeNext / 1000) };
  } catch (rejection) {
    const r = rejection as { msBeforeNext?: number };
    return {
      ok: false,
      resetSeconds: Math.ceil((r.msBeforeNext ?? cfg.duration * 1000) / 1000)
    };
  }
}
