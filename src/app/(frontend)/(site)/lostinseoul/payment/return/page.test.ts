import { describe, expect, it, vi } from "vitest";
const verify = vi.fn();
vi.mock("@/lib/lost-commerce/paymentReturn", () => ({
  verifyReturnedProductPayment: verify
}));
vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: unknown }) => children
}));
vi.mock("../purchase-status", () => ({ PurchaseStatus: () => null }));
describe("LOST payment return", () => {
  it("passes only purchase references to browser reconciliation, never treats provider query status as proof", async () => {
    const { default: Page } = await import("./page");
    const result = await Page({
      searchParams: Promise.resolve({
        paymentId: "pay-1",
        order: "LIS-1",
        code: "FAILED"
      })
    });
    expect(result.props.children.props).toEqual({
      paymentId: "pay-1",
      orderRef: "LIS-1",
      showOrderReference: false
    });
    expect(verify).not.toHaveBeenCalled();
  });
});
