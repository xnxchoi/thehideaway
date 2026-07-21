import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Webhook } from "@portone/server-sdk";
import { getPayload } from "payload";
import config from "@payload-config";
import { paymentWebhookLock } from "@/lib/db/sequences";
import { markRequestOrderPaid } from "@/lib/lost-commerce/campaigns";
import { releaseStandardInventory } from "@/lib/lost-commerce/inventory";
import { authorizeCommerceLifecycleRequest } from "@/lib/lost-commerce/lifecycle-authorization";
import {
  cancelPendingPlanPayment,
  syncPlanPayment
} from "@/lib/lost-commerce/plan-payment";
import { syncProductPayment } from "@/lib/lost-commerce/product-payment";
import {
  getPortOnePayment,
  requiresLiveChannel,
  verifyPortOnePayment,
  type PortOnePaymentRecord
} from "@/lib/lost-commerce/verify-payment";
import {
  claimCommerceProviderEvent,
  completeCommerceProviderEvent,
  recordCommerceProviderEventStandalone
} from "@/lib/lost-commerce/provider-events";
import {
  assertOrderTransition,
  assertPaymentTransition,
  CommerceTransitionError,
  isCommerceOrderState,
  isCommercePaymentState
} from "@/lib/lost-commerce/transitions";

export const runtime = "nodejs";

const legacyPortOneActor = { kind: "system", id: "portone-legacy" } as const;

/**
 * Extract the paymentId a PortOne webhook carries, from every shape we might
 * receive: V2 Standard-Webhook (`data.paymentId`), and the legacy / echoed
 * top-level fields. We do NOT rely on `customData.service` here — customData
 * lives on the *payment record* (the GET response), not reliably on the
 * webhook body. Instead the caller decides "is this a plan payment?" by
 * looking up a subscription whose `payment_ref` equals this id. The paymentId
 * itself is always present in the webhook.
 */
function webhookPaymentIdOf(event: Record<string, unknown>): string | null {
  const data = event.data;
  const nested =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).paymentId
      : undefined;
  const ref =
    event.paymentId ??
    event.payment_ref ??
    nested ??
    event.merchant_order_id ??
    event.portone_order_ref ??
    event.order_ref;
  return typeof ref === "string" && ref.length > 0 ? ref : null;
}

function isV2PaymentWebhook(event: Record<string, unknown>): boolean {
  const data = event.data;
  return Boolean(
    data &&
    typeof data === "object" &&
    typeof (data as Record<string, unknown>).paymentId === "string"
  );
}

function normalizePaymentStatus(status: unknown) {
  const value = String(status ?? "").toUpperCase();
  if (["SUCCESS", "PAID", "CAPTURED"].includes(value)) return "paid";
  if (["FAILED", "FAILURE", "CANCELLED", "CANCELED"].includes(value))
    return "failed";
  if (["REFUNDED"].includes(value)) return "refunded";
  return "pending";
}

/**
 * Read the status a plans webhook carries. PortOne V2 uses a `type`
 * discriminator (e.g. `Transaction.Paid`, `Transaction.Failed`,
 * `Transaction.Cancelled`) and/or a `data.status` / top-level `status`. We
 * normalize any of these to paid | failed | refunded | pending.
 */
function webhookStatusOf(event: Record<string, unknown>): string {
  const data = event.data;
  const nestedStatus =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).status
      : undefined;
  const type = String(event.type ?? "").toUpperCase();
  if (type.includes("PAID") || type.includes("CAPTURED")) return "paid";
  if (type.includes("FAILED") || type.includes("CANCEL")) return "failed";
  if (type.includes("REFUND")) return "refunded";
  return normalizePaymentStatus(
    event.status ?? event.payment_status ?? nestedStatus
  );
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isConfiguredWebhookSecret(value: string | undefined): value is string {
  const secret = value?.trim();
  return Boolean(
    secret &&
      secret.length >= 32 &&
      !/change[_-]?me|placeholder|example/i.test(secret)
  );
}

function eventIdOf(event: Record<string, unknown>): string {
  return String(event.webhook_id ?? event.event_id ?? "");
}

function orderStatusForPaymentStatus(
  paymentStatus: string,
  orderMode?: string
): string {
  if (paymentStatus === "paid") {
    return orderMode === "request_to_order" ? "paid" : "confirmed";
  }
  if (paymentStatus === "pending") return "pending_payment";
  return paymentStatus;
}

function eventAmountOf(event: Record<string, unknown>): number | null {
  const amount = event.amount ?? event.paid_amount ?? event.total_amount;
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount === "string" && amount.trim()) {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function eventCurrencyOf(event: Record<string, unknown>): string {
  return String(event.currency ?? event.payment_currency ?? "");
}

async function finishProviderEvent(
  context: {
    payload: Awaited<ReturnType<typeof getPayload>>;
    eventId: string;
    leaseToken: string;
  },
  response: NextResponse,
  status: "processed" | "rejected" | "retryable",
  outcomeCode: string
): Promise<NextResponse> {
  try {
    await completeCommerceProviderEvent({
      ...context,
      status,
      outcomeCode
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "provider-event-outcome-failed" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!isConfiguredWebhookSecret(secret)) {
    return NextResponse.json(
      { ok: false, error: "webhook-secret-not-configured" },
      { status: 500 }
    );
  }

  // Read the raw body exactly once, BEFORE any JSON.parse: the
  // Standard-Webhooks signature is an HMAC over the raw bytes, so the string
  // we verify must be the string we later parse.
  const rawBody = await req.text();

  /**
   * Dual-mode webhook authentication, fail-closed per mode:
   *
   * 1. Signature mode — PortOne V2 sends Standard-Webhooks headers
   *    (`webhook-id` / `webhook-signature` / `webhook-timestamp`; HMAC-SHA256
   *    over `${id}.${timestamp}.${rawBody}`, secret format `whsec_…`). If ANY
   *    of these headers is present we verify via @portone/server-sdk's
   *    `Webhook.verify` against PORTONE_WEBHOOK_SECRET and reject with 400 on
   *    failure (including a partial header set). The legacy shared-secret
   *    header is NOT consulted in this mode.
   * 2. Legacy mode — when no Standard-Webhooks header is present, fall back
   *    to the `x-portone-webhook-secret` / `x-webhook-secret` shared-secret
   *    comparison (compat), UNLESS PORTONE_WEBHOOK_REQUIRE_SIGNATURE ===
   *    "true", in which case unsigned webhooks are rejected with 401.
   */
  const hasStandardWebhookHeaders =
    req.headers.get("webhook-id") !== null ||
    req.headers.get("webhook-signature") !== null ||
    req.headers.get("webhook-timestamp") !== null;
  const liveMode =
    process.env.PORTONE_ENVIRONMENT === "production" ||
    process.env.PORTONE_ENVIRONMENT === "live";
  const legacyAllowed =
    !liveMode && process.env.PORTONE_WEBHOOK_ALLOW_LEGACY === "true";
  const signatureRequired =
    liveMode ||
    process.env.PORTONE_WEBHOOK_REQUIRE_SIGNATURE === "true" ||
    !legacyAllowed;

  if (hasStandardWebhookHeaders) {
    try {
      await Webhook.verify(secret, rawBody, {
        "webhook-id": req.headers.get("webhook-id") ?? undefined,
        "webhook-signature": req.headers.get("webhook-signature") ?? undefined,
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? undefined
      });
    } catch (err) {
      if (err instanceof Webhook.WebhookVerificationError) {
        return NextResponse.json(
          { ok: false, error: "invalid-webhook-signature" },
          { status: 400 }
        );
      }
      // e.g. InvalidInputError: PORTONE_WEBHOOK_SECRET is not a valid
      // base64 / whsec_ secret. Server misconfiguration — still fail closed.
      return NextResponse.json(
        { ok: false, error: "webhook-verification-unavailable" },
        { status: 500 }
      );
    }
  } else if (signatureRequired) {
    return NextResponse.json(
      { ok: false, error: "signature-required" },
      { status: 401 }
    );
  } else {
    const supplied =
      req.headers.get("x-portone-webhook-secret") ??
      req.headers.get("x-webhook-secret") ??
      "";
    if (!safeEqual(supplied, secret)) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
  }

  let event: Record<string, unknown> | null = null;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown> | null;
  } catch {
    event = null;
  }
  if (!event) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const webhookPaymentId = webhookPaymentIdOf(event);
  const payload = await getPayload({ config });
  const providerEventId = req.headers.get("webhook-id") ?? eventIdOf(event);
  let providerEvent;
  try {
    providerEvent = await recordCommerceProviderEventStandalone({
      payload,
      paymentId: webhookPaymentId ?? undefined,
      event: { ...event, provider_event_id: providerEventId },
      rawBody
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "provider-event-persistence-failed" },
      { status: 503 }
    );
  }
  if (providerEvent.conflict) {
    return NextResponse.json(
      { ok: false, error: "provider-event-conflict" },
      { status: 409 }
    );
  }
  if (
    (!providerEvent.recorded && !providerEvent.duplicate) ||
    !providerEvent.eventId
  ) {
    return NextResponse.json(
      { ok: false, error: "missing-provider-event-id" },
      { status: 400 }
    );
  }

  let claim;
  try {
    claim = await claimCommerceProviderEvent({
      payload,
      eventId: providerEvent.eventId
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "provider-event-claim-failed" },
      { status: 503 }
    );
  }
  if (claim.kind === "terminal") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }
  if (claim.kind === "busy") {
    return NextResponse.json(
      { ok: false, error: "provider-event-processing" },
      { status: 503 }
    );
  }
  const processingContext = {
    payload,
    eventId: providerEvent.eventId,
    leaseToken: claim.leaseToken
  };
  if (!webhookPaymentId) {
    return finishProviderEvent(
      processingContext,
      NextResponse.json(
        { ok: false, error: "missing-order-ref" },
        { status: 400 }
      ),
      "rejected",
      "missing-order-ref"
    );
  }

  // Plans (membership) branch — decided by data, not by customData: if a
  // subscription carries this paymentId as its `payment_ref`, reconcile the
  // subscription rather than a product order. Idempotent and shared with the
  // browser-return verify route.
  {
    let planSub;
    try {
      planSub = await payload.find({
        collection: "subscriptions" as never,
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { payment_ref: { equals: webhookPaymentId } }
      });
    } catch {
      return finishProviderEvent(
        processingContext,
        NextResponse.json(
          { ok: false, error: "webhook-classification-unavailable" },
          { status: 503 }
        ),
        "retryable",
        "webhook-classification-unavailable"
      );
    }
    const sub = planSub?.docs?.[0] as
      { id: string; subscription_status?: string; paid?: boolean } | undefined;
    if (sub) {
      const status = webhookStatusOf(event);

      // Terminal non-paid outcomes (failed / cancelled): record and ACK 2xx.
      // We must NOT keep returning non-2xx — that provokes a PortOne retry
      // storm for a payment that will never become paid. Cancel the pending
      // hold so its seat is freed — but ONLY when the row is still pending and
      // unpaid; a reordered / duplicate FAILED must never cancel an
      // already-active (paid) membership.
      if (status === "failed") {
        const cancellation = await cancelPendingPlanPayment({
          payload,
          paymentId: webhookPaymentId
        });
        if (!cancellation.ok) {
          return finishProviderEvent(
            processingContext,
            NextResponse.json(
              { ok: false, error: cancellation.reason },
              { status: cancellation.status }
            ),
            cancellation.status >= 500 ? "retryable" : "rejected",
            cancellation.reason
          );
        }
        return finishProviderEvent(
          processingContext,
          NextResponse.json({ ok: true, terminal: "failed" }),
          "processed",
          "plan-payment-failed"
        );
      }
      // Refunds are reconciled out-of-band (admin) at launch; ACK so PortOne
      // stops retrying.
      if (status === "refunded") {
        return finishProviderEvent(
          processingContext,
          NextResponse.json({ ok: true, terminal: "refunded" }),
          "processed",
          "plan-payment-refunded"
        );
      }

      const result = await syncPlanPayment({
        payload,
        paymentId: webhookPaymentId
      });
      if (result.ok) {
        return finishProviderEvent(
          processingContext,
          NextResponse.json({
            ok: true,
            subscriptionId: result.subscriptionId,
            alreadyProcessed: result.alreadyProcessed
          }),
          "processed",
          "plan-payment-paid"
        );
      }
      // Only a genuinely transient failure should provoke a retry. A verified
      // rejection (amount/currency mismatch, TEST channel, not-paid) is
      // terminal — ACK 2xx after logging so PortOne stops hammering us; the
      // row stays pending for admin inspection.
      if (result.reason === "verify-unavailable") {
        return finishProviderEvent(
          processingContext,
          NextResponse.json(
            { ok: false, error: result.reason },
            { status: 503 }
          ),
          "retryable",
          result.reason
        );
      }
      payload.logger?.warn?.(
        `[lost/portone/webhook] plan payment ${webhookPaymentId} rejected: ${result.reason}`
      );
      return finishProviderEvent(
        processingContext,
        NextResponse.json({ ok: true, rejected: result.reason }),
        "rejected",
        result.reason
      );
    }
    if (isV2PaymentWebhook(event)) {
      const result = await syncProductPayment({
        payload,
        paymentId: webhookPaymentId
      });
      if (result.ok) {
        return finishProviderEvent(
          processingContext,
          NextResponse.json({
            ok: true,
            orderId: result.orderId,
            alreadyProcessed: result.alreadyProcessed
          }),
          "processed",
          "product-payment-paid"
        );
      }
      if (result.reason === "verify-unavailable") {
        return finishProviderEvent(
          processingContext,
          NextResponse.json(
            { ok: false, error: result.reason },
            { status: 503 }
          ),
          "retryable",
          result.reason
        );
      }
      payload.logger?.warn?.(
        `[lost/portone/webhook] product payment ${webhookPaymentId} rejected: ${result.reason}`
      );
      return finishProviderEvent(
        processingContext,
        NextResponse.json({ ok: true, rejected: result.reason }),
        "rejected",
        result.reason
      );
    }
    // No subscription and no V2 data.paymentId → legacy product path.
  }

  const orderRef = String(
    event.merchant_order_id ?? event.portone_order_ref ?? event.order_ref ?? ""
  );
  if (!orderRef) {
    return finishProviderEvent(
      processingContext,
      NextResponse.json(
        { ok: false, error: "missing-order-ref" },
        { status: 400 }
      ),
      "rejected",
      "missing-order-ref"
    );
  }

  const legacyPaymentStatus = normalizePaymentStatus(
    event.payment_status ?? event.status ?? event.transaction_status
  );
  let authoritativePayment: PortOnePaymentRecord | null = null;
  if (legacyPaymentStatus === "paid") {
    try {
      authoritativePayment = await getPortOnePayment(orderRef);
    } catch {
      return finishProviderEvent(
        processingContext,
        NextResponse.json(
          { ok: false, error: "verify-unavailable" },
          { status: 503 }
        ),
        "retryable",
        "verify-unavailable"
      );
    }
  }

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return finishProviderEvent(
      processingContext,
      NextResponse.json(
        { ok: false, error: "transaction-failed" },
        { status: 500 }
      ),
      "retryable",
      "transaction-failed"
    );
  }
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as NonNullable<Parameters<typeof payload.update>[0]["req"]>;
  authorizeCommerceLifecycleRequest(txReq);

  try {
    await paymentWebhookLock(payload, transactionID, orderRef);

    const orders = await payload.find({
      collection: "product-orders" as never,
      overrideAccess: true,
      req: txReq as never,
      depth: 0,
      limit: 1,
      where: { order_ref: { equals: orderRef } }
    });
    const order = orders.docs?.[0] as
      | {
          id: string;
          user?: string;
          order_mode?: string;
          campaign?: string | { id?: string };
          status?: string;
          lines?: unknown[];
          payment_status?: string;
          total_amount?: number;
          currency?: string;
        }
      | undefined;
    if (!order) {
      await payload.db.rollbackTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json(
          { ok: false, error: "order-not-found" },
          { status: 404 }
        ),
        "retryable",
        "order-not-found"
      );
    }

    const paymentStatus = legacyPaymentStatus;
    const payments = await payload.find({
      collection: "product-payments" as never,
      overrideAccess: true,
      req: txReq as never,
      depth: 0,
      limit: 1,
      where: {
        and: [
          { portone_order_ref: { equals: orderRef } },
          { provider: { equals: "portone" } }
        ]
      }
    });
    const payment = payments.docs?.[0] as
      | {
          id: string;
          amount?: number;
          currency?: string;
          provider?: string;
          status?: string;
          events?: unknown[];
        }
      | undefined;
    if (!payment || payment.provider !== "portone") {
      await payload.db.rollbackTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json(
          { ok: false, error: "payment-not-found" },
          { status: 404 }
        ),
        "retryable",
        "payment-not-found"
      );
    }
    const expectedAmount = Number(payment.amount ?? order.total_amount ?? NaN);
    const eventAmount = eventAmountOf(event);
    const expectedCurrency = String(payment.currency ?? order.currency ?? "");
    const eventCurrency = eventCurrencyOf(event);
    if (
      eventAmount === null ||
      eventAmount !== expectedAmount ||
      eventCurrency !== expectedCurrency
    ) {
      await payload.db.rollbackTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json(
          { ok: false, error: "payment-mismatch" },
          { status: 409 }
        ),
        "rejected",
        "payment-mismatch"
      );
    }

    if (paymentStatus === "paid") {
      const verification = verifyPortOnePayment(authoritativePayment, {
        amount: expectedAmount,
        currency: expectedCurrency,
        requireLiveChannel: requiresLiveChannel()
      });
      if (!verification.ok) {
        await payload.db.rollbackTransaction(transactionID);
        return finishProviderEvent(
          processingContext,
          NextResponse.json({ ok: true, rejected: verification.reason }),
          "rejected",
          verification.reason
        );
      }
    }

    const nextOrderStatus = orderStatusForPaymentStatus(
      paymentStatus,
      order.order_mode
    );
    if (
      !isCommerceOrderState(order.status) ||
      !isCommerceOrderState(nextOrderStatus) ||
      !isCommercePaymentState(payment.status) ||
      !isCommercePaymentState(paymentStatus)
    ) {
      await payload.db.rollbackTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json({
          ok: true,
          rejected: "invalid-commerce-transition"
        }),
        "rejected",
        "invalid-commerce-transition"
      );
    }
    try {
      assertOrderTransition({
        from: order.status,
        to: nextOrderStatus,
        actor: legacyPortOneActor
      });
      assertPaymentTransition({
        from: payment.status,
        to: paymentStatus,
        actor: legacyPortOneActor
      });
    } catch (error) {
      if (!(error instanceof CommerceTransitionError)) throw error;
      await payload.db.rollbackTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json({ ok: true, rejected: error.code }),
        "rejected",
        error.code
      );
    }

    const alreadyApplied =
      order.status === nextOrderStatus &&
      order.payment_status === paymentStatus &&
      payment.status === paymentStatus;
    if (alreadyApplied) {
      await payload.db.commitTransaction(transactionID);
      return finishProviderEvent(
        processingContext,
        NextResponse.json({ ok: true }),
        "processed",
        "already-processed"
      );
    }

    const wasAlreadyPaid = order.payment_status === "paid";
    const shouldReleaseStandardInventory =
      paymentStatus === "failed" &&
      !wasAlreadyPaid &&
      order.payment_status !== "failed" &&
      order.status !== "failed" &&
      order.status !== "canceled" &&
      order.status !== "refunded";

    if (shouldReleaseStandardInventory) {
      await releaseStandardInventory({ payload, order, req: txReq as never });
    }

    await payload.update({
      collection: "product-orders" as never,
      id: order.id,
      req: txReq,
      overrideAccess: true,
      data: {
        payment_status: paymentStatus,
        status: nextOrderStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : undefined
      } as never
    });

    await payload.update({
      collection: "product-payments" as never,
      id: payment.id,
      req: txReq,
      overrideAccess: true,
      data: {
        status: paymentStatus,
        portone_transaction_ref: event.payment_txn_ref ?? event.transaction_ref,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : undefined
      } as never
    });

    if (paymentStatus === "paid" && !wasAlreadyPaid) {
      await markRequestOrderPaid({
        payload,
        order: { ...order, status: nextOrderStatus },
        req: txReq as never
      });
    }

    await payload.db.commitTransaction(transactionID);
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    payload.logger.error?.(
      `[lost/portone/webhook] transaction failed for ${orderRef}: ${(err as Error).message}`
    );
    return finishProviderEvent(
      processingContext,
      NextResponse.json(
        { ok: false, error: "webhook-transaction-failed" },
        { status: 500 }
      ),
      "retryable",
      "webhook-transaction-failed"
    );
  }

  return finishProviderEvent(
    processingContext,
    NextResponse.json({ ok: true }),
    "processed",
    `legacy-${normalizePaymentStatus(
      event.payment_status ?? event.status ?? event.transaction_status
    )}`
  );
}
