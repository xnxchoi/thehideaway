import type { PayloadRequest } from "payload";

import { paymentWebhookLock } from "@/lib/db/sequences";
import {
  getPortOnePayment,
  requiresLiveChannel,
  verifyPortOnePayment
} from "@/lib/lost-commerce/verify-payment";

import { CART_LINE_SCHEMA_VERSION } from "../lost-line-fields";
import { authorizePluginOrderWrite } from "../order-lifecycle";
import { commitPluginOrderReservations } from "../order-reservations";
import type { PortOneAdapterDeps } from "./deps";

function relationId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

function lineMode(items: unknown): "standard_purchase" | "request_to_order" | "private_order" {
  const first = Array.isArray(items) ? items[0] : undefined;
  const mode =
    first && typeof first === "object"
      ? (first as { mode?: unknown }).mode
      : undefined;
  if (
    mode === "request_to_order" ||
    mode === "private_order" ||
    mode === "standard_purchase"
  ) {
    return mode;
  }
  return "standard_purchase";
}

function lineCampaign(items: unknown): string | undefined {
  const first = Array.isArray(items) ? items[0] : undefined;
  const campaign =
    first && typeof first === "object"
      ? (first as { campaign?: unknown }).campaign
      : undefined;
  return typeof campaign === "string" && campaign.length > 0
    ? campaign
    : undefined;
}

export function createPortOneConfirmOrder(deps: PortOneAdapterDeps = {}) {
  const getPayment = deps.getPayment ?? getPortOnePayment;
  const liveChannel = deps.requireLiveChannel ?? requiresLiveChannel;
  const commitReservations =
    deps.commitReservations ?? commitPluginOrderReservations;

  return async ({
    cartsSlug = "carts",
    data,
    ordersSlug = "orders",
    req,
    transactionsSlug = "transactions"
  }: {
    cartsSlug?: string;
    data: { [key: string]: unknown; customerEmail?: string; paymentId?: unknown };
    ordersSlug?: string;
    req: PayloadRequest;
    transactionsSlug?: string;
  }) => {
    const paymentId =
      typeof data.paymentId === "string" ? data.paymentId.trim() : "";
    if (!paymentId) throw new Error("payment-id-required");

    const confirmOnce = async (lockedReq: PayloadRequest) => {
    const found = await lockedReq.payload.find({
      collection: transactionsSlug as "transactions",
      req: lockedReq,
      depth: 0,
      limit: 1,
      where: { "portone.paymentId": { equals: paymentId } }
    });
    const transaction = found.docs[0] as
      | {
          id: string;
          status?: string;
          amount?: number;
          currency?: string;
          cart?: unknown;
          order?: unknown;
          items?: unknown;
          customer?: unknown;
          customerEmail?: unknown;
          portone?: Record<string, unknown>;
        }
      | undefined;
    if (!transaction) throw new Error("transaction-not-found");

    const existingOrderId = relationId(transaction.order);
    if (existingOrderId) {
      if (transaction.status !== "succeeded") {
        await lockedReq.payload.update({
          id: transaction.id,
          collection: transactionsSlug as "transactions",
          data: { status: "succeeded", order: existingOrderId },
          req: lockedReq
        });
      }
      return {
        message: "Order confirmed successfully",
        orderID: existingOrderId,
        order_ref: paymentId,
        transactionID: transaction.id
      };
    }

    const record = await getPayment(paymentId);
    const expectedAmount = transaction.amount;
    const expectedCurrency = transaction.currency;
    if (
      typeof expectedAmount !== "number" ||
      typeof expectedCurrency !== "string"
    ) {
      throw new Error("malformed");
    }
    const verified = verifyPortOnePayment(record, {
      amount: expectedAmount,
      currency: expectedCurrency,
      requireLiveChannel: liveChannel()
    });
    if (!verified.ok) throw new Error(verified.reason);

    const cartID = relationId(transaction.cart);
    const customerId = relationId(transaction.customer);
    if (req.user?.id && customerId && req.user.id !== customerId) {
      throw new Error("transaction-owner-mismatch");
    }
    const customerEmail =
      typeof transaction.customerEmail === "string"
        ? transaction.customerEmail
        : undefined;
    authorizePluginOrderWrite(lockedReq);
    const paidAt = new Date().toISOString();
    const order = await lockedReq.payload.create({
      collection: ordersSlug as "orders",
      data: {
        amount: expectedAmount,
        currency: expectedCurrency as "KRW" | "USD" | "JPY" | "EUR",
        ...(customerId ? { customer: customerId } : {}),
        ...(customerEmail ? { customerEmail } : {}),
        items: transaction.items as never,
        status: "processing",
        order_ref: paymentId,
        order_mode: lineMode(transaction.items),
        lifecycle_status: "paid",
        payment_status: "paid",
        fulfillment_status: "reserved",
        line_snapshot_version: CART_LINE_SCHEMA_VERSION,
        paid_at: paidAt,
        ...(lineCampaign(transaction.items)
          ? { campaign: lineCampaign(transaction.items) }
          : {}),
        transactions: [transaction.id]
      },
      req: lockedReq
    });
    const reservationResult = await commitReservations({
      payload: lockedReq.payload,
      req: lockedReq,
      orderId: String(order.id),
      paymentId,
      idempotencyKey: `${paymentId}-commit`.padEnd(16, "x"),
      effectiveAt: paidAt
    });
    if (reservationResult.kind === "paid_inventory_review") {
      await lockedReq.payload.update({
        id: order.id,
        collection: ordersSlug as "orders",
        data: { lifecycle_status: "paid_inventory_review" },
        req: lockedReq
      });
    }

    if (cartID) {
      await lockedReq.payload.update({
        id: cartID,
        collection: cartsSlug as "carts",
        data: { purchasedAt: new Date().toISOString() },
        req: lockedReq
      });
    }

    await lockedReq.payload.update({
      id: transaction.id,
      collection: transactionsSlug as "transactions",
      data: {
        order: order.id,
        status: "succeeded",
        portone: {
          ...(transaction.portone ?? {}),
          paymentId,
          transactionId: verified.transactionRef
        }
      },
      req: lockedReq
    });

    return {
      message: "Order confirmed successfully",
      orderID: order.id,
      order_ref: paymentId,
      transactionID: transaction.id
    };
    };

    const begin = req.payload.db?.beginTransaction?.bind(req.payload.db);
    if (!begin) return confirmOnce(req);

    const transactionID = await begin();
    if (!transactionID) throw new Error("confirm-transaction-failed");
    const lockedReq = { ...req, transactionID } as PayloadRequest;
    try {
      await paymentWebhookLock(req.payload, transactionID, paymentId);
      const result = await confirmOnce(lockedReq);
      await req.payload.db.commitTransaction(transactionID);
      return result;
    } catch (error) {
      await req.payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
  };
}
