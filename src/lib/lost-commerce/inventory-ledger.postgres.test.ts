import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { up as applyInventoryLedgerMigration } from "@/lib/migrations/20260721_162401";
import {
  commerceTestDatabaseUri,
  createInventoryPostgresHarness,
  type InventoryPostgresHarness
} from "./inventory-ledger.postgres.fixtures";

const testDatabaseUri = commerceTestDatabaseUri;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

describeWithPostgres.sequential("inventory ledger with PostgreSQL", () => {
  let harness: InventoryPostgresHarness;
  let payload: Payload;
  let createFixture: InventoryPostgresHarness["createFixture"];
  let createLocation: InventoryPostgresHarness["createLocation"];
  let seedInventoryForTest: InventoryPostgresHarness["seedInventoryForTest"];
  let outboundRequest: InventoryPostgresHarness["outboundRequest"];
  let transferRequest: InventoryPostgresHarness["transferRequest"];
  let findInventory: InventoryPostgresHarness["findInventory"];
  let reconcileFixture: InventoryPostgresHarness["reconcileFixture"];

  beforeAll(async () => {
    harness = await createInventoryPostgresHarness(testDatabaseUri as string);
    ({
      payload,
      createFixture,
      createLocation,
      seedInventoryForTest,
      outboundRequest,
      transferRequest,
      findInventory,
      reconcileFixture
    } = harness);
  }, 60_000);

  afterEach(async () => {
    await harness.cleanup();
  });

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
    await seedInventoryForTest(
      fixture,
      `inventory-contention-seed-${fixture.suffix}`,
      2
    );
    const request = outboundRequest(fixture, `inventory-${fixture.suffix}`, 1);

    const results = await Promise.all([
      harness.recordCommand(fixture, { payload, request }),
      harness.recordCommand(fixture, { payload, request })
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
      docs: [expect.objectContaining({ quantity: 1, movement_count: 2 })]
    });
  });

  it("rejects an altered request that reuses a permanent idempotency key", async () => {
    const fixture = await createFixture();
    await seedInventoryForTest(
      fixture,
      `inventory-conflict-seed-${fixture.suffix}`,
      3
    );
    const request = outboundRequest(
      fixture,
      `inventory-conflict-${fixture.suffix}`,
      1
    );

    await harness.recordCommand(fixture, { payload, request });
    await expect(
      harness.recordCommand(fixture, {
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
    await seedInventoryForTest(
      fixture,
      `inventory-append-only-seed-${fixture.suffix}`,
      2
    );
    const request = outboundRequest(
      fixture,
      `inventory-append-only-${fixture.suffix}`,
      1
    );
    await harness.recordCommand(fixture, { payload, request });
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
    await seedInventoryForTest(
      fixture,
      `inventory-last-unit-seed-${fixture.suffix}`,
      1
    );

    const debits = await Promise.allSettled([
      harness.recordCommand(fixture, {
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
      harness.recordCommand(fixture, {
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
    await seedInventoryForTest(
      fixture,
      `inventory-transfer-seed-${fixture.suffix}`,
      4
    );

    const transferKey = `inventory-transfer-${fixture.suffix}`;
    await harness.recordCommand(fixture, {
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
    await seedInventoryForTest(
      fixture,
      `inventory-rollback-seed-${fixture.suffix}`,
      3
    );

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
      harness.recordCommand(fixture, {
        payload: failingPayload,
        request: transferRequest(
          fixture,
          failedKey,
          2,
          fixture.locationId,
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

    await expect(
      harness.recordCommand(fixture, {
        payload,
        request: transferRequest(
          fixture,
          failedKey,
          2,
          fixture.locationId,
          "quarantine"
        )
      })
    ).resolves.toMatchObject({ kind: "created" });
    await expect(
      findInventory("inventory-levels", { sku: { equals: fixture.skuId } })
    ).resolves.toMatchObject({
      docs: expect.arrayContaining([
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:available`,
          quantity: 1,
          movement_count: 2
        }),
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:quarantine`,
          quantity: 2,
          movement_count: 1
        })
      ]),
      totalDocs: 2
    });
    await expect(reconcileFixture(fixture)).resolves.toEqual([]);
  });

  it("completes opposing transfers without deadlock and conserves stock", async () => {
    const fixture = await createFixture();
    const destinationId = await createLocation(
      fixture.suffix,
      "opposing-destination"
    );
    await seedInventoryForTest(
      fixture,
      `inventory-opposing-available-${fixture.suffix}`,
      5
    );
    await seedInventoryForTest(
      fixture,
      `inventory-opposing-destination-${fixture.suffix}`,
      7,
      destinationId
    );

    await Promise.all([
      harness.recordCommand(fixture, {
        payload,
        request: {
          idempotencyKey: `inventory-opposing-a-${fixture.suffix}`,
          skuId: fixture.skuId,
          kind: "transfer",
          quantity: 2,
          from: {
            locationId: fixture.locationId,
            disposition: "available"
          },
          to: {
            locationId: destinationId,
            disposition: "available"
          },
          reasonCode: "opposing-transfer-test",
          sourceType: "inventory_command"
        }
      }),
      harness.recordCommand(fixture, {
        payload,
        request: {
          idempotencyKey: `inventory-opposing-b-${fixture.suffix}`,
          skuId: fixture.skuId,
          kind: "transfer",
          quantity: 3,
          from: {
            locationId: destinationId,
            disposition: "available"
          },
          to: {
            locationId: fixture.locationId,
            disposition: "available"
          },
          reasonCode: "opposing-transfer-test",
          sourceType: "inventory_command"
        }
      })
    ]);

    const levels = await findInventory("inventory-levels", {
      sku: { equals: fixture.skuId }
    });
    expect(levels.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:available`,
          disposition: "available",
          quantity: 6
        }),
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${destinationId}:available`,
          disposition: "available",
          quantity: 6
        })
      ])
    );
    expect(
      levels.docs.reduce(
        (total, level) =>
          total + Number((level as unknown as { quantity: number }).quantity),
        0
      )
    ).toBe(12);
    await expect(reconcileFixture(fixture)).resolves.toEqual([]);
  });
});
