import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { recordPluginOrderCreated } from "./order-lifecycle";
import {
  getOrCreateCheckoutAttempt,
  markAuthorizedCheckout,
  purchaseAccessDigest
} from "./checkout-attempt";

vi.mock("@/lib/db/sequences", () => ({ paymentWebhookLock: vi.fn() }));

function fixture() {
  const rows: Record<string, Record<string, unknown>[]> = {
    orders: [],
    transactions: []
  };
  const payload = {
    secret: "fixture-secret-only",
    find: vi.fn(async ({ collection, where }) => ({
      docs: rows[collection]
        .filter((row) => !where?.and || row.status === "pending")
        .slice(-1)
    })),
    findByID: vi.fn(async ({ collection, id }) =>
      rows[collection].find((row) => row.id === id)
    ),
    create: vi.fn(async ({ collection, data, req }) => {
      // Payload's default allowIDOnCreate:false ignores application supplied IDs.
      const row = { ...data, id: `${collection}-${rows[collection].length}` };
      rows[collection] = [...rows[collection], row];
      if (collection === "orders")
        await recordPluginOrderCreated({
          doc: row,
          operation: "create",
          req
        } as never);
      return row;
    }),
    update: vi.fn(async ({ collection, id, data }) => {
      rows[collection] = rows[collection].map((row) =>
        row.id === id ? { ...row, ...data } : row
      );
      return rows[collection].find((row) => row.id === id);
    }),
    db: {
      beginTransaction: vi.fn(async () => "db-tx"),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn()
    }
  };
  const req = { payload, context: {} } as unknown as PayloadRequest;
  const input = {
    req,
    cartID: "cart-1",
    snapshot: {
      version: 1,
      amount: 120000,
      currency: "KRW",
      items: [{ product: "prod-1", quantity: 1 }]
    },
    customerEmail: "buyer@example.com",
    paymentId: "pay_1",
    providerExpectation: {
      paymentId: "pay_1",
      storeId: "store-1",
      channelKey: "channel-1",
      channelType: "TEST"
    }
  };
  return { payload, rows, req, input };
}

describe("durable checkout attempt", () => {
  it("requires the server authorization receipt before any database access", async () => {
    const f = fixture();
    await expect(getOrCreateCheckoutAttempt(f.input)).rejects.toThrow(
      "checkout-authorization-required"
    );
    expect(f.payload.find).not.toHaveBeenCalled();
    expect(f.payload.db.beginTransaction).not.toHaveBeenCalled();
  });
  it("reuses the pending purchase, attempt and guest token after a lost response", async () => {
    const f = fixture();
    markAuthorizedCheckout(f.req, { cartID: "cart-1" });
    const first = await getOrCreateCheckoutAttempt(f.input);
    const second = await getOrCreateCheckoutAttempt({
      ...f.input,
      paymentId: "unused-new-id"
    });
    expect(second.attempt.id).toBe(first.attempt.id);
    expect(second.order.id).toBe(first.order.id);
    expect(second.purchaseAccessToken).toBe(first.purchaseAccessToken);
    expect(f.rows.orders).toHaveLength(1);
    expect(f.rows.transactions).toHaveLength(1);
    expect(first.order).toMatchObject({
      status: "pending",
      lifecycle_status: "pending_payment",
      fulfillment_status: "unfulfilled",
      guest_access_digest: purchaseAccessDigest(first.purchaseAccessToken!)
    });
    expect(first.order.order_ref).not.toBe(
      first.attempt.portone &&
        (first.attempt.portone as { paymentId: string }).paymentId
    );
  });
  it("blocks changed accepted contents rather than creating a second obligation", async () => {
    const f = fixture();
    markAuthorizedCheckout(f.req, { cartID: "cart-1" });
    await getOrCreateCheckoutAttempt(f.input);
    await expect(
      getOrCreateCheckoutAttempt({
        ...f.input,
        snapshot: { ...f.input.snapshot, amount: 240000 }
      })
    ).rejects.toThrow("checkout-review-required");
    expect(f.rows.transactions).toHaveLength(1);
  });
  it.each([null, { id: "buyer-B" }])(
    "cannot replay an account purchase with a shared cart secret as %s",
    async (user) => {
      const f = fixture();
      f.req.user = { id: "buyer-A" } as never;
      markAuthorizedCheckout(f.req, { cartID: "cart-1" });
      await getOrCreateCheckoutAttempt(f.input);
      f.req.user = user as never;
      f.payload.create.mockClear();
      await expect(getOrCreateCheckoutAttempt(f.input)).rejects.toThrow(
        "checkout-authorization-required"
      );
      expect(f.payload.create).not.toHaveBeenCalled();
    }
  );
  it("requires both verified terminal provider state and deliberate retry", async () => {
    const f = fixture();
    markAuthorizedCheckout(f.req, { cartID: "cart-1" });
    await getOrCreateCheckoutAttempt(f.input);
    f.rows.transactions = [{ ...f.rows.transactions[0], status: "failed" }];
    await expect(
      getOrCreateCheckoutAttempt({ ...f.input, retryPayment: true })
    ).rejects.toThrow("payment-retry-review-required");
    f.rows.transactions = [
      {
        ...f.rows.transactions[0],
        provider_verified_at: new Date().toISOString()
      }
    ];
    await expect(getOrCreateCheckoutAttempt(f.input)).rejects.toThrow(
      "payment-retry-review-required"
    );
    await getOrCreateCheckoutAttempt({
      ...f.input,
      paymentId: "pay_2",
      retryPayment: true
    });
    expect(f.rows.orders).toHaveLength(1);
    expect(f.rows.transactions).toHaveLength(2);
  });
});
