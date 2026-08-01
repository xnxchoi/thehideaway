import type { getPayload } from "payload";
import type { ProductOrder, ProductPayment } from "@/payload-types";

import { paymentWebhookLock } from "@/lib/db/sequences";
import { hashCommerceCommandInput } from "./commerce-commands";
import { finalizePaidOrderInventoryInTransaction } from "./inventory-reservation-payment-finalization";
import type { ReservationTransactionRequest } from "./inventory-reservation-store";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservations";
import { markRequestOrderPaid } from "./campaigns";
import { authorizeCommerceLifecycleRequest } from "./lifecycle-authorization";
import { recordCommerceProviderEventStandalone } from "./provider-events";
import { cancelUnpaidProductOrder } from "./orders";
import {
  assertOrderTransition,
  assertPaymentTransition,
  CommerceTransitionError,
  isCommerceOrderState,
  isCommercePaymentState
} from "./transitions";
import {
  getPortOnePayment,
  requiresLiveChannel,
  verifyPortOnePayment
} from "./verify-payment";

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;
const portOneActor = { kind: "system", id: "portone" } as const;
const providerEventReferencePattern = /^[A-Za-z0-9_.:~/-]{1,200}$/;

export type SyncProductPaymentResult =
  | {
      ok: true;
      orderId: string;
      status: "paid";
      alreadyProcessed: boolean;
    }
  | {
      ok: false;
      status: number;
      reason:
        | "order-not-found"
        | "payment-not-found"
        | "payment-failed"
        | "order-final"
        | "not-paid"
        | "amount-mismatch"
        | "currency-mismatch"
        | "test-channel-rejected"
        | "malformed"
        | "verify-unavailable";
    };

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function paidOrderStatus(orderMode: unknown): "paid" | "confirmed" {
  return orderMode === "request_to_order" ? "paid" : "confirmed";
}

function rejectionStatus(reason: string): number {
  if (reason === "amount-mismatch" || reason === "currency-mismatch")
    return 409;
  if (reason === "test-channel-rejected") return 403;
  return 402;
}

async function findOrder(
  payload: PayloadInstance,
  paymentId: string,
  req?: unknown
) {
  const result = await payload.find({
    collection: "product-orders" as never,
    overrideAccess: true,
    req: req as never,
    depth: 0,
    limit: 1,
    where: { order_ref: { equals: paymentId } }
  });
  return result.docs?.[0] as ProductOrder | undefined;
}

async function findPayment(
  payload: PayloadInstance,
  paymentId: string,
  req?: unknown
) {
  const result = await payload.find({
    collection: "product-payments" as never,
    overrideAccess: true,
    req: req as never,
    depth: 0,
    limit: 1,
    where: { payment_ref: { equals: `${paymentId}_portone` } }
  });
  return result.docs?.[0] as ProductPayment | undefined;
}

/**
 * Authoritative PortOne V2 reconciliation for LOSTINSEOUL product orders.
 * Browser and webhook inputs supply only the payment id; PortOne's payment
 * record supplies payment truth, and the database snapshot supplies the
 * expected amount, currency, owner, order mode, and campaign.
 */
export async function syncProductPayment(input: {
  payload: PayloadInstance;
  paymentId: string;
  expectedUserId?: string;
  event?: Record<string, unknown>;
  providerEventRef?: string;
}): Promise<SyncProductPaymentResult> {
  const { payload, paymentId, expectedUserId, event } = input;
  let providerEventRef = input.providerEventRef;
  if (
    providerEventRef !== undefined &&
    !providerEventReferencePattern.test(providerEventRef)
  ) {
    return { ok: false, status: 400, reason: "malformed" };
  }
  if (event) {
    try {
      const providerEvent = await recordCommerceProviderEventStandalone({
        payload,
        paymentId,
        event
      });
      if (!providerEvent.recorded && !providerEvent.duplicate) {
        return { ok: false, status: 400, reason: "malformed" };
      }
      if (!providerEvent.eventId) {
        return { ok: false, status: 400, reason: "malformed" };
      }
      providerEventRef = providerEvent.eventId;
    } catch {
      return { ok: false, status: 503, reason: "verify-unavailable" };
    }
  }
  let preOrder: ProductOrder | undefined;
  let prePayment: ProductPayment | undefined;
  try {
    [preOrder, prePayment] = await Promise.all([
      findOrder(payload, paymentId),
      findPayment(payload, paymentId)
    ]);
  } catch {
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }

  if (!preOrder || (expectedUserId && idOf(preOrder.user) !== expectedUserId)) {
    return { ok: false, status: 404, reason: "order-not-found" };
  }
  if (!prePayment || prePayment.provider !== "portone") {
    return { ok: false, status: 404, reason: "payment-not-found" };
  }
  if (
    idOf(prePayment.order) !== String(preOrder.id) ||
    idOf(prePayment.user) !== idOf(preOrder.user)
  ) {
    return { ok: false, status: 404, reason: "payment-not-found" };
  }
  if (Number(prePayment.amount) !== Number(preOrder.total_amount)) {
    return { ok: false, status: 409, reason: "amount-mismatch" };
  }
  if (String(prePayment.currency) !== String(preOrder.currency)) {
    return { ok: false, status: 409, reason: "currency-mismatch" };
  }
  if (
    preOrder.payment_status === "paid" &&
    prePayment.status === "paid" &&
    !event
  ) {
    return {
      ok: true,
      orderId: String(preOrder.id),
      status: "paid",
      alreadyProcessed: true
    };
  }

  let record;
  try {
    record = await getPortOnePayment(paymentId);
  } catch {
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }

  const verdict = verifyPortOnePayment(record, {
    amount: Number(prePayment.amount ?? preOrder.total_amount ?? 0),
    currency: String(prePayment.currency ?? preOrder.currency ?? ""),
    requireLiveChannel: requiresLiveChannel()
  });
  if (!verdict.ok) {
    const providerStatus = String(record.status ?? "").toUpperCase();
    if (
      verdict.reason === "not-paid" &&
      ["FAILED", "FAILURE", "CANCELLED", "CANCELED"].includes(providerStatus)
    ) {
      try {
        await cancelUnpaidProductOrder({ payload, order: preOrder });
      } catch {
        return { ok: false, status: 503, reason: "verify-unavailable" };
      }
      return { ok: false, status: 402, reason: "payment-failed" };
    }
    return {
      ok: false,
      status: rejectionStatus(verdict.reason),
      reason: verdict.reason
    };
  }

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }
  const txReq: ReservationTransactionRequest = {
    payload,
    transactionID,
    context: { user: { role: "guest" } }
  };
  authorizeCommerceLifecycleRequest(txReq);
  const inventoryCommandKey = hashCommerceCommandInput({
    paymentId,
    operation: "consume-reservations"
  });

  try {
    await lockOrderInventoryReservationsInTransaction({
      payload,
      req: txReq,
      orderId: String(preOrder.id),
      terminal: { operation: "consume", baseKey: inventoryCommandKey }
    });
    await paymentWebhookLock(payload, transactionID, paymentId);
    const [order, payment] = await Promise.all([
      findOrder(payload, paymentId, txReq),
      findPayment(payload, paymentId, txReq)
    ]);
    if (!order) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 404, reason: "order-not-found" };
    }
    if (!payment || payment.provider !== "portone") {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 404, reason: "payment-not-found" };
    }
    if (
      idOf(payment.order) !== String(order.id) ||
      idOf(payment.user) !== idOf(order.user)
    ) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 404, reason: "payment-not-found" };
    }
    if (expectedUserId && idOf(order.user) !== expectedUserId) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 404, reason: "order-not-found" };
    }
    if (Number(payment.amount) !== Number(order.total_amount)) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 409, reason: "amount-mismatch" };
    }
    if (String(payment.currency) !== String(order.currency)) {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 409, reason: "currency-mismatch" };
    }
    const lockedVerdict = verifyPortOnePayment(record, {
      amount: Number(payment.amount),
      currency: String(payment.currency),
      requireLiveChannel: requiresLiveChannel()
    });
    if (!lockedVerdict.ok) {
      await payload.db.rollbackTransaction(transactionID);
      return {
        ok: false,
        status: rejectionStatus(lockedVerdict.reason),
        reason: lockedVerdict.reason
      };
    }
    if (order.payment_status === "paid" && payment.status === "paid") {
      await payload.db.commitTransaction(transactionID);
      return {
        ok: true,
        orderId: String(order.id),
        status: "paid",
        alreadyProcessed: true
      };
    }
    if (String(order.status) === "refunded") {
      await payload.db.rollbackTransaction(transactionID);
      return { ok: false, status: 409, reason: "order-final" };
    }

    if (
      !isCommerceOrderState(order.status) ||
      !isCommercePaymentState(payment.status)
    ) {
      throw new CommerceTransitionError("invalid-commerce-transition");
    }
    assertPaymentTransition({
      from: payment.status,
      to: "paid",
      actor: portOneActor
    });

    const paidAt = record.paidAt;
    await payload.update({
      collection: "product-payments" as never,
      id: String(payment.id),
      overrideAccess: true,
      req: txReq,
      data: {
        status: "paid",
        portone_transaction_ref: lockedVerdict.transactionRef ?? undefined,
        paid_at: paidAt
      } as never
    });
    const inventoryResult =
      order.order_mode === "standard_purchase"
        ? await finalizePaidOrderInventoryInTransaction({
            payload,
            req: txReq,
            orderId: String(order.id),
            paymentId: String(payment.id),
            idempotencyKey: inventoryCommandKey,
            providerEventRef,
            providerPaidAt: paidAt,
            locksHeld: true
          })
        : undefined;
    const terminalOrderNeedsReview =
      order.status === "failed" || order.status === "canceled";
    const nextOrderStatus =
      inventoryResult?.kind === "paid_inventory_review" ||
      terminalOrderNeedsReview
        ? "paid_inventory_review"
        : paidOrderStatus(order.order_mode);
    assertOrderTransition({
      from: order.status,
      to: nextOrderStatus,
      actor: portOneActor
    });
    await payload.update({
      collection: "product-orders" as never,
      id: String(order.id),
      overrideAccess: true,
      req: txReq,
      data: {
        payment_status: "paid",
        status: nextOrderStatus,
        paid_at: paidAt
      } as never
    });
    if (nextOrderStatus !== "paid_inventory_review") {
      await markRequestOrderPaid({
        payload,
        order: { ...order, status: nextOrderStatus },
        req: txReq as never
      });
    }
    await payload.db.commitTransaction(transactionID);
    return {
      ok: true,
      orderId: String(order.id),
      status: "paid",
      alreadyProcessed: false
    };
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    if (err instanceof CommerceTransitionError) {
      return { ok: false, status: 409, reason: "order-final" };
    }
    payload.logger?.error?.(
      `[product-payment] reconcile failed for ${paymentId}: ${(err as Error).message}`
    );
    return { ok: false, status: 503, reason: "verify-unavailable" };
  }
}
