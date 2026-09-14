import { createHash, createHmac } from "node:crypto";
import type { PayloadRequest } from "payload";

import { paymentWebhookLock } from "@/lib/db/sequences";
import { hashCommerceCommandInput } from "@/lib/lost-commerce/commerce-commands";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import {
  authorizePluginOrderWrite,
  authorizePluginGuestAccessInitialization
} from "./order-lifecycle";
import { authorizePluginTransactionWrite } from "./transaction-lifecycle";

const authorizedCheckouts = new WeakMap<object, { cartID: string }>();

/** Server-only receipt: JSON/request bodies cannot grant this authority. */
export function markAuthorizedCheckout(
  req: PayloadRequest,
  proof: { cartID: string }
): void {
  authorizedCheckouts.set(req, { ...proof });
}

export function relationID(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value)
    return relationID(value.id);
  return undefined;
}

export function purchaseAccessDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function guestToken(req: PayloadRequest, purchaseID: string): string {
  if (!req.payload.secret) throw new Error("purchase-access-not-configured");
  return createHmac("sha256", req.payload.secret)
    .update(`purchase-access:${purchaseID}`)
    .digest("base64url");
}

/** Callbacks contain database work only; provider calls belong before this boundary. */
export async function withPurchaseLock<T>(
  req: PayloadRequest,
  key: string,
  run: (locked: PayloadRequest) => Promise<T>
): Promise<T> {
  if (req.transactionID)
    throw new Error("checkout-nested-transaction-forbidden");
  const transactionID = await req.payload.db.beginTransaction();
  if (!transactionID) throw new Error("checkout-transaction-failed");
  const locked = {
    ...req,
    context: { ...req.context },
    transactionID
  } as PayloadRequest;
  authorizePluginOrderWrite(locked);
  authorizePluginTransactionWrite(locked);
  try {
    await paymentWebhookLock(req.payload, transactionID, key);
    const result = await run(locked);
    await req.payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    try {
      await req.payload.db.rollbackTransaction(transactionID);
    } catch (rollbackError) {
      req.payload.logger?.error?.(
        { err: rollbackError },
        "checkout rollback failed"
      );
    }
    throw error;
  }
}

export type CheckoutAttemptInput = {
  req: PayloadRequest;
  cartID: string;
  snapshot: Record<string, unknown>;
  customerEmail: string;
  paymentId: string;
  providerExpectation: Record<string, unknown>;
  retryPayment?: boolean;
};

export async function getOrCreateCheckoutAttempt(input: CheckoutAttemptInput) {
  const { req, cartID } = input;
  if (authorizedCheckouts.get(req)?.cartID !== cartID)
    throw new Error("checkout-authorization-required");
  const snapshot: Record<string, unknown> = { ...input.snapshot, cartID };
  const fingerprint = hashCommerceCommandInput(snapshot);
  return withPurchaseLock(req, `checkout-cart:${cartID}`, async (locked) => {
    const found = await req.payload.find({
      collection: "orders",
      where: { checkout_cart: { equals: cartID } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
      req: locked
    });
    let order = found.docs[0] as unknown as Record<string, unknown> | undefined;
    if (
      order &&
      relationID(order.customer) &&
      relationID(order.customer) !== req.user?.id
    )
      throw new Error("checkout-authorization-required");
    if (order && order.checkout_fingerprint !== fingerprint)
      throw new Error("checkout-review-required");
    if (
      order &&
      (order.payment_status !== "pending" ||
        order.lifecycle_status !== "pending_payment" ||
        order.reconciliation_required)
    )
      throw new Error("purchase-not-payable");
    if (!order) {
      order = (await req.payload.create({
        collection: "orders",
        overrideAccess: true,
        req: locked,
        data: {
          checkout_cart: cartID,
          checkout_snapshot: snapshot,
          checkout_fingerprint: fingerprint,
          ...(req.user ? { customer: req.user.id } : {}),
          customerEmail: input.customerEmail,
          order_ref: makeLostOrderRef("lis"),
          order_mode: "standard_purchase",
          amount: snapshot.amount,
          currency: snapshot.currency,
          items: snapshot.items,
          ...(snapshot.shippingAddress
            ? { shippingAddress: snapshot.shippingAddress }
            : {}),
          status: "pending",
          lifecycle_status: "pending_payment",
          payment_status: "pending",
          fulfillment_status: "unfulfilled"
        } as never,
        showHiddenFields: true
      })) as unknown as Record<string, unknown>;
      if (!req.user) {
        const actualID = relationID(order.id);
        if (!actualID) throw new Error("purchase-id-required");
        const digest = purchaseAccessDigest(guestToken(req, actualID));
        authorizePluginGuestAccessInitialization(locked, actualID);
        await req.payload.update({
          collection: "orders",
          id: actualID,
          overrideAccess: true,
          req: locked,
          data: { guest_access_digest: digest } as never
        });
        order = { ...order, guest_access_digest: digest };
      }
    }
    const orderID = relationID(order.id)!;
    // Same cart lock serializes all initiators; the purchase lock also serializes settlement.
    await paymentWebhookLock(
      req.payload,
      locked.transactionID as string,
      `purchase:${orderID}`
    );
    const latestOrder = (await req.payload.findByID({
      collection: "orders",
      id: orderID,
      depth: 0,
      overrideAccess: true,
      req: locked
    })) as unknown as Record<string, unknown>;
    if (
      relationID(latestOrder.customer) &&
      relationID(latestOrder.customer) !== req.user?.id
    )
      throw new Error("checkout-authorization-required");
    if (
      latestOrder.payment_status !== "pending" ||
      latestOrder.lifecycle_status !== "pending_payment" ||
      latestOrder.reconciliation_required
    )
      throw new Error("purchase-not-payable");
    const activeAttempts = await req.payload.find({
      collection: "transactions",
      where: {
        and: [{ order: { equals: orderID } }, { status: { equals: "pending" } }]
      },
      limit: 2,
      depth: 0,
      overrideAccess: true,
      req: locked
    });
    if (activeAttempts.docs.length > 1)
      throw new Error("multiple-active-payment-attempts");
    const attempts = activeAttempts.docs.length
      ? activeAttempts
      : await req.payload.find({
          collection: "transactions",
          where: { order: { equals: orderID } },
          sort: "-createdAt",
          limit: 1,
          depth: 0,
          overrideAccess: true,
          req: locked
        });
    let attempt = attempts.docs[0] as unknown as
      Record<string, unknown> | undefined;
    if (attempt) {
      if (attempt.checkout_fingerprint !== fingerprint)
        throw new Error("checkout-review-required");
      if (attempt.reconciliation_required)
        throw new Error("purchase-not-payable");
      if (attempt.status !== "pending") {
        if (
          !input.retryPayment ||
          !["failed", "cancelled"].includes(String(attempt.status)) ||
          !attempt.provider_verified_at
        )
          throw new Error("payment-retry-review-required");
        attempt = undefined;
      }
    }
    if (!attempt) {
      attempt = (await req.payload.create({
        collection: "transactions",
        overrideAccess: true,
        req: locked,
        data: {
          order: orderID,
          cart: cartID,
          amount: snapshot.amount,
          currency: snapshot.currency,
          items: snapshot.items,
          ...(snapshot.billingAddress
            ? { billingAddress: snapshot.billingAddress }
            : {}),
          ...(relationID(order.customer)
            ? { customer: relationID(order.customer) }
            : {}),
          customerEmail: order.customerEmail,
          paymentMethod: "portone",
          status: "pending",
          portone: { paymentId: input.paymentId },
          checkout_snapshot: snapshot,
          checkout_fingerprint: fingerprint,
          checkout_attempt_key: input.paymentId,
          ...(order.guest_access_digest
            ? { guest_access_digest: order.guest_access_digest }
            : {}),
          provider_expectation: input.providerExpectation
        } as never
      })) as unknown as Record<string, unknown>;
      await req.payload.update({
        collection: "orders",
        id: orderID,
        overrideAccess: true,
        req: locked,
        data: {
          transactions: [
            ...(Array.isArray(latestOrder.transactions)
              ? latestOrder.transactions.map(relationID).filter(Boolean)
              : []),
            attempt.id
          ]
        } as never
      });
    }
    const purchaseAccessToken = order.guest_access_digest
      ? guestToken(req, orderID)
      : undefined;
    if (
      purchaseAccessToken &&
      purchaseAccessDigest(purchaseAccessToken) !== order.guest_access_digest
    )
      throw new Error("purchase-access-secret-changed");
    return {
      order,
      attempt,
      ...(purchaseAccessToken ? { purchaseAccessToken } : {})
    };
  });
}
