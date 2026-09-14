import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import {
  createPortOneConfirmOrder,
  markAuthorizedBrowserPayment
} from "./confirm-order";

const mocks = vi.hoisted(() => ({ find: vi.fn(), settle: vi.fn() }));
vi.mock("./settle-payment", () => ({
  findPaymentAttempt: mocks.find,
  createPortOneSettlement: () => mocks.settle
}));

const attempt = {
  id: "txn-1",
  cart: "cart-1",
  order: "order-1",
  status: "succeeded",
  checkout_snapshot: { cartID: "cart-1" }
};
const req = () =>
  ({
    payload: {},
    context: {},
    user: { id: "buyer" }
  }) as unknown as PayloadRequest;

describe("browser confirmation authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockResolvedValue(attempt);
    mocks.settle.mockResolvedValue({ orderID: "order-1" });
  });
  it("rejects known paid IDs and forged body privileges before reads or provider calls", async () => {
    await expect(
      createPortOneConfirmOrder()({
        req: req(),
        data: { paymentId: "pay_1", trusted: true, internal: true }
      })
    ).rejects.toThrow("payment-authorization-required");
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
  });
  it("checks receipt binding before an already-paid replay", async () => {
    const request = req();
    markAuthorizedBrowserPayment(request, {
      transactionID: "other-transaction",
      cartID: "cart-1"
    });
    await expect(
      createPortOneConfirmOrder()({
        req: request,
        data: { paymentId: "pay_1" }
      })
    ).rejects.toThrow("payment-authorization-required");
    expect(mocks.settle).not.toHaveBeenCalled();
  });
  it("checks cart binding independently of the transaction identifier", async () => {
    const request = req();
    markAuthorizedBrowserPayment(request, {
      transactionID: "txn-1",
      cartID: "other-cart"
    });
    await expect(
      createPortOneConfirmOrder()({
        req: request,
        data: { paymentId: "pay_1" }
      })
    ).rejects.toThrow("payment-authorization-required");
    expect(mocks.settle).not.toHaveBeenCalled();
  });
  it("uses the trusted settlement path after HTTP authorization even after cart deletion", async () => {
    const request = req();
    mocks.find.mockResolvedValue({ ...attempt, cart: null });
    markAuthorizedBrowserPayment(request, {
      transactionID: "txn-1",
      cartID: "cart-1"
    });
    await expect(
      createPortOneConfirmOrder()({
        req: request,
        data: { paymentId: "pay_1" }
      })
    ).resolves.toEqual({ orderID: "order-1" });
    expect(mocks.settle).toHaveBeenCalledWith({
      req: request,
      paymentId: "pay_1"
    });
  });
});
