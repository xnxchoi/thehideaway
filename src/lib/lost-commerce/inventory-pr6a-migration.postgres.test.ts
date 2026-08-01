import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import { createLocalReq, type PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  down as revertPr6aMigration,
  up as applyPr6aMigration
} from "@/lib/migrations/20260723_055605";
import {
  down as revertPr6aMetadataMigration,
  up as applyPr6aMetadataMigration
} from "@/lib/migrations/20260723_061618";
import {
  down as revertPr6aKeyMigration,
  up as applyPr6aKeyMigration
} from "@/lib/migrations/20260723_061720";
import {
  down as revertPr6aAttemptEvidenceMigration,
  up as applyPr6aAttemptEvidenceMigration
} from "@/lib/migrations/20260801_102548";
import {
  createReservationPostgresHarness,
  type ReservationFixture,
  type ReservationPostgresHarness
} from "./inventory-reservations.postgres.fixtures";

const testDatabaseUri = process.env.PR6A_MIGRATION_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

function errorMessages(error: unknown): string {
  const messages: string[] = [];
  let current = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) messages.push(current.message);
    current = "cause" in current ? current.cause : undefined;
  }
  return messages.join("\n");
}

async function applyPr6aMigrations(
  args: Parameters<typeof applyPr6aMigration>[0]
) {
  await applyPr6aMigration(args);
  await applyPr6aMetadataMigration(args);
  await applyPr6aKeyMigration(args);
  await applyPr6aAttemptEvidenceMigration(args);
}

async function revertPr6aMigrations(
  args: Parameters<typeof revertPr6aMigration>[0]
) {
  await revertPr6aAttemptEvidenceMigration(args);
  await revertPr6aKeyMigration(args);
  await revertPr6aMetadataMigration(args);
  await revertPr6aMigration(args);
}

describeWithPostgres.sequential("PR6A operator migration", () => {
  let harness: ReservationPostgresHarness;
  let fixture: ReservationFixture;
  let req: PayloadRequest;

  beforeAll(async () => {
    harness = await createReservationPostgresHarness(testDatabaseUri!);
    fixture = await harness.createFixture();
    req = await createLocalReq({}, harness.payload);
  }, 60_000);

  afterAll(async () => {
    try {
      await harness?.cleanup();
    } finally {
      await harness?.payload.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    }
  });

  it("re-enters safely, protects audit history, and permits one linked recovery", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    let rejection: unknown;
    try {
      await database.transaction(async (db) => {
        const args = { db, payload: harness.payload, req };
        await applyPr6aMigrations(args);
        await applyPr6aMigrations(args);

        const originalId = randomUUID();
        const recoveryId = randomUUID();
        const orderId = fixture.orderIds[0];
        const skuId = fixture.skuIds[0];
        const locationId = fixture.locationId;
        const baseKey = `${orderId}:${skuId}:${locationId}`;
        const reservedAt = new Date().toISOString();
        const expiresAt = new Date(
          Date.parse(reservedAt) + 15 * 60_000
        ).toISOString();
        await db.execute(sql`
          INSERT INTO inventory_reservations (
            id, reservation_key, request_hash, order_id, sku_id, location_id,
            quantity, status, expires_at, reserved_at,
            policy_version, ttl_minutes, safety_stock, consume_point,
            expiry_boundary, payment_time_source, late_payment_policy,
            backorder_mode
          ) VALUES (
            ${originalId}, ${baseKey}, ${"a".repeat(64)}, ${orderId}, ${skuId},
            ${locationId}, 1, 'active', ${expiresAt}, ${reservedAt},
            1, 15, 0, 'payment_confirmed', 'at_or_after',
            'provider_paid_at', 'manual_review', 'disabled'
          )
        `);
        await db.execute(sql`
          INSERT INTO inventory_reservation_entries (
            idempotency_key, request_hash, reservation_id, operation,
            quantity, effective_at
          ) VALUES (
            ${`migration-original-${originalId}`}, ${"a".repeat(64)},
            ${originalId}, 'reserve', 1, ${reservedAt}
          )
        `);
        await db.execute(sql`
          INSERT INTO inventory_reservations (
            id, reservation_key, request_hash, order_id, sku_id, location_id,
            quantity, status, expires_at, reserved_at, policy_version,
            ttl_minutes, safety_stock, consume_point, expiry_boundary,
            payment_time_source, late_payment_policy, backorder_mode,
            recovery_of_id
          ) VALUES (
            ${recoveryId}, ${`${baseKey}:recovery:${originalId}`}, ${"b".repeat(64)},
            ${orderId}, ${skuId}, ${locationId}, 1, 'active',
            ${expiresAt}, ${reservedAt},
            1, 15, 0, 'payment_confirmed', 'at_or_after',
            'provider_paid_at', 'manual_review', 'disabled', ${originalId}
          )
        `);
        await db.execute(sql`
          INSERT INTO inventory_reservation_entries (
            idempotency_key, request_hash, reservation_id, operation,
            quantity, effective_at
          ) VALUES (
            ${`migration-recovery-${recoveryId}`}, ${"b".repeat(64)},
            ${recoveryId}, 'reserve', 1, ${reservedAt}
          )
        `);
        await db.execute(sql`
          INSERT INTO inventory_reservation_operator_events (
            event_key, command_key, source, correlation_key, causation_key,
            action, outcome_code, actor_id, order_id, reason_code,
            evidence_reference, expected_state_hash, observed_state_hash,
            affected_count, effective_at
          ) VALUES (
            ${"c".repeat(64)}, ${"d".repeat(64)}, 'manual_operator',
            ${"d".repeat(64)}, ${"d".repeat(64)}, 'reconcile', 'confirmed',
            ${fixture.actorId}, ${orderId}, 'payment-review', 'portone:event-1',
            ${"e".repeat(64)}, ${"f".repeat(64)}, 1, CURRENT_TIMESTAMP
          )
        `);
        await db.execute(sql`
          INSERT INTO inventory_reservation_operator_events (
            event_key, command_key, source, correlation_key, causation_key,
            action, outcome_code, actor_id, order_id, reason_code,
            evidence_reference, expected_state_hash, observed_state_hash,
            affected_count, effective_at
          ) VALUES (
            ${"1".repeat(64)}, ${"d".repeat(64)}, 'manual_operator',
            ${"d".repeat(64)}, ${"d".repeat(64)}, 'reconcile',
            'inventory-reservation-operator-failed', ${fixture.actorId},
            ${orderId}, 'payment-review', 'portone:event-1',
            ${"e".repeat(64)}, ${"f".repeat(64)}, 0, CURRENT_TIMESTAMP
          )
        `);

        const evidence = await db.execute<{
          audit_trigger: boolean;
          command_attempts: number;
          recovery_unique: boolean;
          recovery_valid: boolean;
        }>(sql`
          SELECT
            EXISTS (
              SELECT 1 FROM pg_trigger
              WHERE tgname = 'inventory_reservation_operator_events_immutable'
            ) AS audit_trigger,
            (
              SELECT count(*)::integer
              FROM inventory_reservation_operator_events
              WHERE command_key = ${"d".repeat(64)}
            ) AS command_attempts,
            EXISTS (
              SELECT 1 FROM pg_class c
              JOIN pg_index i ON i.indexrelid = c.oid
              WHERE c.relname = 'inventory_reservations_recovery_of_idx'
                AND i.indisunique
            ) AS recovery_unique,
            EXISTS (
              SELECT 1 FROM inventory_reservations
              WHERE id = ${recoveryId} AND recovery_of_id = ${originalId}
            ) AS recovery_valid
        `);
        expect(evidence.rows[0]).toEqual({
          audit_trigger: true,
          command_attempts: 2,
          recovery_unique: true,
          recovery_valid: true
        });
        await db.execute(sql`
          UPDATE inventory_reservation_operator_events
          SET outcome_code = 'changed'
          WHERE event_key = ${"c".repeat(64)}
        `);
      });
    } catch (error) {
      rejection = error;
    }
    expect(errorMessages(rejection)).toContain(
      "inventory-reservation-operator-event-immutable"
    );
  }, 60_000);

  it("blocks audit truncation and populated rollback", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    const insertAudit = async (db: typeof harness.payload.db.drizzle) => {
      await db.execute(sql`
        INSERT INTO inventory_reservation_operator_events (
          event_key, command_key, source, correlation_key, causation_key,
          action, outcome_code, actor_id, order_id, reason_code,
          evidence_reference, expected_state_hash, observed_state_hash,
          affected_count, effective_at
        ) VALUES (
          ${randomUUID().replaceAll("-", "").padEnd(64, "0")}, ${"a".repeat(64)},
          'manual_operator', ${"a".repeat(64)}, ${"a".repeat(64)},
          'reconcile', 'review_remaining', ${fixture.actorId},
          ${fixture.orderIds[0]}, 'payment-review', 'portone:test',
          ${"b".repeat(64)}, ${"c".repeat(64)}, 0, CURRENT_TIMESTAMP
        )
      `);
    };
    for (const operation of ["truncate", "down"] as const) {
      let rejection: unknown;
      try {
        await database.transaction(async (db) => {
          const args = { db, payload: harness.payload, req };
          await applyPr6aMigrations(args);
          await insertAudit(db);
          if (operation === "truncate") {
            await db.execute(
              sql`TRUNCATE inventory_reservation_operator_events`
            );
          } else {
            await revertPr6aKeyMigration(args);
          }
        });
      } catch (error) {
        rejection = error;
      }
      expect(errorMessages(rejection)).toContain(
        operation === "truncate"
          ? "inventory-reservation-operator-event-immutable"
          : "pr6a-down-requires-empty-operator-events"
      );
    }
  }, 60_000);

  it("refuses the attempt-evidence down migration before a populated partial rollback", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    const commandKey = "9".repeat(64);
    await database.transaction(async (db) => {
      const args = { db, payload: harness.payload, req };
      await applyPr6aMigrations(args);
      await db.execute(sql`
        INSERT INTO inventory_reservation_operator_events (
          event_key, command_key, source, correlation_key, causation_key,
          action, outcome_code, actor_id, order_id, reason_code,
          evidence_reference, expected_state_hash, observed_state_hash,
          affected_count, effective_at
        ) VALUES (
          ${"8".repeat(64)}, ${commandKey}, 'manual_operator', ${commandKey},
          ${commandKey}, 'reconcile', 'review_remaining', ${fixture.actorId},
          ${fixture.orderIds[0]}, 'payment-review', 'portone:test',
          ${"7".repeat(64)}, ${"6".repeat(64)}, 0, CURRENT_TIMESTAMP
        )
      `);
    });

    let rejection: unknown;
    try {
      await database.transaction(async (db) => {
        await revertPr6aAttemptEvidenceMigration({
          db,
          payload: harness.payload,
          req
        });
      });
    } catch (error) {
      rejection = error;
    }
    expect(errorMessages(rejection)).toContain(
      "PR6A operator evidence exists; refusing rollback"
    );

    const index = await database.execute<{ is_unique: boolean }>(sql`
      SELECT i.indisunique AS is_unique
      FROM pg_class c
      JOIN pg_index i ON i.indexrelid = c.oid
      WHERE c.relname = 'inventory_reservation_operator_events_command_key_idx'
    `);
    expect(index.rows).toEqual([{ is_unique: false }]);
    await database.transaction(async (db) => {
      await db.execute(sql`SET LOCAL session_replication_role = replica`);
      await db.execute(sql`
        DELETE FROM inventory_reservation_operator_events
        WHERE command_key = ${commandKey}
      `);
    });
  }, 60_000);

  it("reverts twice and reapplies on an empty schema", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    let rejection: unknown;
    try {
      await database.transaction(async (db) => {
        const args = { db, payload: harness.payload, req };
        await applyPr6aMigrations(args);
        await revertPr6aMigrations(args);
        await revertPr6aMigrations(args);
        await applyPr6aMigrations(args);
        throw new Error("pr6a-empty-cycle-rollback");
      });
    } catch (error) {
      rejection = error;
    }
    expect(errorMessages(rejection)).toContain("pr6a-empty-cycle-rollback");
  }, 60_000);

  it("preserves expiry ordering and rejects self-linked recoveries", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    for (const invalid of ["expiry", "self-recovery"] as const) {
      let rejection: unknown;
      try {
        await database.transaction(async (db) => {
          await applyPr6aMigrations({ db, payload: harness.payload, req });
          const reservationId = randomUUID();
          const orderId = fixture.orderIds[0];
          const skuId = fixture.skuIds[0];
          const locationId = fixture.locationId;
          const baseKey = `${orderId}:${skuId}:${locationId}`;
          const reservedAt = new Date().toISOString();
          await db.execute(sql`
            INSERT INTO inventory_reservations (
              id, reservation_key, request_hash, order_id, sku_id, location_id,
              quantity, status, expires_at, reserved_at, policy_version,
              ttl_minutes, safety_stock, consume_point, expiry_boundary,
              payment_time_source, late_payment_policy, backorder_mode,
              recovery_of_id
            ) VALUES (
              ${reservationId},
              ${invalid === "self-recovery" ? `${baseKey}:recovery:${reservationId}` : baseKey},
              ${"a".repeat(64)}, ${orderId}, ${skuId}, ${locationId}, 1,
              'active',
              ${invalid === "expiry" ? reservedAt : new Date(Date.parse(reservedAt) + 60_000).toISOString()},
              ${reservedAt}, 1, 15, 0, 'payment_confirmed', 'at_or_after',
              'provider_paid_at', 'manual_review', 'disabled',
              ${invalid === "self-recovery" ? reservationId : null}
            )
          `);
        });
      } catch (error) {
        rejection = error;
      }
      expect(errorMessages(rejection)).toContain(
        "inventory_reservations_identity_evidence_check"
      );
    }
  }, 60_000);

  it("rejects malformed immutable correlation metadata", async () => {
    const database = harness.payload.db
      .drizzle as typeof harness.payload.db.drizzle & {
      transaction<T>(
        callback: (db: typeof harness.payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    let rejection: unknown;
    try {
      await database.transaction(async (db) => {
        await applyPr6aMigrations({ db, payload: harness.payload, req });
        await db.execute(sql`
          INSERT INTO inventory_reservation_operator_events (
            event_key, command_key, source, correlation_key, causation_key,
            action, outcome_code, actor_id, reason_code, evidence_reference,
            expected_state_hash, observed_state_hash, affected_count,
            effective_at
          ) VALUES (
            ${"5".repeat(64)}, ${"4".repeat(64)}, 'manual_operator', '', '',
            'run_expiry', 'expiry-run-completed', ${fixture.actorId},
            'scheduled-check', 'ops:test', ${"3".repeat(64)},
            ${"2".repeat(64)}, 0, CURRENT_TIMESTAMP
          )
        `);
        throw new Error("malformed-correlation-accepted");
      });
    } catch (error) {
      rejection = error;
    }
    expect(errorMessages(rejection)).toContain(
      "inventory_reservation_operator_events_shape_check"
    );
  }, 60_000);
});
