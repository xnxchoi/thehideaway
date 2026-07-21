import crypto from "crypto";
import type { LostCurrency } from "./types";

export type PortOnePaymentProduct = {
  id: string;
  name: string;
  amount: number;
  quantity: number;
  link?: string;
};

export type PortOneGlobalPaymentPayload = {
  key: string;
  merchant_order_id: string;
  amount: number;
  currency: LostCurrency;
  success_url: string;
  failure_url: string;
  pmt_channel?: string;
  pmt_method?: string;
  signature_hash: string;
  environment: "sandbox" | "live";
};

export type PortOneV2PaymentPayload = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: `CURRENCY_${LostCurrency}`;
  payMethod: string;
  redirectUrl: string;
  forceRedirect: true;
  noticeUrls: string[];
  products: PortOnePaymentProduct[];
  productType: "PRODUCT_TYPE_REAL";
  customData: {
    orderRef: string;
    service: "lostinseoul";
  };
};

/**
 * PortOne V2 payload for the plans (digital membership) card flow. Distinct
 * from the lostinseoul shape: DIGITAL product type, `service: "plans"` so the
 * shared webhook branches correctly, and a redirect back to the plans
 * checkout return route.
 */
export type PortOnePlanPaymentPayload = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: `CURRENCY_${LostCurrency}`;
  payMethod: "CARD";
  redirectUrl: string;
  noticeUrls: string[];
  productType: "PRODUCT_TYPE_DIGITAL";
  customData: {
    paymentRef: string;
    subscriptionId: string;
    service: "plans";
  };
};

export type PortOnePaymentPayload =
  PortOneGlobalPaymentPayload | PortOneV2PaymentPayload;

export function getPortOneConfig() {
  return {
    key: process.env.PORTONE_CLIENT_KEY ?? "",
    secret: process.env.PORTONE_SECRET_KEY ?? "",
    apiSecret: process.env.PORTONE_API_SECRET ?? "",
    apiJwt: process.env.PORTONE_API_JWT ?? "",
    storeId: process.env.PORTONE_STORE_ID,
    channelKey: process.env.PORTONE_CHANNEL_KEY,
    environment:
      process.env.PORTONE_ENVIRONMENT === "production" ||
      process.env.PORTONE_ENVIRONMENT === "live"
        ? "live"
        : "sandbox",
    defaultChannel: process.env.PORTONE_DEFAULT_CHANNEL,
    defaultMethod: process.env.PORTONE_DEFAULT_METHOD,
    // Master gate: card checkout stays dark unless this is explicitly "true",
    // independent of whether PortOne keys happen to be present. Lets the owner
    // set sandbox keys for validation without exposing card to real users.
    cardCheckoutLive: process.env.PORTONE_CARD_CHECKOUT_LIVE === "true"
  } as const;
}

function hasPortOneValue(value: string | undefined): value is string {
  const trimmed = value?.trim();
  return (
    typeof trimmed === "string" &&
    trimmed.length > 0 &&
    !trimmed.startsWith("CHANGE_ME")
  );
}

export function isPortOneCheckoutEnabled(
  cfg: ReturnType<typeof getPortOneConfig> = getPortOneConfig()
): boolean {
  const hasV2Config =
    hasPortOneValue(cfg.storeId) &&
    (hasPortOneValue(cfg.channelKey) || hasPortOneValue(cfg.defaultChannel)) &&
    (hasPortOneValue(cfg.apiSecret) || hasPortOneValue(cfg.secret));
  const hasGlobalConfig =
    hasPortOneValue(cfg.key) && hasPortOneValue(cfg.secret);
  // Config presence is necessary but not sufficient: the master gate
  // (PORTONE_CARD_CHECKOUT_LIVE) must be explicitly on. This keeps card dark
  // by default so setting sandbox keys alone never exposes it to users.
  return (hasV2Config || hasGlobalConfig) && cfg.cardCheckoutLive;
}

export function getPortOneSdkVersion(
  cfg: ReturnType<typeof getPortOneConfig> = getPortOneConfig()
): "v2" | "global" {
  const hasV2Config =
    hasPortOneValue(cfg.storeId) &&
    (hasPortOneValue(cfg.channelKey) || hasPortOneValue(cfg.defaultChannel));
  return hasV2Config ? "v2" : "global";
}

export async function createPortOneRefund(input: {
  orderRef: string;
  amount: number;
  channel: string;
  reason: string;
  description: string;
  refundType?: "full" | "partial";
}): Promise<unknown> {
  const cfg = getPortOneConfig();
  if (!hasPortOneValue(cfg.key) || !hasPortOneValue(cfg.apiJwt)) {
    throw new Error("portone-refund-not-configured");
  }

  const response = await fetch(
    `https://api.portone.cloud/api/refund/${encodeURIComponent(input.orderRef)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Portone-Client-Key": cfg.key,
        Authorization: `Bearer ${cfg.apiJwt}`
      },
      body: JSON.stringify({
        amount: input.amount,
        channel: input.channel,
        description: input.description,
        environment: cfg.environment,
        refund_type: input.refundType ?? "full",
        refund_reason: input.reason
      })
    }
  );

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `portone-refund-failed:${response.status}:${JSON.stringify(body)}`
    );
  }
  return body;
}

export function generatePortOneSignature(input: {
  clientKey: string;
  secret: string;
  amount: number;
  currency: LostCurrency;
  merchantOrderId: string;
  successUrl: string;
  failureUrl: string;
}): string {
  const params = new URLSearchParams();
  params.append("amount", String(input.amount));
  params.append("currency", input.currency);
  params.append("failure_url", input.failureUrl);
  params.append("merchant_order_id", input.merchantOrderId);
  params.append("client_key", input.clientKey);
  params.append("success_url", input.successUrl);
  params.sort();

  return crypto
    .createHmac("sha256", input.secret)
    .update(params.toString())
    .digest("base64");
}

export function buildPortOnePaymentPayload(input: {
  orderRef: string;
  amount: number;
  currency: LostCurrency;
  origin: string;
  orderName?: string;
  paymentChannel?: string;
  paymentMethod?: string;
  products?: PortOnePaymentProduct[];
}): PortOnePaymentPayload {
  const cfg = getPortOneConfig();

  const host = new URL(input.origin).hostname;
  const paymentBase =
    host === "lostinseoul.com" || host === "www.lostinseoul.com"
      ? "/payment"
      : "/lostinseoul/payment";
  const successUrl = `${input.origin}${paymentBase}/success?order=${encodeURIComponent(input.orderRef)}`;
  const failureUrl = `${input.origin}${paymentBase}/failure?order=${encodeURIComponent(input.orderRef)}`;
  const returnUrl = `${input.origin}${paymentBase}/return?order=${encodeURIComponent(input.orderRef)}`;

  if (hasPortOneValue(cfg.storeId)) {
    const channelKey =
      input.paymentChannel ?? cfg.channelKey ?? cfg.defaultChannel;
    if (!hasPortOneValue(channelKey)) throw new Error("portone-not-configured");

    return {
      storeId: cfg.storeId,
      channelKey,
      paymentId: input.orderRef,
      orderName: input.orderName ?? `LOSTINSEOUL ${input.orderRef}`,
      totalAmount: input.amount,
      currency: `CURRENCY_${input.currency}`,
      payMethod: input.paymentMethod ?? cfg.defaultMethod ?? "CARD",
      redirectUrl: returnUrl,
      forceRedirect: true,
      noticeUrls: [`${input.origin}/api/lost/webhooks/portone`],
      products:
        input.products && input.products.length > 0
          ? input.products
          : [
              {
                id: input.orderRef,
                name: input.orderName ?? `LOSTINSEOUL ${input.orderRef}`,
                amount: input.amount,
                quantity: 1
              }
            ],
      productType: "PRODUCT_TYPE_REAL",
      customData: {
        orderRef: input.orderRef,
        service: "lostinseoul"
      }
    };
  }

  if (!hasPortOneValue(cfg.key) || !hasPortOneValue(cfg.secret)) {
    throw new Error("portone-not-configured");
  }

  return {
    key: cfg.key,
    merchant_order_id: input.orderRef,
    amount: input.amount,
    currency: input.currency,
    success_url: successUrl,
    failure_url: failureUrl,
    pmt_channel: input.paymentChannel ?? cfg.defaultChannel,
    pmt_method: input.paymentMethod ?? cfg.defaultMethod,
    environment: cfg.environment,
    signature_hash: generatePortOneSignature({
      clientKey: cfg.key,
      secret: cfg.secret,
      amount: input.amount,
      currency: input.currency,
      merchantOrderId: input.orderRef,
      successUrl,
      failureUrl
    })
  };
}

/**
 * Build the browser-SDK payload for a one-time plan (membership) card
 * payment. Requires PortOne V2 config (store + channel). The plans flow is
 * card-only and digital, and redirects back to `/checkout/return` where the
 * server verifies the payment before marking the subscription paid.
 */
export function buildPlanPortOnePayload(input: {
  paymentRef: string;
  subscriptionId: string;
  amount: number;
  currency: LostCurrency;
  origin: string;
  orderName: string;
}): PortOnePlanPaymentPayload {
  const cfg = getPortOneConfig();
  if (!hasPortOneValue(cfg.storeId)) throw new Error("portone-not-configured");
  const channelKey = cfg.channelKey ?? cfg.defaultChannel;
  if (!hasPortOneValue(channelKey)) throw new Error("portone-not-configured");

  const returnUrl = `${input.origin}/checkout/return?payment=${encodeURIComponent(
    input.paymentRef
  )}`;

  return {
    storeId: cfg.storeId,
    channelKey,
    paymentId: input.paymentRef,
    orderName: input.orderName,
    totalAmount: input.amount,
    currency: `CURRENCY_${input.currency}`,
    payMethod: "CARD",
    redirectUrl: returnUrl,
    noticeUrls: [`${input.origin}/api/lost/webhooks/portone`],
    productType: "PRODUCT_TYPE_DIGITAL",
    customData: {
      paymentRef: input.paymentRef,
      subscriptionId: input.subscriptionId,
      service: "plans"
    }
  };
}
