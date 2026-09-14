import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  payload: vi.fn(),
  list: vi.fn(),
  detail: vi.fn(),
  rate: vi.fn(),
  origin: vi.fn()
}));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.session
}));
vi.mock("@/lib/payload", () => ({ getPayload: mocks.payload }));
vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin: mocks.origin }));
vi.mock("@/lib/api/rateLimit", () => ({ enforceRateLimit: mocks.rate }));
vi.mock("./order-history", () => ({
  listCustomerOrders: mocks.list,
  getCustomerOrder: mocks.detail
}));
import { GET, POST } from "@/app/api/lost/orders/route";
const request = (method = "GET", body?: unknown, query = "") =>
  new NextRequest(`https://lostinseoul.com/api/lost/orders${query}`, {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: {
            "content-type": "application/json",
            origin: "https://lostinseoul.com"
          }
        }
      : {})
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.payload.mockResolvedValue({ logger: { error: vi.fn() } });
  mocks.origin.mockReturnValue(true);
  mocks.rate.mockResolvedValue({ ok: true });
  mocks.list.mockResolvedValue({ orders: [] });
  mocks.detail.mockResolvedValue({ orderRef: "LOST-1" });
});
describe("customer history HTTP boundary", () => {
  it("requires Better Auth for list even with email or capability in query", async () => {
    const response = await GET(
      request(
        "GET",
        undefined,
        "?email=a@example.com&purchaseAccessToken=secret"
      )
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("uses only server identity and forwards page, never caller owner filters", async () => {
    mocks.session.mockResolvedValue({ user: { id: "alice" } });
    const response = await GET(
      request("GET", undefined, "?page=2&customer=bob")
    );
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(expect.anything(), "alice", "2");
  });
  it("accepts a capability only in a strict POST body", async () => {
    const response = await POST(
      request("POST", { orderRef: "LOST-1", purchaseAccessToken: "token" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.detail).toHaveBeenCalledWith(expect.anything(), {
      orderRef: "LOST-1",
      purchaseAccessToken: "token",
      customerID: undefined
    });
    expect(
      (
        await POST(
          request("POST", {
            orderRef: "LOST-1",
            customerEmail: "a@example.com"
          })
        )
      ).status
    ).toBe(400);
  });
  it("does not accept a query capability or reveal missing vs forbidden orders", async () => {
    expect(
      (
        await POST(
          request("POST", { orderRef: "LOST-1" }, "?purchaseAccessToken=token")
        )
      ).status
    ).toBe(404);
    expect(mocks.detail).not.toHaveBeenCalled();
    mocks.detail.mockResolvedValue(null);
    expect(
      (
        await POST(
          request("POST", { orderRef: "LOST-1", purchaseAccessToken: "bad" })
        )
      ).status
    ).toBe(404);
  });
  it("enforces same-origin and rate limits with private responses", async () => {
    mocks.origin.mockReturnValue(false);
    expect(
      (
        await POST(
          request("POST", { orderRef: "LOST-1", purchaseAccessToken: "token" })
        )
      ).status
    ).toBe(403);
    mocks.origin.mockReturnValue(true);
    mocks.rate.mockResolvedValue({ ok: false, resetSeconds: 30 });
    const response = await POST(
      request("POST", { orderRef: "LOST-1", purchaseAccessToken: "token" })
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("sanitizes database errors instead of returning empty history", async () => {
    mocks.session.mockResolvedValue({ user: { id: "alice" } });
    mocks.list.mockRejectedValue(new Error("sensitive database message"));
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("sensitive");
  });
});
