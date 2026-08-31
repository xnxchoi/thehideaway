import type { PayloadRequest } from "payload";

import {
  buildPortOnePaymentPayload,
  isPortOneCheckoutEnabled
} from "@/lib/lost-commerce/portone";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { getServerSideURL } from "@/utilities/getURL";

import { serverCartAmount } from "./amount";
import type { PortOneAdapterDeps } from "./deps";
import { requestHeader } from "./deps";
import { flattenCartItems } from "./flatten-items";

function requestOrigin(req: PayloadRequest): string {
  const origin = requestHeader(req, "origin");
  if (origin && /^https?:\/\//i.test(origin)) return origin;
  return getServerSideURL();
}

export function createPortOneInitiatePayment(deps: PortOneAdapterDeps = {}) {
  const buildPayload = deps.buildPayload ?? buildPortOnePaymentPayload;
  const isCheckoutEnabled = deps.isCheckoutEnabled ?? isPortOneCheckoutEnabled;
  const makePaymentId = deps.makePaymentId ?? (() => makeLostOrderRef("lis"));

  return async ({
    data,
    req,
    transactionsSlug
  }: {
    data: {
      billingAddress?: unknown;
      cart: {
        id: unknown;
        currency?: unknown;
        items?: Record<string, unknown>[];
        subtotal?: unknown;
      };
      currency: string;
      customerEmail: string;
      shippingAddress?: unknown;
    };
    req: PayloadRequest;
    transactionsSlug: string;
  }) => {
    if (!isCheckoutEnabled()) throw new Error("portone-not-configured");

    const cart = data.cart;
    if (!cart?.items || cart.items.length === 0) {
      throw new Error("invalid-cart-amount");
    }
    const amount = serverCartAmount(cart);
    const currency = String(data.currency || cart.currency || "KRW").toUpperCase();
    if (!["KRW", "USD", "JPY", "EUR"].includes(currency)) {
      throw new Error("unsupported-currency");
    }
    const paymentId = makePaymentId();
    const origin = requestOrigin(req);
    const items = flattenCartItems(cart.items);

    const transaction = await req.payload.create({
      collection: transactionsSlug as "transactions",
      data: {
        ...(req.user
          ? { customer: req.user.id }
          : { customerEmail: data.customerEmail }),
        amount,
        billingAddress: data.billingAddress as never,
        cart: cart.id as string,
        currency: currency as "KRW" | "USD" | "JPY" | "EUR",
        items: items as never,
        paymentMethod: "portone",
        status: "pending",
        portone: {
          paymentId
        }
      },
      req
    });

    const clientPayload = {
      ...buildPayload({
        orderRef: paymentId,
        amount,
        currency: currency as "KRW" | "USD" | "JPY" | "EUR",
        origin
      }),
      noticeUrls: [
        `${getServerSideURL()}/api/payments/portone/webhooks`
      ]
    };

    return {
      message: "Payment initiated successfully",
      paymentId,
      transactionID: transaction.id,
      clientPayload
    };
  };
}
