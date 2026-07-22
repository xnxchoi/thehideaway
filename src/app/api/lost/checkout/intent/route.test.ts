import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  beginTransaction: vi.fn(),
  claimCommerceCommand: vi.fn(),
  claimRequestOrderCapacity: vi.fn(),
  commitTransaction: vi.fn(),
  completeCommerceCommand: vi.fn(),
  create: vi.fn(),
  createLocalReq: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  loggerError: vi.fn(),
  lockExecute: vi.fn(),
  lockEvents: [] as string[],
  productInventoryLock: vi.fn(),
  productSkuMutationLock: vi.fn(),
  requireInventoryReservationPolicyForCheckout: vi.fn(),
  reserveCheckoutOrderInventoryInTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
  update: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  createLocalReq: mocks.createLocalReq,
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    create: mocks.create,
    find: async (args: { collection: string }) => {
      mocks.lockEvents.push(`find:${args.collection}`);
      return mocks.find(args);
    },
    findByID: async (args: { collection: string; id?: string }) => {
      mocks.lockEvents.push(`read:${args.collection}:${args.id ?? ""}`);
      const doc = await mocks.findByID(args);
      if (args.collection === "products") {
        return { storefront: "lostinseoul", ...doc };
      }
      if (args.collection !== "product-variants") return doc;
      return {
        id: args.id ?? doc.id ?? "sku-1",
        product: doc.product ?? "product-1",
        active: doc.active,
        sku: "LIS-SKU-1",
        label: null,
        options: [],
        stock_state: doc.stock_state,
        inventory: doc.inventory
      };
    },
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
      error: mocks.loggerError
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

vi.mock("@/lib/db/sequences", () => ({
  productInventoryLock: mocks.productInventoryLock,
  productSkuMutationLock: mocks.productSkuMutationLock
}));

vi.mock("@/lib/lost-commerce/commerce-commands", () => ({
  claimCommerceCommand: mocks.claimCommerceCommand,
  completeCommerceCommand: mocks.completeCommerceCommand,
  hashCommerceCommandInput: vi.fn(() => "a".repeat(64)),
  validateCommerceCommandKey: vi.fn((value) => {
    if (!value) throw new Error("commerce-command-key-required");
    return value;
  })
}));

vi.mock("@/lib/lost-commerce/campaigns", () => ({
  claimRequestOrderCapacity: mocks.claimRequestOrderCapacity
}));

vi.mock("@/lib/lost-commerce/inventory-reservations", () => ({
  requireInventoryReservationPolicyForCheckout:
    mocks.requireInventoryReservationPolicyForCheckout
}));

vi.mock("@/lib/lost-commerce/checkout-inventory-reservations", () => ({
  reserveCheckoutOrderInventoryInTransaction:
    mocks.reserveCheckoutOrderInventoryInTransaction
}));

vi.mock("@/lib/lost-commerce/format", () => ({
  makeLostOrderRef: vi.fn(() => "lis_test_order")
}));

function request(
  body: unknown,
  url = "https://hideaway.test/api/lost/checkout/intent"
) {
  const value = body as { lines?: Array<Record<string, unknown>> };
  const requestBody = Array.isArray(value?.lines)
    ? {
        ...(body as Record<string, unknown>),
        lines: value.lines.map((line) => ({
          skuId: "sku-1",
          ...line
        }))
      }
    : body;
  return new NextRequest(url, {
    method: "POST",
    headers: { "idempotency-key": "checkout_key_123456" },
    body: JSON.stringify(requestBody)
  });
}

const originalManualPaymentLive = process.env.LOST_MANUAL_PAYMENT_LIVE;

describe("POST /api/lost/checkout/intent", () => {
  beforeEach(() => {
    process.env.LOST_MANUAL_PAYMENT_LIVE = "true";
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", role: "user" }
    });
    mocks.beginTransaction.mockReset().mockResolvedValue("tx-1");
    mocks.claimCommerceCommand.mockReset().mockResolvedValue({
      kind: "claimed",
      businessKey: "lis_test_order",
      requestHash: "b".repeat(64),
      leaseToken: "lease-token",
      leaseExpiresAt: "2026-07-21T08:05:00.000Z"
    });
    mocks.claimRequestOrderCapacity.mockReset().mockResolvedValue(undefined);
    mocks.commitTransaction.mockReset().mockResolvedValue(undefined);
    mocks.completeCommerceCommand.mockReset().mockResolvedValue({
      businessKey: "lis_test_order",
      response: { ok: true }
    });
    mocks.createLocalReq
      .mockReset()
      .mockImplementation(async ({ req, user }, payload) => ({
        ...req,
        context: { user },
        headers: req?.headers ?? new Headers(),
        payload,
        user
      }));
    mocks.rollbackTransaction.mockReset().mockResolvedValue(undefined);
    mocks.find.mockReset().mockResolvedValue({
      docs: [],
      hasNextPage: false,
      limit: 100,
      page: 1,
      totalDocs: 0,
      totalPages: 1
    });
    mocks.lockExecute.mockReset().mockResolvedValue(undefined);
    mocks.lockEvents.length = 0;
    mocks.productInventoryLock
      .mockReset()
      .mockImplementation(async (_payload, _transactionID, productId) => {
        mocks.lockEvents.push(`product:${productId}`);
      });
    mocks.productSkuMutationLock
      .mockReset()
      .mockImplementation(async (_payload, _transactionID, skuId) => {
        mocks.lockEvents.push(`sku:${skuId}`);
      });
    mocks.requireInventoryReservationPolicyForCheckout
      .mockReset()
      .mockReturnValue({
        locationId: "location-1",
        safetyStock: 0,
        ttlMinutes: 15
      });
    mocks.reserveCheckoutOrderInventoryInTransaction
      .mockReset()
      .mockResolvedValue(undefined);
    mocks.loggerError.mockReset();
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

  afterEach(() => {
    if (originalManualPaymentLive === undefined) {
      delete process.env.LOST_MANUAL_PAYMENT_LIVE;
    } else {
      process.env.LOST_MANUAL_PAYMENT_LIVE = originalManualPaymentLive;
    }
  });

  it("rejects manual payment while its policy gate is disabled", async () => {
    delete process.env.LOST_MANUAL_PAYMENT_LIVE;
    const { POST } = await import("./route");

    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      ok: false,
      error: "payment-method-unavailable"
    });
    expect(mocks.claimCommerceCommand).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("requires an idempotency key before commerce writes", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("https://hideaway.test/api/lost/checkout/intent", {
        method: "POST",
        body: JSON.stringify({
          paymentProvider: "manual",
          lines: [
            {
              productId: "product-1",
              mode: "standard_purchase",
              quantity: 1
            }
          ]
        })
      })
    );

    expect(res.status).toBe(400);
    expect(mocks.claimCommerceCommand).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("replays a completed durable command without commerce writes", async () => {
    mocks.claimCommerceCommand.mockResolvedValue({
      kind: "replay",
      businessKey: "lis_test_order",
      response: {
        ok: true,
        order: { id: "order-1", order_ref: "lis_test_order" },
        paymentProvider: "manual",
        portone: null
      }
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
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
    expect(res.headers.get("Idempotent-Replay")).toBe("true");
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects a reused key with a different request hash", async () => {
    mocks.claimCommerceCommand.mockResolvedValue({ kind: "conflict" });

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
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks standard inventory reservation policy before claiming the command", async () => {
    mocks.requireInventoryReservationPolicyForCheckout.mockImplementation(
      () => {
        throw new Error("inventory-reservations-unavailable");
      }
    );

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(
      mocks.requireInventoryReservationPolicyForCheckout
    ).toHaveBeenCalledWith({ paymentProvider: "manual" });
    expect(res.status).toBe(503);
    expect(mocks.claimCommerceCommand).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates an expiring standard inventory reservation without mutating the SKU scalar", async () => {
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
    expect(mocks.createLocalReq).toHaveBeenCalledWith(
      {
        req: {
          headers: expect.any(Headers),
          transactionID: "tx-1"
        },
        user: expect.objectContaining({ id: "user-1" })
      },
      expect.anything()
    );
    expect(mocks.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.productInventoryLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "product-1"
    );
    expect(mocks.productSkuMutationLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "sku-1"
    );
    expect(mocks.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "product-variants" })
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        req: expect.objectContaining({ transactionID: "tx-1" }),
        data: expect.objectContaining({ expires_at: expect.any(String) })
      })
    );
    expect(
      mocks.reserveCheckoutOrderInventoryInTransaction
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.anything(),
        req: expect.objectContaining({ transactionID: "tx-1" }),
        order: expect.objectContaining({
          id: "order-1",
          expires_at: expect.any(String)
        }),
        lines: [expect.objectContaining({ skuId: "sku-1", quantity: 2 })]
      })
    );
    expect(mocks.completeCommerceCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        commandKey: "a".repeat(64),
        requestHash: "b".repeat(64),
        leaseToken: "lease-token",
        req: expect.objectContaining({ transactionID: "tx-1" }),
        resource: { type: "product-order", id: "order-1" }
      })
    );
    expect(mocks.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("locks sorted products and SKUs before the first relational SKU read", async () => {
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "product-variants") {
        return {
          id,
          product: id === "sku-a" ? "product-a" : "product-b",
          active: true,
          stock_state: "in_stock",
          inventory: 3
        };
      }
      return {
        id,
        active: true,
        name: `Product ${id}`,
        slug: id,
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 5,
        standard_enabled: true,
        stock_state: "in_stock",
        inventory: 3
      };
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-b",
            skuId: "sku-b",
            mode: "standard_purchase",
            quantity: 1
          },
          {
            productId: "product-a",
            skuId: "sku-a",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    expect(mocks.lockEvents.slice(0, 4)).toEqual([
      "product:product-a",
      "product:product-b",
      "sku:sku-a",
      "sku:sku-b"
    ]);
    expect(
      mocks.lockEvents.findIndex((event) =>
        event.startsWith("read:product-variants:")
      )
    ).toBeGreaterThan(mocks.lockEvents.indexOf("sku:sku-b"));
  });

  it("claims request-to-order capacity after resolution and before order creation", async () => {
    const events: string[] = [];
    mocks.claimRequestOrderCapacity.mockImplementation(async () => {
      events.push("capacity");
    });
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "product-order-campaigns") {
        return {
          id,
          product: "product-1",
          state: "open",
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          maximum_commitments: null,
          paid_commitments: 0,
          eligible_skus: ["sku-1"]
        };
      }
      if (collection === "product-variants") {
        return {
          id,
          product: "product-1",
          active: true,
          stock_state: "pre_order",
          inventory: null
        };
      }
      return {
        id,
        active: true,
        name: "Campaign product",
        slug: "campaign-product",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 1,
        request_to_order_enabled: true
      };
    });
    mocks.create.mockImplementation(async ({ collection, data }) => {
      if (collection === "product-orders") {
        events.push("order");
        return { id: "order-1", order_ref: "lis_test_order", ...data };
      }
      return { id: "payment-1", ...data };
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    expect(mocks.productInventoryLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "product-1"
    );
    expect(mocks.productSkuMutationLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "sku-1"
    );
    expect(mocks.lockEvents.indexOf("product:product-1")).toBeLessThan(
      mocks.lockEvents.indexOf("sku:sku-1")
    );
    expect(mocks.lockEvents.indexOf("sku:sku-1")).toBeLessThan(
      mocks.lockEvents.findIndex((event) =>
        event.startsWith("read:product-order-campaigns:")
      )
    );
    expect(mocks.claimRequestOrderCapacity).toHaveBeenCalledWith({
      payload: expect.anything(),
      campaignId: "campaign-1",
      productId: "product-1",
      skuIds: ["sku-1"],
      req: expect.objectContaining({ transactionID: "tx-1" })
    });
    expect(events).toEqual(["capacity", "order"]);
  });

  it("returns 503 when finite campaign reservations are unavailable", async () => {
    mocks.claimRequestOrderCapacity.mockRejectedValue(
      new Error("campaign-capacity-reservations-unavailable")
    );
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "product-order-campaigns") {
        return {
          id,
          product: "product-1",
          state: "open",
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          maximum_commitments: 1,
          paid_commitments: 0,
          eligible_skus: ["sku-1"]
        };
      }
      if (collection === "product-variants") {
        return {
          id,
          product: "product-1",
          active: true,
          stock_state: "pre_order",
          inventory: null
        };
      }
      return {
        id,
        active: true,
        name: "Campaign product",
        slug: "campaign-product",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 1,
        request_to_order_enabled: true
      };
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      ok: false,
      error: "campaign-capacity-reservations-unavailable"
    });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("locks a canonical SKU discovered from a legacy variant reference before final resolution", async () => {
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "products") {
        return {
          id,
          active: true,
          name: "Legacy product",
          slug: "legacy-product",
          currency: "KRW",
          unit_amount: 120000,
          min_order_quantity: 1,
          max_order_quantity: 5,
          standard_enabled: true,
          stock_state: "in_stock",
          inventory: 3
        };
      }
      return {
        id,
        product: "product-1",
        active: true,
        stock_state: "in_stock",
        inventory: 3
      };
    });
    mocks.find.mockResolvedValue({
      docs: [
        {
          id: "sku-canonical",
          product: "product-1",
          active: true,
          sku: "LIS-CANONICAL",
          label: null,
          options: [],
          legacy_variant_ref: "legacy-small",
          stock_state: "in_stock",
          inventory: 3
        }
      ],
      hasNextPage: false,
      limit: 2,
      page: 1,
      totalDocs: 1,
      totalPages: 1
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            skuId: undefined,
            variantId: "legacy-small",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(200);
    expect(mocks.productSkuMutationLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "sku-canonical"
    );
    const firstDiscovery = mocks.lockEvents.indexOf("find:product-variants");
    const skuLock = mocks.lockEvents.indexOf("sku:sku-canonical");
    const finalResolution = mocks.lockEvents.indexOf(
      "find:product-variants",
      firstDiscovery + 1
    );
    expect(firstDiscovery).toBeGreaterThan(
      mocks.lockEvents.indexOf("product:product-1")
    );
    expect(skuLock).toBeGreaterThan(firstDiscovery);
    expect(finalResolution).toBeGreaterThan(skuLock);
  });

  it("rejects non-integer server totals before creating commerce records", async () => {
    mocks.findByID.mockReset().mockResolvedValue({
      id: "product-1",
      active: true,
      name: "Jacket",
      slug: "jacket",
      currency: "KRW",
      unit_amount: 1000.5,
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
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "invalid-sku-price"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects direct private checkout without a complete positive preset", async () => {
    mocks.findByID.mockReset().mockResolvedValue({
      id: "product-1",
      active: true,
      name: "Private item",
      slug: "private-item",
      currency: "KRW",
      unit_amount: 120000,
      min_order_quantity: 1,
      max_order_quantity: 1,
      private_order_enabled: true,
      private_preset_price_enabled: false
    });

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "private_order",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid-sku-price" });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a client error when a standard checkout line includes a campaign", async () => {
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
    const response = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "campaign-not-allowed"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("passes the resolved aggregate to the reservation service without scalar writes", async () => {
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
    expect(
      mocks.reserveCheckoutOrderInventoryInTransaction
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [expect.objectContaining({ skuId: "sku-1", quantity: 3 })]
      })
    );
    expect(mocks.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "product-variants" })
    );
  });

  it("rolls back when reservation fails after the transactional recheck", async () => {
    mocks.reserveCheckoutOrderInventoryInTransaction.mockRejectedValueOnce(
      new Error("insufficient-available-to-promise")
    );
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
      inventory: 2
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
      error: "insufficient-available-to-promise"
    });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "product-orders" })
    );
    expect(mocks.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "product-payments" })
    );
  });

  it("rolls back when local Payload request construction fails", async () => {
    mocks.createLocalReq.mockRejectedValueOnce(
      new Error("request-init-failed")
    );

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "checkout-failed" });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.productInventoryLock).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a generic 500 without logging an unexpected raw error", async () => {
    const attackerControlledMessage = "attacker-input-required";
    mocks.findByID.mockRejectedValue(new Error(attackerControlledMessage));

    const { POST } = await import("./route");
    const res = await POST(
      request({
        paymentProvider: "manual",
        lines: [
          {
            productId: "product-1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "checkout-failed" });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[lost/checkout/intent] transaction failed"
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      attackerControlledMessage
    );
  });

  it("includes product details in the PortOne payload", async () => {
    const oldStoreId = process.env.PORTONE_STORE_ID;
    const oldChannelKey = process.env.PORTONE_CHANNEL_KEY;
    const oldApiSecret = process.env.PORTONE_API_SECRET;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    process.env.PORTONE_API_SECRET = "api-secret";
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
              id: "product-1:sku-1",
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

      if (oldApiSecret === undefined) delete process.env.PORTONE_API_SECRET;
      else process.env.PORTONE_API_SECRET = oldApiSecret;

      if (oldCardLive === undefined)
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      else process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
    }
  });

  it("does not replay a prior PortOne intent after the master gate is disabled", async () => {
    const oldStoreId = process.env.PORTONE_STORE_ID;
    const oldChannelKey = process.env.PORTONE_CHANNEL_KEY;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
    mocks.claimCommerceCommand.mockResolvedValue({
      kind: "replay",
      response: {
        ok: true,
        provider: "portone",
        payment: { storeId: "store-test", channelKey: "channel-test" }
      }
    });

    try {
      const { POST } = await import("./route");
      const response = await POST(
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

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        ok: false,
        error: "portone-not-configured"
      });
      expect(mocks.claimCommerceCommand).not.toHaveBeenCalled();
    } finally {
      process.env.PORTONE_STORE_ID = oldStoreId;
      process.env.PORTONE_CHANNEL_KEY = oldChannelKey;
      if (oldCardLive === undefined) {
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      } else {
        process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
      }
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
      expect(await res.json()).toEqual({
        ok: false,
        error: "portone-not-configured"
      });
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
    const oldApiSecret = process.env.PORTONE_API_SECRET;
    const oldCardLive = process.env.PORTONE_CARD_CHECKOUT_LIVE;
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    process.env.PORTONE_API_SECRET = "api-secret";
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
              id: "product-1:sku-1",
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

      if (oldApiSecret === undefined) delete process.env.PORTONE_API_SECRET;
      else process.env.PORTONE_API_SECRET = oldApiSecret;

      if (oldCardLive === undefined)
        delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
      else process.env.PORTONE_CARD_CHECKOUT_LIVE = oldCardLive;
    }
  });
});
