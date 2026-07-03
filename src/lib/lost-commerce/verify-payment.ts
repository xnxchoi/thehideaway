import { getPortOneConfig } from "./portone";

/**
 * PortOne V2 payment verification.
 *
 * The plans card flow (and, in principle, any card path) must never mark a
 * subscription paid on the client's say-so. After the browser completes the
 * PortOne payment window it hands us a `paymentId`; we then call PortOne's
 * server API to fetch the *authoritative* payment record and check it against
 * what we expect: PAID status, order amount (`amount.total`), settled amount
 * (`amount.paid` when present — closes the partial-payment path), currency,
 * and — in production — an explicit LIVE channel.
 *
 * Fail-closed posture:
 *   - Missing/malformed amount → reject (not accept).
 *   - Channel check is an ALLOWLIST in production: require `channel.type ===
 *     "LIVE"`. An absent / misnamed / spoofed channel rejects rather than
 *     silently unlocking a paid plan. Sandbox (`requireLiveChannel` false)
 *     accepts any channel so dev flows keep working.
 *
 * `getPortOnePayment` is the raw fetch (mirrors how `createPortOneRefund` in
 * portone.ts does a raw fetch against the config). `verifyPortOnePayment` is a
 * pure decision function over the fetched record so it can be unit-tested
 * without a network call.
 *
 * PortOne V2 REST: `GET https://api.portone.io/payments/{paymentId}` with
 * `Authorization: PortOne {API_SECRET}`. The response is the Payment object;
 * the fields we read are `status`, `amount.total`, `amount.paid`, `currency`,
 * and `channel.type` ("LIVE" | "TEST"). NOT VERIFIED against a live sandbox
 * response — field paths (esp. `amount.paid`, `channel.type`) asserted from
 * V2 docs; confirm before go-live.
 */

const PORTONE_API_BASE =
  process.env.PORTONE_API_BASE?.trim() || "https://api.portone.io";

export type PortOnePaymentRecord = {
  status?: string;
  amount?: { total?: number; paid?: number } | null;
  currency?: string;
  channel?: { type?: string } | null;
  transactionId?: string;
  id?: string;
  paymentId?: string;
};

export type VerifyExpectation = {
  amount: number;
  currency: string;
  /** true when running against a live PG channel (production). */
  requireLiveChannel: boolean;
};

export type VerifyResult =
  | { ok: true; transactionRef: string | null }
  | {
      ok: false;
      reason:
        | "not-paid"
        | "amount-mismatch"
        | "currency-mismatch"
        | "test-channel-rejected"
        | "malformed";
    };

const PAID_STATUSES = new Set(["PAID", "SUCCEEDED", "SUCCESS", "CAPTURED"]);

function normalizeCurrency(value: string | undefined | null): string {
  if (!value) return "";
  // PortOne returns e.g. "KRW" or "CURRENCY_KRW"; normalize to the bare code.
  return value.replace(/^CURRENCY_/, "").toUpperCase();
}

/**
 * Pure verification of a fetched PortOne payment record against expectations.
 * No network, no side effects — safe to unit-test exhaustively.
 */
export function verifyPortOnePayment(
  record: PortOnePaymentRecord | null | undefined,
  expected: VerifyExpectation
): VerifyResult {
  if (!record || typeof record !== "object") {
    return { ok: false, reason: "malformed" };
  }

  const status = String(record.status ?? "").toUpperCase();
  if (!PAID_STATUSES.has(status)) {
    return { ok: false, reason: "not-paid" };
  }

  const total = record.amount?.total;
  if (typeof total !== "number" || !Number.isFinite(total)) {
    return { ok: false, reason: "malformed" };
  }
  if (total !== expected.amount) {
    return { ok: false, reason: "amount-mismatch" };
  }

  // Settled-amount guard (partial-payment / installment bypass). When the V2
  // record reports `amount.paid`, the settled amount must equal the expected
  // total — a `status=PAID` record with `paid < total` is an underpayment and
  // must be rejected. When `paid` is absent we fall back to `total` only; this
  // is the documented assumption in the NOT-VERIFIED note (confirm the V2
  // field name against a sandbox response before go-live).
  const paid = record.amount?.paid;
  if (typeof paid === "number" && Number.isFinite(paid)) {
    if (paid !== expected.amount) {
      return { ok: false, reason: "amount-mismatch" };
    }
  }

  if (
    normalizeCurrency(record.currency) !== normalizeCurrency(expected.currency)
  ) {
    return { ok: false, reason: "currency-mismatch" };
  }

  // Channel check fails CLOSED in production. We require an explicit LIVE
  // channel (allowlist) rather than merely rejecting a known "TEST" label
  // (denylist): an absent, misnamed, or spoofed channel field must NOT unlock
  // a paid plan for free. In sandbox (`requireLiveChannel` false) any channel
  // — including TEST — is accepted so dev/sandbox flows keep working.
  if (expected.requireLiveChannel) {
    const channelType = String(record.channel?.type ?? "").toUpperCase();
    if (channelType !== "LIVE") {
      return { ok: false, reason: "test-channel-rejected" };
    }
  }

  const transactionRef =
    record.transactionId ?? record.paymentId ?? record.id ?? null;
  return { ok: true, transactionRef };
}

/**
 * Fetch the authoritative payment record from PortOne. Throws on
 * configuration / transport failure so callers can distinguish
 * "could not verify" from "verified and rejected".
 */
export async function getPortOnePayment(
  paymentId: string,
  cfg: ReturnType<typeof getPortOneConfig> = getPortOneConfig()
): Promise<PortOnePaymentRecord> {
  const secret = cfg.secret?.trim();
  if (!secret || secret.startsWith("CHANGE_ME")) {
    throw new Error("portone-verify-not-configured");
  }

  const response = await fetch(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `PortOne ${secret}`,
        "content-type": "application/json"
      }
    }
  );

  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(
      `portone-verify-failed:${response.status}:${JSON.stringify(body)}`
    );
  }
  return (body ?? {}) as PortOnePaymentRecord;
}

/**
 * Whether the current PortOne config targets a live channel. In `live`
 * environment we reject TEST-channel payments (a card-review requirement).
 */
export function requiresLiveChannel(
  cfg: ReturnType<typeof getPortOneConfig> = getPortOneConfig()
): boolean {
  return cfg.environment === "live";
}
