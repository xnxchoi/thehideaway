import type { NextRequest } from "next/server";

/**
 * Same-origin check for state-changing API routes.
 *
 * Fails CLOSED — when `NEXT_PUBLIC_SERVER_URL` is unset, every origin is
 * rejected. The earlier inline copies of this helper returned `true` in the
 * unset case, which silently disabled CSRF protection across all callers if
 * the env var was ever missing in production.
 *
 * Compares `host` + `protocol` of the request's `Origin` (or `Referer`
 * fallback) against the configured server URL.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.NEXT_PUBLIC_LOSTINSEOUL_URL,
    process.env.NEXT_PUBLIC_PRODUCTION_URL
  ].filter((origin): origin is string => Boolean(origin));
  if (allowedOrigins.length === 0) return false;

  const candidate =
    req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!candidate) return false;

  try {
    const candidateUrl = new URL(candidate);
    return allowedOrigins.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return (
        candidateUrl.host === allowedUrl.host &&
        candidateUrl.protocol === allowedUrl.protocol
      );
    });
  } catch {
    return false;
  }
}
