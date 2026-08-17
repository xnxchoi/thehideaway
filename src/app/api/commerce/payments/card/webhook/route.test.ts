import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settle: vi.fn(), verify: vi.fn() }));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn(async () => ({})) }));
vi.mock("@portone/server-sdk", () => ({
  Webhook: {
    verify: mocks.verify,
    WebhookVerificationError: class extends Error {}
  }
}));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));
vi.mock("@/lib/commerce/settle-payment", () => ({
  settleCardPayment: mocks.settle
}));
vi.mock("@/lib/lost-commerce/verify-payment", () => ({
  getPortOnePayment: vi.fn(),
  requiresLiveChannel: vi.fn(() => false)
}));

function request(body: unknown) {
  return new NextRequest(
    "https://hideaway.test/api/commerce/payments/card/webhook",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": "evt-1",
        "webhook-signature": "v1,sig",
        "webhook-timestamp": "123"
      },
      body: JSON.stringify(body)
    }
  );
}

describe("PortOne minimal commerce webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.PORTONE_WEBHOOK_SECRET =
      "whsec_abcdefghijklmnopqrstuvwxyz123456";
    mocks.verify.mockReset().mockResolvedValue(undefined);
    mocks.settle
      .mockReset()
      .mockResolvedValue({ ref: "ORD-1", status: "paid" });
  });

  it("verifies and settles a signed payment event", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ data: { paymentId: "PAY-123" } }));
    expect(response.status).toBe(200);
    expect(mocks.settle).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "PAY-123" })
    );
  });

  it("rejects a missing payment identifier", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ data: {} }));
    expect(response.status).toBe(400);
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("fails closed when signature verification fails", async () => {
    mocks.verify.mockRejectedValue(new Error("bad signature"));
    const { POST } = await import("./route");
    const response = await POST(request({ data: { paymentId: "PAY-123" } }));
    expect(response.status).toBe(400);
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("rejects non-JSON and oversized webhook bodies before verification", async () => {
    const { POST } = await import("./route");
    const wrongType = new NextRequest(
      "https://hideaway.test/api/commerce/payments/card/webhook",
      { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" }
    );
    const oversized = new NextRequest(
      "https://hideaway.test/api/commerce/payments/card/webhook",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(256 * 1024 + 1)
        },
        body: "{}"
      }
    );

    expect((await POST(wrongType)).status).toBe(415);
    expect((await POST(oversized)).status).toBe(413);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("requests provider retry when payment reconciliation is rejected", async () => {
    mocks.settle.mockRejectedValue(new Error("amount-mismatch"));
    const { POST } = await import("./route");

    const response = await POST(request({ data: { paymentId: "ORD-1" } }));

    expect(response.status).toBe(503);
  });
});
