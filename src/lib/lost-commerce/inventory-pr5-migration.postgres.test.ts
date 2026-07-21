import { randomUUID } from "node:crypto";
import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import {
  buildConfig,
  createLocalReq,
  getPayload,
  type CollectionConfig,
  type Payload,
  type PayloadRequest
} from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  down as revertPr5Migration,
  up as applyPr5Migration
} from "@/lib/migrations/20260721_194017";
import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import { CommerceCommands } from "@/payload/collections/(consumption)/CommerceCommands";

import {
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt
} from "./inventory-operations";

// Destructive migration tests require their own disposable database and must
// never join the shared COMMERCE_TEST_DATABASE_URI file-parallel test pool.
const testDatabaseUri = process.env.PR5_MIGRATION_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

const TestProducts: CollectionConfig = {
  slug: "products",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "currency", type: "select", options: ["KRW", "USD", "JPY", "EUR"] },
    { name: "unit_amount", type: "number", required: true, defaultValue: 0 }
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

type TestDoc = Record<string, unknown> & { id: string };
const databaseCause = (expected: Record<string, unknown>) => ({
  cause: expect.objectContaining(expected)
});
const isStillWaiting = (promise: Promise<unknown>) =>
  Promise.race([
    promise.then(
      () => false,
      () => false
    ),
    new Promise<true>((resolve) => setTimeout(() => resolve(true), 50))
  ]);

describeWithPostgres.sequential(
  "PR5 inventory migration with PostgreSQL",
  () => {
    let payload: Payload;
    let migrationReq: PayloadRequest;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      payload = await getPayload({
        config: buildConfig({
          secret: "commerce-pr5-migration-test-secret",
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
            InventoryMovements,
            CommerceCommands
          ]
        })
      });
      await payload.db.drizzle.execute(sql`
        DELETE FROM commerce_commands
        WHERE status::text = 'in_progress'
          AND business_key LIKE 'inventory:%'
      `);
      migrationReq = await createLocalReq({}, payload);
    }, 60_000);

    afterAll(async () => {
      await payload?.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    });

    async function createTestDoc(
      collection: "products" | "users" | "product-variants" | "stock-locations",
      data: Record<string, unknown>
    ): Promise<TestDoc> {
      // This test-local Payload config is intentionally narrower than generated app types.
      return payload.create({
        collection,
        overrideAccess: true,
        data
      } as never) as unknown as Promise<TestDoc>;
    }

    const migrationArgs = (db = payload.db.drizzle) => ({
      db,
      payload,
      req: migrationReq
    });

    async function schemaEvidence(db = payload.db.drizzle) {
      const result = await db.execute<{
        receipt_index: boolean;
        cycle_line_once_index: boolean;
        cycle_parent_trigger: boolean;
        count_quantity_check: boolean;
        lot_receipt_trigger: boolean;
        lot_trigger: boolean;
        provenance_check: boolean;
        provenance_trigger: boolean;
      }>(sql`
      SELECT
        to_regclass('public.inventory_movements_receipt_idx') IS NOT NULL AS receipt_index,
        to_regclass('public.inventory_movements_cycle_count_line_once_idx') IS NOT NULL
          AS cycle_line_once_index,
        EXISTS (SELECT 1 FROM pg_trigger
          WHERE tgname = 'inventory_movements_require_applied_cycle_count')
          AS cycle_parent_trigger,
        EXISTS (SELECT 1 FROM pg_constraint
          WHERE conname = 'inventory_cycle_count_lines_quantities_check')
          AS count_quantity_check,
        EXISTS (SELECT 1 FROM pg_trigger
          WHERE tgname = 'inventory_lots_require_receipt_movement')
          AS lot_receipt_trigger,
        EXISTS (SELECT 1 FROM pg_trigger
          WHERE tgname = 'inventory_lots_prevent_row_mutation') AS lot_trigger,
        EXISTS (SELECT 1 FROM pg_constraint
          WHERE conname = 'inventory_movements_provenance_shape_check') AS provenance_check,
        EXISTS (SELECT 1 FROM pg_trigger
          WHERE tgname = 'inventory_movements_validate_pr5_provenance') AS provenance_trigger
    `);
      return result.rows[0];
    }

    it("repairs partial tables and scoped safeguards idempotently", async () => {
      const rollbackMarker = "partial-reentry-rollback";
      const transactional = payload.db.drizzle as typeof payload.db.drizzle & {
        transaction<T>(
          callback: (tx: typeof payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (tx) => {
          await tx.execute(sql`
            SET LOCAL session_replication_role = replica;
            DELETE FROM inventory_movements
              WHERE source_type::text <> 'inventory_command';
            DELETE FROM inventory_cycle_count_lines;
            DELETE FROM inventory_cycle_counts;
            DELETE FROM inventory_lots;
            DELETE FROM inventory_receipt_lines;
            DELETE FROM inventory_receipts;

            CREATE SCHEMA IF NOT EXISTS pr5_constraint_decoy;
            CREATE TABLE IF NOT EXISTS pr5_constraint_decoy.inventory_lots (
              actor_id integer,
              CONSTRAINT inventory_lots_actor_id_users_id_fk CHECK (actor_id IS NULL)
            );

            ALTER TABLE inventory_receipts DROP COLUMN IF EXISTS location_id CASCADE;
            ALTER TABLE inventory_receipt_lines DROP COLUMN IF EXISTS receipt_sku_key CASCADE;
            ALTER TABLE inventory_lots DROP COLUMN IF EXISTS operation_key CASCADE;
            ALTER TABLE inventory_cycle_counts DROP COLUMN IF EXISTS location_id CASCADE;
            ALTER TABLE inventory_cycle_count_lines
              DROP COLUMN IF EXISTS movement_count_snapshot CASCADE;

            ALTER TABLE inventory_lots
              DROP CONSTRAINT IF EXISTS inventory_lots_actor_id_users_id_fk;
            ALTER TABLE inventory_receipt_lines
              DROP CONSTRAINT IF EXISTS inventory_receipt_lines_expected_quantity_check;
            DROP INDEX IF EXISTS inventory_cycle_count_lines_count_aggregate_key_idx;
            DROP TRIGGER IF EXISTS inventory_receipts_protect_lifecycle
              ON inventory_receipts;
            DROP TRIGGER IF EXISTS inventory_movements_validate_pr5_provenance
              ON inventory_movements;
            DROP TRIGGER IF EXISTS inventory_movements_require_applied_cycle_count
              ON inventory_movements;
            DROP INDEX IF EXISTS inventory_movements_cycle_count_line_once_idx;
            ALTER TABLE inventory_movements
              DROP CONSTRAINT IF EXISTS inventory_movements_provenance_shape_check
          `);
          await applyPr5Migration(migrationArgs(tx));
          await applyPr5Migration(migrationArgs(tx));

          const repaired = await tx.execute<{
            columns_repaired: boolean;
            count_unique_repaired: boolean;
            lifecycle_trigger_repaired: boolean;
            lot_fk_repaired: boolean;
            receipt_check_repaired: boolean;
          }>(sql`
            SELECT
              (SELECT count(*) = 5 FROM information_schema.columns
                WHERE table_schema = 'public' AND (
                  (table_name = 'inventory_receipts' AND column_name = 'location_id')
                  OR (table_name = 'inventory_receipt_lines' AND column_name = 'receipt_sku_key')
                  OR (table_name = 'inventory_lots' AND column_name = 'operation_key')
                  OR (table_name = 'inventory_cycle_counts' AND column_name = 'location_id')
                  OR (table_name = 'inventory_cycle_count_lines'
                    AND column_name = 'movement_count_snapshot')
                )) AS columns_repaired,
              to_regclass('public.inventory_cycle_count_lines_count_aggregate_key_idx')
                IS NOT NULL AS count_unique_repaired,
              EXISTS (SELECT 1 FROM pg_trigger
                WHERE tgname = 'inventory_receipts_protect_lifecycle'
                  AND tgrelid = 'public.inventory_receipts'::regclass)
                AS lifecycle_trigger_repaired,
              EXISTS (SELECT 1 FROM pg_constraint
                WHERE conname = 'inventory_lots_actor_id_users_id_fk'
                  AND conrelid = 'public.inventory_lots'::regclass)
                AS lot_fk_repaired,
              EXISTS (SELECT 1 FROM pg_constraint
                WHERE conname = 'inventory_receipt_lines_expected_quantity_check'
                  AND conrelid = 'public.inventory_receipt_lines'::regclass)
                AS receipt_check_repaired
          `);
          expect(repaired.rows[0]).toEqual({
            columns_repaired: true,
            count_unique_repaired: true,
            lifecycle_trigger_repaired: true,
            lot_fk_repaired: true,
            receipt_check_repaired: true
          });
          const snapshot = await schemaEvidence(tx);
          expect(snapshot).toEqual({
            receipt_index: true,
            cycle_line_once_index: true,
            cycle_parent_trigger: true,
            count_quantity_check: true,
            lot_receipt_trigger: true,
            lot_trigger: true,
            provenance_check: true,
            provenance_trigger: true
          });
          throw new Error(rollbackMarker);
        })
      ).rejects.toThrow(rollbackMarker);
    });

    it("preserves populated up re-entry and refuses rollback with PR5 evidence", async () => {
      const suffix = randomUUID();
      const product = await createTestDoc("products", {
        name: `Migration ${suffix}`,
        slug: `migration-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      });
      const actor = await createTestDoc("users", {
        name: "Migration actor",
        role: "admin"
      });
      const location = await createTestDoc("stock-locations", {
        code: `MIG-${suffix}`.toUpperCase(),
        name: `Migration ${suffix}`,
        active: true
      });
      const sku = await createTestDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `MIG-${suffix}`.toUpperCase(),
        options: []
      });
      const receipt = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_receipts (location_id, status)
      VALUES (${location.id}, 'draft') RETURNING id
    `);
      const receiptId = receipt.rows[0]?.id;
      if (!receiptId) throw new Error("migration-receipt-fixture-failed");
      const line = await payload.db.drizzle.execute<{ id: string }>(sql`
        INSERT INTO inventory_receipt_lines (
          receipt_sku_key, receipt_id, sku_id, expected_quantity
        ) VALUES (${suffix}, ${receiptId}, ${sku.id}, 2) RETURNING id
      `);
      const lineId = line.rows[0]?.id;
      if (!lineId) throw new Error("migration-line-fixture-failed");
      await payload.db.drizzle.execute(sql`
      UPDATE inventory_receipts SET status = 'open',
        opened_at = now(), opened_by_id = ${actor.id}
      WHERE id = ${receiptId}
    `);
      const inserted = await payload.db.drizzle.execute<{
        movement_id: string;
      }>(sql`
      WITH lot AS (
        INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES (${`lot-${suffix}`}, ${lineId}, 2, now(), ${actor.id})
        RETURNING id, receipt_line_id, received_at, actor_id
      )
      INSERT INTO inventory_movements (
        idempotency_key, request_hash, sku_id, kind, quantity,
        to_location_id, to_disposition, reason_code, source_type,
        source_ref, actor, effective_at, receipt_id, receipt_line_id, lot_id
      ) SELECT
        ${`movement-${suffix}`}, ${"a".repeat(64)}, ${sku.id}, 'inbound', 2,
        ${location.id}, 'quarantine', 'migration-down-test', 'inventory_receipt',
        lot.id::text, lot.actor_id::text, lot.received_at,
        ${receiptId}, ${lineId}, lot.id FROM lot
      RETURNING id AS movement_id
    `);
      expect(inserted.rows).toHaveLength(1);

      const aggregateKey = `${sku.id}:${location.id}:quarantine`;
      await payload.db.drizzle.execute(sql`
      INSERT INTO inventory_levels (
        aggregate_key, sku_id, location_id, disposition, quantity, movement_count
      ) VALUES (${aggregateKey}, ${sku.id}, ${location.id}, 'quarantine', 2, 1)
      ON CONFLICT (aggregate_key) DO UPDATE
      SET quantity = EXCLUDED.quantity, movement_count = EXCLUDED.movement_count
    `);
      const commandKey = `migration-command-${suffix}`;
      await payload.db.drizzle.execute(sql`
      INSERT INTO commerce_commands (
        command_key, business_key, request_hash, status, safe_response,
        resource_type, resource_id, completed_at
      ) VALUES (
        ${commandKey}, ${commandKey}, ${"b".repeat(64)}, 'succeeded', '{}'::jsonb,
        'inventory-receipt', ${receiptId}, now()
      )
    `);

      await applyPr5Migration(migrationArgs());
      await applyPr5Migration(migrationArgs());

      await expect(revertPr5Migration(migrationArgs())).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "PR5 inventory evidence exists; refusing rollback"
          )
        })
      );
      const preserved = await payload.db.drizzle.execute<{
        command_count: string;
        evidence_table: unknown;
        level_count: string;
        movement_count: string;
      }>(sql`
      SELECT to_regclass('public.inventory_receipts') AS evidence_table,
        (SELECT count(*)::text FROM inventory_movements
          WHERE id = ${inserted.rows[0]?.movement_id}) AS movement_count,
        (SELECT count(*)::text FROM inventory_levels
          WHERE aggregate_key = ${aggregateKey} AND quantity = 2 AND movement_count = 1) AS level_count,
        (SELECT count(*)::text FROM commerce_commands
          WHERE command_key = ${commandKey} AND status = 'succeeded') AS command_count
    `);
      expect(preserved.rows[0]).toEqual({
        command_count: "1",
        evidence_table: "inventory_receipts",
        level_count: "1",
        movement_count: "1"
      });
      expect(await schemaEvidence()).toEqual({
        receipt_index: true,
        cycle_line_once_index: true,
        cycle_parent_trigger: true,
        count_quantity_check: true,
        lot_receipt_trigger: true,
        lot_trigger: true,
        provenance_check: true,
        provenance_trigger: true
      });
    }, 30_000);

    it("refuses rollback for a committed in-progress inventory claim before evidence", async () => {
      await payload.db.drizzle.execute(sql`
        SET session_replication_role = replica;
        DELETE FROM inventory_movements
          WHERE source_type::text <> 'inventory_command';
        DELETE FROM inventory_cycle_count_lines;
        DELETE FROM inventory_cycle_counts;
        DELETE FROM inventory_lots;
        DELETE FROM inventory_receipt_lines;
        DELETE FROM inventory_receipts;
        SET session_replication_role = origin
      `);
      const commandKey = `migration-claimed-${randomUUID()}`;
      await payload.db.drizzle.execute(sql`
        INSERT INTO commerce_commands (
          command_key, business_key, request_hash, status,
          attempt_count, lease_expires_at
        ) VALUES (
          ${commandKey}, ${`inventory:receipt-receive:${commandKey}`},
          ${"9".repeat(64)}, 'in_progress', 1, now() + interval '5 minutes'
        )
      `);
      try {
        await expect(revertPr5Migration(migrationArgs())).rejects.toMatchObject(
          databaseCause({
            message: expect.stringContaining(
              "PR5 inventory command is in progress; refusing rollback"
            )
          })
        );
      } finally {
        await payload.db.drizzle.execute(sql`
          DELETE FROM commerce_commands WHERE command_key = ${commandKey}
        `);
      }
    }, 30_000);

    it("allows rollback past an expired inventory claim without evidence", async () => {
      await payload.db.drizzle.execute(sql`
        SET session_replication_role = replica;
        DELETE FROM inventory_movements
          WHERE source_type::text <> 'inventory_command';
        DELETE FROM inventory_cycle_count_lines;
        DELETE FROM inventory_cycle_counts;
        DELETE FROM inventory_lots;
        DELETE FROM inventory_receipt_lines;
        DELETE FROM inventory_receipts;
        SET session_replication_role = origin
      `);
      const commandKey = `migration-expired-${randomUUID()}`;
      await payload.db.drizzle.execute(sql`
        INSERT INTO commerce_commands (
          command_key, business_key, request_hash, status,
          attempt_count, lease_expires_at
        ) VALUES (
          ${commandKey}, ${`inventory:receipt-receive:${commandKey}`},
          ${"8".repeat(64)}, 'in_progress', 1, now() - interval '1 minute'
        )
      `);

      await revertPr5Migration(migrationArgs());
      await applyPr5Migration(migrationArgs());
      const preserved = await payload.db.drizzle.execute<{
        present: boolean;
      }>(sql`
        SELECT EXISTS (
          SELECT 1 FROM commerce_commands WHERE command_key = ${commandKey}
        ) AS present
      `);
      expect(preserved.rows[0]?.present).toBe(true);
      await payload.db.drizzle.execute(sql`
        DELETE FROM commerce_commands WHERE command_key = ${commandKey}
      `);
    }, 30_000);

    it("allows an empty guarded down/up cycle without touching pre-PR5 truth", async () => {
      const rollbackMarker = "rollback-empty-migration-test";
      const suffix = randomUUID();
      const product = await createTestDoc("products", {
        name: `Pre-PR5 ${suffix}`,
        slug: `pre-pr5-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      });
      const location = await createTestDoc("stock-locations", {
        code: `PRE-${suffix}`.toUpperCase(),
        name: `Pre-PR5 ${suffix}`,
        active: true
      });
      const sku = await createTestDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `PRE-${suffix}`.toUpperCase(),
        options: []
      });
      const aggregateKey = `${sku.id}:${location.id}:available`;
      const commandKey = `pre-pr5-${suffix}`;
      await payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, reason_code, source_type
        ) VALUES (
          ${commandKey}, ${"c".repeat(64)}, ${sku.id}, 'outbound', 1,
          ${location.id}, 'available', 'migration-preservation-test',
          'inventory_command'
        )
      `);
      await payload.db.drizzle.execute(sql`
        INSERT INTO inventory_levels (
          aggregate_key, sku_id, location_id, disposition, quantity, movement_count
        ) VALUES (${aggregateKey}, ${sku.id}, ${location.id}, 'available', 0, 1)
      `);
      await payload.db.drizzle.execute(sql`
        INSERT INTO commerce_commands (
          command_key, business_key, request_hash, status, safe_response,
          resource_type, resource_id, completed_at
        ) VALUES (
          ${commandKey}, ${commandKey}, ${"d".repeat(64)}, 'succeeded', '{}'::jsonb,
          'inventory-command', ${sku.id}, now()
        )
      `);
      const transactional = payload.db.drizzle as typeof payload.db.drizzle & {
        transaction<T>(
          callback: (tx: typeof payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (tx) => {
          await tx.execute(sql`
          ALTER TABLE inventory_movements
            DISABLE TRIGGER inventory_movements_prevent_row_mutation;
          DELETE FROM inventory_movements
            WHERE source_type::text <> 'inventory_command';
          ALTER TABLE inventory_movements
            ENABLE TRIGGER inventory_movements_prevent_row_mutation;
          ALTER TABLE inventory_cycle_count_lines DISABLE TRIGGER USER;
          ALTER TABLE inventory_cycle_counts DISABLE TRIGGER USER;
          ALTER TABLE inventory_lots DISABLE TRIGGER USER;
          ALTER TABLE inventory_receipt_lines DISABLE TRIGGER USER;
          ALTER TABLE inventory_receipts DISABLE TRIGGER USER;
          DELETE FROM inventory_cycle_count_lines;
          DELETE FROM inventory_cycle_counts;
          DELETE FROM inventory_lots;
          DELETE FROM inventory_receipt_lines;
          DELETE FROM inventory_receipts;
        `);
          const args = { ...migrationArgs(), db: tx } as never;
          await revertPr5Migration(args);
          await revertPr5Migration(args);
          const downState = await tx.execute<{
            command_rows: string;
            evidence_table: unknown;
            level_rows: string;
            movement_rows: string;
          }>(sql`
          SELECT to_regclass('public.inventory_receipts') AS evidence_table,
            (SELECT count(*)::text FROM inventory_movements) AS movement_rows,
            (SELECT count(*)::text FROM inventory_levels) AS level_rows,
            (SELECT count(*)::text FROM commerce_commands) AS command_rows
        `);
          expect(downState.rows[0]?.evidence_table).toBeNull();
          expect(Number(downState.rows[0]?.movement_rows)).toBeGreaterThan(0);
          expect(Number(downState.rows[0]?.level_rows)).toBeGreaterThan(0);
          expect(Number(downState.rows[0]?.command_rows)).toBeGreaterThan(0);
          await applyPr5Migration(args);
          throw new Error(rollbackMarker);
        })
      ).rejects.toThrow(rollbackMarker);
      expect(await schemaEvidence()).toEqual({
        receipt_index: true,
        cycle_line_once_index: true,
        cycle_parent_trigger: true,
        count_quantity_check: true,
        lot_receipt_trigger: true,
        lot_trigger: true,
        provenance_check: true,
        provenance_trigger: true
      });
    }, 30_000);

    it("locks evidence writers before rollback scans", async () => {
      await payload.db.drizzle.execute(sql`
        SET session_replication_role = replica;
        DELETE FROM inventory_movements
          WHERE source_type::text <> 'inventory_command';
        DELETE FROM inventory_cycle_count_lines;
        DELETE FROM inventory_cycle_counts;
        DELETE FROM inventory_lots;
        DELETE FROM inventory_receipt_lines;
        DELETE FROM inventory_receipts;
        SET session_replication_role = origin
      `);
      const suffix = randomUUID();
      const location = await createTestDoc("stock-locations", {
        code: `RACE-${suffix}`.toUpperCase(),
        name: `Rollback race ${suffix}`,
        active: true
      });
      const writer = await payload.db.pool.connect();
      try {
        await writer.query("BEGIN");
        const inserted = await writer.query<{ id: string }>(
          `INSERT INTO inventory_receipts (location_id, status)
           VALUES ($1, 'draft') RETURNING id`,
          [location.id]
        );
        const receiptId = inserted.rows[0]?.id;
        if (!receiptId) throw new Error("rollback-race-fixture-failed");

        const transactional = payload.db
          .drizzle as typeof payload.db.drizzle & {
          transaction<T>(
            callback: (tx: typeof payload.db.drizzle) => Promise<T>
          ): Promise<T>;
        };
        const rollback = transactional.transaction((tx) =>
          revertPr5Migration({ ...migrationArgs(), db: tx } as never)
        );
        expect(await isStillWaiting(rollback)).toBe(true);
        await writer.query("COMMIT");
        await expect(rollback).rejects.toMatchObject(
          databaseCause({
            message: expect.stringContaining(
              "PR5 inventory evidence exists; refusing rollback"
            )
          })
        );
        const preserved = await payload.db.drizzle.execute<{
          present: boolean;
        }>(sql`
          SELECT EXISTS (
            SELECT 1 FROM inventory_receipts WHERE id = ${receiptId}
          ) AS present
        `);
        expect(preserved.rows[0]?.present).toBe(true);
      } finally {
        await writer.query("ROLLBACK").catch(() => undefined);
        writer.release();
      }
    }, 30_000);

    it("runs a real receipt operation after empty down and fresh up", async () => {
      await payload.db.drizzle.execute(sql`
        SET session_replication_role = replica;
        DELETE FROM inventory_movements
          WHERE source_type::text <> 'inventory_command';
        DELETE FROM inventory_cycle_count_lines;
        DELETE FROM inventory_cycle_counts;
        DELETE FROM inventory_lots;
        DELETE FROM inventory_receipt_lines;
        DELETE FROM inventory_receipts;
        SET session_replication_role = origin
      `);
      await revertPr5Migration(migrationArgs());
      await applyPr5Migration(migrationArgs());

      const suffix = randomUUID();
      const [actor, product, location] = await Promise.all([
        createTestDoc("users", {
          name: `Fresh up actor ${suffix}`,
          role: "admin"
        }),
        createTestDoc("products", {
          name: `Fresh up ${suffix}`,
          slug: `fresh-up-${suffix}`,
          currency: "KRW",
          unit_amount: 1
        }),
        createTestDoc("stock-locations", {
          code: `FRESH-${suffix}`.toUpperCase(),
          name: `Fresh up ${suffix}`,
          active: true
        })
      ]);
      const sku = await createTestDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `FRESH-${suffix}`.toUpperCase(),
        options: []
      });
      const req = await createLocalReq(
        { user: { ...actor, role: "admin" } as never },
        payload
      );
      const created = await createInventoryReceipt({
        payload,
        req,
        commandKey: `fresh-up-receipt-${suffix}`,
        input: {
          locationId: location.id,
          lines: [{ skuId: sku.id, expectedQuantity: 1 }]
        }
      });
      expect(created).toMatchObject({ kind: "succeeded", status: "draft" });
      if (created.kind !== "succeeded") {
        throw new Error("fresh-up-receipt-create-failed");
      }
      const persisted = await payload.db.drizzle.execute<{
        line_count: string;
        status: string;
      }>(sql`
        SELECT receipt.status::text AS status,
          count(line.id)::text AS line_count
        FROM inventory_receipts receipt
        JOIN inventory_receipt_lines line ON line.receipt_id = receipt.id
        WHERE receipt.id = ${created.resourceId}
        GROUP BY receipt.status
      `);
      expect(persisted.rows[0]).toEqual({ line_count: "1", status: "draft" });

      const lines = await payload.find({
        collection: "inventory-receipt-lines",
        overrideAccess: true,
        pagination: false,
        where: { receipt: { equals: created.resourceId } }
      });
      const lineId = lines.docs[0]?.id;
      if (!lineId) throw new Error("fresh-up-receipt-line-missing");
      await expect(
        openInventoryReceipt({
          payload,
          req,
          commandKey: `fresh-up-open-${suffix}`,
          input: { receiptId: created.resourceId }
        })
      ).resolves.toMatchObject({ kind: "succeeded", status: "open" });
      await expect(
        receiveInventoryReceipt({
          payload,
          req,
          commandKey: `fresh-up-receive-${suffix}`,
          input: {
            receiptId: created.resourceId,
            receiptLineId: lineId,
            quantity: 1
          }
        })
      ).resolves.toMatchObject({ kind: "succeeded", status: "quarantine" });

      const received = await payload.db.drizzle.execute<{
        lot_count: string;
        movement_count: string;
      }>(sql`
        SELECT count(DISTINCT lot.id)::text AS lot_count,
          count(movement.id)::text AS movement_count
        FROM inventory_lots lot
        JOIN inventory_receipt_lines line ON line.id = lot.receipt_line_id
        JOIN inventory_movements movement
          ON movement.lot_id = lot.id
          AND movement.receipt_line_id = line.id
          AND movement.receipt_id = line.receipt_id
          AND movement.actor = lot.actor_id::text
          AND movement.effective_at = lot.received_at
          AND movement.source_type::text = 'inventory_receipt'
        WHERE line.receipt_id = ${created.resourceId}
      `);
      expect(received.rows[0]).toEqual({
        lot_count: "1",
        movement_count: "1"
      });
    }, 30_000);
  }
);
