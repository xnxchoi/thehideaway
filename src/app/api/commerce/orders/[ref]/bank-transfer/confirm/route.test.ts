import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  settleBankTransfer: vi.fn()
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ auth: mocks.auth }))
}));
vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin: vi.fn(() => true) }));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository: vi.fn(() => ({}))
}));
vi.mock("@/lib/commerce/settle-payment", () => ({
  settleBankTransfer: mocks.settleBankTransfer
}));

const req = () =>
  new NextRequest(
    "https://hideaway.test/api/commerce/orders/ORD-1/bank-transfer/confirm",
    {
      method: "POST",
      body: JSON.stringify({ evidenceReference: "BANK-1" })
    }
  );

describe("bank transfer confirmation", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth
      .mockReset()
      .mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mocks.settleBankTransfer
      .mockReset()
      .mockResolvedValue({ ref: "ORD-12345678", status: "paid" });
  });

  it("allows an admin to confirm bank evidence", async () => {
    const { POST } = await import("./route");
    const response = await POST(req(), {
      params: Promise.resolve({ ref: "ORD-12345678" })
    });
    expect(response.status).toBe(200);
    expect(mocks.settleBankTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        orderRef: "ORD-12345678",
        evidenceReference: "BANK-1"
      })
    );
  });

  it("forbids non-admin confirmation", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "user" } });
    const { POST } = await import("./route");
    const response = await POST(req(), {
      params: Promise.resolve({ ref: "ORD-12345678" })
    });
    expect(response.status).toBe(403);
    expect(mocks.settleBankTransfer).not.toHaveBeenCalled();
  });
});
