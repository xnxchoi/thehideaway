import { describe, expect, it, vi } from "vitest";

const nextHeaders = vi.fn();
const settleCardPayment = vi.fn();
const createPayloadCommerceRepository = vi.fn(() => ({ repository: true }));
const getPortOnePayment = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: nextHeaders }));
vi.mock("payload", () => ({ getPayload: vi.fn() }));
vi.mock("@/lib/auth/getServerSession", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/commerce/settle-payment", () => ({ settleCardPayment }));
vi.mock("@/lib/commerce/payload-repository", () => ({
  createPayloadCommerceRepository
}));
vi.mock("./verify-payment", () => ({
  getPortOnePayment,
  requiresLiveChannel: () => false
}));

describe("verifyReturnedProductPayment", () => {
  it("accepts distinct order and provider identifiers and returns the stored ref", async () => {
    const { getPayload } = await import("payload");
    const { getServerSession } = await import("@/lib/auth/getServerSession");
    vi.mocked(getPayload).mockResolvedValue({} as never);
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user_1", role: "user" }
    } as never);
    settleCardPayment.mockResolvedValue({ ref: "ord_1" });
    const { verifyReturnedProductPayment } = await import("./paymentReturn");
    const result = await verifyReturnedProductPayment({
      orderRef: "ord_1",
      paymentId: "pay_1"
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      orderRef: "ord_1"
    });
    expect(settleCardPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay_1", userId: "user_1" })
    );
  });
});
