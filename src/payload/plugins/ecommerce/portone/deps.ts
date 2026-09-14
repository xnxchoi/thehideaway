import type { Payload, PayloadRequest } from "payload";

import type { PortOnePaymentPayload } from "@/lib/lost-commerce/portone";
import type { PortOnePaymentRecord } from "@/lib/lost-commerce/verify-payment";
import type { CommerceProviderEventWriteResult } from "@/lib/lost-commerce/provider-events";
import type {
  claimCommerceProviderEvent,
  completeCommerceProviderEvent
} from "@/lib/lost-commerce/provider-events";
import type { SettlementResult } from "./settle-payment";

export type PortOneBuildPayload = (input: {
  orderRef: string;
  amount: number;
  currency: "KRW" | "USD" | "JPY" | "EUR";
  origin: string;
  paymentChannel?: string;
  paymentMethod?: string;
}) => PortOnePaymentPayload | Record<string, unknown>;

export type PortOneAdapterDeps = {
  buildPayload?: PortOneBuildPayload;
  getPayment?: (paymentId: string) => Promise<PortOnePaymentRecord>;
  isCheckoutEnabled?: () => boolean;
  makePaymentId?: () => string;
  recordEvent?: (input: {
    payload: Payload;
    paymentId?: string;
    event: Record<string, unknown>;
    rawBody?: string;
  }) => Promise<CommerceProviderEventWriteResult>;
  requireLiveChannel?: () => boolean;
  verifyWebhook?: (
    secret: string,
    body: string,
    headers: Record<string, string | undefined>
  ) => Promise<unknown>;
  webhookSecret?: () => string | undefined;
  settlePayment?: (input: {
    req: PayloadRequest;
    paymentId: string;
  }) => Promise<SettlementResult>;
  claimEvent?: typeof claimCommerceProviderEvent;
  completeEvent?: typeof completeCommerceProviderEvent;
};

export function requestHeader(
  req: PayloadRequest,
  name: string
): string | null {
  const headers = req.headers as
    Headers | Record<string, string | string[] | undefined> | undefined;
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const value = (headers as Record<string, string | string[] | undefined>)[
    name
  ];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}
