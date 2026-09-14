import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { createPortOneWebhookEndpoint } from "./webhooks";

function fixture() {
  const raw = JSON.stringify({
    type: "Transaction.Paid",
    data: { paymentId: "pay_1" }
  });
  const req = {
    payload: { logger: { error: vi.fn() } },
    text: async () => raw,
    headers: new Headers({
      "webhook-id": "evt-1",
      "webhook-signature": "v1,signature",
      "webhook-timestamp": "1"
    })
  } as unknown as PayloadRequest;
  const settlePayment = vi.fn(async () => ({
    message: "confirmed",
    orderID: "order-1",
    order_ref: "lis-order",
    transactionID: "txn-1",
    paymentStatus: "paid",
    attemptStatus: "succeeded"
  }));
  const recordEvent = vi.fn(async () => ({
    recorded: true,
    duplicate: false,
    conflict: false,
    eventId: "event-row"
  }));
  const claimEvent = vi.fn(async () => ({
    kind: "claimed" as const,
    leaseToken: "lease-token"
  }));
  const completeEvent = vi.fn(async () => undefined);
  const verifyWebhook = vi.fn(async () => undefined);
  const deps = {
    settlePayment,
    recordEvent,
    claimEvent,
    completeEvent,
    verifyWebhook,
    webhookSecret: () => "whsec_abcdefghijklmnopqrstuvwxyz123456"
  };
  return { req, raw, deps };
}

describe("signed webhook processing", () => {
  it("verifies original bytes before storing or settling and then completes the lease", async () => {
    const f = fixture();
    const response = await createPortOneWebhookEndpoint(f.deps).handler(f.req);
    expect(response.status).toBe(200);
    expect(f.deps.verifyWebhook).toHaveBeenCalledWith(
      expect.any(String),
      f.raw,
      expect.objectContaining({ "webhook-id": "evt-1" })
    );
    expect(f.deps.settlePayment).toHaveBeenCalledWith({
      req: f.req,
      paymentId: "pay_1"
    });
    expect(f.deps.completeEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "processed",
        outcomeCode: "paid",
        leaseToken: "lease-token"
      })
    );
  });
  it("keeps failure retryable and retries duplicate delivery instead of treating received as processed", async () => {
    const f = fixture();
    f.deps.settlePayment.mockRejectedValueOnce(new Error("provider-timeout"));
    const endpoint = createPortOneWebhookEndpoint(f.deps);
    expect((await endpoint.handler(f.req)).status).toBe(500);
    expect(f.deps.completeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: "retryable" })
    );
    f.deps.recordEvent.mockResolvedValue({
      recorded: false,
      duplicate: true,
      conflict: false,
      eventId: "event-row"
    });
    expect((await endpoint.handler(f.req)).status).toBe(200);
    expect(f.deps.settlePayment).toHaveBeenCalledTimes(2);
  });
  it("does not acknowledge a busy lease as successful processing", async () => {
    const f = fixture();
    f.deps.claimEvent.mockResolvedValue({ kind: "busy" } as never);
    expect(
      (await createPortOneWebhookEndpoint(f.deps).handler(f.req)).status
    ).toBe(503);
    expect(f.deps.settlePayment).not.toHaveBeenCalled();
  });
  it("does not settle duplicate events whose completed state was actually persisted", async () => {
    const f = fixture();
    f.deps.claimEvent.mockResolvedValue({
      kind: "terminal",
      status: "processed"
    } as never);
    expect(
      (await createPortOneWebhookEndpoint(f.deps).handler(f.req)).status
    ).toBe(200);
    expect(f.deps.settlePayment).not.toHaveBeenCalled();
  });
  it("rejects payload conflicts, missing raw bodies and invalid signatures before settlement", async () => {
    const f = fixture();
    f.deps.recordEvent.mockResolvedValue({
      recorded: false,
      duplicate: false,
      conflict: true,
      eventId: "event-row"
    });
    expect(
      (await createPortOneWebhookEndpoint(f.deps).handler(f.req)).status
    ).toBe(409);
    f.deps.verifyWebhook.mockRejectedValue(new Error("invalid-signature"));
    expect(
      (await createPortOneWebhookEndpoint(f.deps).handler(f.req)).status
    ).toBe(400);
    expect(
      (
        await createPortOneWebhookEndpoint(f.deps).handler({
          ...f.req,
          text: undefined
        } as unknown as PayloadRequest)
      ).status
    ).toBe(400);
    expect(f.deps.settlePayment).not.toHaveBeenCalled();
  });
});
