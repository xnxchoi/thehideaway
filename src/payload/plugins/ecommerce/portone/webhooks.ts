import { Webhook } from "@portone/server-sdk";
import type { Endpoint, PayloadRequest } from "payload";

import {
  recordCommerceProviderEventStandalone,
  claimCommerceProviderEvent,
  completeCommerceProviderEvent
} from "@/lib/lost-commerce/provider-events";
import { getPortOneConfig } from "@/lib/lost-commerce/portone";

import type { PortOneAdapterDeps } from "./deps";
import { requestHeader } from "./deps";
import { createPortOneSettlement } from "./settle-payment";

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
  throw new Error("webhook-raw-body-required");
}

export function createPortOneWebhookEndpoint(
  deps: PortOneAdapterDeps = {}
): Endpoint {
  const settlePayment = deps.settlePayment ?? createPortOneSettlement(deps);
  const verifyWebhook =
    deps.verifyWebhook ??
    ((secret, body, headers) => Webhook.verify(secret, body, headers));
  const webhookSecret =
    deps.webhookSecret ?? (() => getPortOneConfig().webhookSecret);
  const recordEvent = deps.recordEvent ?? recordCommerceProviderEventStandalone;
  const claimEvent = deps.claimEvent ?? claimCommerceProviderEvent;
  const completeEvent = deps.completeEvent ?? completeCommerceProviderEvent;

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

      let rawBody: string;
      try {
        rawBody = await readRawBody(req);
      } catch {
        return Response.json(
          { message: "webhook-raw-body-required" },
          { status: 400 }
        );
      }
      const webhookId = requestHeader(req, "webhook-id");
      const webhookSignature = requestHeader(req, "webhook-signature");
      const webhookTimestamp = requestHeader(req, "webhook-timestamp");
      const hasSignatureHeaders = Boolean(
        webhookId || webhookSignature || webhookTimestamp
      );
      if (!hasSignatureHeaders) {
        return Response.json(
          { message: "signature-required" },
          { status: 401 }
        );
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
        if (!event || typeof event !== "object" || Array.isArray(event))
          throw new Error("bad-request");
      } catch {
        return Response.json({ message: "bad-request" }, { status: 400 });
      }

      const paymentId = paymentIdOf(event);
      if (!paymentId) {
        return Response.json(
          { message: "missing-payment-id" },
          { status: 400 }
        );
      }

      // All signed payment outcomes are reconciled from fresh provider truth.
      // Receipt persistence alone never means settlement completed.
      let eventId: string | null = null;
      let leaseToken: string | null = null;
      try {
        const recorded = await recordEvent({
          payload: req.payload,
          paymentId,
          rawBody,
          event: {
            ...event,
            provider_event_id: webhookId ?? event.webhook_id ?? event.event_id
          }
        });
        eventId = recorded.eventId;
        if (recorded.conflict)
          return Response.json(
            { message: "provider-event-conflict" },
            { status: 409 }
          );
        if (!eventId) throw new Error("provider-event-persistence-required");
        const claim = await claimEvent({ payload: req.payload, eventId });
        if (claim.kind === "terminal")
          return Response.json({
            received: true,
            alreadyProcessed: claim.status === "processed",
            outcome: claim.outcomeCode
          });
        if (claim.kind === "busy")
          return Response.json(
            { message: "provider-event-busy" },
            { status: 503 }
          );
        leaseToken = claim.leaseToken;
        const result = await settlePayment({ req, paymentId });
        await completeEvent({
          payload: req.payload,
          eventId,
          leaseToken,
          status: "processed",
          outcomeCode: result.reconciliationRequired
            ? "reconciliation-required"
            : result.paymentStatus
        });
        return Response.json({ received: true, ...result });
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "settlement-failed";
        if (eventId && leaseToken) {
          try {
            await completeEvent({
              payload: req.payload,
              eventId,
              leaseToken,
              status: "retryable",
              outcomeCode:
                reason === "not-paid" ? "not-paid" : "settlement-unavailable"
            });
          } catch {
            req.payload.logger?.error?.(
              "[payments/portone/webhooks] event completion unavailable"
            );
          }
        }
        req.payload.logger?.error?.(
          "[payments/portone/webhooks] settlement unavailable"
        );
        return Response.json(
          { message: "verify-unavailable" },
          { status: 500 }
        );
      }
    }
  };
}
