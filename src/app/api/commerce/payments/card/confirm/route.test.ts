import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isSameOrigin: vi.fn(),
  settleCardPayment: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth: mocks.auth }))
}));
vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));
vi.mock("@/lib/commerce/settle-payment", () => ({
  settleCardPayment: mocks.settleCardPayment
}));
vi.mock("@/lib/lost-commerce/verify-payment", () => ({
  getPortOnePayment: vi.fn(),
  requiresLiveChannel: vi.fn(() => false)
}));

function request(body: unknown) {
  return new NextRequest(
    "https://hideaway.test/api/commerce/payments/card/confirm",
    {
      method: "POST",
      body: JSON.stringify(body)
    }
  );
}

describe("POST /api/commerce/payments/card/confirm", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth
      .mockReset()
      .mockResolvedValue({ user: { id: "owner-1", role: "user" } });
    mocks.isSameOrigin.mockReset().mockReturnValue(true);
    mocks.settleCardPayment
      .mockReset()
      .mockResolvedValue({ ref: "ORD-1", status: "paid" });
  });

  it("confirms the owned payment", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ paymentId: "PAY-123" }));

    expect(response.status).toBe(200);
    expect(mocks.settleCardPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "PAY-123", userId: "owner-1" })
    );
  });

  it("rejects unknown input fields", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ paymentId: "PAY-123", paid: true }));
    expect(response.status).toBe(400);
    expect(mocks.settleCardPayment).not.toHaveBeenCalled();
  });

  it("hides non-owned payments behind 404", async () => {
    mocks.settleCardPayment.mockRejectedValue(new Error("order-not-found"));
    const { POST } = await import("./route");
    const response = await POST(request({ paymentId: "PAY-123" }));
    expect(response.status).toBe(404);
  });
});
