import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});
const verifyReturnedProductPayment = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/lost-commerce/paymentReturn", () => ({
  verifyReturnedProductPayment
}));

describe("LOSTINSEOUL payment return", () => {
  beforeEach(() => {
    redirect.mockClear();
    verifyReturnedProductPayment.mockReset();
  });

  it("redirects to success only after authoritative reconciliation", async () => {
    verifyReturnedProductPayment.mockResolvedValue({ ok: true });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ paymentId: "lis_1" }) })
    ).rejects.toThrow(
      "redirect:/lostinseoul/payment/success?order=lis_1&paymentId=lis_1"
    );
  });

  it("does not claim success when reconciliation fails", async () => {
    verifyReturnedProductPayment.mockResolvedValue({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("redirect:/lostinseoul/checkout");
  });

  it("reconciles the stored attempt when PortOne returns an error code", async () => {
    verifyReturnedProductPayment.mockResolvedValue({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({
        searchParams: Promise.resolve({ code: "FAIL", order: "lis_1" })
      })
    ).rejects.toThrow("redirect:/lostinseoul/checkout");
    expect(verifyReturnedProductPayment).toHaveBeenCalledWith({
      orderRef: "lis_1",
      paymentId: undefined
    });
  });

  it("shows failure only after an authoritative terminal result", async () => {
    verifyReturnedProductPayment.mockResolvedValue({
      ok: false,
      status: 402,
      reason: "payment-failed"
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("redirect:/lostinseoul/payment/failure?order=lis_1");
  });
});
