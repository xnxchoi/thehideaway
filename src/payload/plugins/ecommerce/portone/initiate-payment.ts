import type { PayloadRequest } from "payload";
import {
  buildPortOnePaymentPayload,
  isPortOneCheckoutEnabled
} from "@/lib/lost-commerce/portone";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { requiresLiveChannel } from "@/lib/lost-commerce/verify-payment";
import { getServerSideURL } from "@/utilities/getURL";
import { getOrCreateCheckoutAttempt, relationID } from "../checkout-attempt";
import type { PortOneAdapterDeps } from "./deps";
import { requestHeader } from "./deps";

export function createPortOneInitiatePayment(deps: PortOneAdapterDeps = {}) {
  const buildPayload = deps.buildPayload ?? buildPortOnePaymentPayload;
  const enabled = deps.isCheckoutEnabled ?? isPortOneCheckoutEnabled;
  const makePaymentId =
    deps.makePaymentId ?? (() => makeLostOrderRef("lis_payment"));
  return async ({
    data,
    req
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
      checkoutSnapshot?: Record<string, unknown>;
      retryPayment?: boolean;
    };
    req: PayloadRequest;
    transactionsSlug: string;
  }) => {
    if (!enabled()) throw new Error("portone-not-configured");
    const snapshot = data.checkoutSnapshot;
    const cartID = relationID(data.cart?.id);
    if (
      !cartID ||
      !snapshot ||
      !Number.isSafeInteger(snapshot.amount) ||
      Number(snapshot.amount) <= 0 ||
      snapshot.currency !== data.currency ||
      !Array.isArray(snapshot.items) ||
      !snapshot.items.length
    )
      throw new Error("checkout-snapshot-required");
    const currency = data.currency as "KRW" | "USD" | "JPY" | "EUR";
    if (!["KRW", "USD", "JPY", "EUR"].includes(currency))
      throw new Error("unsupported-currency");
    // The HTTP handler validates the origin before invoking this adapter.
    const origin = requestHeader(req, "origin") ?? getServerSideURL();
    const paymentId = makePaymentId();
    const firstPayload = buildPayload({
      orderRef: paymentId,
      amount: Number(snapshot.amount),
      currency,
      origin
    });
    if (
      !("storeId" in firstPayload) ||
      !("channelKey" in firstPayload) ||
      typeof firstPayload.storeId !== "string" ||
      typeof firstPayload.channelKey !== "string"
    )
      throw new Error("portone-v2-required");
    const outcome = await getOrCreateCheckoutAttempt({
      req,
      cartID,
      snapshot,
      customerEmail: data.customerEmail,
      paymentId,
      retryPayment: data.retryPayment,
      providerExpectation: {
        paymentId,
        storeId: firstPayload.storeId,
        channelKey: firstPayload.channelKey,
        channelType: (deps.requireLiveChannel ?? requiresLiveChannel)()
          ? "LIVE"
          : "TEST"
      }
    });
    const existingPaymentId = String(
      (outcome.attempt.portone as Record<string, unknown>).paymentId
    );
    const binding = outcome.attempt.provider_expectation as Record<
      string,
      unknown
    >;
    if (
      binding.storeId !== firstPayload.storeId ||
      binding.channelKey !== firstPayload.channelKey ||
      binding.channelType !==
        ((deps.requireLiveChannel ?? requiresLiveChannel)() ? "LIVE" : "TEST")
    )
      throw new Error("payment-configuration-changed");
    const clientPayload = {
      ...buildPayload({
        orderRef: existingPaymentId,
        amount: Number(snapshot.amount),
        currency,
        origin
      }),
      noticeUrls: [`${getServerSideURL()}/api/payments/portone/webhooks`]
    };
    return {
      message: "Payment initiated successfully",
      cartID,
      paymentId: existingPaymentId,
      transactionID: outcome.attempt.id,
      orderID: outcome.order.id,
      customerID: relationID(outcome.order.customer) ?? null,
      order_ref: outcome.order.order_ref,
      clientPayload,
      ...(outcome.purchaseAccessToken
        ? { purchaseAccessToken: outcome.purchaseAccessToken }
        : {})
    };
  };
}
