import type { Payload } from "payload";

import { releaseStandardInventory } from "./inventory";

type AnyDoc = Record<string, any>;

export type CancelUnpaidProductOrderResult =
  | { ok: true; canceled: true }
  | { ok: true; canceled: false; reason: "already-final" };

function isFinalOrder(order: AnyDoc): boolean {
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
  order: AnyDoc;
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
  } as Parameters<typeof input.payload.update>[0]["req"];

  try {
    await releaseStandardInventory({
      payload: input.payload,
      order: input.order,
      req: txReq as never
    });

    await input.payload.update({
      collection: "product-orders" as never,
      id: input.order.id,
      overrideAccess: true,
      req: txReq,
      data: {
        status: "failed",
        payment_status: "failed",
        fulfillment_status: "canceled"
      } as never
    });

    const payments = await input.payload.find({
      collection: "product-payments" as never,
      depth: 0,
      limit: 10,
      overrideAccess: true,
      req: txReq as never,
      where: { order: { equals: input.order.id } }
    });

    await Promise.all(
      payments.docs.map((payment: AnyDoc) =>
        input.payload.update({
          collection: "product-payments" as never,
          id: String(payment.id),
          overrideAccess: true,
          req: txReq,
          data: { status: "failed" } as never
        })
      )
    );

    await input.payload.db.commitTransaction(transactionID);
    return { ok: true, canceled: true };
  } catch (err) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw err;
  }
}
