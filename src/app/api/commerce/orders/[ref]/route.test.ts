import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getCommerceOrder: vi.fn() }));

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth: mocks.auth }))
}));
vi.mock("@/lib/commerce/get-order", () => ({
  getCommerceOrder: mocks.getCommerceOrder
}));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));

describe("GET /api/commerce/orders/[ref]", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "owner-1", role: "user" }
    });
    mocks.getCommerceOrder.mockReset().mockResolvedValue({
      ref: "ORD-12345678",
      status: "paid"
    });
  });

  it("returns the owned order projection", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("https://hideaway.test/api/commerce/orders/ORD-12345678"),
      { params: Promise.resolve({ ref: "ORD-12345678" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { order: { ref: "ORD-12345678", status: "paid" } }
    });
  });

  it("returns 404 for missing and non-owned orders", async () => {
    mocks.getCommerceOrder.mockRejectedValue(new Error("order-not-found"));
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("https://hideaway.test/api/commerce/orders/ORD-12345678"),
      { params: Promise.resolve({ ref: "ORD-12345678" }) }
    );

    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue({ user: null });
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("https://hideaway.test/api/commerce/orders/ORD-12345678"),
      { params: Promise.resolve({ ref: "ORD-12345678" }) }
    );

    expect(response.status).toBe(401);
    expect(mocks.getCommerceOrder).not.toHaveBeenCalled();
  });
});
