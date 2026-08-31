import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";

import { createPortOneInitiatePayment } from "./initiate-payment";

function payloadStub(overrides: Record<string, unknown> = {}) {
  return {
    create: vi.fn(async () => ({ id: "txn-1" })),
    logger: { error: vi.fn() },
    ...overrides
  };
}

function reqStub(payload: ReturnType<typeof payloadStub>): PayloadRequest {
  return {
    payload,
    user: { id: "user-1", email: "buyer@example.com" },
    headers: new Headers({ origin: "http://localhost:3000" }),
    data: { amount: 1, cartID: "cart-1" }
  } as unknown as PayloadRequest;
}

describe("createPortOneInitiatePayment", () => {
  it("creates a pending transaction from the server cart total, not the client amount", async () => {
    const payload = payloadStub();
    const buildPayload = vi.fn(() => ({
      storeId: "store",
      paymentId: "pay_1",
      totalAmount: 120000
    }));
    const initiate = createPortOneInitiatePayment({
      buildPayload,
      makePaymentId: () => "pay_1",
      isCheckoutEnabled: () => true
    });

    const result = await initiate({
      data: {
        cart: {
          id: "cart-1",
          subtotal: 120000,
          currency: "KRW",
          items: [
            {
              id: "row-1",
              product: "prod-1",
              variant: "var-1",
              quantity: 2,
              mode: "standard_purchase",
              line_amount: 120000
            }
          ]
        },
        currency: "KRW",
        customerEmail: "buyer@example.com",
        billingAddress: {} as never
      },
      req: reqStub(payload),
      transactionsSlug: "transactions"
    });

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        data: expect.objectContaining({
          amount: 120000,
          currency: "KRW",
          paymentMethod: "portone",
          status: "pending",
          cart: "cart-1",
          customer: "user-1",
          portone: expect.objectContaining({
            paymentId: "pay_1"
          })
        })
      })
    );
    expect(payload.create).toHaveBeenCalledTimes(1);
    expect(buildPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        orderRef: "pay_1",
        amount: 120000,
        currency: "KRW",
        origin: "http://localhost:3000"
      })
    );
    expect(result).toMatchObject({
      message: "Payment initiated successfully",
      paymentId: "pay_1",
      transactionID: "txn-1"
    });
    expect(result.clientPayload).toMatchObject({
      noticeUrls: ["http://localhost:3000/api/payments/portone/webhooks"]
    });
  });

  it("pins noticeUrls to the server origin even if the request Origin is foreign", async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
    const payload = payloadStub();
    const initiate = createPortOneInitiatePayment({
      buildPayload: () => ({ storeId: "store", paymentId: "pay_1" }),
      makePaymentId: () => "pay_1",
      isCheckoutEnabled: () => true
    });
    const req = reqStub(payload);
    (req as { headers: Headers }).headers = new Headers({
      origin: "https://evil.example"
    });

    const result = await initiate({
      data: {
        cart: {
          id: "cart-1",
          subtotal: 120000,
          items: [{ id: "row-1", product: "prod-1", quantity: 1, line_amount: 120000 }]
        },
        currency: "KRW",
        customerEmail: "buyer@example.com",
        billingAddress: {} as never
      },
      req,
      transactionsSlug: "transactions"
    });

    expect(result.clientPayload).toMatchObject({
      noticeUrls: ["http://localhost:3000/api/payments/portone/webhooks"]
    });
  });

  it("refuses to initiate when checkout is dark or the cart has no payable total", async () => {
    const payload = payloadStub();
    const dark = createPortOneInitiatePayment({
      isCheckoutEnabled: () => false
    });
    await expect(
      dark({
        data: {
          cart: {
            id: "cart-1",
            subtotal: 120000,
            items: [{ id: "row-1", product: "prod-1", quantity: 1 }]
          },
          currency: "KRW",
          customerEmail: "buyer@example.com",
          billingAddress: {} as never
        },
        req: reqStub(payload),
        transactionsSlug: "transactions"
      })
    ).rejects.toThrow("portone-not-configured");

    const unpaid = createPortOneInitiatePayment({
      isCheckoutEnabled: () => true
    });
    await expect(
      unpaid({
        data: {
          cart: { id: "cart-1", subtotal: 0, items: [] },
          currency: "KRW",
          customerEmail: "buyer@example.com",
          billingAddress: {} as never
        },
        req: reqStub(payload),
        transactionsSlug: "transactions"
      })
    ).rejects.toThrow("invalid-cart-amount");
  });
});
