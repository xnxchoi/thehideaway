import type { Payload } from "payload";
import type { ProductOrder, ProductPayment } from "@/payload-types";

import { paymentWebhookLock } from "@/lib/db/sequences";
import { hashCommerceCommandInput } from "./commerce-commands";
import type { ReservationTransactionRequest } from "./inventory-reservation-store";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservations";
import { releaseOrderInventoryReservationsInTransaction } from "./order-inventory-reservations";
import { authorizeCommerceLifecycleRequest } from "./lifecycle-authorization";
import {
  assertOrderTransition,
  assertPaymentTransition,
  CommerceTransitionError,
  isCommerceOrderState,
  isCommercePaymentState
} from "./transitions";

type OrderCancellationRecord = {
  id?: string;
  order_ref?: unknown;
  order_mode?: unknown;
  payment_status?: unknown;
  status?: unknown;
  lines?: unknown;
};

const orderFailureActor = { kind: "system", id: "payment-failure" } as const;

export type CancelUnpaidProductOrderResult =
  | { ok: true; canceled: true }
  | { ok: true; canceled: false; reason: "already-final" };

function isFinalOrder(order: OrderCancellationRecord): boolean {
  return (
    order.payment_status === "paid" ||
    order.payment_status === "failed" ||
    order.payment_status === "refunded" ||
    order.status === "failed" ||
    order.status === "canceled" ||
    order.status === "refunded"
  );
}

export async function cancelUnpaidProductOrder(input: {
  payload: Payload;
  order: OrderCancellationRecord;
}): Promise<CancelUnpaidProductOrderResult> {
  if (isFinalOrder(input.order)) {
    return { ok: true, canceled: false, reason: "already-final" };
  }

  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("transaction-failed");

  const txReq: ReservationTransactionRequest = {
    payload: input.payload,
    transactionID,
    context: { user: { role: "guest" } }
  };
  authorizeCommerceLifecycleRequest(txReq);

  try {
    const orderRef = String(input.order.order_ref ?? "");
    if (!orderRef) throw new Error("missing-order-ref");
    const orderId = String(input.order.id ?? "");
    if (!orderId) throw new Error("order-not-found");
    const releaseCommandKey = hashCommerceCommandInput({
      orderId,
      operation: "cancel-release"
    });
    await lockOrderInventoryReservationsInTransaction({
      payload: input.payload,
      req: txReq,
      orderId,
      terminal: { operation: "release", baseKey: releaseCommandKey }
    });
    await paymentWebhookLock(input.payload, transactionID, orderRef);

    const locked = await input.payload.find({
      collection: "product-orders",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: txReq,
      where: { order_ref: { equals: orderRef } }
    });
    const order = locked.docs[0] as ProductOrder | undefined;
    if (!order) throw new Error("order-not-found");
    if (isFinalOrder(order)) {
      await input.payload.db.rollbackTransaction(transactionID);
      return { ok: true, canceled: false, reason: "already-final" };
    }

    if (!isCommerceOrderState(order.status)) {
      throw new CommerceTransitionError("invalid-commerce-transition");
    }
    assertOrderTransition({
      from: order.status,
      to: "failed",
      actor: orderFailureActor
    });

    const payments = await input.payload.find({
      collection: "product-payments",
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req: txReq,
      where: { order: { equals: order.id } }
    });
    for (const payment of payments.docs as ProductPayment[]) {
      if (!isCommercePaymentState(payment.status)) {
        throw new CommerceTransitionError("invalid-commerce-transition");
      }
      assertPaymentTransition({
        from: payment.status,
        to: "failed",
        actor: orderFailureActor
      });
    }

    await releaseOrderInventoryReservationsInTransaction({
      payload: input.payload,
      req: txReq,
      orderId: order.id,
      idempotencyKey: releaseCommandKey,
      effectiveAt: new Date().toISOString(),
      locksHeld: true
    });

    await input.payload.update({
      collection: "product-orders",
      id: order.id,
      overrideAccess: true,
      req: txReq,
      data: {
        status: "failed",
        payment_status: "failed",
        fulfillment_status: "canceled"
      }
    });

    for (const payment of payments.docs as ProductPayment[]) {
      await input.payload.update({
        collection: "product-payments",
        id: String(payment.id),
        overrideAccess: true,
        req: txReq,
        data: { status: "failed" }
      });
    }

    await input.payload.db.commitTransaction(transactionID);
    return { ok: true, canceled: true };
  } catch (err) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw err;
  }
}
