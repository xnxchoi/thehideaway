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

export type PortOnePaymentPayload =
  | PortOneGlobalPaymentPayload
  | PortOneV2PaymentPayload;

export function getPortOneConfig() {
  return {
    key: process.env.PORTONE_CLIENT_KEY ?? "",
    secret: process.env.PORTONE_SECRET_KEY ?? "",
    apiJwt: process.env.PORTONE_API_JWT ?? "",
    storeId: process.env.PORTONE_STORE_ID,
    channelKey: process.env.PORTONE_CHANNEL_KEY,
    environment:
      process.env.PORTONE_ENVIRONMENT === "production" ||
      process.env.PORTONE_ENVIRONMENT === "live"
        ? "live"
        : "sandbox",
    defaultChannel: process.env.PORTONE_DEFAULT_CHANNEL,
    defaultMethod: process.env.PORTONE_DEFAULT_METHOD
  } as const;
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
  if (!cfg.key || !cfg.apiJwt) {
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

  if (cfg.storeId) {
    const channelKey =
      input.paymentChannel ?? cfg.channelKey ?? cfg.defaultChannel;
    if (!channelKey) throw new Error("portone-not-configured");

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

  if (!cfg.key || !cfg.secret) {
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
