import type { getPayload } from "payload";
import type { Currency, Price, Subscription } from "@/payload-types";
import { paymentWebhookLock } from "@/lib/db/sequences";
import {
  getPortOnePayment,
  requiresLiveChannel,
  verifyPortOnePayment
} from "./verify-payment";

/**
 * Plan card-payment reconciliation — the single idempotent path shared by
 * the browser-return verify route and the PortOne webhook.
 *
 * A pending subscription is created at card-checkout start with
 * `payment_ref = paymentId` (unique). Reconciliation:
 *
 *   1. Look the subscription up by `payment_ref`. Missing → "subscription
 *      -not-found" (nothing to reconcile; not our payment).
 *   2. If it is already active/paid → idempotent success (a duplicate call,
 *      e.g. webhook after the return verify already ran). No re-processing.
 *   3. Otherwise fetch the authoritative PortOne payment and verify it
 *      (status PAID, amount === subscription.amount, currency matches, non
 *      -TEST channel in prod). Mismatch → return the reason; the row stays
 *      pending so a reviewer / admin can inspect it.
 *   4. On success flip `paid: true`. The Subscriptions hooks
 *      (`autoActivateOnPaid` → `syncRole` + `issueInvoiceOnPaid`) take over
 *      in the same write: status pending→active, role granted, invoice
 *      issued exactly once. `issueInvoiceOnPaid` is edge-gated *and*
 *      de-dupes on existing invoices, so even a re-fire cannot double-issue.
 *
 * Because step 2 short-circuits once the row is active, the same paymentId
 * processed twice yields one active subscription and one invoice.
 */

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

export type CancelPendingPlanPaymentResult =
  | { ok: true; canceled: boolean }
  | { ok: false; status: 503; reason: "cancel-unavailable" };

export type SyncPlanPaymentResult =
  | {
      ok: true;
      subscriptionId: string;
      status: "active";
      alreadyProcessed: boolean;
    }
  | {
      ok: false;
      status: number;
      reason:
        | "subscription-not-found"
        | "not-paid"
        | "amount-mismatch"
        | "currency-mismatch"
        | "test-channel-rejected"
        | "malformed"
        | "verify-unavailable";
    };

const currencyCodeOf = (currency: Price["currency"] | Currency): string => {
  if (typeof currency === "string") return currency;
  return (currency as Currency)?.name ?? "";
};

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

export async function cancelPendingPlanPayment(input: {
  payload: PayloadInstance;
  paymentId: string;
}): Promise<CancelPendingPlanPaymentResult> {
  const { payload, paymentId } = input;
  let preSub: Subscription | undefined;
  try {
    const found = await payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { payment_ref: { equals: paymentId } }
    });
    preSub = found.docs?.[0] as Subscription | undefined;
  } catch {
    return { ok: false, status: 503, reason: "cancel-unavailable" };
  }

  if (
    !preSub ||
    preSub.paid === true ||
    preSub.subscription_status !== "pending"
  ) {
    return { ok: true, canceled: false };
  }

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return { ok: false, status: 503, reason: "cancel-unavailable" };
  }
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as Parameters<typeof payload.update>[0]["req"];

  try {
    await paymentWebhookLock(payload, transactionID, `plan:${paymentId}`);
    const locked = await payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      req: txReq as never,
      depth: 0,
      limit: 1,
      where: { payment_ref: { equals: paymentId } }
    });
    const sub = locked.docs?.[0] as Subscription | undefined;
    if (!sub || sub.paid === true || sub.subscription_status !== "pending") {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: true, canceled: false };
    }

    await payload.update({
      collection: "subscriptions",
      id: sub.id,
      overrideAccess: true,
      req: txReq,
      data: { subscription_status: "canceled" }
    });
    await payload.db.commitTransaction(transactionID);
    return { ok: true, canceled: true };
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    payload.logger?.error?.(
      `[plan-payment] cancel failed for ${paymentId}: ${(error as Error).message}`
    );
    return { ok: false, status: 503, reason: "cancel-unavailable" };
  }
}

/**
 * Reconcile a PortOne plan payment against its pending subscription.
 * Idempotent: safe to call from both the return route and the webhook,
 * any number of times, for the same `paymentId`.
 *
 * `expectedUserId` — when provided (the browser-return / verify-route path),
 * the subscription must belong to that user. A mismatch is reported as
 * `subscription-not-found` (404), identical to a genuinely missing row, so
 * the endpoint is not an existence oracle for other users' payment refs. The
 * ownership check runs BEFORE the outbound PortOne fetch, so a non-owner
 * cannot use the endpoint to amplify calls against the PortOne API. The
 * webhook path omits `expectedUserId` (it has its own trust boundary).
 */
export async function syncPlanPayment(input: {
  payload: PayloadInstance;
  paymentId: string;
  expectedUserId?: string;
}): Promise<SyncPlanPaymentResult> {
  const { payload, paymentId, expectedUserId } = input;

  // Pre-check (unlocked, cheap) — if there is no subscription for this ref,
  // or it is already reconciled, we can answer without opening a
  // transaction. The authoritative check happens again under the lock.
  const preFound = await payload
    .find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 1,
      limit: 1,
      where: { payment_ref: { equals: paymentId } }
    })
    .catch(() => null);
  const preSub = preFound?.docs?.[0] as Subscription | undefined;
  if (!preSub) {
    return { ok: false, status: 404, reason: "subscription-not-found" };
  }

  // Ownership gate (verify-route path only). Non-owner → same 404 as missing,
  // no existence oracle, and no outbound PortOne fetch amplification.
  if (expectedUserId && idOf(preSub.user) !== expectedUserId) {
    return { ok: false, status: 404, reason: "subscription-not-found" };
  }
  if (preSub.paid === true || preSub.subscription_status === "active") {
    return {
      ok: true,
      subscriptionId: preSub.id,
      status: "active",
      alreadyProcessed: true
    };
  }

  // Fetch the authoritative payment record BEFORE taking the DB lock — the
  // network call should not hold the advisory lock. Verification is pure.
  const currencyCode = currencyCodeOf(preSub.currency) || "KRW";
  let record;
  try {
    record = await getPortOnePayment(paymentId);
  } catch {
    // Could not reach PortOne / not configured — distinct from "verified and
    // rejected". Leave the row pending; caller returns 503 so the client (or
    // webhook retry) can try again.
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }

  const verdict = verifyPortOnePayment(record, {
    amount: typeof preSub.amount === "number" ? preSub.amount : 0,
    currency: currencyCode,
    requireLiveChannel: requiresLiveChannel()
  });
  if (!verdict.ok) {
    const status =
      verdict.reason === "amount-mismatch" ||
      verdict.reason === "currency-mismatch"
        ? 409
        : verdict.reason === "test-channel-rejected"
          ? 403
          : 402;
    return { ok: false, status, reason: verdict.reason };
  }

  // Serialize the pending→paid edge. The verify-on-return path and the
  // webhook can fire seconds apart; without this lock both could read
  // paid=false and each drive the paid edge, double-issuing an invoice.
  // The advisory lock (keyed on the payment ref) + a re-read inside the
  // transaction make the second caller a no-op.
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as Parameters<typeof payload.update>[0]["req"];

  try {
    await paymentWebhookLock(payload, transactionID, `plan:${paymentId}`);

    const locked = await payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      req: txReq as never,
      depth: 0,
      limit: 1,
      where: { payment_ref: { equals: paymentId } }
    });
    const sub = locked.docs?.[0] as Subscription | undefined;
    if (!sub) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 404, reason: "subscription-not-found" };
    }

    // Re-check under the lock — the other caller may have won the race.
    if (sub.paid === true || sub.subscription_status === "active") {
      await payload.db.rollbackTransaction(transactionID);
      return {
        ok: true,
        subscriptionId: sub.id,
        status: "active",
        alreadyProcessed: true
      };
    }

    // Flip paid → true. The Subscriptions beforeChange hook
    // (`autoActivateOnPaid`) promotes pending→active + stamps expires_at, and
    // the afterChange hooks sync the role and issue the invoice (once).
    //
    // Recovery case: if a stale-sweep (or a race) canceled the row between
    // checkout-start and this reconcile, the buyer has still PAID. Re-set
    // status to `pending` in the SAME write so `autoActivateOnPaid` sees a
    // clean pending→paid promotion and does its full activation (expiry
    // stamp + role + invoice) rather than leaving a paid-but-canceled orphan.
    const recoverCanceled = sub.subscription_status === "canceled";
    await payload.update({
      collection: "subscriptions",
      id: sub.id,
      overrideAccess: true,
      req: txReq,
      data: {
        paid: true,
        provider: "portone",
        ...(recoverCanceled ? { subscription_status: "pending" } : {}),
        ...(verdict.transactionRef
          ? { portone_transaction_ref: verdict.transactionRef }
          : {})
      } as never
    });

    await payload.db.commitTransaction(transactionID);
    return {
      ok: true,
      subscriptionId: sub.id,
      status: "active",
      alreadyProcessed: false
    };
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    payload.logger?.error?.(
      `[plan-payment] reconcile failed for ${paymentId}: ${(err as Error).message}`
    );
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }
}
