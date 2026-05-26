import { NextRequest, NextResponse } from "next/server";
import { isGatePublicPath } from "@/lib/gate/allowlist";

/**
 * Proxy (Next 16 — replaces `middleware.ts`). Runs in the Node.js
 * runtime by default. Three responsibilities, in order:
 *
 *   1. Soft-launch gate. Anonymous traffic outside the public
 *      allowlist is rewritten to `/gate`. Logged-in users keep their
 *      requested route.
 *   2. Per-IP rate limiting on selected `/api/*` prefixes.
 *   3. Auth redirect for `/me`, `/prive`, `/account`, `/admin-ba`
 *      when no Better Auth session cookie is present.
 *
 * To lift the gate: delete the gate block and the catch-all matcher
 * entry. Rate limiting and auth redirect stay.
 */

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token"
];

const TEMPORARILY_LOCKED_PATH_PREFIXES = ["/plans"] as const;

const LOST_HOSTS = new Set(["lostinseoul.com", "www.lostinseoul.com"]);

function isLostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.split(":")[0]?.toLowerCase();
  if (normalized && LOST_HOSTS.has(normalized)) return true;

  const configured = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;
  if (!configured) return false;
  try {
    return normalized === new URL(configured).hostname.toLowerCase();
  } catch {
    return false;
  }
}

function lostInternalPath(pathname: string): string | null {
  if (pathname === "/") return "/lostinseoul";
  if (pathname === "/lostinseoul" || pathname.startsWith("/lostinseoul/")) {
    return pathname;
  }

  const storefrontPrefixes = [
    "/collections",
    "/products",
    "/cart",
    "/checkout",
    "/orders",
    "/payment"
  ];
  if (
    storefrontPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
  ) {
    return `/lostinseoul${pathname}`;
  }

  return null;
}

function hasSessionCookie(req: NextRequest): boolean {
  for (const name of SESSION_COOKIE_NAMES) {
    if (req.cookies.get(name)) return true;
  }
  return false;
}

function isTemporarilyLockedPath(pathname: string): boolean {
  return TEMPORARILY_LOCKED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

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
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs
    };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt
  };
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
  ["/api/lost", 40, 60_000]
];

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const lostRewritePathname = isLostHost(
    request.nextUrl.hostname || request.headers.get("host")
  )
    ? lostInternalPath(originalPathname)
    : null;
  const pathname = lostRewritePathname ?? originalPathname;

  // --- 1. Soft-launch gate ---
  // Forward the real pathname so server components can do the role-aware
  // tier-2 check without re-parsing the rewrite target.
  const fwdHeaders = new Headers(request.headers);
  fwdHeaders.set("x-pathname", pathname);

  if (isTemporarilyLockedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.search = "";
    return NextResponse.rewrite(url, {
      request: { headers: fwdHeaders }
    });
  }

  const gateAllowed =
    isGatePublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    hasSessionCookie(request);

  if (!gateAllowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.search = "";
    return NextResponse.rewrite(url, {
      request: { headers: fwdHeaders }
    });
  }

  // --- 2. Rate limiting on API routes ---
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
                "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
              }
            }
          );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(max));
        response.headers.set("X-RateLimit-Remaining", String(result.remaining));
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
    const lostUrl = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;

    const allowedOrigin =
      [serverUrl, lostUrl].filter(Boolean).find((url) => url === origin) ??
      null;

    if (allowedOrigin) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
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

  // --- 3. Auth redirect for protected routes ---
  // Explicit prefix guard: the widened gate matcher above means this
  // block now sees every path, not just the original four. Scope it
  // back to the four protected areas.
  const protectedPrefixes = [
    "/me",
    "/prive",
    "/account",
    "/admin-ba",
    "/lostinseoul/checkout",
    "/lostinseoul/orders"
  ];
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected && !hasSessionCookie(request)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (lostRewritePathname) {
    const url = request.nextUrl.clone();
    url.pathname = lostRewritePathname;
    return NextResponse.rewrite(url, { request: { headers: fwdHeaders } });
  }

  // Default: forward with the x-pathname header set above.
  return NextResponse.next({ request: { headers: fwdHeaders } });
}

export const config = {
  matcher: [
    // Catch-all for the soft-launch gate. Excludes Next internals and
    // static assets so they don't pay the proxy cost.
    "/((?!_next/static|_next/image|assets/|fonts/|images/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff|woff2|ttf|otf|mp3|mp4|webm|mov|json|txt|xml)).*)",
    "/api/:path*",
    "/me/:path*",
    "/prive/:path*",
    "/account/:path*",
    "/admin-ba/:path*"
  ]
};
