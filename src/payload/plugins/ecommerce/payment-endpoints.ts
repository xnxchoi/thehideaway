import type { PaymentAdapter } from "@payloadcms/plugin-ecommerce/types";
import { addDataAndFileToRequest, headersWithCors } from "payload";
import type { Config, Endpoint, PayloadRequest, Where } from "payload";
import type { NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { enforceRateLimit } from "@/lib/api/rateLimit";

import { markAuthorizedCheckout } from "./checkout-attempt";
import {
  buildCheckoutSnapshot,
  CheckoutSnapshotError,
  checkoutRelationID,
  type CheckoutCart
} from "./checkout-snapshot";
import { markAuthorizedBrowserPayment } from "./portone/confirm-order";
import { hasPurchaseAccess } from "./purchase-access";

type Data = Record<string, unknown>;
class CheckoutHTTPError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}

function response(req: PayloadRequest, data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: headersWithCors({
      req,
      headers: new Headers({ "Cache-Control": "no-store" })
    })
  });
}

async function body(req: PayloadRequest): Promise<Data> {
  try {
    await addDataAndFileToRequest(req);
  } catch {
    throw new CheckoutHTTPError(400, "invalid-checkout-request");
  }
  if (!req.data || typeof req.data !== "object" || Array.isArray(req.data))
    throw new CheckoutHTTPError(400, "invalid-checkout-request");
  return req.data;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 && value.length <= 500
    ? value
    : undefined;
}

async function authorizedCart(req: PayloadRequest, data: Data) {
  const userCart = (
    req.user as unknown as { cart?: { docs?: unknown[] } } | null
  )?.cart;
  const cartID = text(data.cartID) ?? checkoutRelationID(userCart?.docs?.[0]);
  if (!cartID) throw new CheckoutHTTPError(400, "cart-id-required");
  const secret = text(data.secret);
  const credentials: Where[] = [
    ...(req.user ? [{ customer: { equals: req.user.id } }] : []),
    ...(secret
      ? [
          {
            and: [
              { customer: { exists: false } },
              { secret: { equals: secret } }
            ]
          }
        ]
      : [])
  ];
  if (!credentials.length)
    throw new CheckoutHTTPError(403, "checkout-access-denied");
  // Same bounded secret query used by the pinned plugin's merge operation;
  // staff collection access never grants checkout ownership.
  const result = await req.payload.find({
    collection: "carts",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { and: [{ id: { equals: cartID } }, { or: credentials }] }
  });
  const cart = result.docs[0] as unknown as CheckoutCart | undefined;
  if (
    !cart ||
    (checkoutRelationID(cart.customer) &&
      checkoutRelationID(cart.customer) !== req.user?.id)
  )
    throw new CheckoutHTTPError(403, "checkout-access-denied");
  if (cart.purchasedAt)
    throw new CheckoutHTTPError(409, "cart-already-purchased");
  return cart;
}

async function initiate(
  req: PayloadRequest,
  data: Data,
  adapter: PaymentAdapter
) {
  const cart = await authorizedCart(req, data);
  const customerEmail = text(req.user?.email) ?? text(data.customerEmail);
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
    throw new CheckoutHTTPError(400, "customer-email-required");
  let checkout;
  try {
    checkout = await buildCheckoutSnapshot({
      req,
      cart,
      currency: String(cart.currency ?? "KRW"),
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      deliveryNote: data.deliveryNote
    });
  } catch (error) {
    if (error instanceof CheckoutSnapshotError)
      throw new CheckoutHTTPError(400, "checkout-review-required");
    throw error;
  }
  if (
    data.expectedAmount !== checkout.snapshot.amount ||
    data.expectedCurrency !== checkout.snapshot.currency
  )
    throw new CheckoutHTTPError(409, "checkout-review-required");
  markAuthorizedCheckout(req, { cartID: cart.id });
  return adapter.initiatePayment({
    req,
    transactionsSlug: "transactions",
    customersSlug: "users",
    data: {
      cart: checkout.cart,
      currency: checkout.snapshot.currency,
      customerEmail,
      billingAddress: checkout.snapshot.billingAddress,
      shippingAddress: checkout.snapshot.shippingAddress,
      checkoutSnapshot: checkout.snapshot,
      retryPayment: data.retryPayment === true
    } as never
  });
}

async function confirm(
  req: PayloadRequest,
  data: Data,
  adapter: PaymentAdapter
) {
  const paymentId = text(data.paymentId);
  if (!paymentId) throw new CheckoutHTTPError(400, "payment-id-required");
  const result = await req.payload.find({
    collection: "transactions",
    req,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: { "portone.paymentId": { equals: paymentId } }
  });
  const transaction = result.docs[0] as unknown as Data | undefined;
  if (!transaction) throw new CheckoutHTTPError(403, "checkout-access-denied");
  const snapshot = transaction.checkout_snapshot as Data | undefined;
  const cartID = checkoutRelationID(transaction.cart) ?? text(snapshot?.cartID);
  const customerID = checkoutRelationID(transaction.customer);
  const authorized = customerID
    ? customerID === req.user?.id
    : hasPurchaseAccess(
        data.purchaseAccessToken,
        transaction.guest_access_digest
      );
  if (!authorized || !cartID || (data.cartID != null && data.cartID !== cartID))
    throw new CheckoutHTTPError(403, "checkout-access-denied");
  markAuthorizedBrowserPayment(req, {
    transactionID: String(transaction.id),
    cartID
  });
  return adapter.confirmOrder({
    req,
    cartsSlug: "carts",
    ordersSlug: "orders",
    customersSlug: "users",
    transactionsSlug: "transactions",
    data: { paymentId, customerEmail: text(transaction.customerEmail) }
  });
}

function guarded(
  adapter: PaymentAdapter,
  operation: typeof initiate
): Endpoint["handler"] {
  return async (req) => {
    try {
      const browserRequest = req as unknown as NextRequest;
      if (!isSameOrigin(browserRequest))
        throw new CheckoutHTTPError(403, "checkout-access-denied");
      const limit = await enforceRateLimit(
        browserRequest,
        "mutation",
        req.user?.id
      );
      if (!limit.ok) {
        const limited = response(
          req,
          { message: "checkout-rate-limited", code: "checkout-rate-limited" },
          429
        );
        limited.headers.set("Retry-After", String(limit.resetSeconds));
        return limited;
      }
      return response(req, await operation(req, await body(req), adapter));
    } catch (error) {
      if (error instanceof CheckoutHTTPError)
        return response(
          req,
          { message: error.code, code: error.code },
          error.status
        );
      if (
        error instanceof Error &&
        [
          "checkout-review-required",
          "payment-retry-review-required",
          "purchase-not-payable"
        ].includes(error.message)
      ) {
        return response(
          req,
          {
            message: "checkout-review-required",
            code: "checkout-review-required"
          },
          409
        );
      }
      // Provider/database exceptions can contain credentials and personal data.
      req.payload.logger.error({ event: "commerce-checkout-failed" });
      return response(
        req,
        { message: "checkout-failed", code: "checkout-failed" },
        500
      );
    }
  };
}

/** Replace defaults after plugin registration; duplicate routes are never overrides. */
export function replacePortOnePaymentEndpoints(
  config: Config,
  adapter: PaymentAdapter
): Config {
  const replacements = new Map([
    ["/payments/portone/initiate", guarded(adapter, initiate)],
    ["/payments/portone/confirm-order", guarded(adapter, confirm)]
  ]);
  const endpoints = config.endpoints || [];
  for (const path of replacements.keys()) {
    if (
      endpoints.filter(
        (endpoint) => endpoint.method === "post" && endpoint.path === path
      ).length !== 1
    )
      throw new Error(`Expected exactly one PortOne POST endpoint: ${path}`);
  }
  return {
    ...config,
    endpoints: endpoints.map((endpoint) => {
      const handler =
        endpoint.method === "post"
          ? replacements.get(endpoint.path)
          : undefined;
      return handler ? { ...endpoint, handler } : endpoint;
    })
  };
}
