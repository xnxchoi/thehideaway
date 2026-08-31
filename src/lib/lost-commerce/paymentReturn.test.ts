import { beforeEach, describe, expect, it, vi } from "vitest";

const nextHeaders = vi.fn();
const getPayload = vi.fn();
const getServerSession = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: nextHeaders }));
vi.mock("payload", () => ({ getPayload }));
vi.mock("@/lib/auth/getServerSession", () => ({ getServerSession }));

describe("verifyReturnedProductPayment", () => {
  beforeEach(() => {
    nextHeaders.mockReset();
    getPayload.mockReset();
    getServerSession.mockReset();
  });

  it("accepts a plugin order_ref and returns it when paid", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user_1", role: "user" }
    });
    getPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            order_ref: "ord_1",
            customer: "user_1",
            payment_status: "paid"
          }
        ]
      })
    });
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
  });

  it("does not distinguish unpaid orders from missing ones", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user_1", role: "user" }
    });
    getPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            order_ref: "ord_1",
            customer: "user_1",
            payment_status: "unpaid"
          }
        ]
      })
    });
    const { verifyReturnedProductPayment } = await import("./paymentReturn");
    await expect(
      verifyReturnedProductPayment({ paymentId: "pay_1" })
    ).resolves.toEqual({
      ok: false,
      status: 404,
      reason: "order-not-found"
    });
  });
});
