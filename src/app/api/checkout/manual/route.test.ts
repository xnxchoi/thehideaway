import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findByID = vi.fn();
const find = vi.fn();
const create = vi.fn();
const idemPut = vi.fn(async () => undefined);

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth,
    findByID,
    find,
    create,
    logger: {
      error: vi.fn(),
      warn: vi.fn()
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

vi.mock("@/lib/api/idempotency", () => ({
  beginIdempotent: vi.fn(() => ({
    get: () => null,
    put: idemPut
  }))
}));

describe("POST /api/checkout/manual", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.mockReset().mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" }
    });
    findByID.mockReset();
    find.mockReset();
    create.mockReset();
    idemPut.mockClear();

    findByID.mockImplementation(async ({ collection }) => {
      if (collection === "plans") {
        return {
          id: "plan-1",
          name: "Resident",
          tier_label: "Resident",
          state: "active"
        };
      }
      if (collection === "prices") {
        return {
          id: "price-1",
          plan: "plan-1",
          active: true,
          unit_amount: 33000,
          currency: "currency-krw"
        };
      }
      return null;
    });
    find.mockResolvedValue({ docs: [] });
    create.mockImplementation(async ({ collection, data }) => {
      if (collection === "subscriptions") return { id: "sub-1", ...data };
      return { id: "email-1", ...data };
    });
  });

  it("snapshots price amount and currency onto the pending subscription", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/checkout/manual", {
      method: "POST",
      body: JSON.stringify({
        plan_id: "plan-1",
        price_id: "price-1",
        method: "bank_transfer"
      })
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "subscriptions",
        data: expect.objectContaining({
          user: "user-1",
          plan: "plan-1",
          price: "price-1",
          amount: 33000,
          currency: "currency-krw",
          subscription_status: "pending",
          paid: false
        })
      })
    );
  });

  it("prefers the active KRW price when the client does not send a price id", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "prices") {
        return {
          docs: [
            {
              id: "price-usd",
              plan: "plan-1",
              active: true,
              unit_amount: 29,
              currency: { id: "currency-usd", name: "USD" }
            },
            {
              id: "price-krw",
              plan: "plan-1",
              active: true,
              unit_amount: 33000,
              currency: { id: "currency-krw", name: "KRW" }
            }
          ]
        };
      }
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/checkout/manual", {
      method: "POST",
      body: JSON.stringify({
        plan_id: "plan-1",
        method: "bank_transfer"
      })
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "subscriptions",
        data: expect.objectContaining({
          price: "price-krw",
          amount: 33000,
          currency: "currency-krw"
        })
      })
    );
  });
});
