import type { Payload } from "payload";
import type { ProductOrder, ProductPayment } from "@/payload-types";

import { paymentWebhookLock } from "@/lib/db/sequences";
import { releaseStandardInventory } from "./inventory";
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

  const txReq = {
    payload: input.payload,
    transactionID,
    context: {}
  } as NonNullable<Parameters<typeof input.payload.update>[0]["req"]>;
  authorizeCommerceLifecycleRequest(txReq);

  try {
    const orderRef = String(input.order.order_ref ?? "");
    if (!orderRef) throw new Error("missing-order-ref");
    await paymentWebhookLock(input.payload, transactionID, orderRef);

    const locked = await input.payload.find({
      collection: "product-orders" as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: txReq as never,
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
      collection: "product-payments" as never,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req: txReq as never,
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

    await releaseStandardInventory({
      payload: input.payload,
      order,
      req: txReq as never
    });

    await input.payload.update({
      collection: "product-orders" as never,
      id: order.id,
      overrideAccess: true,
      req: txReq,
      data: {
        status: "failed",
        payment_status: "failed",
        fulfillment_status: "canceled"
      } as never
    });

    for (const payment of payments.docs as ProductPayment[]) {
      await input.payload.update({
        collection: "product-payments" as never,
        id: String(payment.id),
        overrideAccess: true,
        req: txReq,
        data: { status: "failed" } as never
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
