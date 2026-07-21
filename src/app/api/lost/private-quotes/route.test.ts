import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  create: vi.fn(),
  findByID: vi.fn(),
  isSameOrigin: vi.fn(),
  lockEvents: [] as string[],
  loggerError: vi.fn(),
  productInventoryLock: vi.fn(),
  productSkuMutationLock: vi.fn(),
  rateLimitOr429: vi.fn(),
  rollbackTransaction: vi.fn(),
  resolveLostCheckout: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    create: mocks.create,
    db: {
      beginTransaction: mocks.beginTransaction,
      commitTransaction: mocks.commitTransaction,
      rollbackTransaction: mocks.rollbackTransaction
    },
    findByID: mocks.findByID,
    logger: { error: mocks.loggerError }
  }))
}));

vi.mock("@/lib/db/sequences", () => ({
  productInventoryLock: mocks.productInventoryLock,
  productSkuMutationLock: mocks.productSkuMutationLock
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: mocks.isSameOrigin
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));

vi.mock("@/lib/lost-commerce/format", () => ({
  makeLostOrderRef: vi.fn(() => "lis_quote_test")
}));

vi.mock("@/lib/lost-commerce/cart", () => ({
  resolveLostCheckout: mocks.resolveLostCheckout
}));

function request(body: unknown) {
  return new NextRequest("https://hideaway.test/api/lost/private-quotes", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

const skuSnapshot = Object.freeze({
  schemaVersion: 2 as const,
  productId: "product-1",
  productName: "CATALYST 01",
  productSlug: "catalyst-01",
  skuId: "sku-1",
  variantId: "sku-1",
  sku: "LIS-CATALYST-01",
  skuLabel: null,
  options: Object.freeze([{ key: "Size", value: "50 ml" }]),
  currency: "KRW" as const,
  unitAmount: 180000,
  quantity: 2,
  lineAmount: 360000,
  weightGrams: null,
  dimensions: null,
  taxCategory: null,
  mode: "private_order" as const
});

describe("POST /api/lost/private-quotes", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", role: "patron" }
    });
    mocks.beginTransaction.mockReset().mockResolvedValue("tx-1");
    mocks.commitTransaction.mockReset().mockResolvedValue(undefined);
    mocks.rollbackTransaction.mockReset().mockResolvedValue(undefined);
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
    mocks.findByID.mockReset().mockImplementation(async () => {
      mocks.lockEvents.push("read:product");
      return {
        id: "product-1",
        name: "CATALYST 01",
        private_order_enabled: true,
        private_preset_price_enabled: true,
        private_unit_amount: 180000
      };
    });
    mocks.resolveLostCheckout.mockReset().mockImplementation(async () => {
      mocks.lockEvents.push("resolve");
      return {
        mode: "private_order",
        currency: "KRW",
        subtotalAmount: 360000,
        totalAmount: 360000,
        lines: [skuSnapshot]
      };
    });
    mocks.create.mockReset().mockImplementation(async ({ data }) => ({
      id: "order-1",
      ...data
    }));
    mocks.loggerError.mockReset();
    mocks.isSameOrigin.mockReset().mockReturnValue(true);
    mocks.rateLimitOr429.mockReset().mockResolvedValue(null);
  });

  it("rejects a cross-origin request before authentication or writes", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "bad-origin" });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a rate-limit response before product lookup or writes", async () => {
    mocks.rateLimitOr429.mockResolvedValue(
      Response.json({ ok: false, error: "rate-limited" }, { status: 429 })
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(429);
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("requires an authenticated user before reading product data", async () => {
    mocks.auth.mockResolvedValue({ user: null });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unauthorized"
    });
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects invalid request data before product or order writes", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "", skuId: "", quantity: 100 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "bad-request"
    });
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects products that do not allow private orders", async () => {
    mocks.findByID.mockResolvedValue({
      id: "product-1",
      private_order_enabled: false
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "private-order-unavailable"
    });
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("resolves the relational SKU and stores its version-2 snapshot", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        productId: "product-1",
        skuId: "sku-1",
        variantId: "legacy-variant",
        quantity: 2,
        note: "Gift packaging",
        shipping: { country: "KR" },
        contact: { email: "buyer@example.com" }
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.resolveLostCheckout).toHaveBeenCalledWith({
      payload: expect.any(Object),
      user: { id: "user-1", role: "patron" },
      allowUnpricedPrivateOrder: true,
      req: expect.objectContaining({ transactionID: "tx-1", context: {} }),
      lines: [
        {
          productId: "product-1",
          skuId: "sku-1",
          variantId: "legacy-variant",
          mode: "private_order",
          quantity: 2
        }
      ]
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        overrideAccess: true,
        data: expect.objectContaining({
          line_snapshot_version: 2,
          lines: [skuSnapshot],
          shipping: { country: "KR" },
          contact: { email: "buyer@example.com" },
          quote: { state: "requested", note: "Gift packaging" }
        })
      })
    );
  });

  it("locks the product and canonical SKU before authoritative quote resolution", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(200);
    expect(mocks.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.lockEvents).toEqual([
      "product:product-1",
      "sku:sku-1",
      "read:product",
      "resolve"
    ]);
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
    expect(mocks.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        id: "product-1",
        req: expect.objectContaining({ transactionID: "tx-1", context: {} })
      })
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        req: expect.objectContaining({ transactionID: "tx-1", context: {} })
      })
    );
    expect(mocks.commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled();
  });

  it("discovers a legacy variant then locks and re-resolves its canonical SKU", async () => {
    let resolveCount = 0;
    mocks.resolveLostCheckout.mockImplementation(async () => {
      resolveCount += 1;
      mocks.lockEvents.push(`resolve:${resolveCount}`);
      return {
        mode: "private_order",
        currency: "KRW",
        subtotalAmount: 360000,
        totalAmount: 360000,
        lines: [skuSnapshot]
      };
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({
        productId: "product-1",
        variantId: "legacy-variant",
        quantity: 2
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.lockEvents).toEqual([
      "product:product-1",
      "resolve:1",
      "sku:sku-1",
      "read:product",
      "resolve:2"
    ]);
    expect(mocks.resolveLostCheckout).toHaveBeenCalledTimes(2);
    expect(mocks.resolveLostCheckout).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        req: expect.objectContaining({ transactionID: "tx-1" }),
        lines: [
          expect.objectContaining({
            productId: "product-1",
            skuId: undefined,
            variantId: "legacy-variant"
          })
        ]
      })
    );
  });

  it("rolls back when locked product eligibility has changed", async () => {
    mocks.findByID.mockImplementation(async () => {
      mocks.lockEvents.push("read:product");
      return {
        id: "product-1",
        private_order_enabled: false
      };
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "private-order-unavailable"
    });
    expect(mocks.lockEvents).toEqual([
      "product:product-1",
      "sku:sku-1",
      "read:product"
    ]);
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.commitTransaction).not.toHaveBeenCalled();
  });

  it("rolls back when authoritative resolution returns no quote line", async () => {
    mocks.resolveLostCheckout.mockResolvedValue({
      mode: "private_order",
      currency: "KRW",
      subtotalAmount: 0,
      totalAmount: 0,
      lines: []
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "sku-not-found"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.commitTransaction).not.toHaveBeenCalled();
  });

  it("retains the client error when rollback itself fails", async () => {
    mocks.resolveLostCheckout.mockRejectedValue(new Error("sku-not-found"));
    mocks.rollbackTransaction.mockRejectedValue(new Error("rollback-failed"));
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "sku-not-found"
    });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("rejects a legacy variant that re-resolves to an unlocked SKU", async () => {
    mocks.resolveLostCheckout
      .mockResolvedValueOnce({
        mode: "private_order",
        currency: "KRW",
        subtotalAmount: 360000,
        totalAmount: 360000,
        lines: [skuSnapshot]
      })
      .mockResolvedValueOnce({
        mode: "private_order",
        currency: "KRW",
        subtotalAmount: 360000,
        totalAmount: 360000,
        lines: [{ ...skuSnapshot, skuId: "sku-2", variantId: "sku-2" }]
      });
    const { POST } = await import("./route");

    const response = await POST(
      request({
        productId: "product-1",
        variantId: "legacy-variant",
        quantity: 2
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "sku-not-found"
    });
    expect(mocks.productSkuMutationLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "sku-1"
    );
    expect(mocks.productSkuMutationLock).not.toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "sku-2"
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("keeps preset SKU amounts in the stored quote snapshot", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: "KRW",
          subtotal_amount: 360000,
          total_amount: 360000,
          lines: [
            expect.objectContaining({
              schemaVersion: 2,
              skuId: "sku-1",
              unitAmount: 180000,
              lineAmount: 360000
            })
          ]
        })
      })
    );
  });

  it("persists the resolved currency and totals for a preset-price quote", async () => {
    const usdSnapshot = Object.freeze({
      ...skuSnapshot,
      currency: "USD" as const,
      unitAmount: 140,
      lineAmount: 280
    });
    mocks.resolveLostCheckout.mockResolvedValue({
      mode: "private_order",
      currency: "USD",
      subtotalAmount: 280,
      totalAmount: 280,
      lines: [usdSnapshot]
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: "USD",
          subtotal_amount: 280,
          total_amount: 280,
          lines: [usdSnapshot]
        })
      })
    );
  });

  it("keeps the authoritative resolved price when the first read was quote-only", async () => {
    mocks.findByID.mockResolvedValue({
      id: "product-1",
      name: "CATALYST 01",
      private_order_enabled: true,
      private_preset_price_enabled: false
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: "KRW",
          subtotal_amount: 360_000,
          total_amount: 360_000,
          lines: [skuSnapshot]
        })
      })
    );
  });

  it("removes amounts when the authoritative resolved snapshot is quote-only", async () => {
    const quoteOnlySnapshot = {
      ...skuSnapshot,
      unitAmount: 0,
      lineAmount: 0
    };
    mocks.resolveLostCheckout.mockResolvedValue({
      mode: "private_order",
      currency: "KRW",
      subtotalAmount: 0,
      totalAmount: 0,
      lines: [quoteOnlySnapshot]
    });

    const { POST } = await import("./route");
    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal_amount: 0,
          total_amount: 0,
          lines: [
            expect.objectContaining({
              unitAmount: null,
              lineAmount: null
            })
          ]
        })
      })
    );
  });

  it("rejects an enabled private preset without a positive amount", async () => {
    mocks.findByID.mockResolvedValue({
      id: "product-1",
      name: "CATALYST 01",
      private_order_enabled: true,
      private_preset_price_enabled: true,
      private_unit_amount: null
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 2 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "private-order-unavailable"
    });
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("maps a private tier rejection to forbidden", async () => {
    mocks.resolveLostCheckout.mockRejectedValue(
      new Error("private-order-forbidden")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: "private-order-forbidden"
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not write an order when SKU resolution is rejected", async () => {
    mocks.resolveLostCheckout.mockRejectedValue(new Error("sku-not-found"));
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "missing-sku", quantity: 1 })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "sku-not-found"
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not expose unexpected checkout errors", async () => {
    mocks.resolveLostCheckout.mockRejectedValue(
      new Error("password=database-secret")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "quote-request-failed"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith({
      code: "lost-private-quote-request-failed",
      context: "POST /api/lost/private-quotes"
    });
    expect(mocks.loggerError).not.toHaveBeenCalledWith(
      expect.stringContaining("password=database-secret")
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not expose product lookup failures", async () => {
    mocks.findByID.mockRejectedValue(new Error("database host unavailable"));
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "quote-request-failed"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith({
      code: "lost-private-quote-request-failed",
      context: "POST /api/lost/private-quotes"
    });
    expect(mocks.resolveLostCheckout).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not expose order persistence failures", async () => {
    mocks.create.mockRejectedValue(new Error("insert secret detail"));
    const { POST } = await import("./route");

    const response = await POST(
      request({ productId: "product-1", skuId: "sku-1", quantity: 1 })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "quote-request-failed"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith({
      code: "lost-private-quote-request-failed",
      context: "POST /api/lost/private-quotes"
    });
  });
});
