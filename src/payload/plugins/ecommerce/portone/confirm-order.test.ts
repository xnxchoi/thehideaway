import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";

import { createPortOneConfirmOrder } from "./confirm-order";

function payloadStub() {
  return {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    logger: { error: vi.fn() }
  };
}

function reqStub(payload: ReturnType<typeof payloadStub>): PayloadRequest {
  return {
    payload,
    user: { id: "user-1", email: "buyer@example.com" }
  } as unknown as PayloadRequest;
}

const pendingTransaction = {
  id: "txn-1",
  status: "pending",
  amount: 120000,
  currency: "KRW",
  cart: "cart-1",
  customer: "user-1",
  customerEmail: "buyer@example.com",
  items: [
    {
      product: "prod-1",
      variant: "var-1",
      quantity: 1,
      mode: "standard_purchase"
    }
  ],
  portone: { paymentId: "pay_1", channel: "channel-live" }
};

describe("createPortOneConfirmOrder", () => {
  it("confirms from PortOne REST against the stored transaction amount", async () => {
    const payload = payloadStub();
    payload.find.mockResolvedValue({ docs: [pendingTransaction], totalDocs: 1 });
    payload.create.mockResolvedValue({ id: "order-1" });
    payload.update.mockResolvedValue({});
    const getPayment = vi.fn(async () => ({
      status: "PAID",
      amount: { total: 120000 },
      currency: "KRW",
      channel: { type: "LIVE" },
      transactionId: "portone-txn"
    }));
    const confirm = createPortOneConfirmOrder({
      getPayment,
      requireLiveChannel: () => true
    });

    const result = await confirm({
      cartsSlug: "carts",
      ordersSlug: "orders",
      transactionsSlug: "transactions",
      data: { paymentId: "pay_1", customerEmail: "buyer@example.com" },
      req: reqStub(payload)
    });

    expect(getPayment).toHaveBeenCalledWith("pay_1");
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          amount: 120000,
          currency: "KRW",
          customer: "user-1",
          customerEmail: "buyer@example.com",
          status: "processing",
          order_ref: "pay_1",
          order_mode: "standard_purchase",
          lifecycle_status: "paid",
          payment_status: "paid",
          fulfillment_status: "reserved",
          line_snapshot_version: 3,
          transactions: ["txn-1"]
        })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cart-1",
        collection: "carts",
        data: expect.objectContaining({ purchasedAt: expect.any(String) })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "txn-1",
        collection: "transactions",
        data: expect.objectContaining({
          status: "succeeded",
          order: "order-1",
          portone: expect.objectContaining({
            paymentId: "pay_1",
            transactionId: "portone-txn",
            channel: "channel-live"
          })
        })
      })
    );
    expect(result).toEqual({
      message: "Order confirmed successfully",
      orderID: "order-1",
      order_ref: "pay_1",
      transactionID: "txn-1"
    });
  });

  it("replays a succeeded transaction without creating a second order", async () => {
    const payload = payloadStub();
    payload.find.mockResolvedValue({
      docs: [
        {
          ...pendingTransaction,
          status: "succeeded",
          order: "order-1"
        }
      ],
      totalDocs: 1
    });
    const getPayment = vi.fn();
    const confirm = createPortOneConfirmOrder({ getPayment });

    await expect(
      confirm({
        cartsSlug: "carts",
        ordersSlug: "orders",
        transactionsSlug: "transactions",
        data: { paymentId: "pay_1" },
        req: reqStub(payload)
      })
    ).resolves.toEqual({
      message: "Order confirmed successfully",
      orderID: "order-1",
      order_ref: "pay_1",
      transactionID: "txn-1"
    });
    expect(getPayment).not.toHaveBeenCalled();
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("stamps the order from the transaction buyer, not the confirm request user", async () => {
    const payload = payloadStub();
    payload.find.mockResolvedValue({ docs: [pendingTransaction], totalDocs: 1 });
    payload.create.mockResolvedValue({ id: "order-1" });
    payload.update.mockResolvedValue({});
    const confirm = createPortOneConfirmOrder({
      getPayment: async () => ({
        status: "PAID",
        amount: { total: 120000 },
        currency: "KRW",
        channel: { type: "LIVE" },
        transactionId: "portone-txn"
      }),
      requireLiveChannel: () => true
    });

    await confirm({
      cartsSlug: "carts",
      ordersSlug: "orders",
      transactionsSlug: "transactions",
      data: { paymentId: "pay_1" },
      req: { payload, user: null } as unknown as PayloadRequest
    });

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customer: "user-1",
          customerEmail: "buyer@example.com"
        })
      })
    );
  });

  it("rejects amount, currency, and unpaid PortOne records", async () => {
    const payload = payloadStub();
    payload.find.mockResolvedValue({ docs: [pendingTransaction], totalDocs: 1 });
    const confirm = createPortOneConfirmOrder({
      getPayment: async () => ({
        status: "PAID",
        amount: { total: 1 },
        currency: "KRW",
        channel: { type: "LIVE" }
      }),
      requireLiveChannel: () => true
    });

    await expect(
      confirm({
        cartsSlug: "carts",
        ordersSlug: "orders",
        transactionsSlug: "transactions",
        data: { paymentId: "pay_1" },
        req: reqStub(payload)
      })
    ).rejects.toThrow("amount-mismatch");
  });
});
