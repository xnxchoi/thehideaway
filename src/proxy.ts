import { NextRequest, NextResponse } from "next/server";
import { hasLostGateCookie } from "@/lib/lostinseoul/gate";
import { isLostCommercePaymentPreviewEnabled } from "@/lib/lost-commerce/payment-preview";
import { signInRedirectPath } from "@/lib/routes/auth";
import {
  isLostHost,
  lostInternalPath,
  lostHostAuthority,
  lostPublicHref
} from "@/lib/lostinseoul/domain";

/**
 * Proxy (Next 16 — replaces `middleware.ts`). Runs in the Node.js
 * runtime by default. Three responsibilities:
 *
 *   1. Host routing for lostinseoul.com into the internal storefront.
 *   2. Per-IP rate limiting on selected `/api/*` prefixes.
 *   3. Auth redirect for `/me`, `/prive`, `/account`, `/admin-ba`
 *      when no Better Auth session cookie is present.
 */

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token"
];

const RETIRED_COMMERCE_API_PREFIXES = [
  "/api/invoice",
  "/api/lost/cart",
  "/api/lost/checkout",
  "/api/commerce"
] as const;

function isRetiredCommerceApiPath(pathname: string): boolean {
  return RETIRED_COMMERCE_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isLostPublicAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/media/") ||
    pathname.startsWith("/track_media/") ||
    pathname.startsWith("/users/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function isLostImageOptimizerPath(pathname: string): boolean {
  return pathname === "/_next/image";
}

function isLostAllowedApiPath(pathname: string): boolean {
  return (
    ["/api/health", "/api/carts", "/api/users/me", "/api/addresses"].includes(
      pathname
    ) ||
    [
      "/api/auth/",
      "/api/lost/",
      "/api/commerce/",
      "/api/carts/",
      "/api/payments/"
    ].some((prefix) => pathname.startsWith(prefix))
  );
}

function isLostScopedPath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    ((pathname === "/lostinseoul" || pathname.startsWith("/lostinseoul/")) &&
      lostInternalPath(pathname.slice("/lostinseoul".length) || "/") !==
        null) ||
    pathname.startsWith("/_next/") ||
    isLostPublicAssetPath(pathname)
  );
}

function cleanLostExternalPath(pathname: string): string {
  if (pathname === "/lostinseoul") return "/";
  if (pathname.startsWith("/lostinseoul/")) {
    return pathname.slice("/lostinseoul".length) || "/";
  }
  return pathname;
}

function lostHostSignInRedirectPath(returnTo: string): string {
  const cleanReturnTo = cleanLostExternalPath(returnTo);
  return `/auth/sign-in?redirectTo=${encodeURIComponent(cleanReturnTo)}`;
}

function isLostGatePath(pathname: string): boolean {
  return pathname === "/lostinseoul/gate" || pathname === "/api/lost/gate";
}

function isLostGateExemptPath(pathname: string): boolean {
  return (
    isLostGatePath(pathname) ||
    pathname === "/api/health" ||
    pathname === "/api/payments/portone/webhooks" ||
    pathname === "/api/lost/webhooks/portone"
  );
}

function isLostGateProtectedPath(pathname: string): boolean {
  return (
    pathname === "/lostinseoul" ||
    pathname.startsWith("/lostinseoul/") ||
    pathname === "/api/lost" ||
    pathname.startsWith("/api/lost/")
  );
}

function lostGateRedirectPath(
  pathname: string,
  isLostRequest: boolean
): string {
  const gatePath = isLostRequest ? "/gate" : "/lostinseoul/gate";
  const returnTo = isLostRequest ? cleanLostExternalPath(pathname) : pathname;

  return `${gatePath}?returnTo=${encodeURIComponent(returnTo)}`;
}

function hasSessionCookie(req: NextRequest): boolean {
  for (const name of SESSION_COOKIE_NAMES) {
    if (req.cookies.get(name)) return true;
  }
  return false;
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
  const isLostRequest = isLostHost(
    request.headers.get("host") || request.nextUrl.hostname
  );
  const lostRewritePathname = isLostRequest
    ? lostInternalPath(originalPathname)
    : null;

  if (
    isLostRequest &&
    !lostRewritePathname &&
    !isLostScopedPath(originalPathname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (
    isLostRequest &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const canonicalPath = lostPublicHref(originalPathname, true);
    if (canonicalPath !== originalPathname) {
      const url = request.nextUrl.clone();
      // Nginx forwards the public Host and protocol while the upstream URL
      // may still identify the private application container.
      const publicHost = lostHostAuthority(request.headers.get("host"));
      if (publicHost) {
        const origin = new URL(`${url.protocol}//${publicHost}`);
        url.hostname = origin.hostname;
        url.port = origin.port;
      }
      const protocol = request.headers.get("x-forwarded-proto");
      if (protocol === "https" || protocol === "http")
        url.protocol = `${protocol}:`;
      url.pathname = canonicalPath;
      return NextResponse.redirect(url, 308);
    }
  }

  const pathname = lostRewritePathname ?? originalPathname;

  // Forward the route pathname seen by app code after host-based rewrites.
  const fwdHeaders = new Headers(request.headers);
  fwdHeaders.set("x-pathname", pathname);

  if (
    (isLostGateProtectedPath(pathname) ||
      (isLostRequest &&
        (pathname === "/api" ||
          pathname.startsWith("/api/") ||
          isLostPublicAssetPath(pathname) ||
          isLostImageOptimizerPath(pathname)))) &&
    !isLostGateExemptPath(pathname) &&
    !(await hasLostGateCookie(request))
  ) {
    return NextResponse.redirect(
      new URL(lostGateRedirectPath(pathname, isLostRequest), request.url)
    );
  }

  if (isRetiredCommerceApiPath(pathname)) {
    return NextResponse.json(
      { success: false, error: "commerce-api-retired" },
      { status: 410 }
    );
  }

  if (
    isLostRequest &&
    (pathname === "/api" || pathname.startsWith("/api/")) &&
    !isLostAllowedApiPath(pathname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // --- 1. Rate limiting on API routes ---
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

  // --- 2. Auth redirect for protected routes ---
  const protectedPrefixes = [
    "/me",
    "/prive",
    "/account",
    "/admin-ba",
    "/checkout",
    "/lostinseoul/checkout",
    "/lostinseoul/orders"
  ];
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isDevelopmentCheckoutPreview =
    pathname === "/lostinseoul/checkout" &&
    isLostCommercePaymentPreviewEnabled();

  if (
    isProtected &&
    !isDevelopmentCheckoutPreview &&
    !hasSessionCookie(request)
  ) {
    const redirectPath = isLostRequest
      ? lostHostSignInRedirectPath(pathname)
      : signInRedirectPath(pathname);
    const signInUrl = new URL(redirectPath, request.url);
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
    "/((?!_next/static|fonts/).*)",
    "/api/:path*",
    "/me/:path*",
    "/prive/:path*",
    "/account/:path*",
    "/admin-ba/:path*",
    "/checkout/:path*",
    "/lostinseoul/checkout/:path*",
    "/lostinseoul/orders/:path*"
  ]
};
