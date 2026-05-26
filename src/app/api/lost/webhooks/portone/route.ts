import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { markRequestOrderPaid } from "@/lib/lost-commerce/campaigns";

export const runtime = "nodejs";

function normalizePaymentStatus(status: unknown) {
  const value = String(status ?? "").toUpperCase();
  if (["SUCCESS", "PAID", "CAPTURED"].includes(value)) return "paid";
  if (["FAILED", "FAILURE", "CANCELLED", "CANCELED"].includes(value)) return "failed";
  if (["REFUNDED"].includes(value)) return "refunded";
  return "pending";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (secret) {
    const supplied =
      req.headers.get("x-portone-webhook-secret") ??
      req.headers.get("x-webhook-secret");
    if (supplied !== secret) {
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
  const orders = await payload.find({
    collection: "product-orders" as never,
    overrideAccess: true,
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
        payment_status?: string;
      }
    | undefined;
  if (!order) {
    return NextResponse.json({ ok: false, error: "order-not-found" }, { status: 404 });
  }

  const paymentStatus = normalizePaymentStatus(
    event.payment_status ?? event.status ?? event.transaction_status
  );
  const wasAlreadyPaid = order.payment_status === "paid";
  await payload.update({
    collection: "product-orders" as never,
    id: order.id,
    overrideAccess: true,
    data: {
      payment_status: paymentStatus,
      status:
        paymentStatus === "paid"
          ? order.order_mode === "request_to_order"
            ? "paid"
            : "confirmed"
          : paymentStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : undefined
    } as never
  });

  const payments = await payload.find({
    collection: "product-payments" as never,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { portone_order_ref: { equals: orderRef } }
  });
  const payment = payments.docs?.[0] as
    | { id: string; events?: unknown[] }
    | undefined;
  if (payment) {
    const eventId = String(
      event.webhook_id ??
        event.event_id ??
        event.transaction_id ??
        event.payment_txn_ref ??
        ""
    );
    const events = Array.isArray(payment.events) ? payment.events : [];
    const duplicate =
      eventId.length > 0 &&
      events.some(
        (stored) =>
          typeof stored === "object" &&
          stored !== null &&
          String(
            (stored as Record<string, unknown>).webhook_id ??
              (stored as Record<string, unknown>).event_id ??
              (stored as Record<string, unknown>).transaction_id ??
              (stored as Record<string, unknown>).payment_txn_ref ??
              ""
          ) === eventId
      );

    if (duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await payload.update({
      collection: "product-payments" as never,
      id: payment.id,
      overrideAccess: true,
      data: {
        status: paymentStatus,
        portone_transaction_ref: event.payment_txn_ref ?? event.transaction_ref,
        events: [...events, event],
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : undefined
      } as never
    });
  }

  if (paymentStatus === "paid" && !wasAlreadyPaid) {
    await markRequestOrderPaid({ payload, order });
  }

  return NextResponse.json({ ok: true });
}
