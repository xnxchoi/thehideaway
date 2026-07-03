import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getPayload } from "payload";
import config from "@payload-config";
import { paymentWebhookLock } from "@/lib/db/sequences";
import { markRequestOrderPaid } from "@/lib/lost-commerce/campaigns";
import { releaseStandardInventory } from "@/lib/lost-commerce/inventory";
import { syncPlanPayment } from "@/lib/lost-commerce/plan-payment";

export const runtime = "nodejs";

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

function eventIdOf(event: Record<string, unknown>): string {
  return String(
    event.webhook_id ??
      event.event_id ??
      event.transaction_id ??
      event.payment_txn_ref ??
      ""
  );
}

function storedEventIdOf(event: unknown): string {
  if (typeof event !== "object" || event === null) return "";
  const stored = event as Record<string, unknown>;
  return eventIdOf(stored);
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "webhook-secret-not-configured" },
      { status: 500 }
    );
  }
  if (secret) {
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

  const event = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!event) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  // Plans (membership) branch — decided by data, not by customData: if a
  // subscription carries this paymentId as its `payment_ref`, reconcile the
  // subscription rather than a product order. Idempotent and shared with the
  // browser-return verify route: whichever runs first drives the pending→
  // paid edge; the second is a no-op (advisory lock + re-read).
  const webhookPaymentId = webhookPaymentIdOf(event);
  if (webhookPaymentId) {
    const payload = await getPayload({ config });
    const planSub = await payload
      .find({
        collection: "subscriptions" as never,
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { payment_ref: { equals: webhookPaymentId } }
      })
      .catch(() => null);
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
        if (sub.subscription_status === "pending" && sub.paid !== true) {
          await payload
            .update({
              collection: "subscriptions" as never,
              id: sub.id,
              overrideAccess: true,
              data: {
                subscription_status: "canceled"
              } as never
            })
            .catch(() => undefined);
        }
        return NextResponse.json({ ok: true, terminal: "failed" });
      }
      // Refunds are reconciled out-of-band (admin) at launch; ACK so PortOne
      // stops retrying.
      if (status === "refunded") {
        return NextResponse.json({ ok: true, terminal: "refunded" });
      }

      const result = await syncPlanPayment({
        payload,
        paymentId: webhookPaymentId
      });
      if (result.ok) {
        return NextResponse.json({
          ok: true,
          subscriptionId: result.subscriptionId,
          alreadyProcessed: result.alreadyProcessed
        });
      }
      // Only a genuinely transient failure should provoke a retry. A verified
      // rejection (amount/currency mismatch, TEST channel, not-paid) is
      // terminal — ACK 2xx after logging so PortOne stops hammering us; the
      // row stays pending for admin inspection.
      if (result.reason === "verify-unavailable") {
        return NextResponse.json(
          { ok: false, error: result.reason },
          { status: 503 }
        );
      }
      payload.logger?.warn?.(
        `[lost/portone/webhook] plan payment ${webhookPaymentId} rejected: ${result.reason}`
      );
      return NextResponse.json({ ok: true, rejected: result.reason });
    }
    // No subscription for this id → fall through to the product-order path.
  }

  const orderRef = String(
    event.merchant_order_id ?? event.portone_order_ref ?? event.order_ref ?? ""
  );
  if (!orderRef) {
    return NextResponse.json(
      { ok: false, error: "missing-order-ref" },
      { status: 400 }
    );
  }

  const payload = await getPayload({ config });
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return NextResponse.json(
      { ok: false, error: "transaction-failed" },
      { status: 500 }
    );
  }
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as Parameters<typeof payload.update>[0]["req"];

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
      return NextResponse.json(
        { ok: false, error: "order-not-found" },
        { status: 404 }
      );
    }

    const paymentStatus = normalizePaymentStatus(
      event.payment_status ?? event.status ?? event.transaction_status
    );
    const payments = await payload.find({
      collection: "product-payments" as never,
      overrideAccess: true,
      req: txReq as never,
      depth: 0,
      limit: 1,
      where: { portone_order_ref: { equals: orderRef } }
    });
    const payment = payments.docs?.[0] as
      | {
          id: string;
          amount?: number;
          currency?: string;
          provider?: string;
          events?: unknown[];
        }
      | undefined;
    if (!payment || payment.provider !== "portone") {
      await payload.db.rollbackTransaction(transactionID);
      return NextResponse.json(
        { ok: false, error: "payment-not-found" },
        { status: 404 }
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
      return NextResponse.json(
        { ok: false, error: "payment-mismatch" },
        { status: 409 }
      );
    }

    const eventId = eventIdOf(event);
    const events = Array.isArray(payment.events) ? payment.events : [];
    const duplicate =
      eventId.length > 0 &&
      events.some((stored) => storedEventIdOf(stored) === eventId);
    if (duplicate) {
      await payload.db.rollbackTransaction(transactionID);
      return NextResponse.json({ ok: true, duplicate: true });
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
        status: orderStatusForPaymentStatus(paymentStatus, order.order_mode),
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
        events: [...events, event],
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : undefined
      } as never
    });

    if (paymentStatus === "paid" && !wasAlreadyPaid) {
      await markRequestOrderPaid({ payload, order, req: txReq as never });
    }

    await payload.db.commitTransaction(transactionID);
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    payload.logger.error?.(
      `[lost/portone/webhook] transaction failed for ${orderRef}: ${(err as Error).message}`
    );
    return NextResponse.json(
      { ok: false, error: "webhook-transaction-failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
