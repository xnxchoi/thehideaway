import config from "@payload-config";
import { Webhook } from "@portone/server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";
import { settleCardPayment } from "@/lib/commerce/settle-payment";
import {
  getPortOnePayment,
  requiresLiveChannel
} from "@/lib/lost-commerce/verify-payment";

function paymentIdOf(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  const data =
    event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : {};
  const paymentId = data.paymentId ?? event.paymentId;
  return typeof paymentId === "string" && paymentId.length <= 128
    ? paymentId
    : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { success: false, error: "webhook-not-configured" },
      { status: 500 }
    );
  }
  if (
    !req.headers.get("content-type")?.toLowerCase().includes("application/json")
  ) {
    return NextResponse.json(
      { success: false, error: "unsupported-media-type" },
      { status: 415 }
    );
  }
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 256 * 1024) {
    return NextResponse.json(
      { success: false, error: "payload-too-large" },
      { status: 413 }
    );
  }
  const rawBody = await req.text();
  if (rawBody.length > 256 * 1024) {
    return NextResponse.json(
      { success: false, error: "payload-too-large" },
      { status: 413 }
    );
  }
  try {
    await Webhook.verify(secret, rawBody, {
      "webhook-id": req.headers.get("webhook-id") ?? undefined,
      "webhook-signature": req.headers.get("webhook-signature") ?? undefined,
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? undefined
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid-webhook-signature" },
      { status: 400 }
    );
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      { success: false, error: "bad-request" },
      { status: 400 }
    );
  }
  const paymentId = paymentIdOf(event);
  if (!paymentId) {
    return NextResponse.json(
      { success: false, error: "missing-payment-id" },
      { status: 400 }
    );
  }

  const payload = await getPayload({ config });
  try {
    const order = await settleCardPayment({
      repository: createPayloadCommerceRepository(payload),
      gateway: {
        getPayment: getPortOnePayment,
        requireLiveChannel: requiresLiveChannel()
      },
      paymentId
    });
    return NextResponse.json({ success: true, data: { order } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (
      [
        "order-not-found",
        "not-paid",
        "amount-mismatch",
        "currency-mismatch",
        "test-channel-rejected",
        "malformed",
        "payment-not-pending"
      ].includes(code)
    ) {
      payload.logger?.warn?.(
        `[commerce/card/webhook] payment ${paymentId} rejected: ${code}`
      );
      return NextResponse.json(
        { success: false, error: "payment-reconciliation-required" },
        { status: 503 }
      );
    }
    payload.logger?.error?.("[commerce/card/webhook] settlement unavailable");
    return NextResponse.json(
      { success: false, error: "webhook-settlement-unavailable" },
      { status: 503 }
    );
  }
}
