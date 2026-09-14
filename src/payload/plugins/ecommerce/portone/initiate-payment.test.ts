import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { createPortOneInitiatePayment } from "./initiate-payment";

const mocks = vi.hoisted(() => ({ attempt: vi.fn() }));
vi.mock("../checkout-attempt", () => ({
  getOrCreateCheckoutAttempt: mocks.attempt,
  relationID: (id: unknown) => (typeof id === "string" ? id : undefined)
}));
vi.mock("@/utilities/getURL", () => ({
  getServerSideURL: () => "https://hideawayseoul.com"
}));
const input = () => ({
  req: {
    headers: new Headers({ origin: "https://lostinseoul.com" })
  } as PayloadRequest,
  transactionsSlug: "transactions",
  data: {
    cart: { id: "cart-1", subtotal: 1 },
    currency: "KRW",
    customerEmail: "buyer@example.com",
    checkoutSnapshot: {
      amount: 120000,
      currency: "KRW",
      items: [{ product: "prod-1", quantity: 1 }]
    }
  }
});
const buildPayload = vi.fn((input) => ({
  storeId: "store-1",
  channelKey: "channel-1",
  paymentId: input.orderRef,
  totalAmount: input.amount
}));
const deps = {
  buildPayload,
  isCheckoutEnabled: () => true,
  makePaymentId: () => "candidate-pay-id",
  requireLiveChannel: () => false
};

describe("PortOne initiation contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.attempt.mockResolvedValue({
      order: { id: "purchase-1", order_ref: "lis-purchase" },
      attempt: {
        id: "attempt-1",
        portone: { paymentId: "original-pay-id" },
        provider_expectation: {
          storeId: "store-1",
          channelKey: "channel-1",
          channelType: "TEST"
        }
      },
      purchaseAccessToken: "guest-capability"
    });
  });
  it("returns the reusable attempt and purchase capability with authoritative totals", async () => {
    const result = await createPortOneInitiatePayment(deps)(input());
    expect(result).toMatchObject({
      paymentId: "original-pay-id",
      orderID: "purchase-1",
      customerID: null,
      order_ref: "lis-purchase",
      transactionID: "attempt-1",
      purchaseAccessToken: "guest-capability",
      clientPayload: {
        totalAmount: 120000,
        paymentId: "original-pay-id",
        noticeUrls: ["https://hideawayseoul.com/api/payments/portone/webhooks"]
      }
    });
    expect(mocks.attempt).toHaveBeenCalledWith(
      expect.objectContaining({
        providerExpectation: {
          paymentId: "candidate-pay-id",
          storeId: "store-1",
          channelKey: "channel-1",
          channelType: "TEST"
        }
      })
    );
  });
  it("refuses missing authoritative snapshots without creating an attempt", async () => {
    const request = input();
    await expect(
      createPortOneInitiatePayment(deps)({
        ...request,
        data: { ...request.data, checkoutSnapshot: undefined }
      })
    ).rejects.toThrow("checkout-snapshot-required");
    expect(mocks.attempt).not.toHaveBeenCalled();
  });
  it("does not rebuild a payable retry under a changed provider configuration", async () => {
    await expect(
      createPortOneInitiatePayment({
        ...deps,
        buildPayload: () => ({
          storeId: "foreign-store",
          channelKey: "channel-1"
        })
      })(input())
    ).rejects.toThrow("payment-configuration-changed");
  });
  it("refuses initiation when checkout is disabled", async () => {
    await expect(
      createPortOneInitiatePayment({ ...deps, isCheckoutEnabled: () => false })(
        input()
      )
    ).rejects.toThrow("portone-not-configured");
    expect(mocks.attempt).not.toHaveBeenCalled();
  });
  it("returns the stored purchase owner rather than client-supplied identity", async () => {
    const guestOutcome = await mocks.attempt();
    mocks.attempt.mockResolvedValue({
      ...guestOutcome,
      order: { ...guestOutcome.order, customer: "stored-owner" },
      purchaseAccessToken: undefined
    });
    const result = await createPortOneInitiatePayment(deps)(input());
    expect(result.customerID).toBe("stored-owner");
  });
});
