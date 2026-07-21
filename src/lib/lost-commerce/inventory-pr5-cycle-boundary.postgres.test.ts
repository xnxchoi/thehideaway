import { randomUUID } from "node:crypto";
import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type Payload
} from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

const TestProducts: CollectionConfig = {
  slug: "products",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "currency", type: "select", options: ["KRW"] },
    { name: "unit_amount", type: "number", required: true, defaultValue: 1 }
  ]
};

const TestUsers: CollectionConfig = {
  slug: "users",
  auth: { disableLocalStrategy: true },
  fields: [
    { name: "name", type: "text" },
    { name: "role", type: "select", options: ["admin"] }
  ]
};

type Doc = Record<string, unknown> & { id: string };
type CycleStockFixture = {
  actorId: string;
  checkerId: string;
  locationId: string;
  otherLocationId: string;
  skuId: string;
  otherSkuId: string;
};

const databaseCause = (expected: Record<string, unknown>) => ({
  cause: expect.objectContaining(expected)
});

describeWithPostgres.sequential(
  "PR5 inventory cycle-count SQL boundary",
  () => {
    let payload: Payload;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      payload = await getPayload({
        config: buildConfig({
          secret: "commerce-pr5-cycle-boundary-secret",
          db: postgresAdapter({
            push: false,
            idType: "uuid",
            pool: { connectionString: testDatabaseUri }
          }),
          collections: [
            TestProducts,
            TestUsers,
            ProductVariants,
            StockLocations,
            InventoryReceipts,
            InventoryReceiptLines,
            InventoryLots,
            InventoryCycleCounts,
            InventoryCycleCountLines,
            InventoryLevels,
            InventoryMovements
          ]
        })
      });
    }, 60_000);

    afterAll(async () => {
      await payload?.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    });

    async function createDoc(
      collection: "products" | "users" | "product-variants" | "stock-locations",
      data: Record<string, unknown>
    ): Promise<Doc> {
      return payload.create({
        collection,
        data,
        overrideAccess: true
      } as never) as unknown as Promise<Doc>;
    }

    async function fixture(): Promise<CycleStockFixture> {
      const suffix = randomUUID();
      const [actor, checker, product, otherProduct, location, otherLocation] =
        await Promise.all([
          createDoc("users", { name: `Maker ${suffix}`, role: "admin" }),
          createDoc("users", { name: `Checker ${suffix}`, role: "admin" }),
          createDoc("products", {
            name: `Boundary ${suffix}`,
            slug: `boundary-${suffix}`,
            currency: "KRW",
            unit_amount: 1
          }),
          createDoc("products", {
            name: `Other boundary ${suffix}`,
            slug: `other-boundary-${suffix}`,
            currency: "KRW",
            unit_amount: 1
          }),
          createDoc("stock-locations", {
            code: `BOUNDARY-${suffix}`.toUpperCase(),
            name: `Boundary ${suffix}`,
            active: true
          }),
          createDoc("stock-locations", {
            code: `OTHER-${suffix}`.toUpperCase(),
            name: `Other ${suffix}`,
            active: true
          })
        ]);
      const [sku, otherSku] = await Promise.all([
        createDoc("product-variants", {
          product: otherProduct.id,
          active: true,
          sku: `BOUNDARY-${suffix}`.toUpperCase(),
          options: []
        }),
        createDoc("product-variants", {
          product: product.id,
          active: true,
          sku: `OTHER-${suffix}`.toUpperCase(),
          options: []
        })
      ]);
      return {
        actorId: actor.id,
        checkerId: checker.id,
        locationId: location.id,
        otherLocationId: otherLocation.id,
        skuId: sku.id,
        otherSkuId: otherSku.id
      };
    }

    it("requires coherent count evidence and maker-checker approval for positive variance", async () => {
      const stock = await fixture();
      const suffix = randomUUID();
      const count = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_counts (location_id, status)
      VALUES (${stock.locationId}, 'draft') RETURNING id
    `);
      const countId = count.rows[0]?.id;
      if (!countId) throw new Error("count-evidence-fixture-failed");
      const line = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_count_lines (
        count_aggregate_key, count_id, sku_id, disposition,
        counted_quantity, system_quantity, movement_count_snapshot, variance
      ) VALUES (
        ${`count-${suffix}`}, ${countId}, ${stock.skuId}, 'available', 3, 0, 0, 3
      ) RETURNING id
    `);
      const lineId = line.rows[0]?.id;
      if (!lineId) throw new Error("count-evidence-fixture-failed");
      const effectiveAt = new Date().toISOString();
      await payload.db.drizzle.execute(sql`
      UPDATE inventory_cycle_counts
      SET status = 'submitted', submitted_at = ${effectiveAt}, submitted_by_id = ${stock.actorId}
      WHERE id = ${countId}
    `);
      const row = { count_id: countId, line_id: lineId };
      const insertCountMovement = (input: {
        disposition?: string;
        kind?: "inbound" | "outbound";
        locationId?: string;
        quantity?: number;
        skuId?: string;
      }) => {
        const inbound = (input.kind ?? "inbound") === "inbound";
        return payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, to_location_id, to_disposition,
          reason_code, source_type, source_ref, actor, effective_at,
          cycle_count_id, cycle_count_line_id
        ) VALUES (
          ${randomUUID()}, ${"e".repeat(64)}, ${input.skuId ?? stock.skuId},
          ${input.kind ?? "inbound"}, ${input.quantity ?? 3},
          ${inbound ? null : (input.locationId ?? stock.locationId)},
          ${inbound ? null : (input.disposition ?? "available")},
          ${inbound ? (input.locationId ?? stock.locationId) : null},
          ${inbound ? (input.disposition ?? "available") : null},
          'cycle-count-variance', 'inventory_cycle_count', ${row.line_id},
          ${stock.checkerId}, ${effectiveAt}, ${row.count_id}, ${row.line_id}
        )
      `);
      };

      await expect(
        payload.db.drizzle.execute(sql`
        UPDATE inventory_cycle_counts
        SET status = 'applied', applied_at = now(), applied_by_id = ${stock.checkerId}
        WHERE id = ${row.count_id}
      `)
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "cycle count movement evidence mismatch"
          )
        })
      );
      await expect(
        insertCountMovement({ skuId: stock.otherSkuId })
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "cycle count provenance chain mismatch"
          )
        })
      );
      for (const contradictory of [
        { quantity: 2 },
        { disposition: "damaged" },
        { locationId: stock.otherLocationId },
        { kind: "outbound" as const }
      ]) {
        await expect(insertCountMovement(contradictory)).rejects.toMatchObject(
          databaseCause({
            message: expect.stringContaining(
              "cycle count provenance chain mismatch"
            )
          })
        );
      }
      const selfApprovalClient = await payload.db.pool.connect();
      try {
        await selfApprovalClient.query("BEGIN");
        await selfApprovalClient.query(
          `INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          actor, effective_at, cycle_count_id, cycle_count_line_id
        ) VALUES ($1, $2, $3, 'inbound', 3, $4, 'available',
          'cycle-count-variance', 'inventory_cycle_count', $5, $6, $7, $8, $9)`,
          [
            randomUUID(),
            "f".repeat(64),
            stock.skuId,
            stock.locationId,
            row.line_id,
            stock.checkerId,
            effectiveAt,
            row.count_id,
            row.line_id
          ]
        );
        await expect(
          selfApprovalClient.query(
            `UPDATE inventory_cycle_counts SET status = 'applied', applied_at = $3,
            applied_by_id = $1 WHERE id = $2`,
            [stock.actorId, row.count_id, effectiveAt]
          )
        ).rejects.toMatchObject({
          message: "positive variance requires a different checker"
        });
      } finally {
        await selfApprovalClient.query("ROLLBACK").catch(() => undefined);
        selfApprovalClient.release();
      }

      const applyClient = await payload.db.pool.connect();
      try {
        await applyClient.query("BEGIN");
        await applyClient.query(
          `INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          actor, effective_at, cycle_count_id, cycle_count_line_id
        ) VALUES ($1, $2, $3, 'inbound', 3, $4, 'available',
          'cycle-count-variance', 'inventory_cycle_count', $5, $6, $7, $8, $9)`,
          [
            randomUUID(),
            "f".repeat(64),
            stock.skuId,
            stock.locationId,
            row.line_id,
            stock.checkerId,
            effectiveAt,
            row.count_id,
            row.line_id
          ]
        );
        await applyClient.query(
          `UPDATE inventory_cycle_counts SET status = 'applied', applied_at = $3,
          applied_by_id = $1 WHERE id = $2`,
          [stock.checkerId, row.count_id, effectiveAt]
        );
        await applyClient.query("COMMIT");
      } finally {
        await applyClient.query("ROLLBACK").catch(() => undefined);
        applyClient.release();
      }
    });

    it("makes cycle-count movement evidence single-use and terminally applied", async () => {
      const stock = await fixture();
      const suffix = randomUUID();
      const count = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_counts (location_id, status)
      VALUES (${stock.locationId}, 'draft') RETURNING id
    `);
      const countId = count.rows[0]?.id;
      if (!countId) throw new Error("cycle-integrity-fixture-failed");
      const line = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_count_lines (
        count_aggregate_key, count_id, sku_id, disposition,
        counted_quantity, system_quantity, movement_count_snapshot, variance
      ) VALUES (
        ${`integrity-${suffix}`}, ${countId}, ${stock.skuId}, 'available',
        1, 0, 0, 1
      ) RETURNING id
    `);
      const lineId = line.rows[0]?.id;
      if (!lineId) throw new Error("cycle-integrity-fixture-failed");
      const effectiveAt = new Date().toISOString();
      await payload.db.drizzle.execute(sql`
      UPDATE inventory_cycle_counts
      SET status = 'submitted', submitted_at = ${effectiveAt}, submitted_by_id = ${stock.actorId}
      WHERE id = ${countId}
    `);

      await expect(
        payload.db.drizzle.execute(sql`
          UPDATE inventory_cycle_counts
          SET status = 'cancelled', cancelled_at = now(),
            cancelled_by_id = ${stock.checkerId}
          WHERE id = ${countId}
        `)
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "invalid inventory cycle count transition"
          )
        })
      );

      const movementValues = [
        randomUUID(),
        "f".repeat(64),
        stock.skuId,
        stock.locationId,
        lineId,
        stock.checkerId,
        effectiveAt,
        countId
      ] as const;
      type TestPoolClient = NonNullable<
        Parameters<Parameters<typeof payload.db.pool.connect>[0]>[1]
      >;
      const insertMovement = (client: TestPoolClient) =>
        client.query(
          `INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          actor, effective_at, cycle_count_id, cycle_count_line_id
        ) VALUES ($1, $2, $3, 'inbound', 1, $4, 'available',
          'cycle-count-variance', 'inventory_cycle_count', $5::text, $6, $7, $8, $5::uuid)`,
          [...movementValues]
        );

      const mismatchedParentClient = await payload.db.pool.connect();
      try {
        await mismatchedParentClient.query("BEGIN");
        await mismatchedParentClient.query(
          "ALTER TABLE inventory_cycle_counts DISABLE TRIGGER inventory_cycle_counts_protect_lifecycle"
        );
        await insertMovement(mismatchedParentClient);
        await mismatchedParentClient.query(
          `UPDATE inventory_cycle_counts
           SET status = 'applied', applied_at = $3, applied_by_id = $1
           WHERE id = $2`,
          [
            stock.checkerId,
            countId,
            new Date(new Date(effectiveAt).getTime() + 1_000).toISOString()
          ]
        );
        await expect(
          mismatchedParentClient.query("COMMIT")
        ).rejects.toMatchObject({
          message: "cycle count movement audit evidence mismatch"
        });
      } finally {
        await mismatchedParentClient.query("ROLLBACK").catch(() => undefined);
        mismatchedParentClient.release();
      }

      const orphanClient = await payload.db.pool.connect();
      try {
        await orphanClient.query("BEGIN");
        await insertMovement(orphanClient);
        await expect(orphanClient.query("COMMIT")).rejects.toMatchObject({
          message: "cycle count movement parent must be applied"
        });
      } finally {
        await orphanClient.query("ROLLBACK").catch(() => undefined);
        orphanClient.release();
      }

      for (const terminalStatus of ["rejected"] as const) {
        const terminalClient = await payload.db.pool.connect();
        try {
          await terminalClient.query("BEGIN");
          await insertMovement(terminalClient);
          await expect(
            terminalClient.query(
              `UPDATE inventory_cycle_counts
             SET status = $1::enum_inventory_cycle_counts_status,
               rejected_at = CASE WHEN $1::text = 'rejected' THEN now() ELSE NULL END,
               rejected_by_id = CASE WHEN $1::text = 'rejected' THEN $2::uuid ELSE NULL END,
               cancelled_at = CASE WHEN $1::text = 'cancelled' THEN now() ELSE NULL END,
               cancelled_by_id = CASE WHEN $1::text = 'cancelled' THEN $2::uuid ELSE NULL END
             WHERE id = $3`,
              [terminalStatus, stock.checkerId, countId]
            )
          ).rejects.toMatchObject({
            message: "cycle count movement evidence requires application"
          });
        } finally {
          await terminalClient.query("ROLLBACK").catch(() => undefined);
          terminalClient.release();
        }
      }

      const appliedClient = await payload.db.pool.connect();
      try {
        await appliedClient.query("BEGIN");
        await insertMovement(appliedClient);
        await appliedClient.query("SAVEPOINT before_duplicate");
        await expect(
          appliedClient.query(
            `INSERT INTO inventory_movements (
            idempotency_key, request_hash, sku_id, kind, quantity,
            to_location_id, to_disposition, reason_code, source_type, source_ref,
            actor, effective_at, cycle_count_id, cycle_count_line_id
          ) VALUES ($1, $2, $3, 'inbound', 1, $4, 'available',
            'cycle-count-variance', 'inventory_cycle_count', $5::text, $6, $7, $8, $5::uuid)`,
            [randomUUID(), "0".repeat(64), ...movementValues.slice(2)]
          )
        ).rejects.toMatchObject({
          code: "23505",
          constraint: "inventory_movements_cycle_count_line_once_idx"
        });
        await appliedClient.query("ROLLBACK TO SAVEPOINT before_duplicate");
        await appliedClient.query(
          `UPDATE inventory_cycle_counts
         SET status = 'applied', applied_at = $3, applied_by_id = $1
         WHERE id = $2`,
          [stock.checkerId, countId, effectiveAt]
        );
        await appliedClient.query("COMMIT");
      } finally {
        await appliedClient.query("ROLLBACK").catch(() => undefined);
        appliedClient.release();
      }

      const applied = await payload.db.drizzle.execute<{ status: string }>(sql`
      SELECT status::text AS status FROM inventory_cycle_counts WHERE id = ${countId}
    `);
      expect(applied.rows[0]?.status).toBe("applied");
    });

    it("rejects submit evidence backfilled after cancellation", async () => {
      const stock = await fixture();
      const count = await payload.db.drizzle.execute<{
        cancelled_at: Date;
        id: string;
      }>(sql`
        INSERT INTO inventory_cycle_counts (location_id)
        VALUES (${stock.locationId})
        RETURNING id
      `);
      const countId = count.rows[0]?.id;
      if (!countId) throw new Error("count-cancellation-fixture-failed");
      const cancelled = await payload.db.drizzle.execute<{
        cancelled_at: Date;
      }>(sql`
        UPDATE inventory_cycle_counts
        SET status = 'cancelled', cancelled_at = now(),
          cancelled_by_id = ${stock.checkerId}
        WHERE id = ${countId}
        RETURNING cancelled_at
      `);
      const cancelledAt = cancelled.rows[0]?.cancelled_at;
      if (!cancelledAt) throw new Error("count-cancellation-fixture-failed");

      await expect(
        payload.db.drizzle.execute(sql`
          UPDATE inventory_cycle_counts
          SET submitted_at = ${cancelledAt}, submitted_by_id = ${stock.actorId}
          WHERE id = ${countId}
        `)
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "inventory cycle count transition evidence requires its status transition"
          )
        })
      );
    });
  }
);
