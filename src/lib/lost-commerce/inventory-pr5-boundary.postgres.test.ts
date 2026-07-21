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
type StockFixture = {
  actorId: string;
  checkerId: string;
  locationId: string;
  otherLocationId: string;
  inactiveLocationId: string;
  skuId: string;
  otherSkuId: string;
};

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

describeWithPostgres.sequential("PR5 inventory SQL boundary", () => {
  let payload: Payload;

  beforeAll(async () => {
    process.env.DATABASE_URI = testDatabaseUri;
    payload = await getPayload({
      config: buildConfig({
        secret: "commerce-pr5-boundary-secret",
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

  async function fixture(): Promise<StockFixture> {
    const suffix = randomUUID();
    const [
      actor,
      checker,
      product,
      otherProduct,
      location,
      otherLocation,
      inactiveLocation
    ] = await Promise.all([
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
      }),
      createDoc("stock-locations", {
        code: `INACTIVE-${suffix}`.toUpperCase(),
        name: `Inactive ${suffix}`,
        active: false
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
      inactiveLocationId: inactiveLocation.id,
      skuId: sku.id,
      otherSkuId: otherSku.id
    };
  }

  async function receiptHeader(input: {
    fixture: StockFixture;
    skuId?: string;
    locationId?: string;
    quantity?: number;
  }) {
    const suffix = randomUUID();
    const quantity = input.quantity ?? 5;
    const receipt = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_receipts (location_id, status)
      VALUES (${input.locationId ?? input.fixture.locationId}, 'draft')
      RETURNING id
    `);
    const receiptId = receipt.rows[0]?.id;
    if (!receiptId) throw new Error("receipt-evidence-fixture-failed");
    const line = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_receipt_lines (
        receipt_sku_key, receipt_id, sku_id, expected_quantity
      ) VALUES (
        ${`line-${suffix}`}, ${receiptId},
        ${input.skuId ?? input.fixture.skuId}, ${quantity}
      ) RETURNING id
    `);
    const lineId = line.rows[0]?.id;
    if (!lineId) throw new Error("receipt-evidence-fixture-failed");
    await payload.db.drizzle.execute(sql`
      UPDATE inventory_receipts
      SET status = 'open', opened_at = now(), opened_by_id = ${input.fixture.actorId}
      WHERE id = ${receiptId}
    `);
    return { receipt_id: receiptId, line_id: lineId, quantity };
  }

  async function receiptEvidence(input: Parameters<typeof receiptHeader>[0]) {
    const header = await receiptHeader(input);
    const receivedAt = new Date().toISOString();
    const transactional = payload.db.drizzle as typeof payload.db.drizzle & {
      transaction<T>(
        callback: (tx: typeof payload.db.drizzle) => Promise<T>
      ): Promise<T>;
    };
    const lotId = await transactional.transaction(async (tx) => {
      const lot = await tx.execute<{ id: string }>(sql`
        INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES (
          ${`lot-${randomUUID()}`}, ${header.line_id}, ${header.quantity},
          ${receivedAt}, ${input.fixture.actorId}
        ) RETURNING id
      `);
      const insertedLotId = lot.rows[0]?.id;
      if (!insertedLotId) throw new Error("receipt-evidence-fixture-failed");
      await tx.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          actor, effective_at, receipt_id, receipt_line_id, lot_id
        ) VALUES (
          ${randomUUID()}, ${"a".repeat(64)},
          ${input.skuId ?? input.fixture.skuId}, 'inbound', ${header.quantity},
          ${input.locationId ?? input.fixture.locationId}, 'quarantine',
          'boundary-fixture', 'inventory_receipt', ${insertedLotId},
          ${input.fixture.actorId}, ${receivedAt}, ${header.receipt_id},
          ${header.line_id}, ${insertedLotId}
        )
      `);
      return insertedLotId;
    });
    return { ...header, lot_id: lotId, received_at: receivedAt };
  }

  async function insertReceiptMovement(input: {
    fixture: StockFixture;
    evidence: Awaited<ReturnType<typeof receiptEvidence>>;
    receiptId?: string;
    lineId?: string;
    lotId?: string;
    skuId?: string;
    locationId?: string;
    quantity?: number;
    sourceType?: "inventory_receipt" | "inventory_lot_release";
    sourceRef?: string;
    actorId?: string;
    effectiveAt?: string;
  }) {
    const release = input.sourceType === "inventory_lot_release";
    return payload.db.drizzle.execute(sql`
      INSERT INTO inventory_movements (
        idempotency_key, request_hash, sku_id, kind, quantity,
        from_location_id, from_disposition, to_location_id, to_disposition,
        reason_code, source_type, source_ref, actor, effective_at, receipt_id,
        receipt_line_id, lot_id
      ) VALUES (
        ${randomUUID()}, ${"a".repeat(64)}, ${input.skuId ?? input.fixture.skuId},
        ${release ? "transfer" : "inbound"}, ${input.quantity ?? input.evidence.quantity},
        ${release ? (input.locationId ?? input.fixture.locationId) : null},
        ${release ? "quarantine" : null},
        ${input.locationId ?? input.fixture.locationId},
        ${release ? "available" : "quarantine"},
        'boundary-test', ${input.sourceType ?? "inventory_receipt"},
        ${input.sourceRef ?? input.lotId ?? input.evidence.lot_id},
        ${input.actorId ?? input.fixture.actorId},
        ${input.effectiveAt ?? input.evidence.received_at},
        ${input.receiptId ?? input.evidence.receipt_id},
        ${input.lineId ?? input.evidence.line_id},
        ${input.lotId ?? input.evidence.lot_id}
      )
    `);
  }

  it("rejects independently valid but contradictory receipt and lot provenance", async () => {
    const stock = await fixture();
    const first = await receiptEvidence({ fixture: stock });
    const second = await receiptEvidence({
      fixture: stock,
      skuId: stock.otherSkuId,
      locationId: stock.otherLocationId
    });

    await expect(
      insertReceiptMovement({
        fixture: stock,
        evidence: first,
        lineId: second.line_id,
        lotId: second.lot_id
      })
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining("receipt provenance chain mismatch")
      })
    );
    await expect(
      insertReceiptMovement({
        fixture: stock,
        evidence: first,
        quantity: first.quantity - 1
      })
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining("receipt provenance chain mismatch")
      })
    );
    await expect(
      insertReceiptMovement({
        fixture: stock,
        evidence: first,
        sourceType: "inventory_lot_release",
        lotId: second.lot_id,
        lineId: second.line_id,
        receiptId: second.receipt_id,
        skuId: stock.otherSkuId,
        locationId: stock.otherLocationId,
        quantity: second.quantity + 1
      })
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "lot release exceeds received quantity"
        )
      })
    );
    await expect(
      insertReceiptMovement({
        fixture: stock,
        evidence: second,
        sourceType: "inventory_lot_release",
        skuId: stock.otherSkuId,
        locationId: stock.otherLocationId,
        quantity: second.quantity + 1
      })
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "lot release exceeds received quantity"
        )
      })
    );
  });

  it("rejects direct cancellation after receipt evidence exists", async () => {
    const stock = await fixture();
    const evidence = await receiptEvidence({ fixture: stock });
    await expect(
      payload.db.drizzle.execute(sql`
        UPDATE inventory_receipts
        SET status = 'cancelled', cancelled_at = now(),
          cancelled_by_id = ${stock.checkerId}
        WHERE id = ${evidence.receipt_id}
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "inventory-receipt-cancel-has-receipts"
        )
      })
    );
  });

  it("rejects receipt evidence backfilled after cancellation", async () => {
    const stock = await fixture();
    const receipt = await payload.db.drizzle.execute<{
      cancelled_at: Date;
      id: string;
    }>(sql`
      INSERT INTO inventory_receipts (location_id)
      VALUES (${stock.locationId})
      RETURNING id
    `);
    const receiptId = receipt.rows[0]?.id;
    if (!receiptId) throw new Error("receipt-cancellation-fixture-failed");
    const cancelled = await payload.db.drizzle.execute<{
      cancelled_at: Date;
    }>(sql`
      UPDATE inventory_receipts
      SET status = 'cancelled', cancelled_at = now(),
        cancelled_by_id = ${stock.checkerId}
      WHERE id = ${receiptId}
      RETURNING cancelled_at
    `);
    const cancelledAt = cancelled.rows[0]?.cancelled_at;
    if (!cancelledAt) throw new Error("receipt-cancellation-fixture-failed");

    await expect(
      payload.db.drizzle.execute(sql`
        UPDATE inventory_receipts
        SET opened_at = ${cancelledAt}, opened_by_id = ${stock.actorId}
        WHERE id = ${receiptId}
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "inventory receipt transition evidence requires its status transition"
        )
      })
    );
  });

  it("rejects orphan lots and mismatched receipt audit evidence", async () => {
    const stock = await fixture();
    const header = await receiptHeader({ fixture: stock });
    const orphanClient = await payload.db.pool.connect();
    try {
      await orphanClient.query("BEGIN");
      await orphanClient.query(
        `INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          header.line_id,
          header.quantity,
          new Date().toISOString(),
          stock.actorId
        ]
      );
      await expect(orphanClient.query("COMMIT")).rejects.toMatchObject({
        message: "inventory lot requires exactly one receipt movement"
      });
    } finally {
      await orphanClient.query("ROLLBACK").catch(() => undefined);
      orphanClient.release();
    }

    const mismatchClient = await payload.db.pool.connect();
    const receivedAt = new Date().toISOString();
    try {
      await mismatchClient.query("BEGIN");
      const lot = await mismatchClient.query<{ id: string }>(
        `INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          randomUUID(),
          header.line_id,
          header.quantity,
          receivedAt,
          stock.actorId
        ]
      );
      await expect(
        mismatchClient.query(
          `INSERT INTO inventory_movements (
            idempotency_key, request_hash, sku_id, kind, quantity,
            to_location_id, to_disposition, reason_code, source_type, source_ref,
            actor, effective_at, receipt_id, receipt_line_id, lot_id
          ) VALUES ($1, $2, $3, 'inbound', $4, $5, 'quarantine',
            'receipt-audit-mismatch', 'inventory_receipt', $6::text,
            $7, $8, $9, $10, $6::uuid)`,
          [
            randomUUID(),
            "a".repeat(64),
            stock.skuId,
            header.quantity,
            stock.locationId,
            lot.rows[0]?.id,
            stock.checkerId,
            receivedAt,
            header.receipt_id,
            header.line_id
          ]
        )
      ).rejects.toMatchObject({ message: "receipt provenance chain mismatch" });
    } finally {
      await mismatchClient.query("ROLLBACK").catch(() => undefined);
      mismatchClient.release();
    }
  });

  it("serializes direct receipt close against inbound evidence", async () => {
    const stock = await fixture();
    const closeEvidence = await receiptEvidence({ fixture: stock });
    const closeClient = await payload.db.pool.connect();
    const inboundClient = await payload.db.pool.connect();
    try {
      await closeClient.query("BEGIN");
      await closeClient.query(
        `UPDATE inventory_receipts SET status = 'closed', closed_at = now(),
          closed_by_id = $1 WHERE id = $2`,
        [stock.checkerId, closeEvidence.receipt_id]
      );
      const inbound = inboundClient.query(
        `INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type, source_ref,
          actor, effective_at, receipt_id, receipt_line_id, lot_id
        ) VALUES ($1, $2, $3, 'inbound', $4, $5, 'quarantine',
          'race-test', 'inventory_receipt', $6, $7, $8, $9, $10, $11)`,
        [
          randomUUID(),
          "a".repeat(64),
          stock.skuId,
          closeEvidence.quantity,
          stock.locationId,
          closeEvidence.lot_id,
          stock.actorId,
          closeEvidence.received_at,
          closeEvidence.receipt_id,
          closeEvidence.line_id,
          closeEvidence.lot_id
        ]
      );
      expect(await isStillWaiting(inbound)).toBe(true);
      await closeClient.query("COMMIT");
      await expect(inbound).rejects.toMatchObject({
        message: "receipt provenance chain mismatch"
      });
    } finally {
      await closeClient.query("ROLLBACK").catch(() => undefined);
      closeClient.release();
      inboundClient.release();
    }
  });

  it("rejects unsafe generic inbound, quarantine release, and inactive destinations", async () => {
    const stock = await fixture();
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          to_location_id, to_disposition, reason_code, source_type
        ) VALUES (
          ${randomUUID()}, ${"b".repeat(64)}, ${stock.skuId}, 'inbound', 1,
          ${stock.locationId}, 'available', 'boundary-test', 'inventory_command'
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "inventory command inbound is forbidden"
        )
      })
    );
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, to_location_id, to_disposition,
          reason_code, source_type
        ) VALUES (
          ${randomUUID()}, ${"d".repeat(64)}, ${stock.skuId}, 'transfer', 1,
          ${stock.locationId}, 'quarantine', ${stock.locationId}, 'available',
          'boundary-test', 'inventory_command'
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "quarantine release requires lot evidence"
        )
      })
    );
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, to_location_id, to_disposition,
          reason_code, source_type
        ) VALUES (
          ${randomUUID()}, ${"c".repeat(64)}, ${stock.skuId}, 'transfer', 1,
          ${stock.locationId}, 'quarantine', ${stock.locationId}, 'available',
          'boundary-test', 'inventory_adjustment'
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "inventory workflow movement requires actor and effective timestamp"
        )
      })
    );
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, to_location_id, to_disposition,
          reason_code, source_type, actor, effective_at
        ) VALUES (
          ${randomUUID()}, ${"c".repeat(64)}, ${stock.skuId}, 'transfer', 1,
          ${stock.locationId}, 'quarantine', ${stock.locationId}, 'available',
          'boundary-test', 'inventory_adjustment', ${stock.actorId}, now()
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "quarantine release requires lot evidence"
        )
      })
    );
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_movements (
          idempotency_key, request_hash, sku_id, kind, quantity,
          from_location_id, from_disposition, to_location_id, to_disposition,
          reason_code, source_type, actor, effective_at
        ) VALUES (
          ${randomUUID()}, ${"d".repeat(64)}, ${stock.skuId}, 'transfer', 1,
          ${stock.locationId}, 'available', ${stock.inactiveLocationId}, 'damaged',
          'boundary-test', 'inventory_adjustment', ${stock.actorId}, now()
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({
        message: expect.stringContaining(
          "inventory destination location is inactive"
        )
      })
    );
  });

  it("rejects late evidence inserts and empty count application", async () => {
    const stock = await fixture();
    const receipt = await receiptEvidence({ fixture: stock });
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_receipt_lines (
          receipt_sku_key, receipt_id, sku_id, expected_quantity
        ) VALUES (${randomUUID()}, ${receipt.receipt_id}, ${stock.otherSkuId}, 1)
      `)
    ).rejects.toMatchObject(
      databaseCause({ message: "receipt lines require a draft receipt" })
    );
    await payload.db.drizzle.execute(sql`
      UPDATE inventory_receipts SET status = 'closed', closed_at = now(),
        closed_by_id = ${stock.checkerId} WHERE id = ${receipt.receipt_id}
    `);
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES (${randomUUID()}, ${receipt.line_id}, 1, now(), ${stock.actorId})
      `)
    ).rejects.toMatchObject(
      databaseCause({ message: "inventory lots require an open receipt" })
    );

    const count = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_counts (location_id, status)
      VALUES (${stock.locationId}, 'draft') RETURNING id
    `);
    const countId = count.rows[0]?.id;
    if (!countId) throw new Error("late-count-fixture-failed");
    await payload.db.drizzle.execute(sql`
      UPDATE inventory_cycle_counts SET status = 'submitted', submitted_at = now(),
        submitted_by_id = ${stock.actorId} WHERE id = ${countId}
    `);
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_cycle_count_lines (
          count_aggregate_key, count_id, sku_id, disposition,
          counted_quantity, system_quantity, movement_count_snapshot, variance
        ) VALUES (${randomUUID()}, ${countId}, ${stock.skuId}, 'available', 0, 0, 0, 0)
      `)
    ).rejects.toMatchObject(
      databaseCause({ message: "count lines require a draft count" })
    );
    await expect(
      payload.db.drizzle.execute(sql`
        UPDATE inventory_cycle_counts SET status = 'applied', applied_at = now(),
          applied_by_id = ${stock.checkerId} WHERE id = ${countId}
      `)
    ).rejects.toMatchObject(
      databaseCause({ message: "cycle count requires at least one line" })
    );
  });

  it("rejects evidence update, delete, and truncate through direct SQL", async () => {
    const stock = await fixture();
    const evidence = await receiptEvidence({ fixture: stock });
    const count = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_counts (location_id, status)
      VALUES (${stock.locationId}, 'draft') RETURNING id
    `);
    const countId = count.rows[0]?.id;
    if (!countId) throw new Error("count-mutation-fixture-failed");
    const line = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO inventory_cycle_count_lines (
        count_aggregate_key, count_id, sku_id, disposition,
        counted_quantity, system_quantity, movement_count_snapshot, variance
      ) VALUES (
        ${randomUUID()}, ${countId}, ${stock.skuId}, 'available', 0, 0, 0, 0
      ) RETURNING id
    `);
    const countLineId = line.rows[0]?.id;
    if (!countLineId) throw new Error("count-mutation-fixture-failed");

    const mutations = [
      sql`UPDATE inventory_receipt_lines SET expected_quantity = 9 WHERE id = ${evidence.line_id}`,
      sql`DELETE FROM inventory_lots WHERE id = ${evidence.lot_id}`,
      sql`DELETE FROM inventory_receipts WHERE id = ${evidence.receipt_id}`,
      sql`UPDATE inventory_cycle_count_lines SET counted_quantity = 1 WHERE id = ${countLineId}`,
      sql`DELETE FROM inventory_cycle_counts WHERE id = ${countId}`,
      sql`TRUNCATE TABLE inventory_receipt_lines CASCADE`,
      sql`TRUNCATE TABLE inventory_cycle_count_lines CASCADE`
    ];
    for (const mutation of mutations) {
      await expect(payload.db.drizzle.execute(mutation)).rejects.toMatchObject(
        databaseCause({
          message: expect.stringContaining("inventory")
        })
      );
    }
  });

  it("rejects non-integral operation quantities", async () => {
    const stock = await fixture();
    const evidence = await receiptEvidence({ fixture: stock });
    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO inventory_lots (
          operation_key, receipt_line_id, received_quantity, received_at, actor_id
        ) VALUES (
          ${randomUUID()}, ${evidence.line_id}, 1.5, now(), ${stock.actorId}
        )
      `)
    ).rejects.toMatchObject(
      databaseCause({ constraint: "inventory_lots_received_quantity_check" })
    );
  });
});
