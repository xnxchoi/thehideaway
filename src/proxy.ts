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

let lastEviction = Date.now();
function maybeEvict() {
  const now = Date.now();
  if (now - lastEviction < 60_000) return;
  lastEviction = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

const RATE_LIMITS: [string, number, number][] = [
  ["/api/search", 30, 60_000],
  ["/api/image-courier", 20, 60_000],
  ["/api/link-preview", 20, 60_000],
  ["/api/payload-jobs", 10, 60_000],
  ["/api/notifications", 30, 60_000],
];

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting on API routes ---
  if (pathname.startsWith("/api/")) {
    maybeEvict();

    const ip = getClientIP(request);

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

    // CORS for configured server URL (API routes only)
    const origin = request.headers.get("origin");
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

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

  // --- Auth redirect for protected routes ---
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/me/:path*",
    "/prive/:path*",
    "/account/:path*",
    "/admin-ba/:path*",
  ],
};
