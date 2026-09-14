import type { Config, PayloadRequest } from "payload";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const adapter = vi.hoisted(() => ({
  initiatePayment: vi.fn(async () => ({
    paymentId: "pay-1",
    transactionID: "tx-1"
  })),
  confirmOrder: vi.fn(async () => ({
    orderID: "order-1",
    transactionID: "tx-1"
  }))
}));
const rateLimit = vi.hoisted(() =>
  vi.fn(async () => ({ ok: true, resetSeconds: 60 }))
);
vi.mock("@/lib/api/rateLimit", () => ({ enforceRateLimit: rateLimit }));
vi.mock("./portone/adapter", () => ({
  portoneAdapter: () => ({
    name: "portone",
    ...adapter,
    group: { name: "portone", type: "group", fields: [] }
  })
}));
vi.mock("payload", async (original) => ({
  ...(await original<typeof import("payload")>()),
  addDataAndFileToRequest: vi.fn(),
  headersWithCors: ({ headers }: { headers: Headers }) => headers
}));
vi.mock("./portone/confirm-order", () => ({
  markAuthorizedBrowserPayment: vi.fn()
}));
vi.mock("./checkout-attempt", () => ({ markAuthorizedCheckout: vi.fn() }));

import { hideawayEcommercePlugin } from "./plugin";
import { replacePortOnePaymentEndpoints } from "./payment-endpoints";

const product = {
  id: "product-1",
  name: "Object",
  slug: "object",
  active: true,
  _status: "published",
  standard_enabled: true,
  enableVariants: true,
  priceInKRW: 1000,
  priceInKRWEnabled: true,
  min_order_quantity: 1,
  max_order_quantity: 3
};
const variant = {
  id: "variant-1",
  product: "product-1",
  sku: "SKU",
  active: true,
  _status: "published",
  priceInKRW: 1200,
  priceInKRWEnabled: true
};

function request(changes: Record<string, unknown> = {}) {
  const cart = {
    id: "cart-1",
    customer: "owner-1",
    currency: "KRW",
    subtotal: 1200,
    items: [
      {
        product: "product-1",
        variant: "variant-1",
        quantity: 1,
        mode: "standard_purchase"
      }
    ]
  };
  const transaction: Record<string, unknown> = {
    id: "tx-1",
    customer: "owner-1",
    cart: "cart-1",
    order: "order-1",
    status: "succeeded",
    items: cart.items
  };
  const records = {
    cart,
    transaction,
    product: { ...product },
    variant: { ...variant }
  };
  const payload = {
    findByID: vi.fn(async ({ collection }: { collection: string }) =>
      collection === "carts"
        ? records.cart
        : collection === "products"
          ? records.product
          : records.variant
    ),
    find: vi.fn(async ({ collection }: { collection: string }) => ({
      docs: [
        collection === "carts"
          ? records.cart
          : collection === "products"
            ? records.product
            : collection === "variants"
              ? records.variant
              : records.transaction
      ]
    })),
    create: vi.fn(),
    update: vi.fn(),
    db: { updateOne: vi.fn() },
    logger: { error: vi.fn() }
  };
  return {
    records,
    payload,
    req: {
      data: {
        cartID: "cart-1",
        paymentId: "pay-1",
        expectedAmount: 1200,
        expectedCurrency: "KRW"
      },
      user: { id: "owner-1", email: "owner@example.test" },
      payload,
      context: {},
      headers: new Headers({ origin: "https://lostinseoul.com" }),
      ...changes
    } as unknown as PayloadRequest
  };
}

async function handler(path: string) {
  const config = await hideawayEcommercePlugin({
    collections: []
  } as unknown as Config);
  const matches = (config.endpoints || []).filter(
    (endpoint) =>
      endpoint.path === `/payments/portone/${path}` &&
      endpoint.method === "post"
  );
  expect(matches).toHaveLength(1);
  return matches[0]!.handler;
}

beforeEach(() => vi.clearAllMocks());
describe("registered commerce payment routes", () => {
  it("reports a catalog database failure as a server failure without leaking details", async () => {
    const fixture = request();
    fixture.payload.find
      .mockResolvedValueOnce({ docs: [fixture.records.cart] })
      .mockRejectedValueOnce(new Error("database connection credentials"));
    const response = await (await handler("initiate"))(fixture.req);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "checkout-failed",
      code: "checkout-failed"
    });
    expect(adapter.initiatePayment).not.toHaveBeenCalled();
  });
  it.each([
    "checkout-review-required",
    "payment-retry-review-required",
    "purchase-not-payable"
  ])("returns a safe conflict for known business outcome %s", async (code) => {
    adapter.initiatePayment.mockRejectedValueOnce(new Error(code));
    const fixture = request();
    const response = await (await handler("initiate"))(fixture.req);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      message: "checkout-review-required",
      code: "checkout-review-required"
    });
  });
  it.each([null, "https://attacker.test", "null"])(
    "rejects untrusted origin %s before any checkout work",
    async (origin) => {
      const fixture = request({
        headers: new Headers(origin ? { origin } : {})
      });
      expect((await (await handler("initiate"))(fixture.req)).status).toBe(403);
      expect(fixture.payload.find).not.toHaveBeenCalled();
      expect(adapter.initiatePayment).not.toHaveBeenCalled();
      expect(rateLimit).not.toHaveBeenCalled();
    }
  );
  it("rate limits before reading carts or calling the provider", async () => {
    rateLimit.mockResolvedValueOnce({ ok: false, resetSeconds: 12 });
    const fixture = request();
    const result = await (await handler("confirm-order"))(fixture.req);
    expect(result.status).toBe(429);
    expect(result.headers.get("retry-after")).toBe("12");
    expect(fixture.payload.find).not.toHaveBeenCalled();
    expect(adapter.confirmOrder).not.toHaveBeenCalled();
  });
  it("fails configuration when expected vendor routes are missing or duplicated", async () => {
    expect(() =>
      replacePortOnePaymentEndpoints(
        { endpoints: [] } as unknown as Config,
        adapter as never
      )
    ).toThrow("exactly one");
    const config = await hideawayEcommercePlugin({
      collections: []
    } as unknown as Config);
    const endpoints = config.endpoints || [];
    expect(() =>
      replacePortOnePaymentEndpoints(
        { ...config, endpoints: [...endpoints, endpoints[0]!] },
        adapter as never
      )
    ).toThrow("exactly one");
  });
  it("rejects a foreign already-paid transaction before the adapter", async () => {
    const fixture = request();
    fixture.records.transaction.customer = "someone-else";
    const response = await (await handler("confirm-order"))(fixture.req);
    expect(response.status).toBe(403);
    expect(adapter.confirmOrder).not.toHaveBeenCalled();
    expect(fixture.payload.db.updateOne).not.toHaveBeenCalled();
  });
  it("validates variant-bearing carts against the authoritative product", async () => {
    const fixture = request();
    fixture.records.product.active = false;
    const response = await (await handler("initiate"))(fixture.req);
    expect(response.status).toBe(400);
    expect(adapter.initiatePayment).not.toHaveBeenCalled();
  });
  it("rejects a foreign variant and stale totals", async () => {
    const fixture = request();
    fixture.records.variant.product = "other-product";
    expect((await (await handler("initiate"))(fixture.req)).status).toBe(400);
    fixture.records.variant.product = "product-1";
    fixture.records.cart.subtotal = 1;
    expect((await (await handler("initiate"))(fixture.req)).status).toBe(400);
    expect(adapter.initiatePayment).not.toHaveBeenCalled();
  });
  it("confirms through the adapter without vendor inventory writes", async () => {
    const fixture = request();
    expect((await (await handler("confirm-order"))(fixture.req)).status).toBe(
      200
    );
    expect(adapter.confirmOrder).toHaveBeenCalledOnce();
    expect(fixture.payload.db.updateOne).not.toHaveBeenCalled();
  });
  it("rejects a guest capability mismatch before paid replay and does not trust body privilege flags", async () => {
    const fixture = request({
      user: null,
      data: {
        paymentId: "pay-1",
        customerEmail: "owner@example.test",
        trusted: true,
        purchaseAccessToken: "wrong"
      }
    });
    fixture.records.transaction.customer = null;
    fixture.records.transaction.guest_access_digest = createHash("sha256")
      .update("capability")
      .digest("hex");
    expect((await (await handler("confirm-order"))(fixture.req)).status).toBe(
      403
    );
    expect(adapter.confirmOrder).not.toHaveBeenCalled();
  });
  it("retains guest confirmation after cart merge through a purchase-scoped capability", async () => {
    const fixture = request({
      user: { id: "new-login" },
      data: { paymentId: "pay-1", purchaseAccessToken: "capability" }
    });
    Object.assign(fixture.records.transaction, {
      customer: null,
      cart: null,
      checkout_snapshot: { cartID: "original-cart" },
      guest_access_digest: createHash("sha256")
        .update("capability")
        .digest("hex")
    });
    expect((await (await handler("confirm-order"))(fixture.req)).status).toBe(
      200
    );
    expect(adapter.confirmOrder).toHaveBeenCalledOnce();
  });
  it("rejects a different cart binding even for the transaction owner", async () => {
    const fixture = request({
      data: { paymentId: "pay-1", cartID: "different-cart" }
    });
    expect((await (await handler("confirm-order"))(fixture.req)).status).toBe(
      403
    );
    expect(adapter.confirmOrder).not.toHaveBeenCalled();
  });
  it("passes authoritative snapshots and shipping address without accepting client prices", async () => {
    const fixture = request({
      data: {
        cartID: "cart-1",
        shippingAddress: { city: "Seoul" },
        expectedAmount: 1200,
        expectedCurrency: "KRW"
      }
    });
    const result = await (await handler("initiate"))(fixture.req);
    expect(result.status).toBe(200);
    expect(adapter.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkoutSnapshot: expect.objectContaining({
            amount: 1200,
            shippingAddress: { city: "Seoul" }
          })
        })
      })
    );
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, undefined])(
    "rejects unsafe quantity %s",
    async (quantity) => {
      const fixture = request();
      fixture.records.cart.items[0]!.quantity = quantity as number;
      expect((await (await handler("initiate"))(fixture.req)).status).toBe(400);
      expect(adapter.initiatePayment).not.toHaveBeenCalled();
    }
  );
  it.each(["draft", undefined])(
    "rejects a variant without published state %s",
    async (status) => {
      const fixture = request();
      fixture.records.variant._status = status as string;
      expect((await (await handler("initiate"))(fixture.req)).status).toBe(400);
      expect(adapter.initiatePayment).not.toHaveBeenCalled();
    }
  );
  it("returns only a safe code for an adapter error", async () => {
    adapter.confirmOrder.mockRejectedValueOnce(
      new Error("database password secret")
    );
    const fixture = request();
    const response = await (await handler("confirm-order"))(fixture.req);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "checkout-failed",
      code: "checkout-failed"
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([undefined, 1, "1200"])(
    "rejects an unreviewed/stale displayed total %s",
    async (expectedAmount) => {
      const fixture = request({
        data: { cartID: "cart-1", expectedAmount, expectedCurrency: "KRW" }
      });
      expect((await (await handler("initiate"))(fixture.req)).status).toBe(409);
      expect(adapter.initiatePayment).not.toHaveBeenCalled();
    }
  );
});
