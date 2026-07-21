import { randomUUID } from "node:crypto";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sql, type SQL } from "drizzle-orm";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type Payload
} from "payload";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { up as applyInventoryLedgerMigration } from "@/lib/migrations/20260721_162401";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import { recordInventoryMovement } from "./inventory-ledger";
import type {
  InventoryDisposition,
  InventoryMovementRequest
} from "./inventory-ledger-contracts";
import {
  reconcileInventoryLedger,
  reconstructInventoryLedger
} from "./inventory-reconciliation";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

type InventoryLevelDoc = {
  aggregate_key: string;
  disposition: string;
  quantity: number;
  movement_count: number;
};

type TestTransactionSession = {
  db: { execute: (query: unknown) => Promise<unknown> };
};

const TestProducts: CollectionConfig = {
  slug: "products",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    { name: "unit_amount", type: "number", required: true, defaultValue: 0 }
  ]
};

describeWithPostgres.sequential("inventory ledger with PostgreSQL", () => {
  let payload: Payload;
  let createdFixtures: Array<{
    productId: string;
    skuId: string;
    locationIds: string[];
  }> = [];

  beforeAll(async () => {
    process.env.DATABASE_URI = testDatabaseUri;
    const config = buildConfig({
      secret: "commerce-inventory-ledger-test-secret",
      db: postgresAdapter({
        push: false,
        idType: "uuid",
        pool: { connectionString: testDatabaseUri }
      }),
      collections: [
        TestProducts,
        ProductVariants,
        StockLocations,
        InventoryLevels,
        InventoryMovements
      ]
    });
    payload = await getPayload({ config });
  }, 60_000);

  afterEach(async () => {
    if (createdFixtures.length === 0) return;
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("inventory-test-cleanup-transaction");
    const session = (
      payload.db as unknown as {
        sessions: Record<string, TestTransactionSession>;
      }
    ).sessions[String(transactionID)];
    if (!session) throw new Error("inventory-test-cleanup-session");

    try {
      await session.db.execute(
        sql`ALTER TABLE inventory_movements DISABLE TRIGGER USER`
      );
      for (const fixture of [...createdFixtures].reverse()) {
        await session.db.execute(sql`
          DELETE FROM inventory_movements WHERE sku_id = ${fixture.skuId}
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_levels WHERE sku_id = ${fixture.skuId}
        `);
        for (const locationId of fixture.locationIds) {
          await session.db.execute(sql`
            DELETE FROM stock_locations WHERE id = ${locationId}
          `);
        }
        await session.db.execute(sql`
          DELETE FROM product_variants WHERE id = ${fixture.skuId}
        `);
        await session.db.execute(sql`
          DELETE FROM products WHERE id = ${fixture.productId}
        `);
      }
      await session.db.execute(
        sql`ALTER TABLE inventory_movements ENABLE TRIGGER USER`
      );
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
    createdFixtures = [];
  });

  async function createFixture() {
    const suffix = randomUUID();
    const product = await payload.create({
      collection: "products",
      overrideAccess: true,
      data: {
        name: `Ledger ${suffix}`,
        slug: `ledger-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      }
    });
    const sku = await payload.create({
      collection: "product-variants",
      overrideAccess: true,
      data: {
        product: product.id,
        active: true,
        sku: `LIS-${suffix}`.toUpperCase(),
        options: []
      }
    });
    const location = await payload.create({
      collection: "stock-locations" as never,
      overrideAccess: true,
      data: {
        code: `LOC-${suffix}`.toUpperCase(),
        name: `Location ${suffix}`,
        active: true
      } as never
    });
    const fixture = {
      productId: String(product.id),
      skuId: String(sku.id),
      locationId: String(location.id),
      locationIds: [String(location.id)],
      suffix
    };
    createdFixtures = [...createdFixtures, fixture];
    return fixture;
  }

  async function createLocation(suffix: string, label: string) {
    const location = await payload.create({
      collection: "stock-locations" as never,
      overrideAccess: true,
      data: {
        code: `LOC-${label}-${suffix}`.toUpperCase(),
        name: `${label} ${suffix}`,
        active: true
      } as never
    });
    const latestFixture = createdFixtures.at(-1);
    if (!latestFixture) throw new Error("inventory-test-fixture-missing");
    createdFixtures = createdFixtures.map((fixture) =>
      fixture === latestFixture
        ? {
            ...fixture,
            locationIds: [...fixture.locationIds, String(location.id)]
          }
        : fixture
    );
    return String(location.id);
  }

  function inboundRequest(
    fixture: Awaited<ReturnType<typeof createFixture>>,
    key: string,
    quantity: number,
    locationId = fixture.locationId,
    disposition: InventoryDisposition = "available"
  ): InventoryMovementRequest {
    return {
      idempotencyKey: key,
      skuId: fixture.skuId,
      kind: "inbound",
      quantity,
      to: { locationId, disposition },
      reasonCode: "postgres-test",
      sourceType: "inventory_command"
    };
  }

  function outboundRequest(
    fixture: Awaited<ReturnType<typeof createFixture>>,
    key: string,
    quantity: number
  ): InventoryMovementRequest {
    return {
      idempotencyKey: key,
      skuId: fixture.skuId,
      kind: "outbound",
      quantity,
      from: { locationId: fixture.locationId, disposition: "available" },
      reasonCode: "postgres-test",
      sourceType: "inventory_command"
    };
  }

  function transferRequest(
    fixture: Awaited<ReturnType<typeof createFixture>>,
    key: string,
    quantity: number,
    locationId: string,
    disposition: InventoryDisposition
  ): InventoryMovementRequest {
    return {
      idempotencyKey: key,
      skuId: fixture.skuId,
      kind: "transfer",
      quantity,
      from: { locationId: fixture.locationId, disposition: "available" },
      to: { locationId, disposition },
      reasonCode: "postgres-test",
      sourceType: "inventory_command"
    };
  }

  async function expectStillWaiting(promise: Promise<unknown>): Promise<void> {
    const state = await Promise.race([
      promise.then(
        () => "settled" as const,
        () => "settled" as const
      ),
      new Promise<"waiting">((resolve) =>
        setTimeout(() => resolve("waiting"), 50)
      )
    ]);
    expect(state).toBe("waiting");
  }

  function findInventory(
    collection: "inventory-levels" | "inventory-movements",
    where: Record<string, unknown>,
    sort?: string
  ) {
    return payload.find({
      collection: collection as never,
      overrideAccess: true,
      pagination: false,
      where,
      ...(sort ? { sort } : {})
    } as never);
  }

  function insertRawLevel(input: {
    fixture: Awaited<ReturnType<typeof createFixture>>;
    disposition: "available" | "quarantine" | "damaged";
    quantity: number | SQL;
    movementCount: number | SQL;
  }) {
    const aggregateKey = `${input.fixture.skuId}:${input.fixture.locationId}:${input.disposition}`;
    return payload.db.drizzle.execute(sql`
      INSERT INTO inventory_levels (
        aggregate_key, sku_id, location_id, disposition, quantity, movement_count
      ) VALUES (
        ${aggregateKey}, ${input.fixture.skuId}, ${input.fixture.locationId},
        ${input.disposition}::enum_inventory_levels_disposition,
        ${input.quantity}, ${input.movementCount}
      )
    `);
  }

  function insertRawMovement(input: {
    fixture: Awaited<ReturnType<typeof createFixture>>;
    idempotencyKey: string;
    kind: "inbound" | "transfer";
    quantity: number | SQL;
    fromDisposition?: "available";
    toDisposition?: "available" | "quarantine";
  }) {
    const fromLocationId = input.fromDisposition
      ? input.fixture.locationId
      : null;
    const toLocationId = input.toDisposition ? input.fixture.locationId : null;
    return payload.db.drizzle.execute(sql`
      INSERT INTO inventory_movements (
        idempotency_key, request_hash, sku_id, kind, quantity,
        from_location_id, from_disposition,
        to_location_id, to_disposition, reason_code, source_type
      ) VALUES (
        ${input.idempotencyKey}, 'raw-hash', ${input.fixture.skuId},
        ${input.kind}::enum_inventory_movements_kind, ${input.quantity},
        ${fromLocationId}::uuid,
        ${input.fromDisposition ?? null}::enum_inventory_movements_from_disposition,
        ${toLocationId}::uuid,
        ${input.toDisposition ?? null}::enum_inventory_movements_to_disposition,
        'raw-test', 'inventory_command'
      )
    `);
  }

  it("does not create inventory rows when the generated migration runs", async () => {
    const before = await payload.db.drizzle.execute<{
      locations: string;
      levels: string;
      movements: string;
    }>(sql`
      SELECT
        (SELECT count(*) FROM stock_locations)::text AS locations,
        (SELECT count(*) FROM inventory_levels)::text AS levels,
        (SELECT count(*) FROM inventory_movements)::text AS movements
    `);

    await applyInventoryLedgerMigration({
      db: payload.db.drizzle,
      payload,
      req: { payload }
    } as never);

    const after = await payload.db.drizzle.execute<{
      locations: string;
      levels: string;
      movements: string;
    }>(sql`
      SELECT
        (SELECT count(*) FROM stock_locations)::text AS locations,
        (SELECT count(*) FROM inventory_levels)::text AS levels,
        (SELECT count(*) FROM inventory_movements)::text AS movements
    `);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it("serializes duplicate idempotency keys into one durable movement", async () => {
    const fixture = await createFixture();
    const request = {
      idempotencyKey: `inventory-${fixture.suffix}`,
      skuId: fixture.skuId,
      kind: "inbound" as const,
      quantity: 1,
      to: {
        locationId: fixture.locationId,
        disposition: "available" as const
      },
      reasonCode: "contention-test",
      sourceType: "inventory_command" as const
    };

    const results = await Promise.all([
      recordInventoryMovement({ payload, request }),
      recordInventoryMovement({ payload, request })
    ]);

    expect(results.map((result) => result.kind).sort()).toEqual([
      "created",
      "replay"
    ]);
    await expect(
      findInventory("inventory-movements", {
        idempotency_key: { equals: request.idempotencyKey }
      })
    ).resolves.toMatchObject({ totalDocs: 1 });
    await expect(
      findInventory("inventory-levels", {
        aggregate_key: {
          equals: `${fixture.skuId}:${fixture.locationId}:available`
        }
      })
    ).resolves.toMatchObject({
      docs: [expect.objectContaining({ quantity: 1, movement_count: 1 })]
    });
  });

  it("rejects an altered request that reuses a permanent idempotency key", async () => {
    const fixture = await createFixture();
    const request = inboundRequest(
      fixture,
      `inventory-conflict-${fixture.suffix}`,
      1
    );

    await recordInventoryMovement({ payload, request });
    await expect(
      recordInventoryMovement({
        payload,
        request: { ...request, quantity: 2 }
      })
    ).rejects.toThrow("inventory-movement-idempotency-conflict");

    await expect(
      findInventory("inventory-movements", {
        idempotency_key: { equals: request.idempotencyKey }
      })
    ).resolves.toMatchObject({
      totalDocs: 1,
      docs: [expect.objectContaining({ quantity: 1 })]
    });
  });

  it("keeps durable movements append-only at the database boundary", async () => {
    const fixture = await createFixture();
    const request = inboundRequest(
      fixture,
      `inventory-append-only-${fixture.suffix}`,
      1
    );
    await recordInventoryMovement({ payload, request });
    const before = await findInventory("inventory-movements", {
      idempotency_key: { equals: request.idempotencyKey }
    });
    const movementId = String(before.docs[0]?.id);

    const triggers = await payload.db.drizzle.execute<{
      tgname: string;
      tgenabled: string;
    }>(sql`
      SELECT tgname, tgenabled
      FROM pg_trigger
      WHERE tgrelid = 'inventory_movements'::regclass
        AND tgname IN (
          'inventory_movements_prevent_row_mutation',
          'inventory_movements_prevent_truncate'
        )
      ORDER BY tgname
    `);
    expect(triggers.rows).toEqual([
      {
        tgname: "inventory_movements_prevent_row_mutation",
        tgenabled: "O"
      },
      { tgname: "inventory_movements_prevent_truncate", tgenabled: "O" }
    ]);

    const mutations = [
      () =>
        payload.db.drizzle.execute(sql`
          UPDATE inventory_movements
          SET reason_code = 'changed'
          WHERE id = ${movementId}
        `),
      () =>
        payload.db.drizzle.execute(sql`
          DELETE FROM inventory_movements WHERE id = ${movementId}
        `),
      () => payload.db.drizzle.execute(sql`TRUNCATE inventory_movements`)
    ];
    for (const mutation of mutations) {
      await expect(mutation()).rejects.toThrow();
    }
    await expect(
      findInventory("inventory-movements", {
        idempotency_key: { equals: request.idempotencyKey }
      })
    ).resolves.toMatchObject({
      docs: [
        expect.objectContaining({
          id: movementId,
          reason_code: "postgres-test"
        })
      ],
      totalDocs: 1
    });
  });

  it("allows only one concurrent debit of the last unit", async () => {
    const fixture = await createFixture();
    const base = {
      skuId: fixture.skuId,
      quantity: 1,
      reasonCode: "last-unit-test",
      sourceType: "inventory_command" as const
    };
    await recordInventoryMovement({
      payload,
      request: {
        ...base,
        idempotencyKey: `inventory-in-${fixture.suffix}`,
        kind: "inbound",
        to: {
          locationId: fixture.locationId,
          disposition: "available"
        }
      }
    });

    const debits = await Promise.allSettled([
      recordInventoryMovement({
        payload,
        request: {
          ...base,
          idempotencyKey: `inventory-out-a-${fixture.suffix}`,
          kind: "outbound",
          from: {
            locationId: fixture.locationId,
            disposition: "available"
          }
        }
      }),
      recordInventoryMovement({
        payload,
        request: {
          ...base,
          idempotencyKey: `inventory-out-b-${fixture.suffix}`,
          kind: "outbound",
          from: {
            locationId: fixture.locationId,
            disposition: "available"
          }
        }
      })
    ]);

    expect(
      debits.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(debits.filter((result) => result.status === "rejected")).toEqual([
      expect.objectContaining({
        reason: expect.objectContaining({
          message: "insufficient-inventory-balance"
        })
      })
    ]);
    await expect(
      findInventory("inventory-levels", {
        aggregate_key: {
          equals: `${fixture.skuId}:${fixture.locationId}:available`
        }
      })
    ).resolves.toMatchObject({
      docs: [expect.objectContaining({ quantity: 0, movement_count: 2 })]
    });
  });

  it("commits both projections and one durable movement for a transfer", async () => {
    const fixture = await createFixture();
    const destinationId = await createLocation(
      fixture.suffix,
      "transfer-destination"
    );
    await recordInventoryMovement({
      payload,
      request: inboundRequest(
        fixture,
        `inventory-transfer-seed-${fixture.suffix}`,
        4
      )
    });

    const transferKey = `inventory-transfer-${fixture.suffix}`;
    await recordInventoryMovement({
      payload,
      request: transferRequest(
        fixture,
        transferKey,
        3,
        destinationId,
        "quarantine"
      )
    });

    const levels = await findInventory(
      "inventory-levels",
      { sku: { equals: fixture.skuId } },
      "aggregate_key"
    );
    expect(levels.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:available`,
          quantity: 1,
          movement_count: 2
        }),
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${destinationId}:quarantine`,
          quantity: 3,
          movement_count: 1
        })
      ])
    );
    await expect(
      findInventory("inventory-movements", {
        idempotency_key: { equals: transferKey }
      })
    ).resolves.toMatchObject({ totalDocs: 1 });
  });

  it("rolls back the movement and every projection change after a transfer failure", async () => {
    const fixture = await createFixture();
    const destinationId = await createLocation(
      fixture.suffix,
      "rollback-destination"
    );
    await recordInventoryMovement({
      payload,
      request: inboundRequest(
        fixture,
        `inventory-rollback-seed-${fixture.suffix}`,
        3
      )
    });

    const failingPayload = new Proxy(payload, {
      get(target, property) {
        if (property === "create") {
          return async (args: Parameters<Payload["create"]>[0]) => {
            if (args.collection === "inventory-levels") {
              throw new Error("forced-projection-write-failure");
            }
            return target.create(args);
          };
        }
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
    const failedKey = `inventory-rollback-transfer-${fixture.suffix}`;

    await expect(
      recordInventoryMovement({
        payload: failingPayload,
        request: transferRequest(
          fixture,
          failedKey,
          2,
          destinationId,
          "quarantine"
        )
      })
    ).rejects.toThrow("forced-projection-write-failure");

    await expect(
      findInventory("inventory-movements", {
        idempotency_key: { equals: failedKey }
      })
    ).resolves.toMatchObject({ docs: [], totalDocs: 0 });
    await expect(
      findInventory("inventory-levels", { sku: { equals: fixture.skuId } })
    ).resolves.toMatchObject({
      docs: [expect.objectContaining({ quantity: 3, movement_count: 1 })],
      totalDocs: 1
    });
  });

  it("serializes location deactivation behind an in-flight movement", async () => {
    const fixture = await createFixture();
    let releaseLocationRead: (() => void) | undefined;
    const locationReadGate = new Promise<void>((resolve) => {
      releaseLocationRead = resolve;
    });
    let markLocationRead: (() => void) | undefined;
    const locationReadStarted = new Promise<void>((resolve) => {
      markLocationRead = resolve;
    });
    const gatedPayload = new Proxy(payload, {
      get(target, property) {
        if (property === "findByID") {
          return async (args: Parameters<Payload["findByID"]>[0]) => {
            const result = await target.findByID(args);
            if (
              args.collection === "stock-locations" &&
              String(args.id) === fixture.locationId
            ) {
              markLocationRead?.();
              await locationReadGate;
            }
            return result;
          };
        }
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });

    const movement = recordInventoryMovement({
      payload: gatedPayload,
      request: inboundRequest(
        fixture,
        `inventory-location-race-${fixture.suffix}`,
        1
      )
    });
    await locationReadStarted;
    const deactivation = payload.update({
      collection: "stock-locations" as never,
      id: fixture.locationId,
      overrideAccess: true,
      data: { active: false } as never
    });

    try {
      await expectStillWaiting(deactivation);
      releaseLocationRead?.();
      await expect(movement).resolves.toMatchObject({ kind: "created" });
      await expect(deactivation).resolves.toMatchObject({ active: false });
    } catch (error) {
      releaseLocationRead?.();
      await movement.catch(() => undefined);
      await deactivation.catch(() => undefined);
      throw error;
    }
  });

  it("rejects invalid quantities and endpoint shapes at the database boundary", async () => {
    const fixture = await createFixture();
    const unsafeInteger = Number.MAX_SAFE_INTEGER + 1;
    const numericNaN = sql.raw("'NaN'::numeric");
    const invalidWrites = [
      () =>
        insertRawLevel({
          fixture,
          disposition: "available",
          quantity: -1,
          movementCount: 0
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "quarantine",
          quantity: 0.5,
          movementCount: 0
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "damaged",
          quantity: 0,
          movementCount: -1
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "available",
          quantity: unsafeInteger,
          movementCount: 0
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "available",
          quantity: numericNaN,
          movementCount: 0
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "available",
          quantity: 0,
          movementCount: unsafeInteger
        }),
      () =>
        insertRawLevel({
          fixture,
          disposition: "available",
          quantity: 0,
          movementCount: numericNaN
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-negative-${fixture.suffix}`,
          kind: "inbound",
          quantity: -1,
          toDisposition: "available"
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-fractional-${fixture.suffix}`,
          kind: "inbound",
          quantity: 0.5,
          toDisposition: "available"
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-unsafe-${fixture.suffix}`,
          kind: "inbound",
          quantity: unsafeInteger,
          toDisposition: "available"
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-nan-${fixture.suffix}`,
          kind: "inbound",
          quantity: numericNaN,
          toDisposition: "available"
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-inbound-shape-${fixture.suffix}`,
          kind: "inbound",
          quantity: 1,
          fromDisposition: "available",
          toDisposition: "quarantine"
        }),
      () =>
        insertRawMovement({
          fixture,
          idempotencyKey: `raw-transfer-same-${fixture.suffix}`,
          kind: "transfer",
          quantity: 1,
          fromDisposition: "available",
          toDisposition: "available"
        })
    ];

    for (const write of invalidWrites) {
      await expect(write()).rejects.toThrow();
    }
    await expect(
      findInventory("inventory-movements", { sku: { equals: fixture.skuId } })
    ).resolves.toMatchObject({ totalDocs: 0 });
    await expect(
      findInventory("inventory-levels", { sku: { equals: fixture.skuId } })
    ).resolves.toMatchObject({ totalDocs: 0 });
  });

  it("reconstructs the durable ledger to the same cached projections", async () => {
    const fixture = await createFixture();
    await recordInventoryMovement({
      payload,
      request: inboundRequest(
        fixture,
        `inventory-reconstruct-in-${fixture.suffix}`,
        5
      )
    });
    await recordInventoryMovement({
      payload,
      request: outboundRequest(
        fixture,
        `inventory-reconstruct-out-${fixture.suffix}`,
        2
      )
    });

    const reconstructed = (await reconstructInventoryLedger(payload)).filter(
      (balance) => balance.skuId === fixture.skuId
    );
    const levels = await findInventory("inventory-levels", {
      sku: { equals: fixture.skuId }
    });
    expect(reconstructed).toEqual(
      (levels.docs as unknown as InventoryLevelDoc[]).map((level) => ({
        aggregateKey: level.aggregate_key,
        skuId: fixture.skuId,
        locationId: fixture.locationId,
        disposition: level.disposition,
        quantity: level.quantity,
        movementCount: level.movement_count
      }))
    );
    await expect(reconcileInventoryLedger(payload)).resolves.not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregateKey: reconstructed[0]?.aggregateKey
        })
      ])
    );
  });

  it("reports induced projection drift without repairing it", async () => {
    const fixture = await createFixture();
    await recordInventoryMovement({
      payload,
      request: inboundRequest(fixture, `inventory-drift-${fixture.suffix}`, 2)
    });
    const aggregateKey = `${fixture.skuId}:${fixture.locationId}:available`;
    await payload.db.drizzle.execute(sql`
      UPDATE inventory_levels
      SET quantity = 9
      WHERE aggregate_key = ${aggregateKey}
    `);

    await expect(reconcileInventoryLedger(payload)).resolves.toEqual(
      expect.arrayContaining([
        {
          kind: "quantity_mismatch",
          aggregateKey,
          expected: 2,
          actual: 9
        }
      ])
    );
    await expect(
      findInventory("inventory-levels", {
        aggregate_key: { equals: aggregateKey }
      })
    ).resolves.toMatchObject({
      docs: [expect.objectContaining({ quantity: 9 })]
    });
  });

  it("drains and reclassifies residual stock after SKU and location deactivation", async () => {
    const fixture = await createFixture();
    const base = {
      skuId: fixture.skuId,
      quantity: 1,
      reasonCode: "deactivation-test",
      sourceType: "inventory_command" as const
    };
    await recordInventoryMovement({
      payload,
      request: {
        ...base,
        quantity: 3,
        idempotencyKey: `inventory-seed-${fixture.suffix}`,
        kind: "inbound",
        to: {
          locationId: fixture.locationId,
          disposition: "available"
        }
      }
    });

    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("deactivation-test-transaction-failed");
    const req = { payload, transactionID, context: {} };
    try {
      await payload.update({
        collection: "product-variants",
        id: fixture.skuId,
        overrideAccess: true,
        req: req as never,
        data: { active: false }
      });
      await payload.update({
        collection: "stock-locations" as never,
        id: fixture.locationId,
        overrideAccess: true,
        req: req as never,
        data: { active: false } as never
      });
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...base,
          idempotencyKey: `inventory-drain-${fixture.suffix}`,
          kind: "outbound",
          from: {
            locationId: fixture.locationId,
            disposition: "available"
          }
        }
      })
    ).resolves.toMatchObject({ kind: "created" });
    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...base,
          idempotencyKey: `inventory-reclassify-${fixture.suffix}`,
          kind: "transfer",
          from: {
            locationId: fixture.locationId,
            disposition: "available"
          },
          to: {
            locationId: fixture.locationId,
            disposition: "quarantine"
          }
        }
      })
    ).resolves.toMatchObject({ kind: "created" });
    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...base,
          idempotencyKey: `inventory-receive-closed-${fixture.suffix}`,
          kind: "inbound",
          to: {
            locationId: fixture.locationId,
            disposition: "available"
          }
        }
      })
    ).rejects.toThrow("inventory-sku-inactive");
  });
});
