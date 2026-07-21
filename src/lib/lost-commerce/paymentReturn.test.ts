import { describe, expect, it, vi } from "vitest";

const nextHeaders = vi.fn();
const syncProductPayment = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: nextHeaders }));
vi.mock("payload", () => ({ getPayload: vi.fn() }));
vi.mock("@/lib/auth/getServerSession", () => ({ getServerSession: vi.fn() }));
vi.mock("./product-payment", () => ({ syncProductPayment }));

describe("verifyReturnedProductPayment", () => {
  it("rejects mismatched order and payment identifiers before any lookup", async () => {
    const { verifyReturnedProductPayment } = await import("./paymentReturn");
    const result = await verifyReturnedProductPayment({
      orderRef: "lis_a",
      paymentId: "lis_b"
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      reason: "order-not-found"
    });
    expect(nextHeaders).not.toHaveBeenCalled();
    expect(syncProductPayment).not.toHaveBeenCalled();
  });
});
