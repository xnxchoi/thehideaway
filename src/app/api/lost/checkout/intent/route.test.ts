import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  create: vi.fn(),
  findByID: vi.fn(),
  lockExecute: vi.fn(),
  rollbackTransaction: vi.fn(),
  update: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    create: mocks.create,
    findByID: mocks.findByID,
    update: mocks.update,
    db: {
      beginTransaction: mocks.beginTransaction,
      commitTransaction: mocks.commitTransaction,
      rollbackTransaction: mocks.rollbackTransaction,
      sessions: {
        "tx-1": {
          db: { execute: mocks.lockExecute }
        }
      }
    },
    logger: {
      error: vi.fn()
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

vi.mock("@/lib/api/idempotency", () => ({
  beginIdempotent: vi.fn(() => ({
    get: () => null,
    put: vi.fn(async () => undefined)
  }))
}));

vi.mock("@/lib/lost-commerce/format", () => ({
  makeLostOrderRef: vi.fn(() => "lis_test_order")
}));

function request(
  body: unknown,
  url = "https://hideaway.test/api/lost/checkout/intent"
) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("POST /api/lost/checkout/intent", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", role: "user" }
    });
    mocks.beginTransaction.mockReset().mockResolvedValue("tx-1");
    mocks.commitTransaction.mockReset().mockResolvedValue(undefined);
    mocks.rollbackTransaction.mockReset().mockResolvedValue(undefined);
    mocks.lockExecute.mockReset().mockResolvedValue(undefined);
    mocks.update.mockReset().mockImplementation(async ({ data }) => ({
      id: "product-1",
      ...data
    }));
    mocks.create
      .mockReset()
      .mockImplementation(async ({ collection, data }) => {
        if (collection === "product-orders") {
          return { id: "order-1", order_ref: "lis_test_order", ...data };
        }
        return { id: "payment-1", ...data };
      });
  });

  it("reserves standard product inventory in the order transaction", async () => {
    mocks.findByID.mockReset().mockResolvedValue({
      id: "product-1",
      active: true,
      name: "Jacket",
      slug: "jacket",
      currency: "KRW",
      unit_amount: 120000,
      min_order_quantity: 1,
      max_order_quantity: 5,
      standard_enabled: true,
      stock_state: "in_stock",
      inventory: 3
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 2
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    expect(mocks.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.lockExecute).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        id: "product-1",
        req: expect.objectContaining({ transactionID: "tx-1" }),
        data: expect.objectContaining({ inventory: 1 })
      })
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        req: expect.objectContaining({ transactionID: "tx-1" })
      })
    );
    expect(mocks.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("aggregates duplicate standard lines before decrementing inventory", async () => {
    mocks.findByID.mockReset().mockResolvedValue({
      id: "product-1",
      active: true,
      name: "Jacket",
      slug: "jacket",
      currency: "KRW",
      unit_amount: 120000,
      min_order_quantity: 1,
      max_order_quantity: 5,
      standard_enabled: true,
      stock_state: "in_stock",
      inventory: 5
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 2
          },
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        id: "product-1",
        data: expect.objectContaining({ inventory: 2 })
      })
    );
  });

  it("rolls back when reservation fails after the transactional recheck", async () => {
    mocks.findByID.mockReset().mockResolvedValueOnce({
      id: "product-1",
      active: true,
      name: "Jacket",
      slug: "jacket",
      currency: "KRW",
      unit_amount: 120000,
      min_order_quantity: 1,
      max_order_quantity: 5,
      standard_enabled: true,
      stock_state: "in_stock",
      inventory: 2
    });
    mocks.findByID.mockResolvedValueOnce({
      id: "product-1",
      active: true,
      name: "Jacket",
      slug: "jacket",
      currency: "KRW",
      unit_amount: 120000,
      min_order_quantity: 1,
      max_order_quantity: 5,
      standard_enabled: true,
      stock_state: "in_stock",
      inventory: 1
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 2
          }
        ]
      })
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      ok: false,
      error: "insufficient-inventory"
    });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("includes product details in the PortOne payload", async () => {
    const oldStoreId = process.env.PORTONE_STORE_ID;
    const oldChannelKey = process.env.PORTONE_CHANNEL_KEY;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";

    try {
      mocks.findByID.mockReset().mockResolvedValue({
        id: "product-1",
        active: true,
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 5,
        standard_enabled: true,
        stock_state: "in_stock",
        inventory: 3
      });

      const { POST } = await import("./route");
      const res = await POST(
        request({
          paymentProvider: "portone",
          lines: [
            {
              productId: "product-1",
              mode: "standard_purchase",
              quantity: 1
            }
          ]
        })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        portone: {
          products: [
            {
              id: "product-1",
              name: "Jacket",
              amount: 120000,
              quantity: 1,
              link: "https://hideaway.test/lostinseoul/products/jacket"
            }
          ]
        }
      });
    } finally {
      if (oldStoreId === undefined) delete process.env.PORTONE_STORE_ID;
      else process.env.PORTONE_STORE_ID = oldStoreId;

      if (oldChannelKey === undefined) delete process.env.PORTONE_CHANNEL_KEY;
      else process.env.PORTONE_CHANNEL_KEY = oldChannelKey;

      if (oldCardLive === undefined)
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      else process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
    }
  });

  it("rejects a PortOne card intent when the master gate is off, even with keys present", async () => {
    const oldStoreId = process.env.PORTONE_STORE_ID;
    const oldChannelKey = process.env.PORTONE_CHANNEL_KEY;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    // Keys present (as during sandbox validation) but the gate is NOT on.
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    delete process.env.PORTONE_CARD_CHECKOUT_LIVE;

    try {
      mocks.findByID.mockReset().mockResolvedValue({
        id: "product-1",
        active: true,
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 5,
        standard_enabled: true,
        stock_state: "in_stock",
        inventory: 3
      });

      const { POST } = await import("./route");
      const res = await POST(
        request({
          paymentProvider: "portone",
          lines: [
            { productId: "product-1", mode: "standard_purchase", quantity: 1 }
          ]
        })
      );

      // Dark: 503, and no order/PortOne intent is minted.
      expect(res.status).toBe(503);
      expect(mocks.create).not.toHaveBeenCalled();
    } finally {
      if (oldStoreId === undefined) delete process.env.PORTONE_STORE_ID;
      else process.env.PORTONE_STORE_ID = oldStoreId;

      if (oldChannelKey === undefined) delete process.env.PORTONE_CHANNEL_KEY;
      else process.env.PORTONE_CHANNEL_KEY = oldChannelKey;

      if (oldCardLive === undefined)
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      else process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
    }
  });

  it("omits the LOSTINSEOUL path prefix for branded-host product links", async () => {
    const oldStoreId = process.env.PORTONE_STORE_ID;
    const oldChannelKey = process.env.PORTONE_CHANNEL_KEY;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";

    try {
      mocks.findByID.mockReset().mockResolvedValue({
        id: "product-1",
        active: true,
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 5,
        standard_enabled: true,
        stock_state: "in_stock",
        inventory: 3
      });

      const { POST } = await import("./route");
      const res = await POST(
        request(
          {
            paymentProvider: "portone",
            lines: [
              {
                productId: "product-1",
                mode: "standard_purchase",
                quantity: 1
              }
            ]
          },
          "https://lostinseoul.com/api/lost/checkout/intent"
        )
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        portone: {
          products: [
            {
              id: "product-1",
              name: "Jacket",
              amount: 120000,
              quantity: 1,
              link: "https://lostinseoul.com/products/jacket"
            }
          ]
        }
      });
    } finally {
      if (oldStoreId === undefined) delete process.env.PORTONE_STORE_ID;
      else process.env.PORTONE_STORE_ID = oldStoreId;

      if (oldChannelKey === undefined) delete process.env.PORTONE_CHANNEL_KEY;
      else process.env.PORTONE_CHANNEL_KEY = oldChannelKey;

      if (oldCardLive === undefined)
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      else process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
    }
  });
});
