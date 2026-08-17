import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isSameOrigin: vi.fn(() => true),
  rateLimit: vi.fn(async () => null),
  transition: vi.fn()
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth: mocks.auth }))
}));
vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/api/rateLimit", () => ({ rateLimitOr429: mocks.rateLimit }));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));
vi.mock("@/lib/commerce/transition-order-status", () => ({
  transitionOrderStatus: mocks.transition
}));

function request(body: unknown) {
  return new NextRequest(
    "https://hideaway.test/api/commerce/orders/ORD-1/status",
    {
      method: "PATCH",
      body: JSON.stringify(body)
    }
  );
}

describe("PATCH /api/commerce/orders/[ref]/status", () => {
  beforeEach(() => {
    mocks.auth
      .mockReset()
      .mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mocks.transition
      .mockReset()
      .mockResolvedValue({ ref: "ORD-1", status: "preparing" });
  });

  it("allows an admin to advance fulfillment status", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(request({ status: "preparing" }), {
      params: Promise.resolve({ ref: "ORD-1" })
    });

    expect(response.status).toBe(200);
    expect(mocks.transition).toHaveBeenCalledWith(
      expect.objectContaining({ orderRef: "ORD-1", status: "preparing" })
    );
  });

  it("rejects a non-admin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "user" } });
    const { PATCH } = await import("./route");
    const response = await PATCH(request({ status: "preparing" }), {
      params: Promise.resolve({ ref: "ORD-1" })
    });

    expect(response.status).toBe(403);
    expect(mocks.transition).not.toHaveBeenCalled();
  });
});
