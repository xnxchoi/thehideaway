import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  create: vi.fn(),
  events: [] as string[],
  find: vi.fn(),
  findByID: vi.fn(),
  isSameOrigin: vi.fn(),
  loggerError: vi.fn(),
  productCartLock: vi.fn(),
  rateLimitOr429: vi.fn(),
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
    find: mocks.find,
    findByID: mocks.findByID,
    logger: { error: mocks.loggerError },
    update: mocks.update,
    db: {
      beginTransaction: mocks.beginTransaction,
      commitTransaction: mocks.commitTransaction,
      rollbackTransaction: mocks.rollbackTransaction
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: mocks.isSameOrigin
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));

vi.mock("@/lib/db/sequences", () => ({
  productCartLock: mocks.productCartLock
}));

const product = Object.freeze({
  id: "product-1",
  active: true,
  storefront: "lostinseoul",
  name: "CATALYST 01",
  slug: "catalyst-01",
  currency: "KRW",
  unit_amount: 180000,
  min_order_quantity: 1,
  max_order_quantity: 5,
  standard_enabled: true,
  request_to_order_enabled: true,
  private_order_enabled: false
});

const sku = Object.freeze({
  id: "sku-1",
  product: "product-1",
  active: true,
  sku: "LIS-CATALYST-01-50",
  label: "50 ml",
  options: [{ key: "Size", value: "50 ml" }],
  price_override_amount: 175000,
  weight_grams: 420,
  length_mm: 55,
  width_mm: 55,
  height_mm: 145,
  tax_category: "fragrance"
});

function request(body: unknown) {
  return new NextRequest("https://hideaway.test/api/lost/cart", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

describe("GET and PATCH /api/lost/cart", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", role: "user" }
    });
    mocks.beginTransaction.mockReset().mockResolvedValue("tx-1");
    mocks.commitTransaction.mockReset().mockResolvedValue(undefined);
    mocks.create.mockReset().mockImplementation(async ({ data }) => ({
      id: "cart-1",
      ...data
    }));
    mocks.find.mockReset().mockResolvedValue({ docs: [] });
    mocks.findByID
      .mockReset()
      .mockImplementation(async ({ collection, id }) => {
        if (collection === "products" && id === product.id) return product;
        if (collection === "product-variants" && id === sku.id) return sku;
        return null;
      });
    mocks.isSameOrigin.mockReset().mockReturnValue(true);
    mocks.loggerError.mockReset();
    mocks.productCartLock.mockReset().mockResolvedValue(undefined);
    mocks.rateLimitOr429.mockReset().mockResolvedValue(null);
    mocks.rollbackTransaction.mockReset().mockResolvedValue(undefined);
    mocks.update.mockReset();
    mocks.events.length = 0;
  });

  it("returns null when no persisted cart exists instead of inventing cart facts", async () => {
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, cart: null });
  });

  it("preserves an existing persisted cart exactly on GET", async () => {
    const persisted = {
      id: "cart-1",
      currency: "KRW",
      line_schema_version: 3,
      lines: [{ skuId: "sku-1" }]
    };
    mocks.find.mockResolvedValue({ docs: [persisted] });
    const { GET } = await import("./route");

    const response = await GET();

    expect(await response.json()).toEqual({ ok: true, cart: persisted });
  });

  it("requires authentication before reading a persisted cart", async () => {
    mocks.auth.mockResolvedValue({ user: null });
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it("rejects a retired variant-only request before opening a transaction", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            variantId: "retired-variant",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "bad-request" });
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });

  it("persists authoritative SKU facts", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "standard_purchase",
            quantity: 2,
          }
        ]
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-carts",
        overrideAccess: true,
        req: expect.objectContaining({ transactionID: "tx-1" }),
        data: {
          user: "user-1",
          storefront: "lostinseoul",
          status: "active",
          currency: "KRW",
          line_schema_version: 3,
          lines: [
            {
              schemaVersion: 3,
              productId: "product-1",
              productName: "CATALYST 01",
              productSlug: "catalyst-01",
              skuId: "sku-1",
              sku: "LIS-CATALYST-01-50",
              skuLabel: "50 ml",
              options: [{ key: "Size", value: "50 ml" }],
              currency: "KRW",
              unitAmount: 175000,
              quantity: 2,
              lineAmount: 350000,
              weightGrams: 420,
              dimensions: { lengthMm: 55, widthMm: 55, heightMm: 145 },
              taxCategory: "fragrance",
              mode: "standard_purchase"
            }
          ]
        }
      })
    );
  });

  it.each([
    ["inactive SKU", { ...sku, active: false }, "sku-inactive"],
    [
      "wrong-product SKU",
      { ...sku, product: "product-2" },
      "sku-product-mismatch"
    ]
  ])(
    "rejects an %s proposal without persistence",
    async (_label, proposedSku, error) => {
      mocks.findByID.mockImplementation(async ({ collection, id }) => {
        if (collection === "products" && id === product.id) return product;
        if (collection === "product-variants" && id === sku.id)
          return proposedSku;
        return null;
      });
      const { PATCH } = await import("./route");

      const response = await PATCH(
        request({
          lines: [
            {
              productId: product.id,
              skuId: sku.id,
              mode: "standard_purchase",
              quantity: 1
            }
          ]
        })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error });
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    }
  );

  it("rejects an unsupported order mode before catalog reads or persistence", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "subscription",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "bad-request" });
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before beginning a transaction", async () => {
    const { PATCH } = await import("./route");
    const malformed = new NextRequest("https://hideaway.test/api/lost/cart", {
      method: "PATCH",
      body: "{"
    });

    const response = await PATCH(malformed);

    expect(response.status).toBe(400);
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns a client error when a standard cart line includes a campaign", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "standard_purchase",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "campaign-not-allowed"
    });
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("rejects a campaign-ineligible SKU proposal without persistence", async () => {
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "products" && id === product.id) return product;
      if (collection === "product-variants" && id === sku.id) return sku;
      if (collection === "product-order-campaigns" && id === "campaign-1") {
        return {
          id: "campaign-1",
          product: product.id,
          state: "open",
          deadline: "2999-12-31T23:59:59.999Z",
          paid_commitments: 0,
          maximum_commitments: null,
          eligible_skus: ["sku-2"]
        };
      }
      return null;
    });
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "campaign-sku-ineligible"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("does not persist a finite request campaign before capacity reservations exist", async () => {
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "products" && id === product.id) return product;
      if (collection === "product-variants" && id === sku.id) return sku;
      if (collection === "product-order-campaigns" && id === "campaign-1") {
        return {
          id: "campaign-1",
          product: product.id,
          state: "open",
          deadline: "2999-12-31T23:59:59.999Z",
          paid_commitments: 0,
          maximum_commitments: 100,
          eligible_skus: [sku.id]
        };
      }
      return null;
    });
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign-1"
          }
        ]
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "campaign-capacity-reservations-unavailable"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("persists an empty version-3 cart when clearing an existing cart", async () => {
    mocks.find.mockResolvedValue({ docs: [{ id: "cart-1", lines: [] }] });
    mocks.update.mockImplementation(async ({ data }) => ({
      id: "cart-1",
      ...data
    }));
    const { PATCH } = await import("./route");

    const response = await PATCH(request({ lines: [] }));

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      collection: "product-carts",
      id: "cart-1",
      overrideAccess: true,
      req: expect.objectContaining({ transactionID: "tx-1" }),
      data: {
        user: "user-1",
        storefront: "lostinseoul",
        status: "active",
        currency: "KRW",
        line_schema_version: 3,
        lines: []
      }
    });
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled();
  });

  it("enforces private-order role gates before persistence", async () => {
    mocks.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === "products" && id === product.id) {
        return {
          ...product,
          private_order_enabled: true,
          private_tier_gate: "patron",
          private_preset_price_enabled: true,
          private_unit_amount: 180000
        };
      }
      if (collection === "product-variants" && id === sku.id) return sku;
      return null;
    });
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "private_order",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: "private-order-forbidden"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("locks, resolves, finds, and writes through one transaction-bound request", async () => {
    mocks.beginTransaction.mockImplementation(async () => {
      mocks.events.push("begin");
      return "tx-1";
    });
    mocks.productCartLock.mockImplementation(async () => {
      mocks.events.push("lock");
    });
    mocks.findByID.mockImplementation(async (args) => {
      mocks.events.push(`resolve:${args.collection}`);
      expect(args.req).toEqual(
        expect.objectContaining({ transactionID: "tx-1", context: {} })
      );
      if (args.collection === "products") return product;
      if (args.collection === "product-variants") return sku;
      return null;
    });
    mocks.find.mockImplementation(async (args) => {
      mocks.events.push("find-cart");
      expect(args.req).toEqual(
        expect.objectContaining({ transactionID: "tx-1", context: {} })
      );
      return { docs: [] };
    });
    mocks.create.mockImplementation(async (args) => {
      mocks.events.push("create");
      expect(args.req).toEqual(
        expect.objectContaining({ transactionID: "tx-1", context: {} })
      );
      return { id: "cart-1", ...args.data };
    });
    mocks.commitTransaction.mockImplementation(async () => {
      mocks.events.push("commit");
    });
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.productCartLock).toHaveBeenCalledWith(
      expect.any(Object),
      "tx-1",
      "user-1",
      "lostinseoul"
    );
    expect(mocks.events).toEqual([
      "begin",
      "lock",
      "resolve:products",
      "resolve:product-variants",
      "find-cart",
      "create",
      "commit"
    ]);
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled();
  });

  it("rolls back without resolving or writing when the cart lock fails", async () => {
    mocks.productCartLock.mockRejectedValue(new Error("lock-failed"));
    mocks.rollbackTransaction.mockRejectedValue(new Error("rollback-failed"));
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(500);
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.findByID).not.toHaveBeenCalled();
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.commitTransaction).not.toHaveBeenCalled();
  });

  it("fails closed when Payload cannot begin a cart transaction", async () => {
    mocks.beginTransaction.mockResolvedValue(null);
    const { PATCH } = await import("./route");

    const response = await PATCH(request({ lines: [] }));

    expect(response.status).toBe(500);
    expect(mocks.productCartLock).not.toHaveBeenCalled();
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.commitTransaction).not.toHaveBeenCalled();
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled();
  });

  it("returns a generic error and structured log when persistence fails", async () => {
    mocks.create.mockRejectedValue("database-details-must-not-leak");
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        lines: [
          {
            productId: product.id,
            skuId: sku.id,
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "cart-persistence-failed"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith({
      code: "lost-cart-persistence-failed",
      context: "PATCH /api/lost/cart"
    });
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.commitTransaction).not.toHaveBeenCalled();
  });

  it("returns rate limiting before parsing or persistence", async () => {
    mocks.rateLimitOr429.mockResolvedValue(
      Response.json({ ok: false, error: "rate-limited" }, { status: 429 })
    );
    const { PATCH } = await import("./route");

    const response = await PATCH(request({ lines: [] }));

    expect(response.status).toBe(429);
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });

  it("preserves same-origin and authentication boundaries before persistence", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { PATCH } = await import("./route");

    const crossOrigin = await PATCH(request({ lines: [] }));

    expect(crossOrigin.status).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();

    mocks.isSameOrigin.mockReturnValue(true);
    mocks.auth.mockResolvedValue({ user: null });
    const unauthenticated = await PATCH(request({ lines: [] }));

    expect(unauthenticated.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("productCartLock", () => {
  it("uses the active transaction session and a stable identity key", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const sequences =
      await vi.importActual<typeof import("@/lib/db/sequences")>(
        "@/lib/db/sequences"
      );
    const payload = {
      db: { sessions: { "tx-1": { db: { execute } } } }
    };

    await sequences.productCartLock(
      payload as never,
      "tx-1",
      "user-1",
      "lostinseoul"
    );
    await sequences.productCartLock(
      payload as never,
      "tx-1",
      "user-1",
      "lostinseoul"
    );
    await sequences.productCartLock(
      payload as never,
      "tx-1",
      "user-2",
      "lostinseoul"
    );

    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute.mock.calls[0]?.[0]).toEqual(execute.mock.calls[1]?.[0]);
    expect(execute.mock.calls[2]?.[0]).not.toEqual(execute.mock.calls[0]?.[0]);
  });
});

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

describeWithPostgres.sequential(
  "product cart advisory lock with PostgreSQL",
  () => {
    it("serializes concurrent transactions for the same user and storefront", async () => {
      const [{ buildConfig, getPayload }, { postgresAdapter }, sequences] =
        await Promise.all([
          vi.importActual<typeof import("payload")>("payload"),
          vi.importActual<typeof import("@payloadcms/db-postgres")>(
            "@payloadcms/db-postgres"
          ),
          vi.importActual<typeof import("@/lib/db/sequences")>(
            "@/lib/db/sequences"
          )
        ]);
      const config = buildConfig({
        secret: "cart-lock-postgres-test-secret-32-bytes",
        db: postgresAdapter({
          push: false,
          idType: "uuid",
          pool: { connectionString: testDatabaseUri }
        }),
        collections: []
      });
      const payload = await getPayload({ config });
      const firstTransaction = await payload.db.beginTransaction();
      const secondTransaction = await payload.db.beginTransaction();
      if (firstTransaction == null || secondTransaction == null) {
        throw new Error("transaction-failed");
      }

      let firstOpen = true;
      try {
        const userId = `cart-race-${Date.now()}-${Math.random()}`;
        await sequences.productCartLock(
          payload,
          firstTransaction,
          userId,
          "lostinseoul"
        );

        let secondAcquired = false;
        const secondLock = sequences
          .productCartLock(payload, secondTransaction, userId, "lostinseoul")
          .then(() => {
            secondAcquired = true;
          });

        await new Promise((resolve) => setTimeout(resolve, 75));
        expect(secondAcquired).toBe(false);

        await payload.db.commitTransaction(firstTransaction);
        firstOpen = false;
        await secondLock;
        expect(secondAcquired).toBe(true);
      } finally {
        if (firstOpen) {
          await payload.db
            .rollbackTransaction(firstTransaction)
            .catch(() => undefined);
        }
        await payload.db
          .rollbackTransaction(secondTransaction)
          .catch(() => undefined);
      }
    }, 60_000);
  }
);
