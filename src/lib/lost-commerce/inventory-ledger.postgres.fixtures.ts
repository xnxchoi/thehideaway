import { randomUUID } from "node:crypto";
import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type Payload,
  type PayloadRequest
} from "payload";
import { expect } from "vitest";

import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import type {
  InventoryDisposition,
  InventoryMovementRequest
} from "./inventory-ledger-contracts";
import { recordInventoryMovement } from "./inventory-ledger";
import { reconcileInventoryLedger } from "./inventory-reconciliation";

export const commerceTestDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;

export type InventoryLevelDoc = {
  aggregate_key: string;
  disposition: string;
  quantity: number;
  movement_count: number;
};

type TestTransactionSession = {
  db: { execute: (query: unknown) => Promise<unknown> };
};

type TestSQL = ReturnType<typeof sql.raw>;

export type InventoryPostgresFixture = {
  productId: string;
  skuId: string;
  locationId: string;
  locationIds: string[];
  actorIds: string[];
  suffix: string;
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

const TestUsers: CollectionConfig = {
  slug: "users",
  auth: true,
  fields: []
};

export async function createInventoryPostgresHarness(databaseUri: string) {
  process.env.DATABASE_URI = databaseUri;
  const config = buildConfig({
    secret: "commerce-inventory-ledger-test-secret",
    db: postgresAdapter({
      push: false,
      idType: "uuid",
      pool: { connectionString: databaseUri }
    }),
    collections: [
      TestUsers,
      TestProducts,
      ProductVariants,
      StockLocations,
      InventoryLevels,
      InventoryMovements,
      InventoryReceipts,
      InventoryReceiptLines,
      InventoryLots,
      InventoryCycleCounts,
      InventoryCycleCountLines
    ]
  });
  const payload = await getPayload({ config });
  let createdFixtures: InventoryPostgresFixture[] = [];

  async function cleanup(): Promise<void> {
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
        sql`SET LOCAL session_replication_role = replica`
      );
      for (const fixture of [...createdFixtures].reverse()) {
        await session.db.execute(sql`
          DELETE FROM inventory_movements WHERE sku_id = ${fixture.skuId}
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_levels WHERE sku_id = ${fixture.skuId}
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_cycle_count_lines WHERE sku_id = ${fixture.skuId}
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_cycle_counts
          WHERE location_id IN (${sql.join(
            fixture.locationIds.map((locationId) => sql`${locationId}`),
            sql`, `
          )})
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
        await session.db.execute(sql`
          DELETE FROM users
          WHERE id IN (${sql.join(
            fixture.actorIds.map((actorId) => sql`${actorId}`),
            sql`, `
          )})
        `);
      }
      await payload.db.commitTransaction(transactionID);
      createdFixtures = [];
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
  }

  async function createFixture(): Promise<InventoryPostgresFixture> {
    const suffix = randomUUID();
    const actorIds = [randomUUID(), randomUUID()];
    const product = (await payload.create({
      collection: "products" as never,
      overrideAccess: true,
      data: {
        name: `Ledger ${suffix}`,
        slug: `ledger-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      } as never
    })) as unknown as { id: string | number };
    const sku = (await payload.create({
      collection: "product-variants" as never,
      overrideAccess: true,
      data: {
        product: product.id,
        active: true,
        sku: `LIS-${suffix}`.toUpperCase(),
        options: []
      } as never
    })) as unknown as { id: string | number };
    const location = (await payload.create({
      collection: "stock-locations" as never,
      overrideAccess: true,
      data: {
        code: `LOC-${suffix}`.toUpperCase(),
        name: `Location ${suffix}`,
        active: true
      } as never
    })) as unknown as { id: string | number };
    const fixture = {
      productId: String(product.id),
      skuId: String(sku.id),
      locationId: String(location.id),
      locationIds: [String(location.id)],
      actorIds,
      suffix
    };
    createdFixtures = [...createdFixtures, fixture];
    await payload.db.drizzle.execute(sql`
      INSERT INTO users (id, email)
      VALUES
        (${actorIds[0]}, ${`maker-${suffix}@example.invalid`}),
        (${actorIds[1]}, ${`checker-${suffix}@example.invalid`})
    `);
    return fixture;
  }

  async function createLocation(suffix: string, label: string) {
    const location = (await payload.create({
      collection: "stock-locations" as never,
      overrideAccess: true,
      data: {
        code: `LOC-${label}-${suffix}`.toUpperCase(),
        name: `${label} ${suffix}`,
        active: true
      } as never
    })) as unknown as { id: string | number };
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

  async function seedInventoryForTest(
    fixture: InventoryPostgresFixture,
    key: string,
    quantity: number,
    locationId = fixture.locationId,
    disposition: InventoryDisposition = "available"
  ): Promise<void> {
    const countId = randomUUID();
    const countLineId = randomUUID();
    const effectiveAt = new Date();
    const aggregateKey = `${fixture.skuId}:${locationId}:${disposition}`;
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("inventory-test-seed-transaction");
    const session = (
      payload.db as unknown as {
        sessions: Record<string, TestTransactionSession>;
      }
    ).sessions[String(transactionID)];
    if (!session) throw new Error("inventory-test-seed-session");

    try {
      // This SQL-only fixture creates completed maker-checker count evidence.
      // Database constraints and triggers validate its movement provenance.
      await session.db.execute(sql`
        INSERT INTO inventory_cycle_counts (id, location_id)
        VALUES (${countId}, ${locationId})
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_cycle_count_lines (
          id, count_aggregate_key, count_id, sku_id, disposition,
          counted_quantity, system_quantity, movement_count_snapshot, variance
        ) VALUES (
          ${countLineId}, ${`${countId}:${fixture.skuId}:${disposition}`},
          ${countId}, ${fixture.skuId},
          ${disposition}::enum_inventory_cycle_count_lines_disposition,
          COALESCE((SELECT quantity FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0) + ${quantity},
          COALESCE((SELECT quantity FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0),
          COALESCE((SELECT movement_count FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0),
          ${quantity}
        )
      `);
      await session.db.execute(sql`
        UPDATE inventory_cycle_counts
        SET status = 'submitted', submitted_at = ${effectiveAt}, submitted_by_id = ${fixture.actorIds[0]}
        WHERE id = ${countId}
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          cycle_count_id, cycle_count_line_id, actor, effective_at
        ) VALUES (
          ${`test-seed:${key}`}, ${`test-seed-hash:${key}`}, ${fixture.skuId},
          'inbound', ${quantity}, ${locationId},
          ${disposition}::enum_inventory_movements_to_disposition,
          'postgres-test-seed', 'inventory_cycle_count', ${countLineId},
          ${countId}, ${countLineId}, ${fixture.actorIds[1]}, ${effectiveAt}
        )
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_levels (
          aggregate_key, sku_id, location_id, disposition, quantity, movement_count
        ) VALUES (
          ${aggregateKey}, ${fixture.skuId}, ${locationId},
          ${disposition}::enum_inventory_levels_disposition, ${quantity}, 1
        )
        ON CONFLICT (aggregate_key) DO UPDATE SET
          quantity = inventory_levels.quantity + EXCLUDED.quantity,
          movement_count = inventory_levels.movement_count + 1,
          updated_at = now()
      `);
      await session.db.execute(sql`
        UPDATE inventory_cycle_counts
        SET status = 'applied', applied_at = ${effectiveAt}, applied_by_id = ${fixture.actorIds[1]}
        WHERE id = ${countId}
      `);
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
  }

  function outboundRequest(
    fixture: InventoryPostgresFixture,
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

  function inventoryAdminRequest(
    fixture: InventoryPostgresFixture,
    requestPayload: Payload = payload
  ): PayloadRequest {
    return {
      payload: requestPayload,
      context: {},
      user: { id: fixture.actorIds[1], role: "admin" }
    } as unknown as PayloadRequest;
  }

  function recordCommand(
    fixture: InventoryPostgresFixture,
    input: { payload: Payload; request: unknown }
  ) {
    return recordInventoryMovement({
      ...input,
      req: inventoryAdminRequest(fixture, input.payload)
    });
  }

  function transferRequest(
    fixture: InventoryPostgresFixture,
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

  async function reconcileFixture(fixture: InventoryPostgresFixture) {
    return (await reconcileInventoryLedger(payload)).filter((drift) =>
      drift.aggregateKey.startsWith(`${fixture.skuId}:`)
    );
  }

  function insertRawLevel(input: {
    fixture: InventoryPostgresFixture;
    disposition: "available" | "quarantine" | "damaged";
    quantity: number | TestSQL;
    movementCount: number | TestSQL;
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
    fixture: InventoryPostgresFixture;
    idempotencyKey: string;
    kind: "inbound" | "outbound" | "transfer";
    quantity: number | TestSQL;
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

  return {
    payload,
    cleanup,
    createFixture,
    createLocation,
    seedInventoryForTest,
    outboundRequest,
    transferRequest,
    inventoryAdminRequest,
    recordCommand,
    expectStillWaiting,
    findInventory,
    reconcileFixture,
    insertRawLevel,
    insertRawMovement
  };
}

export type InventoryPostgresHarness = Awaited<
  ReturnType<typeof createInventoryPostgresHarness>
>;
