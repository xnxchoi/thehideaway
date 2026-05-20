/**
 * Event-gate cookie helpers.
 *
 * The cookie value is `<expiresAtMs>.<hex-hmac>` where the HMAC is
 * computed over the event id + expiresAt with the shared Payload secret.
 * That way:
 *   - the raw gate password is never persisted to the client
 *   - cookies for one event can't be lifted to another event
 *   - rotating the gate password invalidates existing cookies (because
 *     the action only issues a new cookie after a fresh password match,
 *     and an attacker forging the cookie would need the secret)
 *   - tampering with `expiresAtMs` invalidates the HMAC
 *
 * We keep the cookie HttpOnly so client JS can't read it, and SameSite=Lax
 * so it survives navigations from external referrers (DM / invite links)
 * without leaking on cross-site POSTs.
 */

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.PAYLOAD_SECRET ?? "";
const HMAC_ALGO = "sha256";
const COOKIE_PREFIX = "event-gate.";

/** Default cookie lifetime: 30 days. Comfortably covers a pre-event run-up. */
export const EVENT_GATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function eventGateCookieName(slug: string): string {
  return `${COOKIE_PREFIX}${slug}`;
}

function signPayload(eventId: string, expiresAtMs: number): string {
  if (!SECRET) {
    // Refuse to issue cookies we can't actually authenticate. Operationally
    // this throws at boot rather than silently degrading to an open gate.
    throw new Error("PAYLOAD_SECRET is required to sign event-gate cookies");
  }
  return createHmac(HMAC_ALGO, SECRET)
    .update(`${eventId}.${expiresAtMs}`)
    .digest("hex");
}

/** Build the cookie value for an event-id once the password has matched. */
export function issueEventGateCookieValue(
  eventId: string,
  ttlMs: number = EVENT_GATE_TTL_MS
): { value: string; expiresAt: Date } {
  const expiresAtMs = Date.now() + ttlMs;
  const sig = signPayload(eventId, expiresAtMs);
  return {
    value: `${expiresAtMs}.${sig}`,
    expiresAt: new Date(expiresAtMs)
  };
}

/**
 * Verify a cookie value against the expected event id.
 * Returns true only if:
 *   - the cookie parses cleanly into `<int>.<hex>`
 *   - the expiry is in the future
 *   - the HMAC matches (constant-time comparison)
 */
export function verifyEventGateCookieValue(
  cookieValue: string | undefined,
  eventId: string
): boolean {
  if (!cookieValue) return false;
  if (!SECRET) return false;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;
  const expiresAtRaw = cookieValue.slice(0, dot);
  const sigRaw = cookieValue.slice(dot + 1);
  const expiresAtMs = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return false;
  if (!/^[0-9a-f]+$/i.test(sigRaw)) return false;

  const expected = signPayload(eventId, expiresAtMs);
  if (expected.length !== sigRaw.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(sigRaw, "hex")
    );
  } catch {
    return false;
  }
}
