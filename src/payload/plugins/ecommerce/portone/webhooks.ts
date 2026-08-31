import { Webhook } from "@portone/server-sdk";
import type { Endpoint, PayloadRequest } from "payload";

import { recordCommerceProviderEventStandalone } from "@/lib/lost-commerce/provider-events";
import { getPortOneConfig } from "@/lib/lost-commerce/portone";

import type { PortOneAdapterDeps } from "./deps";
import { requestHeader } from "./deps";
import { createPortOneConfirmOrder } from "./confirm-order";

function isConfiguredSecret(value: string | undefined): value is string {
  const secret = value?.trim();
  return Boolean(
    secret &&
      secret.length >= 32 &&
      !/change[_-]?me|placeholder|example/i.test(secret)
  );
}

function paymentIdOf(event: Record<string, unknown>): string | null {
  const data =
    event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : {};
  const paymentId =
    data.paymentId ??
    event.paymentId ??
    event.payment_ref ??
    event.merchant_order_id;
  return typeof paymentId === "string" && paymentId.length > 0
    ? paymentId
    : null;
}

async function readRawBody(req: PayloadRequest): Promise<string> {
  const maybeText = (req as PayloadRequest & { text?: () => Promise<string> })
    .text;
  if (typeof maybeText === "function") return maybeText.call(req);
  return JSON.stringify(req.data ?? {});
}

export function createPortOneWebhookEndpoint(
  deps: PortOneAdapterDeps = {}
): Endpoint {
  const confirmOrder = deps.confirmOrder ?? createPortOneConfirmOrder(deps);
  const verifyWebhook =
    deps.verifyWebhook ??
    ((secret, body, headers) => Webhook.verify(secret, body, headers));
  const webhookSecret =
    deps.webhookSecret ?? (() => getPortOneConfig().webhookSecret);
  const recordEvent =
    deps.recordEvent ??
    (async (input) => {
      const collections = input.payload.collections;
      if (collections && !("commerce-provider-events" in collections)) {
        return {
          recorded: false,
          duplicate: false,
          conflict: false,
          eventId: null
        };
      }
      return recordCommerceProviderEventStandalone(input);
    });

  return {
    method: "post",
    path: "/webhooks",
    handler: async (req) => {
      const secret = webhookSecret();
      if (!isConfiguredSecret(secret)) {
        return Response.json(
          { message: "webhook-secret-not-configured" },
          { status: 500 }
        );
      }

      const rawBody = await readRawBody(req);
      const webhookId = requestHeader(req, "webhook-id");
      const webhookSignature = requestHeader(req, "webhook-signature");
      const webhookTimestamp = requestHeader(req, "webhook-timestamp");
      const hasSignatureHeaders = Boolean(
        webhookId || webhookSignature || webhookTimestamp
      );
      if (!hasSignatureHeaders) {
        return Response.json({ message: "signature-required" }, { status: 401 });
      }

      try {
        await verifyWebhook(secret, rawBody, {
          "webhook-id": webhookId ?? undefined,
          "webhook-signature": webhookSignature ?? undefined,
          "webhook-timestamp": webhookTimestamp ?? undefined
        });
      } catch {
        return Response.json(
          { message: "invalid-webhook-signature" },
          { status: 400 }
        );
      }

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return Response.json({ message: "bad-request" }, { status: 400 });
      }

      const paymentId = paymentIdOf(event);
      if (!paymentId) {
        return Response.json({ message: "missing-payment-id" }, { status: 400 });
      }

      const eventType = String(event.type ?? "").toUpperCase();
      if (
        eventType &&
        !eventType.includes("PAID") &&
        !eventType.includes("CAPTURED") &&
        !eventType.includes("SUCCEEDED")
      ) {
        return Response.json({ received: true, ignored: true });
      }

      const recorded = await recordEvent({
        payload: req.payload,
        paymentId,
        event: {
          ...event,
          provider_event_id: webhookId ?? event.webhook_id ?? event.event_id
        },
        rawBody
      });
      if (recorded.duplicate) {
        return Response.json({ received: true, alreadyProcessed: true });
      }

      try {
        const result = await confirmOrder({
          cartsSlug: "carts",
          ordersSlug: "orders",
          transactionsSlug: "transactions",
          data: { paymentId },
          req
        });
        return Response.json({ received: true, ...result });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "confirm-failed";
        if (
          reason === "not-paid" ||
          reason === "amount-mismatch" ||
          reason === "currency-mismatch" ||
          reason === "test-channel-rejected" ||
          reason === "malformed" ||
          reason === "transaction-not-found"
        ) {
          req.payload.logger?.warn?.(
            `[payments/portone/webhooks] ${paymentId} ignored: ${reason}`
          );
          return Response.json({ received: true, ignored: reason });
        }
        req.payload.logger?.error?.(
          `[payments/portone/webhooks] confirm unavailable for ${paymentId}`
        );
        return Response.json(
          { message: "verify-unavailable" },
          { status: 500 }
        );
      }
    }
  };
}
