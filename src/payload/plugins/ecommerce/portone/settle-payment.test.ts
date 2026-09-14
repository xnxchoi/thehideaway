import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { createPortOneSettlement } from "./settle-payment";

vi.mock("@/lib/db/sequences", () => ({ paymentWebhookLock: vi.fn() }));

function fixture() {
  let inTransaction = false;
  const order = {
    id: "order-1",
    order_ref: "lis_order",
    amount: 120000,
    currency: "KRW",
    lifecycle_status: "pending_payment",
    payment_status: "pending",
    fulfillment_status: "unfulfilled",
    checkout_fingerprint: "fingerprint",
    checkout_snapshot: { cartID: "cart-1" },
    settlement_transaction: null
  };
  const transaction = {
    id: "txn-1",
    order: order.id,
    cart: "cart-1",
    status: "pending",
    amount: 120000,
    currency: "KRW",
    checkout_fingerprint: "fingerprint",
    portone: { paymentId: "pay_1" },
    provider_expectation: {
      paymentId: "pay_1",
      storeId: "store-1",
      channelKey: "channel-1",
      channelType: "TEST"
    }
  };
  const rows: Record<string, Record<string, unknown>> = {
    "orders:order-1": order,
    "transactions:txn-1": transaction
  };
  const payload = {
    find: vi.fn(async () => ({ docs: [rows["transactions:txn-1"]] })),
    findByID: vi.fn(async ({ collection, id }) => rows[`${collection}:${id}`]),
    update: vi.fn(async ({ collection, id, data }) => {
      rows[`${collection}:${id}`] = { ...rows[`${collection}:${id}`], ...data };
      return rows[`${collection}:${id}`];
    }),
    db: {
      beginTransaction: vi.fn(async () => {
        inTransaction = true;
        return "db-tx";
      }),
      commitTransaction: vi.fn(async () => {
        inTransaction = false;
      }),
      rollbackTransaction: vi.fn(async () => {
        inTransaction = false;
      })
    }
  };
  const getPayment = vi.fn(async () => {
    expect(inTransaction).toBe(false);
    return {
      id: "pay_1",
      storeId: "store-1",
      status: "PAID",
      amount: { total: 120000, paid: 120000 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    };
  });
  return {
    rows,
    payload,
    getPayment,
    req: { payload, context: {} } as unknown as PayloadRequest
  };
}

describe("PortOne purchase settlement", () => {
  beforeEach(() => vi.clearAllMocks());
  it("fetches outside the lock and commits the existing purchase once without inventory", async () => {
    const f = fixture();
    const settle = createPortOneSettlement({ getPayment: f.getPayment });
    const result = await settle({ req: f.req, paymentId: "pay_1" });
    expect(result).toMatchObject({
      orderID: "order-1",
      order_ref: "lis_order",
      transactionID: "txn-1"
    });
    expect(f.rows["orders:order-1"]).toMatchObject({
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
      settlement_transaction: "txn-1",
      settlement_effects: { payment_receipt: { status: "pending" } }
    });
    f.payload.update.mockClear();
    await settle({ req: f.req, paymentId: "pay_1" });
    expect(f.payload.update).not.toHaveBeenCalled();
  });
  it("never turns a refunded purchase or attempt back into paid on replay", async () => {
    const f = fixture();
    f.rows["orders:order-1"] = {
      ...f.rows["orders:order-1"],
      lifecycle_status: "refunded",
      payment_status: "refunded",
      settlement_transaction: "txn-1"
    };
    f.rows["transactions:txn-1"] = {
      ...f.rows["transactions:txn-1"],
      status: "refunded"
    };
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "CANCELLED",
      amount: { total: 120000, paid: 0 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await createPortOneSettlement({ getPayment: f.getPayment })({
      req: f.req,
      paymentId: "pay_1"
    });
    expect(f.payload.update).not.toHaveBeenCalled();
    expect(f.rows["orders:order-1"].payment_status).toBe("refunded");
  });
  it("persists mismatched capture evidence without paying the purchase", async () => {
    const f = fixture();
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "PAID",
      amount: { total: 1, paid: 1 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({ reconciliationRequired: true });
    expect(f.rows["orders:order-1"]).toMatchObject({
      payment_status: "pending",
      reconciliation_required: true
    });
    expect(f.rows["transactions:txn-1"]).toMatchObject({
      reconciliation_required: true,
      provider_outcome: { reason: "amount-mismatch" }
    });
  });
  it("marks a second capture for reconciliation without issuing a second receipt intent", async () => {
    const f = fixture();
    f.rows["orders:order-1"] = {
      ...f.rows["orders:order-1"],
      payment_status: "paid",
      lifecycle_status: "paid",
      settlement_transaction: "other-txn",
      settlement_effects: {
        payment_receipt: { key: "original", status: "pending" }
      }
    };
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({ reconciliationRequired: true });
    expect(f.rows["orders:order-1"].settlement_effects).toEqual({
      payment_receipt: { key: "original", status: "pending" }
    });
    expect(f.rows["transactions:txn-1"].provider_outcome).toMatchObject({
      reason: "excess-capture"
    });
  });
  it("records only an identity-checked zero-paid terminal attempt as retryable", async () => {
    const f = fixture();
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "FAILED",
      amount: { total: 120000, paid: 0 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({
      paymentStatus: "pending",
      attemptStatus: "failed"
    });
    expect(f.rows["transactions:txn-1"]).toMatchObject({
      status: "failed",
      provider_verified_at: expect.any(String)
    });
    expect(f.rows["orders:order-1"].payment_status).toBe("pending");
  });
  it("does not permit retry when a failed provider record still reports captured funds", async () => {
    const f = fixture();
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "FAILED",
      amount: { total: 120000, paid: 120000 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({ reconciliationRequired: true });
    expect(f.rows["transactions:txn-1"].status).toBe("pending");
  });
  it.each(["storeId", "id"])(
    "rejects a mismatched provider %s before any settlement",
    async (field) => {
      const f = fixture();
      f.getPayment.mockImplementation(async () => ({
        id: "pay_1",
        storeId: "store-1",
        status: "PAID",
        amount: { total: 120000, paid: 120000 },
        currency: "KRW",
        channel: { key: "channel-1", type: "TEST" },
        transactionId: "provider-txn",
        [field]: "foreign"
      }));
      await expect(
        createPortOneSettlement({ getPayment: f.getPayment })({
          req: f.req,
          paymentId: "pay_1"
        })
      ).resolves.toMatchObject({ reconciliationRequired: true });
      expect(f.rows["orders:order-1"].payment_status).toBe("pending");
    }
  );
  it("rolls back all settlement writes when persisting the receipt intent fails", async () => {
    const f = fixture();
    f.payload.update.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).rejects.toThrow("database unavailable");
    expect(f.payload.db.rollbackTransaction).toHaveBeenCalledWith("db-tx");
    expect(f.payload.db.commitTransaction).not.toHaveBeenCalled();
  });
  it("records provider-console cancellation of a locally paid order for reconciliation", async () => {
    const f = fixture();
    const settle = createPortOneSettlement({ getPayment: f.getPayment });
    await settle({ req: f.req, paymentId: "pay_1" });
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "CANCELLED",
      amount: { total: 120000, paid: 0 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await expect(
      settle({ req: f.req, paymentId: "pay_1" })
    ).resolves.toMatchObject({
      paymentStatus: "paid",
      reconciliationRequired: true
    });
    expect(f.rows["transactions:txn-1"]).toMatchObject({
      status: "succeeded",
      provider_outcome: { reason: "not-paid", status: "CANCELLED" }
    });
    expect(f.rows["orders:order-1"].reconciliation_required).toBe(true);
  });
  it("rejects a paid response missing its mandatory settled amount", async () => {
    const f = fixture();
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "PAID",
      amount: { total: 120000 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    } as never);
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({ reconciliationRequired: true });
    expect(f.rows["orders:order-1"].payment_status).toBe("pending");
    expect(f.rows["transactions:txn-1"].provider_outcome).toMatchObject({
      reason: "malformed"
    });
  });
  it("ignores an old verified failed attempt after another attempt settled the purchase", async () => {
    const f = fixture();
    f.rows["orders:order-1"] = {
      ...f.rows["orders:order-1"],
      payment_status: "paid",
      lifecycle_status: "paid",
      settlement_transaction: "new-txn"
    };
    f.rows["transactions:txn-1"] = {
      ...f.rows["transactions:txn-1"],
      status: "failed",
      provider_verified_at: new Date().toISOString()
    };
    f.getPayment.mockResolvedValue({
      id: "pay_1",
      storeId: "store-1",
      status: "FAILED",
      amount: { total: 120000, paid: 0 },
      currency: "KRW",
      channel: { key: "channel-1", type: "TEST" },
      transactionId: "provider-txn"
    });
    await expect(
      createPortOneSettlement({ getPayment: f.getPayment })({
        req: f.req,
        paymentId: "pay_1"
      })
    ).resolves.toMatchObject({
      paymentStatus: "paid",
      attemptStatus: "failed"
    });
    expect(f.payload.update).not.toHaveBeenCalled();
  });
  it.each(["FAILED", "CANCELLED"])(
    "replays a verified %s attempt without poisoning its intentional retry",
    async (status) => {
      const f = fixture();
      f.getPayment.mockResolvedValue({
        id: "pay_1",
        storeId: "store-1",
        status,
        amount: { total: 120000, paid: 0 },
        currency: "KRW",
        channel: { key: "channel-1", type: "TEST" },
        transactionId: "provider-txn"
      });
      const settle = createPortOneSettlement({ getPayment: f.getPayment });
      await settle({ req: f.req, paymentId: "pay_1" });
      f.payload.update.mockClear();
      await expect(
        settle({ req: f.req, paymentId: "pay_1" })
      ).resolves.toMatchObject({
        attemptStatus: status.toLowerCase(),
        paymentStatus: "pending"
      });
      expect(f.payload.update).not.toHaveBeenCalled();
      expect(f.rows["orders:order-1"].reconciliation_required).not.toBe(true);
    }
  );
});
