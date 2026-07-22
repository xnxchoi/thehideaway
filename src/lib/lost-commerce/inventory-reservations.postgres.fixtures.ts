import { randomUUID } from "node:crypto";
import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type PayloadRequest
} from "payload";

import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { InventoryReservationEntries } from "@/payload/collections/(consumption)/InventoryReservationEntries";
import { InventoryReservations } from "@/payload/collections/(consumption)/InventoryReservations";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import type { InventoryDisposition } from "./inventory-ledger-contracts";

export const reservationTestDatabaseUri =
  process.env.COMMERCE_TEST_DATABASE_URI;

type TestTransactionSession = {
  db: { execute: (query: unknown) => Promise<unknown> };
};

export type ReservationFixture = {
  actorId: string;
  checkerId: string;
  locationCode: string;
  locationId: string;
  orderIds: string[];
  productId: string;
  skuIds: string[];
  suffix: string;
  userId: string;
};

export type ReservationRow = {
  id: string;
  order_id: string;
  sku_id: string;
  location_id: string;
  quantity: number;
  status: "active" | "released" | "expired" | "consumed";
  expires_at: Date | string;
};

export type ReservationEntryRow = {
  id: string;
  idempotency_key: string;
  reservation_id: string;
  operation: "reserve" | "release" | "expire" | "consume";
  quantity: number;
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
    { name: "unit_amount", type: "number", required: true, defaultValue: 1 }
  ]
};

const TestUsers: CollectionConfig = {
  slug: "users",
  fields: [
    { name: "email", type: "text", required: true, unique: true },
    { name: "role", type: "text" }
  ]
};

const TestAdmins: CollectionConfig = {
  slug: "reservation-test-admins",
  auth: true,
  lockDocuments: false,
  fields: []
};

const TestProductOrders: CollectionConfig = {
  slug: "product-orders",
  fields: [
    { name: "order_ref", type: "text", required: true, unique: true },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    },
    { name: "storefront", type: "text", defaultValue: "lostinseoul" },
    {
      name: "order_mode",
      type: "select",
      required: true,
      defaultValue: "standard_purchase",
      options: ["standard_purchase", "request_to_order", "private_order"]
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending_payment",
      options: ["pending_payment", "paid", "failed", "canceled"]
    },
    {
      name: "payment_status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "paid", "failed"]
    },
    {
      name: "fulfillment_status",
      type: "select",
      required: true,
      defaultValue: "reserved",
      options: ["unfulfilled", "reserved", "canceled"]
    },
    { name: "currency", type: "text", defaultValue: "KRW" },
    { name: "subtotal_amount", type: "number", defaultValue: 0 },
    { name: "total_amount", type: "number", defaultValue: 0 },
    { name: "line_snapshot_version", type: "number", defaultValue: 2 },
    { name: "lines", type: "json", required: true, defaultValue: [] },
    { name: "expires_at", type: "date", index: true }
  ]
};

const TestProductPayments: CollectionConfig = {
  slug: "product-payments",
  fields: [
    {
      name: "order",
      type: "relationship",
      relationTo: "product-orders",
      required: true,
      index: true
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    },
    {
      name: "provider",
      type: "select",
      required: true,
      options: ["portone"]
    },
    {
      name: "status",
      type: "select",
      required: true,
      options: ["initiated", "pending", "paid", "failed"]
    },
    { name: "amount", type: "number", required: true },
    { name: "currency", type: "text", required: true },
    { name: "paid_at", type: "date" }
  ]
};

export async function createReservationPostgresHarness(databaseUri: string) {
  process.env.DATABASE_URI = databaseUri;
  const config = buildConfig({
    secret: "commerce-reservation-postgres-test-secret",
    admin: { user: "reservation-test-admins" },
    db: postgresAdapter({
      push: false,
      idType: "uuid",
      pool: { connectionString: databaseUri }
    }),
    collections: [
      TestAdmins,
      TestUsers,
      TestProducts,
      ProductVariants,
      TestProductOrders,
      TestProductPayments,
      StockLocations,
      InventoryLevels,
      InventoryMovements,
      InventoryReceipts,
      InventoryReceiptLines,
      InventoryLots,
      InventoryCycleCounts,
      InventoryCycleCountLines,
      InventoryReservations,
      InventoryReservationEntries
    ]
  });
  const payload = await getPayload({ config });
  let fixtures: ReservationFixture[] = [];

  async function createFixture(input?: {
    orderCount?: number;
    skuCount?: number;
  }): Promise<ReservationFixture> {
    const suffix = randomUUID();
    const actorId = randomUUID();
    const checkerId = randomUUID();
    const userId = randomUUID();
    await payload.db.drizzle.execute(sql`
      INSERT INTO users (id, email, role)
      VALUES
        (${actorId}, ${`reservation-actor-${suffix}@example.invalid`}, 'admin'),
        (${checkerId}, ${`reservation-checker-${suffix}@example.invalid`}, 'admin'),
        (${userId}, ${`reservation-buyer-${suffix}@example.invalid`}, 'user')
    `);
    const product = (await payload.create({
      collection: "products" as never,
      overrideAccess: true,
      data: {
        name: `Reservation ${suffix}`,
        slug: `reservation-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      } as never
    })) as unknown as { id: string | number };
    const locationCode = `RES-${suffix}`.toUpperCase();
    const location = (await payload.create({
      collection: "stock-locations" as never,
      overrideAccess: true,
      data: {
        code: locationCode,
        name: `Reservation ${suffix}`,
        active: true
      } as never
    })) as unknown as { id: string | number };
    let skuIds: string[] = [];
    for (let index = 0; index < (input?.skuCount ?? 1); index += 1) {
      const sku = (await payload.create({
        collection: "product-variants" as never,
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-RES-${index}-${suffix}`.toUpperCase(),
          options: [{ key: "test", value: String(index) }]
        } as never
      })) as unknown as { id: string | number };
      skuIds = [...skuIds, String(sku.id)];
    }
    const baseFixture: ReservationFixture = {
      actorId,
      checkerId,
      locationCode,
      locationId: String(location.id),
      orderIds: [],
      productId: String(product.id),
      skuIds,
      suffix,
      userId
    };
    let orderIds: string[] = [];
    for (let index = 0; index < (input?.orderCount ?? 1); index += 1) {
      orderIds = [
        ...orderIds,
        await createOrder(
          baseFixture,
          skuIds.map((skuId) => ({ skuId, quantity: 1 }))
        )
      ];
    }
    const fixture = { ...baseFixture, orderIds };
    fixtures = [...fixtures, fixture];
    return fixture;
  }

  async function createOrder(
    fixture: ReservationFixture,
    lines: Array<{ skuId: string; quantity: number }>
  ): Promise<string> {
    const order = (await payload.create({
      collection: "product-orders" as never,
      overrideAccess: true,
      data: {
        order_ref: `lis_res_${randomUUID()}`,
        user: fixture.userId,
        storefront: "lostinseoul",
        order_mode: "standard_purchase",
        status: "pending_payment",
        payment_status: "pending",
        fulfillment_status: "reserved",
        currency: "KRW",
        subtotal_amount: lines.reduce(
          (total, line) => total + line.quantity,
          0
        ),
        total_amount: lines.reduce((total, line) => total + line.quantity, 0),
        line_snapshot_version: 2,
        lines: lines.map((line) => ({
          schemaVersion: 2,
          mode: "standard_purchase",
          productId: fixture.productId,
          skuId: line.skuId,
          quantity: line.quantity
        }))
      } as never
    })) as unknown as { id: string | number };
    return String(order.id);
  }

  async function seedInventory(
    fixture: ReservationFixture,
    input: {
      disposition?: InventoryDisposition;
      quantity: number;
      skuId?: string;
    }
  ): Promise<void> {
    const disposition = input.disposition ?? "available";
    const skuId = input.skuId ?? fixture.skuIds[0];
    const countId = randomUUID();
    const countLineId = randomUUID();
    const effectiveAt = new Date();
    const aggregateKey = `${skuId}:${fixture.locationId}:${disposition}`;
    const key = `reservation-seed:${fixture.suffix}:${randomUUID()}`;
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("reservation-seed-transaction");
    const session = (
      payload.db as unknown as {
        sessions: Record<string, TestTransactionSession>;
      }
    ).sessions[String(transactionID)];
    if (!session) throw new Error("reservation-seed-session");

    try {
      await session.db.execute(sql`
        INSERT INTO inventory_cycle_counts (id, location_id)
        VALUES (${countId}, ${fixture.locationId})
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_cycle_count_lines (
          id, count_aggregate_key, count_id, sku_id, disposition,
          counted_quantity, system_quantity, movement_count_snapshot, variance
        ) VALUES (
          ${countLineId}, ${`${countId}:${skuId}:${disposition}`},
          ${countId}, ${skuId},
          ${disposition}::enum_inventory_cycle_count_lines_disposition,
          COALESCE((SELECT quantity FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0) + ${input.quantity},
          COALESCE((SELECT quantity FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0),
          COALESCE((SELECT movement_count FROM inventory_levels WHERE aggregate_key = ${aggregateKey}), 0),
          ${input.quantity}
        )
      `);
      await session.db.execute(sql`
        UPDATE inventory_cycle_counts
        SET status = 'submitted', submitted_at = ${effectiveAt}, submitted_by_id = ${fixture.actorId}
        WHERE id = ${countId}
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          cycle_count_id, cycle_count_line_id, actor, effective_at
        ) VALUES (
          ${key}, ${`${key}:hash`}, ${skuId}, 'inbound', ${input.quantity},
          ${fixture.locationId},
          ${disposition}::enum_inventory_movements_to_disposition,
          'postgres-reservation-test-seed', 'inventory_cycle_count', ${countLineId},
          ${countId}, ${countLineId}, ${fixture.checkerId}, ${effectiveAt}
        )
      `);
      await session.db.execute(sql`
        INSERT INTO inventory_levels (
          aggregate_key, sku_id, location_id, disposition, quantity, movement_count
        ) VALUES (
          ${aggregateKey}, ${skuId}, ${fixture.locationId},
          ${disposition}::enum_inventory_levels_disposition, ${input.quantity}, 1
        )
        ON CONFLICT (aggregate_key) DO UPDATE SET
          quantity = inventory_levels.quantity + EXCLUDED.quantity,
          movement_count = inventory_levels.movement_count + 1,
          updated_at = now()
      `);
      await session.db.execute(sql`
        UPDATE inventory_cycle_counts
        SET status = 'applied', applied_at = ${effectiveAt}, applied_by_id = ${fixture.checkerId}
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

  function transactionRequest(
    fixture: ReservationFixture,
    transactionID: string | number
  ): PayloadRequest & { transactionID: string | number } {
    return {
      payload,
      transactionID,
      context: {},
      user: { id: fixture.actorId, role: "admin" }
    } as unknown as PayloadRequest & { transactionID: string | number };
  }

  async function inTransaction<T>(
    fixture: ReservationFixture,
    operation: (
      req: PayloadRequest & { transactionID: string | number }
    ) => Promise<T>
  ): Promise<T> {
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("reservation-test-transaction");
    try {
      const result = await operation(
        transactionRequest(fixture, transactionID)
      );
      await payload.db.commitTransaction(transactionID);
      return result;
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
  }

  async function reservations(
    fixture: ReservationFixture
  ): Promise<ReservationRow[]> {
    const result = await payload.db.drizzle.execute<ReservationRow>(sql`
        SELECT id, order_id, sku_id, location_id,
          quantity::double precision AS quantity, status, expires_at
      FROM inventory_reservations
      WHERE sku_id IN (${sql.join(
        fixture.skuIds.map((skuId) => sql`${skuId}`),
        sql`, `
      )})
      ORDER BY id
    `);
    return result.rows;
  }

  async function reservationEntries(
    fixture: ReservationFixture
  ): Promise<ReservationEntryRow[]> {
    const result = await payload.db.drizzle.execute<ReservationEntryRow>(sql`
        SELECT id, idempotency_key, reservation_id, operation,
          quantity::double precision AS quantity
      FROM inventory_reservation_entries
      WHERE reservation_id IN (
        SELECT id FROM inventory_reservations
        WHERE sku_id IN (${sql.join(
          fixture.skuIds.map((skuId) => sql`${skuId}`),
          sql`, `
        )})
      )
      ORDER BY id
    `);
    return result.rows;
  }

  async function availableQuantity(
    fixture: ReservationFixture,
    skuId = fixture.skuIds[0]
  ): Promise<number> {
    const aggregateKey = `${skuId}:${fixture.locationId}:available`;
    const result = await payload.db.drizzle.execute<{ quantity: number }>(sql`
      SELECT quantity
      FROM inventory_levels
      WHERE aggregate_key = ${aggregateKey}
    `);
    return Number(result.rows[0]?.quantity ?? 0);
  }

  async function cleanup(): Promise<void> {
    if (fixtures.length === 0) return;
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("reservation-cleanup-transaction");
    const session = (
      payload.db as unknown as {
        sessions: Record<string, TestTransactionSession>;
      }
    ).sessions[String(transactionID)];
    if (!session) throw new Error("reservation-cleanup-session");

    try {
      await session.db.execute(
        sql`SET LOCAL session_replication_role = replica`
      );
      for (const fixture of [...fixtures].reverse()) {
        await session.db.execute(sql`
          DELETE FROM inventory_reservation_entries
          WHERE reservation_id IN (
            SELECT id FROM inventory_reservations
            WHERE sku_id IN (${sql.join(
              fixture.skuIds.map((skuId) => sql`${skuId}`),
              sql`, `
            )})
          )
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_reservations
          WHERE sku_id IN (${sql.join(
            fixture.skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )})
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_movements
          WHERE sku_id IN (${sql.join(
            fixture.skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )})
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_levels
          WHERE sku_id IN (${sql.join(
            fixture.skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )})
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_cycle_count_lines
          WHERE sku_id IN (${sql.join(
            fixture.skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )})
        `);
        await session.db.execute(sql`
          DELETE FROM inventory_cycle_counts WHERE location_id = ${fixture.locationId}
        `);
        await session.db.execute(sql`
          DELETE FROM product_orders WHERE user_id = ${fixture.userId}
        `);
        await session.db.execute(sql`
          DELETE FROM product_variants
          WHERE id IN (${sql.join(
            fixture.skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )})
        `);
        await session.db.execute(sql`
          DELETE FROM stock_locations WHERE id = ${fixture.locationId}
        `);
        await session.db.execute(sql`
          DELETE FROM products WHERE id = ${fixture.productId}
        `);
        await session.db.execute(sql`
          DELETE FROM users
          WHERE id IN (${fixture.actorId}, ${fixture.checkerId}, ${fixture.userId})
        `);
      }
      await payload.db.commitTransaction(transactionID);
      fixtures = [];
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }
  }

  return {
    payload,
    availableQuantity,
    cleanup,
    createFixture,
    createOrder,
    inTransaction,
    reservationEntries,
    reservations,
    seedInventory,
    transactionRequest
  };
}

export type ReservationPostgresHarness = Awaited<
  ReturnType<typeof createReservationPostgresHarness>
>;
