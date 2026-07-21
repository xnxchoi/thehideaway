import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cancelUnpaidProductOrder: vi.fn(),
  syncProductPayment: vi.fn(),
  find: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    find: mocks.find,
    logger: { error: vi.fn() }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

vi.mock("@/lib/lost-commerce/orders", () => ({
  cancelUnpaidProductOrder: mocks.cancelUnpaidProductOrder
}));

vi.mock("@/lib/lost-commerce/product-payment", () => ({
  syncProductPayment: mocks.syncProductPayment
}));

function request(body: unknown) {
  return new NextRequest("https://hideaway.test/api/lost/checkout/cancel", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("POST /api/lost/checkout/cancel", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", role: "user" }
    });
    mocks.find.mockReset().mockImplementation(async ({ collection }) => ({
      docs:
        collection === "product-orders"
          ? [
              {
                id: "order-1",
                order_ref: "lis_1",
                user: "user-1",
                order_mode: "standard_purchase",
                payment_status: "pending",
                lines: []
              }
            ]
          : [{ provider: "manual" }]
    }));
    mocks.syncProductPayment.mockReset().mockResolvedValue({
      ok: false,
      status: 402,
      reason: "not-paid"
    });
    mocks.cancelUnpaidProductOrder
      .mockReset()
      .mockResolvedValue({ ok: true, canceled: true });
  });

  it("cancels the authenticated user's unpaid LOST order", async () => {
    const { POST } = await import("./route");
    const res = await POST(request({ order_ref: "lis_1" }));

    expect(res.status).toBe(200);
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        where: {
          and: [
            { order_ref: { equals: "lis_1" } },
            { user: { equals: "user-1" } }
          ]
        }
      })
    );
    expect(mocks.cancelUnpaidProductOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({ id: "order-1" })
      })
    );
  });

  it("does not cancel another user's order", async () => {
    mocks.find.mockResolvedValue({ docs: [] });

    const { POST } = await import("./route");
    const res = await POST(request({ order_ref: "lis_1" }));

    expect(res.status).toBe(404);
    expect(mocks.cancelUnpaidProductOrder).not.toHaveBeenCalled();
  });

  it("never cancels a PortOne order without authoritative reconciliation", async () => {
    mocks.find.mockImplementation(async ({ collection }) => ({
      docs:
        collection === "product-orders"
          ? [
              {
                id: "order-1",
                order_ref: "lis_1",
                user: "user-1",
                payment_status: "pending"
              }
            ]
          : [
              {
                provider: "portone",
                portone_order_ref: "lis_1"
              }
            ]
    }));
    mocks.syncProductPayment.mockResolvedValue({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });

    const { POST } = await import("./route");
    const res = await POST(request({ order_ref: "lis_1" }));

    expect(res.status).toBe(503);
    expect(mocks.syncProductPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1",
        expectedUserId: "user-1"
      })
    );
    expect(mocks.cancelUnpaidProductOrder).not.toHaveBeenCalled();
  });
});
