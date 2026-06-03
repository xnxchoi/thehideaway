import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getPayload } from "payload";
import config from "@payload-config";
import { paymentWebhookLock } from "@/lib/db/sequences";
import { markRequestOrderPaid } from "@/lib/lost-commerce/campaigns";
import { releaseStandardInventory } from "@/lib/lost-commerce/inventory";

export const runtime = "nodejs";

function normalizePaymentStatus(status: unknown) {
  const value = String(status ?? "").toUpperCase();
  if (["SUCCESS", "PAID", "CAPTURED"].includes(value)) return "paid";
  if (["FAILED", "FAILURE", "CANCELLED", "CANCELED"].includes(value)) return "failed";
  if (["REFUNDED"].includes(value)) return "refunded";
  return "pending";
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
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const event = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!event) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const orderRef = String(
    event.merchant_order_id ?? event.portone_order_ref ?? event.order_ref ?? ""
  );
  if (!orderRef) {
    return NextResponse.json({ ok: false, error: "missing-order-ref" }, { status: 400 });
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
      return NextResponse.json({ ok: false, error: "order-not-found" }, { status: 404 });
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
      return NextResponse.json({ ok: false, error: "payment-not-found" }, { status: 404 });
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
