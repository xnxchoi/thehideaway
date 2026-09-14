import type { PayloadRequest } from "payload";
import {
  getPortOnePayment,
  verifyPortOnePayment,
  type PortOnePaymentRecord
} from "@/lib/lost-commerce/verify-payment";
import { relationID, withPurchaseLock } from "../checkout-attempt";
import { authorizeCartOwnershipRequest } from "../cart-ownership";
import type { PortOneAdapterDeps } from "./deps";

type Row = Record<string, unknown>;
export type SettlementResult = {
  message: string;
  orderID: string;
  order_ref: string;
  transactionID: string;
  paymentStatus: string;
  attemptStatus: string;
  reconciliationRequired?: boolean;
};

export async function findPaymentAttempt(
  req: PayloadRequest,
  paymentId: string
): Promise<Row> {
  const found = await req.payload.find({
    collection: "transactions",
    req,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { "portone.paymentId": { equals: paymentId } }
  });
  const attempt = found.docs[0];
  if (!attempt) throw new Error("transaction-not-found");
  return attempt as unknown as Row;
}

function result(
  order: Row,
  attempt: Row,
  reconciliation = false
): SettlementResult {
  return {
    message: reconciliation
      ? "payment-reconciliation-required"
      : "Order confirmed successfully",
    orderID: String(order.id),
    order_ref: String(order.order_ref),
    transactionID: String(attempt.id),
    paymentStatus: String(order.payment_status),
    attemptStatus: String(attempt.status),
    ...(reconciliation ? { reconciliationRequired: true } : {})
  };
}

function evidence(record: PortOnePaymentRecord, reason: string): Row {
  return {
    reason,
    paymentId: record.id ?? null,
    storeId: record.storeId ?? null,
    status: record.status ?? null,
    total: record.amount?.total ?? null,
    paid: record.amount?.paid ?? null,
    currency: record.currency ?? null,
    channelKey: record.channel?.key ?? null,
    channelType: record.channel?.type ?? null,
    transactionId: record.transactionId ?? null
  };
}

/** Trusted server entry point. Browser callers must pass through confirm-order authorization first. */
export function createPortOneSettlement(deps: PortOneAdapterDeps = {}) {
  const getPayment = deps.getPayment ?? getPortOnePayment;
  return async ({
    req,
    paymentId
  }: {
    req: PayloadRequest;
    paymentId: string;
  }): Promise<SettlementResult> => {
    if (req.transactionID)
      throw new Error("provider-fetch-inside-transaction-forbidden");
    const before = await findPaymentAttempt(req, paymentId);
    const purchaseID = relationID(before.order);
    if (!purchaseID) throw new Error("transaction-purchase-required");
    const record = await getPayment(paymentId);
    return withPurchaseLock(req, `purchase:${purchaseID}`, async (locked) => {
      const attempt = (await req.payload.findByID({
        collection: "transactions",
        id: String(before.id),
        req: locked,
        depth: 0,
        overrideAccess: true
      })) as unknown as Row;
      const order = (await req.payload.findByID({
        collection: "orders",
        id: purchaseID,
        req: locked,
        depth: 0,
        overrideAccess: true
      })) as unknown as Row;
      if (
        relationID(attempt.order) !== purchaseID ||
        (attempt.portone as Row)?.paymentId !== paymentId ||
        attempt.checkout_fingerprint !== order.checkout_fingerprint ||
        attempt.amount !== order.amount ||
        attempt.currency !== order.currency
      )
        throw new Error("purchase-binding-mismatch");
      const expectation = attempt.provider_expectation as Row | undefined;
      if (
        !expectation ||
        expectation.paymentId !== paymentId ||
        typeof expectation.storeId !== "string" ||
        typeof expectation.channelKey !== "string" ||
        !["LIVE", "TEST"].includes(String(expectation.channelType))
      )
        throw new Error("provider-expectation-required");
      if (
        !Number.isSafeInteger(attempt.amount) ||
        Number(attempt.amount) <= 0 ||
        typeof attempt.currency !== "string"
      )
        throw new Error("malformed");
      const verification = verifyPortOnePayment(record, {
        amount: Number(attempt.amount),
        currency: attempt.currency,
        requireLiveChannel: expectation.channelType === "LIVE",
        paymentId,
        storeId: expectation.storeId,
        channelKey: expectation.channelKey,
        channelType: expectation.channelType as "LIVE" | "TEST",
        requirePaidAmount: true
      });
      const settledID = relationID(order.settlement_transaction);
      const now = new Date().toISOString();
      const matchingTerminalAmounts =
        record.amount?.total === attempt.amount &&
        record.amount?.paid === 0 &&
        typeof record.currency === "string" &&
        record.currency.replace(/^CURRENCY_/, "").toUpperCase() ===
          attempt.currency;
      if (verification.ok && record.status !== "PAID")
        return reconcile("unexpected-provider-status");
      // Preserve terminal financial state, but do not hide provider-console changes.
      if (
        settledID === String(attempt.id) &&
        ["succeeded", "refunded", "cancelled"].includes(String(attempt.status))
      ) {
        const matchingPaid = attempt.status === "succeeded" && verification.ok;
        const matchingCancellation =
          ["refunded", "cancelled"].includes(String(attempt.status)) &&
          !verification.ok &&
          verification.reason === "not-paid" &&
          record.status === "CANCELLED" &&
          matchingTerminalAmounts;
        if (matchingPaid || matchingCancellation)
          return result(order, attempt, Boolean(order.reconciliation_required));
        return reconcile(
          verification.ok ? "capture-after-terminal-state" : verification.reason
        );
      }
      if (!verification.ok) {
        const terminalStatus =
          verification.reason === "not-paid" &&
          ["FAILED", "CANCELLED"].includes(String(record.status));
        const terminal = terminalStatus && matchingTerminalAmounts;
        if (terminalStatus && !terminal)
          return reconcile("terminal-amount-mismatch");
        if (
          terminal &&
          attempt.provider_verified_at &&
          attempt.status ===
            (record.status === "FAILED" ? "failed" : "cancelled")
        ) {
          return result(order, attempt, Boolean(order.reconciliation_required));
        }
        if (
          terminal &&
          attempt.status === "pending" &&
          settledID !== String(attempt.id)
        ) {
          await req.payload.update({
            collection: "transactions",
            id: String(attempt.id),
            req: locked,
            overrideAccess: true,
            data: {
              status: record.status === "FAILED" ? "failed" : "cancelled",
              provider_verified_at: now,
              provider_outcome: evidence(record, "terminal-unpaid")
            } as never
          });
          return result(order, {
            ...attempt,
            status: record.status === "FAILED" ? "failed" : "cancelled"
          });
        }
        if (
          verification.reason === "not-paid" &&
          !["PARTIAL_CANCELLED", "CANCELLED"].includes(String(record.status))
        )
          throw new Error("not-paid");
        return reconcile(verification.reason);
      }
      if (settledID && settledID !== String(attempt.id))
        return reconcile("excess-capture");
      if (
        order.lifecycle_status !== "pending_payment" ||
        order.payment_status !== "pending" ||
        attempt.status !== "pending"
      )
        return reconcile("capture-after-terminal-state");
      if (order.reconciliation_required || attempt.reconciliation_required)
        return result(order, attempt, true);
      await req.payload.update({
        collection: "transactions",
        id: String(attempt.id),
        req: locked,
        overrideAccess: true,
        data: {
          status: "succeeded",
          provider_verified_at: now,
          provider_outcome: evidence(record, "paid"),
          portone: {
            ...(attempt.portone as Row),
            transactionId: verification.transactionRef
          }
        } as never
      });
      const paidOrder = { ...order, payment_status: "paid" };
      await req.payload.update({
        collection: "orders",
        id: purchaseID,
        req: locked,
        overrideAccess: true,
        data: {
          lifecycle_status: "paid",
          payment_status: "paid",
          paid_at: now,
          settlement_transaction: attempt.id,
          settlement_effects: {
            payment_receipt: {
              key: `purchase:${purchaseID}:payment-receipt`,
              status: "pending"
            }
          }
        } as never
      });
      const cartID = relationID(attempt.cart);
      authorizeCartOwnershipRequest(locked);
      if (cartID)
        await req.payload.update({
          collection: "carts",
          id: cartID,
          req: locked,
          overrideAccess: true,
          data: { purchasedAt: now }
        });
      return result(paidOrder, { ...attempt, status: "succeeded" });

      async function reconcile(reason: string): Promise<SettlementResult> {
        await req.payload.update({
          collection: "transactions",
          id: String(attempt.id),
          req: locked,
          overrideAccess: true,
          data: {
            reconciliation_required: true,
            provider_verified_at: now,
            provider_outcome: evidence(record, reason)
          } as never
        });
        if (!order.reconciliation_required)
          await req.payload.update({
            collection: "orders",
            id: purchaseID!,
            req: locked,
            overrideAccess: true,
            data: { reconciliation_required: true } as never
          });
        return result(order, attempt, true);
      }
    });
  };
}
