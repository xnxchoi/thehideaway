import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  buildPaymentPayload: vi.fn(),
  createCommerceOrder: vi.fn(),
  isCardEnabled: vi.fn(),
  isSameOrigin: vi.fn(),
  rateLimitOr429: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth: mocks.auth }))
}));
vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: mocks.isSameOrigin
}));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));
vi.mock("@/lib/commerce/create-order", () => ({
  createCommerceOrder: mocks.createCommerceOrder
}));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));
vi.mock("@/lib/commerce/payment-readiness", () => ({
  isMinimalCommerceCardReady: mocks.isCardEnabled
}));
vi.mock("@/lib/lost-commerce/portone", () => ({
  buildPortOnePaymentPayload: mocks.buildPaymentPayload
}));

function request(body: unknown, idempotencyKey = "idem-123456789012") {
  return new NextRequest("https://hideaway.test/api/commerce/orders", {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: JSON.stringify(body)
  });
}

const validBody = {
  productId: "product-1",
  quantity: 2,
  paymentMethod: "bank_transfer",
  contact: { name: "Buyer", email: "buyer@example.com", phone: "01012345678" },
  shipping: { address: "Seoul", postalCode: "01234" }
};

describe("POST /api/commerce/orders", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({ user: { id: "user-1" } });
    mocks.isSameOrigin.mockReset().mockReturnValue(true);
    mocks.rateLimitOr429.mockReset().mockResolvedValue(null);
    mocks.isCardEnabled.mockReset().mockReturnValue(true);
    mocks.buildPaymentPayload.mockReset().mockReturnValue({
      paymentId: "ORD-1",
      noticeUrls: ["https://hideaway.test/api/commerce/payments/card/webhook"]
    });
    mocks.createCommerceOrder.mockReset().mockResolvedValue({
      order: { ref: "ORD-1", status: "awaiting_payment" },
      nextAction: { type: "bank_transfer", reference: "ORD-1" }
    });
    process.env.NEXT_PUBLIC_BANK_ACCOUNT = "Bank 123-456";
  });

  it("rejects cross-origin requests before authentication", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(request(validBody));

    expect(response.status).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue({ user: null });
    const { POST } = await import("./route");

    const response = await POST(request(validBody));

    expect(response.status).toBe(401);
    expect(mocks.createCommerceOrder).not.toHaveBeenCalled();
  });

  it("rejects unknown client-owned fields", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ ...validBody, totalAmount: 1 }));

    expect(response.status).toBe(400);
    expect(mocks.createCommerceOrder).not.toHaveBeenCalled();
  });

  it("creates a bank-transfer order", async () => {
    const { POST } = await import("./route");

    const response = await POST(request(validBody));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        order: { ref: "ORD-1", status: "awaiting_payment" },
        nextAction: {
          type: "bank_transfer",
          reference: "ORD-1",
          account: "Bank 123-456"
        }
      }
    });
    expect(mocks.createCommerceOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        idempotencyKey: "idem-123456789012",
        command: {
          productId: "product-1",
          quantity: 2,
          paymentMethod: "bank_transfer"
        }
      })
    );
  });

  it.each([undefined, "", "CHANGE_ME_BANK_ACCOUNT"])(
    "rejects an unusable bank account before creating an order",
    async (account) => {
      if (account === undefined) delete process.env.NEXT_PUBLIC_BANK_ACCOUNT;
      else process.env.NEXT_PUBLIC_BANK_ACCOUNT = account;
      const { POST } = await import("./route");

      const response = await POST(request(validBody));

      expect(response.status).toBe(503);
      expect(mocks.createCommerceOrder).not.toHaveBeenCalled();
    }
  );

  it("uses the stored provider ID in the reconcilable card payload", async () => {
    mocks.createCommerceOrder.mockResolvedValue({
      order: {
        ref: "ORD-1",
        product: { id: "product-1", name: "Object", slug: "object" },
        quantity: 1,
        money: { unitAmount: 10_000, totalAmount: 10_000, currency: "KRW" }
      },
      nextAction: { type: "card", paymentId: "ORD-1" }
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ ...validBody, quantity: 1, paymentMethod: "card" })
    );

    expect(response.status).toBe(201);
    expect(mocks.buildPaymentPayload).toHaveBeenCalledWith(
      expect.objectContaining({ orderRef: "ORD-1" })
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          nextAction: expect.objectContaining({
            paymentId: "ORD-1",
            request: expect.objectContaining({ paymentId: "ORD-1" })
          })
        })
      })
    );
  });

  it("returns stable public errors for expected conflicts", async () => {
    mocks.createCommerceOrder.mockRejectedValue(
      new Error("idempotency-conflict")
    );
    const { POST } = await import("./route");

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "idempotency-conflict"
    });
  });

  it("returns a rate-limit response before parsing", async () => {
    mocks.rateLimitOr429.mockResolvedValue(
      NextResponse.json({ error: "rate-limited" }, { status: 429 })
    );
    const { POST } = await import("./route");

    const response = await POST(request(validBody));

    expect(response.status).toBe(429);
    expect(mocks.createCommerceOrder).not.toHaveBeenCalled();
  });
});
