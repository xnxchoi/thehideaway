import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import { createLocalReq, type PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  down as revertPr6Migration,
  up as applyPr6Migration
} from "@/lib/migrations/20260722_011612";

import {
  createReservationPostgresHarness,
  type ReservationFixture,
  type ReservationPostgresHarness
} from "./inventory-reservations.postgres.fixtures";

const testDatabaseUri = process.env.PR6_MIGRATION_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;
const rollbackMarker = "pr6-migration-test-rollback";
const databaseCause = (expected: Record<string, unknown>) => ({
  cause: expect.objectContaining(expected)
});

describeWithPostgres.sequential(
  "PR6 reservation migration with PostgreSQL",
  () => {
    let harness: ReservationPostgresHarness;
    let fixture: ReservationFixture;
    let migrationReq: PayloadRequest;

    beforeAll(async () => {
      harness = await createReservationPostgresHarness(testDatabaseUri!);
      fixture = await harness.createFixture();
      migrationReq = await createLocalReq({}, harness.payload);
    }, 60_000);

    afterAll(async () => {
      await harness?.cleanup();
      await harness?.payload.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    });

    const migrationArgs = (db = harness.payload.db.drizzle) => ({
      db,
      payload: harness.payload,
      req: migrationReq
    });

    async function expectRollback(
      operation: (db: typeof harness.payload.db.drizzle) => Promise<void>
    ) {
      const transactional = harness.payload.db
        .drizzle as typeof harness.payload.db.drizzle & {
        transaction<T>(
          callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (db) => {
          await operation(db);
          throw new Error(rollbackMarker);
        })
      ).rejects.toThrow(rollbackMarker);
    }

    async function insertReservationRoot(
      db: typeof harness.payload.db.drizzle,
      input: {
        id: string;
        quantity?: number;
        requestHash?: string;
        status?: "active" | "consumed" | "released" | "expired";
        terminalAt?: Date;
      }
    ) {
      const orderId = fixture.orderIds[0];
      const skuId = fixture.skuIds[0];
      const reservedAt = new Date("2026-07-22T00:00:00.000Z");
      await db.execute(sql`
      INSERT INTO inventory_reservations (
        id, reservation_key, request_hash, order_id, sku_id, location_id,
        quantity, status, expires_at, reserved_at, terminal_at,
        policy_version, ttl_minutes, safety_stock, consume_point,
        expiry_boundary, payment_time_source, late_payment_policy, backorder_mode
      ) VALUES (
        ${input.id}, ${`${orderId}:${skuId}:${fixture.locationId}`},
        ${input.requestHash ?? "root-hash"}, ${orderId}, ${skuId},
        ${fixture.locationId}, ${input.quantity ?? 1}, ${input.status ?? "active"},
        ${new Date("2026-07-22T00:15:00.000Z")}, ${reservedAt},
        ${input.terminalAt ?? null}, 1, 15, 0, 'payment_confirmed',
        'at_or_after', 'provider_paid_at', 'manual_review', 'disabled'
      )
    `);
    }

    async function insertReservationEntry(
      db: typeof harness.payload.db.drizzle,
      input: {
        reservationId: string;
        operation?:
          | "reserve"
          | "consume"
          | "release"
          | "expire"
          | "late_payment_detected";
        requestHash?: string;
        paymentId?: string;
        evidenceCode?:
          | "provider_timestamp_missing"
          | "provider_timestamp_before_reservation"
          | "provider_payment_late"
          | "physical_inventory_unavailable";
        providerPaidAt?: Date;
      }
    ) {
      await db.execute(sql`
      INSERT INTO inventory_reservation_entries (
        idempotency_key, request_hash, reservation_id, operation, quantity,
        payment_id, provider_paid_at, evidence_code, actor, effective_at
      ) VALUES (
        ${`entry-${randomUUID()}`}, ${input.requestHash ?? "root-hash"},
        ${input.reservationId}, ${input.operation ?? "reserve"}, 1,
        ${input.paymentId ?? null}, ${input.providerPaidAt ?? null},
        ${input.evidenceCode ?? null}, ${fixture.actorId},
        ${new Date("2026-07-22T00:00:00.000Z")}
      )
    `);
    }

    it("repairs direct up re-entry without changing Payload-owned jobs data or array IDs", async () => {
      await expectRollback(async (db) => {
        const statsId = randomUUID();
        await db.execute(sql`
        INSERT INTO payload_jobs_stats (id, stats) VALUES (${statsId}, '{"kept":true}'::jsonb)
      `);
        await db.execute(sql`
        ALTER TABLE inventory_reservations
          DROP CONSTRAINT IF EXISTS inventory_reservations_numeric_bounds_check;
        DROP INDEX IF EXISTS inventory_reservation_entries_reserve_once_idx;
        DROP TRIGGER IF EXISTS inventory_reservation_entries_prevent_row_mutation
          ON inventory_reservation_entries;
        ALTER TABLE inventory_movements
          DROP CONSTRAINT IF EXISTS inventory_movements_provenance_shape_check
      `);

        await applyPr6Migration(migrationArgs(db));
        await applyPr6Migration(migrationArgs(db));

        const evidence = await db.execute<{
          entry_trigger: boolean;
          jobs_stats_kept: boolean;
          options_id_type: string;
          provenance_check: boolean;
          reserve_once: boolean;
          root_check: boolean;
        }>(sql`
        SELECT
          EXISTS (SELECT 1 FROM pg_constraint
            WHERE conname = 'inventory_reservations_numeric_bounds_check'
              AND conrelid = 'public.inventory_reservations'::regclass) AS root_check,
          to_regclass('public.inventory_reservation_entries_reserve_once_idx')
            IS NOT NULL AS reserve_once,
          EXISTS (SELECT 1 FROM pg_trigger
            WHERE tgname = 'inventory_reservation_entries_prevent_row_mutation'
              AND tgrelid = 'public.inventory_reservation_entries'::regclass)
            AS entry_trigger,
          EXISTS (SELECT 1 FROM pg_constraint
            WHERE conname = 'inventory_movements_provenance_shape_check'
              AND conrelid = 'public.inventory_movements'::regclass)
            AS provenance_check,
          (SELECT data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'product_variants_options'
              AND column_name = 'id') AS options_id_type,
          EXISTS (SELECT 1 FROM payload_jobs_stats
            WHERE id = ${statsId} AND stats = '{"kept":true}'::jsonb) AS jobs_stats_kept
      `);
        expect(evidence.rows[0]).toEqual({
          entry_trigger: true,
          jobs_stats_kept: true,
          options_id_type: "character varying",
          provenance_check: true,
          reserve_once: true,
          root_check: true
        });
      });
    });

    it("repairs missing labels in partially created reservation enums", async () => {
      await expectRollback(async (db) => {
        await revertPr6Migration(migrationArgs(db));
        await db.execute(sql`
        CREATE TYPE enum_inventory_reservations_status AS ENUM('active');
        CREATE TYPE enum_inventory_reservations_consume_point AS ENUM('payment_confirmed');
        CREATE TYPE enum_inventory_reservations_expiry_boundary AS ENUM('at_or_after');
        CREATE TYPE enum_inventory_reservations_payment_time_source AS ENUM('provider_paid_at');
        CREATE TYPE enum_inventory_reservations_late_payment_policy AS ENUM('manual_review');
        CREATE TYPE enum_inventory_reservations_backorder_mode AS ENUM('disabled');
        CREATE TYPE enum_inventory_reservation_entries_operation AS ENUM('reserve');
        CREATE TYPE enum_inventory_reservation_entries_evidence_code AS ENUM('provider_timestamp_missing')
      `);

        await applyPr6Migration(migrationArgs(db));

        const labels = await db.execute<{
          enum_name: string;
          labels: string[];
        }>(sql`
        SELECT t.typname AS enum_name,
          array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS labels
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname IN (
          'enum_inventory_reservations_status',
          'enum_inventory_reservation_entries_operation',
          'enum_inventory_reservation_entries_evidence_code'
        )
        GROUP BY t.typname
        ORDER BY t.typname
      `);
        expect(labels.rows).toEqual([
          {
            enum_name: "enum_inventory_reservation_entries_evidence_code",
            labels: [
              "provider_timestamp_missing",
              "provider_timestamp_before_reservation",
              "provider_payment_late",
              "physical_inventory_unavailable"
            ]
          },
          {
            enum_name: "enum_inventory_reservation_entries_operation",
            labels: [
              "reserve",
              "consume",
              "release",
              "expire",
              "late_payment_detected"
            ]
          },
          {
            enum_name: "enum_inventory_reservations_status",
            labels: ["active", "consumed", "released", "expired"]
          }
        ]);
      });
    });

    it("rejects unsafe root numbers and inconsistent lifecycle evidence", async () => {
      await applyPr6Migration(migrationArgs());
      const transactional = harness.payload.db
        .drizzle as typeof harness.payload.db.drizzle & {
        transaction<T>(
          callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (db) => {
          await insertReservationRoot(db, { id: randomUUID(), quantity: 1.5 });
        })
      ).rejects.toMatchObject(
        databaseCause({
          constraint: "inventory_reservations_numeric_bounds_check"
        })
      );
      await expect(
        transactional.transaction(async (db) => {
          await insertReservationRoot(db, {
            id: randomUUID(),
            status: "released"
          });
        })
      ).rejects.toMatchObject(
        databaseCause({
          constraint: "inventory_reservations_lifecycle_evidence_check"
        })
      );
    });

    it("enforces entry evidence shape, partial uniqueness, and append-only rows", async () => {
      await applyPr6Migration(migrationArgs());
      const transactional = harness.payload.db
        .drizzle as typeof harness.payload.db.drizzle & {
        transaction<T>(
          callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (db) => {
          const id = randomUUID();
          await insertReservationRoot(db, { id });
          await insertReservationEntry(db, { reservationId: id });
          await insertReservationEntry(db, { reservationId: id });
        })
      ).rejects.toMatchObject(
        databaseCause({
          constraint: "inventory_reservation_entries_reserve_once_idx"
        })
      );
      await expect(
        transactional.transaction(async (db) => {
          const id = randomUUID();
          await insertReservationRoot(db, { id });
          await insertReservationEntry(db, { reservationId: id });
          await insertReservationEntry(db, {
            reservationId: id,
            operation: "late_payment_detected",
            evidenceCode: "provider_timestamp_missing"
          });
        })
      ).rejects.toMatchObject(
        databaseCause({
          constraint: "inventory_reservation_entries_evidence_shape_check"
        })
      );
      await expect(
        transactional.transaction(async (db) => {
          const id = randomUUID();
          await insertReservationRoot(db, { id });
          await insertReservationEntry(db, { reservationId: id });
          await db.execute(sql`
          UPDATE inventory_reservation_entries SET actor = 'changed'
          WHERE reservation_id = ${id}
        `);
        })
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining(
            "reservation entries are append-only"
          )
        })
      );
    });

    it("defers root, entry, and movement agreement until transaction commit", async () => {
      await applyPr6Migration(migrationArgs());
      const transactional = harness.payload.db
        .drizzle as typeof harness.payload.db.drizzle & {
        transaction<T>(
          callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      await expect(
        transactional.transaction(async (db) => {
          const id = randomUUID();
          await insertReservationRoot(db, { id });
          await insertReservationEntry(db, {
            reservationId: id,
            requestHash: "different-hash"
          });
        })
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining("reservation history mismatch")
        })
      );
      await expect(
        transactional.transaction(async (db) => {
          const id = randomUUID();
          const terminalAt = new Date("2026-07-22T00:05:00.000Z");
          await insertReservationRoot(db, {
            id,
            status: "consumed",
            terminalAt
          });
          await insertReservationEntry(db, { reservationId: id });
          const payment = await db.execute<{ id: string }>(sql`
          INSERT INTO product_payments (
            payment_ref, order_id, user_id, provider, status, amount, currency
          ) VALUES (
            ${`payment-${randomUUID()}`}, ${fixture.orderIds[0]}, ${fixture.userId},
            'portone', 'paid', 1, 'KRW'
          ) RETURNING id
        `);
          await db.execute(sql`
          INSERT INTO inventory_reservation_entries (
            idempotency_key, request_hash, reservation_id, operation, quantity,
            payment_id, actor, effective_at
          ) VALUES (
            ${`consume-${randomUUID()}`}, 'consume-hash', ${id}, 'consume', 1,
            ${payment.rows[0]!.id}, ${fixture.actorId}, ${terminalAt}
          )
        `);
        })
      ).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining("reservation movement mismatch")
        })
      );
    });

    it("refuses down when any PR6 reservation, review, job, meta, or stats evidence exists", async () => {
      await applyPr6Migration(migrationArgs());
      const cases = [
        async (db: typeof harness.payload.db.drizzle) => {
          const id = randomUUID();
          await insertReservationRoot(db, { id });
          await insertReservationEntry(db, { reservationId: id });
        },
        async (db: typeof harness.payload.db.drizzle) => {
          await db.execute(sql`SET LOCAL session_replication_role = replica`);
          await db.execute(sql`
          INSERT INTO inventory_movements (
            idempotency_key, request_hash, sku_id, kind, quantity,
            from_location_id, from_disposition, reason_code, source_type, source_ref
          ) VALUES (
            ${`movement-${randomUUID()}`}, 'hash', ${fixture.skuIds[0]},
            'outbound', 1, ${fixture.locationId}, 'available',
            'rollback-test', 'inventory_reservation', ${randomUUID()}
          )
        `);
          await db.execute(sql`SET LOCAL session_replication_role = origin`);
        },
        async (db: typeof harness.payload.db.drizzle) => {
          await db.execute(sql`
          UPDATE product_orders SET status = 'paid_inventory_review'
          WHERE id = ${fixture.orderIds[0]}
        `);
        },
        async (db: typeof harness.payload.db.drizzle) => {
          await db.execute(sql`
          INSERT INTO payload_jobs (task_slug) VALUES ('expireInventoryReservations')
        `);
        },
        async (db: typeof harness.payload.db.drizzle) => {
          await db.execute(sql`
          INSERT INTO payload_jobs_stats (stats) VALUES ('{}'::jsonb)
        `);
        },
        async (db: typeof harness.payload.db.drizzle) => {
          await db.execute(sql`
          INSERT INTO payload_jobs (meta) VALUES ('{}'::jsonb)
        `);
        }
      ];
      const transactional = harness.payload.db
        .drizzle as typeof harness.payload.db.drizzle & {
        transaction<T>(
          callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
        ): Promise<T>;
      };
      for (const arrangeEvidence of cases) {
        await expect(
          transactional.transaction(async (db) => {
            await arrangeEvidence(db);
            await revertPr6Migration(migrationArgs(db));
          })
        ).rejects.toMatchObject(
          databaseCause({
            message: expect.stringContaining(
              "PR6 reservation evidence exists; refusing rollback"
            )
          })
        );
      }
    }, 30_000);

    it("runs empty down and up twice while restoring the exact PR5 provenance shape", async () => {
      await expectRollback(async (db) => {
        await db.execute(sql`
        SET LOCAL session_replication_role = replica;
        DELETE FROM inventory_reservation_entries;
        DELETE FROM inventory_reservations;
        DELETE FROM inventory_movements WHERE source_type::text = 'inventory_reservation';
        UPDATE product_orders SET status = 'pending_payment'
          WHERE status::text = 'paid_inventory_review';
        DELETE FROM payload_jobs_log WHERE task_slug::text = 'expireInventoryReservations';
        DELETE FROM payload_jobs WHERE task_slug::text = 'expireInventoryReservations';
        DELETE FROM payload_jobs_stats;
        UPDATE payload_jobs SET meta = NULL WHERE meta IS NOT NULL;
        SET LOCAL session_replication_role = origin
      `);
        await revertPr6Migration(migrationArgs(db));
        await revertPr6Migration(migrationArgs(db));
        const restored = await db.execute<{
          has_all_pr5_branches: boolean;
          has_pr6_branch: boolean;
        }>(sql`
        SELECT
          pg_get_constraintdef(oid) LIKE '%inventory_command%'
            AND pg_get_constraintdef(oid) LIKE '%inventory_adjustment%'
            AND pg_get_constraintdef(oid) LIKE '%inventory_receipt%'
            AND pg_get_constraintdef(oid) LIKE '%inventory_lot_release%'
            AND pg_get_constraintdef(oid) LIKE '%inventory_cycle_count%'
            AS has_all_pr5_branches,
          pg_get_constraintdef(oid) LIKE '%inventory_reservation%'
            AS has_pr6_branch
        FROM pg_constraint
        WHERE conname = 'inventory_movements_provenance_shape_check'
          AND conrelid = 'public.inventory_movements'::regclass
      `);
        expect(restored.rows[0]).toEqual({
          has_all_pr5_branches: true,
          has_pr6_branch: false
        });
        await applyPr6Migration(migrationArgs(db));
        await applyPr6Migration(migrationArgs(db));
        const evidence = await db.execute<{
          pr5_branch_count: string;
          pr6_branch_count: string;
          reservations_table: unknown;
        }>(sql`
        SELECT
          to_regclass('public.inventory_reservations') AS reservations_table,
          (SELECT count(*)::text FROM pg_get_constraintdef(
            (SELECT oid FROM pg_constraint
              WHERE conname = 'inventory_movements_provenance_shape_check'
                AND conrelid = 'public.inventory_movements'::regclass)
          ) definition WHERE definition LIKE '%inventory_cycle_count%') AS pr5_branch_count,
          (SELECT count(*)::text FROM pg_get_constraintdef(
            (SELECT oid FROM pg_constraint
              WHERE conname = 'inventory_movements_provenance_shape_check'
                AND conrelid = 'public.inventory_movements'::regclass)
          ) definition WHERE definition LIKE '%inventory_reservation%') AS pr6_branch_count
      `);
        expect(evidence.rows[0]).toEqual({
          pr5_branch_count: "1",
          pr6_branch_count: "1",
          reservations_table: "inventory_reservations"
        });
      });
    }, 30_000);
  }
);
