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
  const allowed = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!allowed) return false;

  const candidate =
    req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!candidate) return false;

  try {
    const candidateUrl = new URL(candidate);
    const allowedUrl = new URL(allowed);
    return (
      candidateUrl.host === allowedUrl.host &&
      candidateUrl.protocol === allowedUrl.protocol
    );
  } catch {
    return false;
  }
}
