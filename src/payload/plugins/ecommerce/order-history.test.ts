import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { getCustomerOrder, listCustomerOrders } from "./order-history";

const token = "guest-purchase-token";
const order = {
  id: "order-1",
  order_ref: "LOST-1",
  customer: "alice",
  createdAt: "2026-09-14T00:00:00Z",
  payment_status: "pending",
  lifecycle_status: "pending_payment",
  fulfillment_status: "unfulfilled",
  guest_access_digest: createHash("sha256").update(token).digest("hex"),
  checkout_snapshot: {
    currency: "KRW",
    amount: 3000,
    shippingAddress: {
      firstName: "Alice",
      addressLine1: "Seoul",
      secret: "never"
    },
    deliveryNote: "Door",
    items: [
      {
        product_name: "Original A",
        quantity: 1,
        unit_amount: 1000,
        line_amount: 1000,
        options: [{ label: "Size", value: "S" }]
      },
      {
        product_name: "Original B",
        quantity: 2,
        unit_amount: 1000,
        line_amount: 2000
      }
    ]
  },
  items: [{ product_name: "Changed catalog", quantity: 9 }],
  provider_outcome: { secret: "never" }
};
function database(docs = [order]) {
  return {
    find: vi
      .fn()
      .mockResolvedValue({
        docs,
        page: 2,
        totalPages: 3,
        totalDocs: 41,
        hasNextPage: true,
        hasPrevPage: true
      })
  };
}

describe("customer order history", () => {
  it("scopes the actual query to the authenticated owner with bounded stable pagination", async () => {
    const payload = database();
    const result = await listCustomerOrders(payload as never, "alice", "2");
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        depth: 0,
        limit: 20,
        page: 2,
        sort: ["-createdAt", "-id"],
        where: { customer: { equals: "alice" } }
      })
    );
    expect(result.orders).toHaveLength(1);
    expect(JSON.stringify(result)).not.toMatch(
      /guest_access|provider_outcome|shippingAddress|Seoul/
    );
  });
  it.each(["0", "-1", "1.5", "10001", "abc", ["1", "2"]])(
    "rejects invalid pagination %s without querying",
    async (page) => {
      const payload = database();
      await expect(
        listCustomerOrders(payload as never, "alice", page)
      ).rejects.toThrow("invalid-order-page");
      expect(payload.find).not.toHaveBeenCalled();
    }
  );
  it("never lists guest purchases from a capability or email", async () => {
    const payload = database();
    await expect(
      listCustomerOrders(payload as never, undefined)
    ).rejects.toThrow("order-auth-required");
    expect(payload.find).not.toHaveBeenCalled();
  });
  it("returns every immutable line and explicit address fields", async () => {
    const result = await getCustomerOrder(database() as never, {
      orderRef: "LOST-1",
      customerID: "alice"
    });
    expect(result?.items.map((item) => item.productName)).toEqual([
      "Original A",
      "Original B"
    ]);
    expect(result?.shippingAddress).toEqual({
      firstName: "Alice",
      addressLine1: "Seoul"
    });
    expect(JSON.stringify(result)).not.toMatch(
      /Changed catalog|never|guest_access_digest/
    );
  });
  it("denies a non-owner even with a guest token on an account purchase", async () => {
    await expect(
      getCustomerOrder(database() as never, {
        orderRef: "LOST-1",
        customerID: "bob",
        purchaseAccessToken: token
      })
    ).resolves.toBeNull();
  });
  it("allows a capability only for its guest order", async () => {
    const payload = database([{ ...order, customer: null } as never]);
    await expect(
      getCustomerOrder(payload as never, {
        orderRef: "LOST-1",
        purchaseAccessToken: token
      })
    ).resolves.toMatchObject({ orderRef: "LOST-1" });
    await expect(
      getCustomerOrder(payload as never, {
        orderRef: "LOST-1",
        purchaseAccessToken: "wrong"
      })
    ).resolves.toBeNull();
  });
  it("rejects anonymous detail without querying and does not hide database errors", async () => {
    const payload = database();
    expect(
      await getCustomerOrder(payload as never, { orderRef: "LOST-1" })
    ).toBeNull();
    expect(payload.find).not.toHaveBeenCalled();
    payload.find.mockRejectedValue(new Error("database failed"));
    await expect(listCustomerOrders(payload as never, "alice")).rejects.toThrow(
      "database failed"
    );
  });
});
