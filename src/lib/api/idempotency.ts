import { LRUCache } from "lru-cache";
import type { NextRequest } from "next/server";

/**
 * Storage-agnostic idempotency for money-adjacent POSTs.
 *
 * Why this exists: a network retry on `tickets/purchase`, `tickets/refund`,
 * or `checkout/manual` mints duplicate side effects — duplicate tickets,
 * double refund emails, two pending subscriptions. The retry is usually
 * within seconds of the original, far inside any reasonable TTL.
 *
 * How callers use it:
 *
 *   const idem = beginIdempotent(req, "tickets/purchase", userId);
 *   const cached = idem.get();
 *   if (cached) return cached;     // replay
 *   const res = await ... actual work ...
 *   idem.put(res);
 *   return res;
 *
 * If the request omits an `Idempotency-Key` header, every call is unique
 * (no caching). This is deliberate — clients opt in by sending the header
 * (a UUID/nanoid the client persists across retries). The server never
 * fabricates a key from the body, because a benign content collision
 * across two different clients would have one client see the other's
 * response.
 *
 * Backend strategy:
 *   - Today: in-process LRU. Single Node process per VPS — fine.
 *   - Tomorrow: swap to Redis (`SET key NX EX <ttl>`) here. Call sites
 *     do not change.
 *
 * Note: a server restart between original and retry voids the cache —
 * the retry will run again. For our manual-confirmation flow that's
 * the lesser evil compared to a Redis dependency at launch.
 */

interface CachedResponse {
  status: number;
  body: string;
  contentType: string;
}

/**
 * Five-minute TTL covers virtually every legitimate retry window
 * (network blips, double-clicks). Cached entries are response bodies,
 * which for our JSON callers run ~2–5 KB each: 5,000 entries ≈ 25 MB
 * upper bound. Acceptable for one Node process; swap to Redis when
 * the deployment scales.
 *
 * KNOWN LIMITATION — concurrent retries: this helper protects against
 * SEQUENTIAL retries (the second request arrives after the first has
 * called `put`). Two *parallel* requests with the same key both miss
 * the cache, both run the route body, both call `put`. Mitigated by
 * route-level invariants (unique constraints, conditional updates).
 * A pending-promise pattern would close this gap; deferred to Sprint 1
 * along with the capacity TOCTOU work.
 */
const cache = new LRUCache<string, CachedResponse>({
  max: 5_000,
  ttl: 5 * 60 * 1000
});

/**
 * Reject keys outside this charset. Bounds keyspace abuse vectors —
 * UUIDs, nanoids, and ULIDs all fit; binary / unicode noise does not.
 */
const KEY_CHARSET = /^[A-Za-z0-9_-]{16,128}$/;

export interface IdempotentScope {
  /** Return the cached response, or null if this is the first call. */
  get(): Response | null;
  /** Persist this response under the idempotency key. */
  put(res: Response): Promise<void>;
  /** True iff the client provided a key. When false, get/put are no-ops. */
  active: boolean;
}

/**
 * Open an idempotency scope for the current request. The endpoint name
 * is part of the cache key so the same client key on two different
 * routes doesn't collide.
 */
export function beginIdempotent(
  req: NextRequest,
  endpoint: string,
  userId: string | null
): IdempotentScope {
  const rawKey = req.headers.get("idempotency-key")?.trim() ?? "";
  // Charset + length guard — UUIDs (36), nanoid (any-length), ULIDs (26)
  // all pass. Binary, unicode, or oversize values are rejected so the
  // LRU keyspace can't be abused to bloat memory.
  if (!KEY_CHARSET.test(rawKey)) {
    return {
      get: () => null,
      put: async () => undefined,
      active: false
    };
  }

  const ownerKey = userId ?? "anon";
  const cacheKey = `${endpoint}:${ownerKey}:${rawKey}`;

  return {
    active: true,
    get: () => {
      const hit = cache.get(cacheKey);
      if (!hit) return null;
      return new Response(hit.body, {
        status: hit.status,
        headers: {
          "Content-Type": hit.contentType,
          "Idempotent-Replay": "true"
        }
      });
    },
    put: async (res: Response) => {
      // Only cache successful + client-error responses. Don't cache 5xx —
      // a transient server failure deserves to be retried fresh.
      if (res.status >= 500) return;
      // Text-only — the cache stores body as a string. Binary payloads
      // (PDF, images) would silently corrupt through `text()`. All
      // current callers return JSON; this guard rejects anything else
      // so a future caller doesn't get a subtle data-loss bug.
      const contentType = res.headers.get("content-type") ?? "application/json";
      const isTextual =
        contentType.startsWith("application/json") ||
        contentType.startsWith("text/");
      if (!isTextual) return;
      // Clone so the original response remains readable by the route.
      const cloned = res.clone();
      const body = await cloned.text().catch(() => "");
      cache.set(cacheKey, {
        status: res.status,
        body,
        contentType
      });
    }
  };
}
