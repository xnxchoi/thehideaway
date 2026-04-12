import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory sliding-window rate limiter.
 *
 * Limits are per IP (or x-forwarded-for behind Nginx). This is a single-process
 * store — adequate for the current single-container Docker deployment. For
 * multi-instance, swap to Redis or the database-backed better-auth rate-limit
 * collection.
 *
 * Cleanup runs on every request (O(1) amortised via lazy eviction of the oldest
 * window entries). The Map is bounded by the number of unique IPs seen within
 * the largest window, which is small for a members-only editorial platform.
 */

type WindowEntry = { count: number; resetAt: number };
const store = new Map<string, WindowEntry>();

function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Evict stale entries every ~60s to prevent unbounded growth.
let lastEviction = Date.now();
function maybeEvict() {
  const now = Date.now();
  if (now - lastEviction < 60_000) return;
  lastEviction = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

// --- Route-specific rate limit configurations ---
// [pathPrefix, maxRequests, windowMs]
const RATE_LIMITS: [string, number, number][] = [
  // Search — expensive queries, user enumeration risk
  ["/api/search", 30, 60_000],
  // Image courier — proxied external fetches, SSRF-hardened but still costly
  ["/api/image-courier", 20, 60_000],
  // Link preview — external fetch
  ["/api/link-preview", 20, 60_000],
  // Payload jobs — only internal callers should hit this
  ["/api/payload-jobs", 10, 60_000],
  // Notification stream — SSE connections are long-lived, limit reconnect churn
  ["/api/notifications", 30, 60_000],
];

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS headers for the configured server URL
  const origin = req.headers.get("origin");
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  // Only apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    maybeEvict();

    const ip = getClientIP(req);

    for (const [prefix, max, window] of RATE_LIMITS) {
      if (pathname.startsWith(prefix)) {
        const key = `${ip}:${prefix}`;
        const result = rateLimit(key, max, window);

        if (!result.allowed) {
          return NextResponse.json(
            { error: "Too many requests" },
            {
              status: 429,
              headers: {
                "Retry-After": String(
                  Math.ceil((result.resetAt - Date.now()) / 1000)
                ),
                "X-RateLimit-Limit": String(max),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
              },
            }
          );
        }

        // Attach rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(max));
        response.headers.set(
          "X-RateLimit-Remaining",
          String(result.remaining)
        );
        response.headers.set(
          "X-RateLimit-Reset",
          String(Math.ceil(result.resetAt / 1000))
        );
        return response;
      }
    }
  }

  // CORS for configured server URL
  if (serverUrl && origin === serverUrl) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", serverUrl);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
