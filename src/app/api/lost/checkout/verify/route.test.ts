import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const syncProductPayment = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth }))
}));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));
vi.mock("@/lib/lost-commerce/product-payment", () => ({
  syncProductPayment
}));

function request(body: unknown, origin = "https://lostinseoul.com") {
  return new NextRequest("https://hideaway.test/api/lost/checkout/verify", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body)
  });
}

describe("POST /api/lost/checkout/verify", () => {
  beforeEach(() => {
    auth.mockReset().mockResolvedValue({ user: { id: "user-1" } });
    syncProductPayment.mockReset().mockResolvedValue({
      ok: true,
      orderId: "order-1",
      status: "paid",
      alreadyProcessed: false
    });
  });

  it("requires an authenticated same-origin caller and enforces ownership", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ payment_id: "lis_1" }));

    expect(response.status).toBe(200);
    expect(syncProductPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1",
        expectedUserId: "user-1"
      })
    );
  });

  it("rejects cross-origin requests before authentication", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      request({ payment_id: "lis_1" }, "https://attacker.test")
    );

    expect(response.status).toBe(403);
    expect(auth).not.toHaveBeenCalled();
    expect(syncProductPayment).not.toHaveBeenCalled();
  });

  it("does not expose another user's payment id", async () => {
    syncProductPayment.mockResolvedValue({
      ok: false,
      status: 404,
      reason: "order-not-found"
    });
    const { POST } = await import("./route");
    const response = await POST(request({ payment_id: "lis_other" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      error: "order-not-found"
    });
  });
});
