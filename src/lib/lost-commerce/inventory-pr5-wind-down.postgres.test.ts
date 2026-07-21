import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { InventoryMovementRequest } from "./inventory-ledger-contracts";
import {
  commerceTestDatabaseUri,
  createInventoryPostgresHarness,
  type InventoryPostgresHarness
} from "./inventory-ledger.postgres.fixtures";

const testDatabaseUri = commerceTestDatabaseUri;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

describeWithPostgres.sequential("PR5 inventory wind-down", () => {
  let harness: InventoryPostgresHarness;
  let payload: Payload;

  beforeAll(async () => {
    harness = await createInventoryPostgresHarness(testDatabaseUri as string);
    payload = harness.payload;
  }, 60_000);

  afterEach(async () => {
    await harness.cleanup();
  });

  afterAll(async () => {
    await payload?.destroy();
    if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = originalDatabaseUri;
  });

  const request = (
    fixture: Awaited<ReturnType<typeof harness.createFixture>>,
    input: Omit<InventoryMovementRequest, "idempotencyKey" | "skuId">
  ): InventoryMovementRequest => ({
    ...input,
    idempotencyKey: `wind-down-${randomUUID()}`,
    skuId: fixture.skuId
  });

  async function rawMovement(input: {
    skuId: string;
    actorId: string;
    kind: "inbound" | "outbound" | "transfer";
    fromLocationId?: string;
    toLocationId?: string;
  }) {
    return payload.db.drizzle.execute(sql`
      INSERT INTO inventory_movements (
        idempotency_key, request_hash, sku_id, kind, quantity,
        from_location_id, from_disposition, to_location_id, to_disposition,
        reason_code, source_type, actor, effective_at
      ) VALUES (
        ${`wind-down-raw-${randomUUID()}`}, ${"a".repeat(64)}, ${input.skuId},
        ${input.kind}::enum_inventory_movements_kind, 1,
        ${input.fromLocationId ?? null}::uuid,
        ${input.fromLocationId ? "available" : null}::enum_inventory_movements_from_disposition,
        ${input.toLocationId ?? null}::uuid,
        ${input.toLocationId ? "damaged" : null}::enum_inventory_movements_to_disposition,
        'wind-down-test', 'inventory_adjustment', ${input.actorId}, now()
      )
    `);
  }

  it("drains and reclassifies stock after SKU and source deactivation", async () => {
    const fixture = await harness.createFixture();
    const destinationId = await harness.createLocation(
      fixture.suffix,
      "wind-down-destination"
    );
    await harness.seedInventoryForTest(
      fixture,
      `wind-down-${fixture.suffix}`,
      6
    );
    await payload.update({
      collection: "product-variants",
      id: fixture.skuId,
      overrideAccess: true,
      data: { active: false }
    });
    await payload.update({
      collection: "stock-locations" as never,
      id: fixture.locationId,
      overrideAccess: true,
      data: { active: false } as never
    });

    const movements = [
      request(fixture, {
        kind: "outbound",
        quantity: 1,
        from: { locationId: fixture.locationId, disposition: "available" },
        reasonCode: "wind-down",
        sourceType: "inventory_command"
      }),
      request(fixture, {
        kind: "transfer",
        quantity: 2,
        from: { locationId: fixture.locationId, disposition: "available" },
        to: { locationId: destinationId, disposition: "available" },
        reasonCode: "wind-down",
        sourceType: "inventory_command"
      }),
      request(fixture, {
        kind: "transfer",
        quantity: 1,
        from: { locationId: fixture.locationId, disposition: "available" },
        to: { locationId: fixture.locationId, disposition: "damaged" },
        reasonCode: "wind-down",
        sourceType: "inventory_command"
      })
    ];

    for (const movement of movements) {
      await expect(
        harness.recordCommand(fixture, { payload, request: movement })
      ).resolves.toMatchObject({ kind: "created" });
    }
    await expect(
      harness.findInventory("inventory-levels", {
        sku: { equals: fixture.skuId }
      })
    ).resolves.toMatchObject({
      docs: expect.arrayContaining([
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:available`,
          quantity: 2
        }),
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${fixture.locationId}:damaged`,
          quantity: 1
        }),
        expect.objectContaining({
          aggregate_key: `${fixture.skuId}:${destinationId}:available`,
          quantity: 2
        })
      ])
    });
  });

  it("rejects inbound stock and cross-location transfers to inactive identities", async () => {
    const fixture = await harness.createFixture();
    const inactiveDestinationId = await harness.createLocation(
      fixture.suffix,
      "inactive-destination"
    );
    await harness.seedInventoryForTest(
      fixture,
      `inactive-${fixture.suffix}`,
      1
    );
    await payload.update({
      collection: "stock-locations" as never,
      id: inactiveDestinationId,
      overrideAccess: true,
      data: { active: false } as never
    });

    await expect(
      harness.recordCommand(fixture, {
        payload,
        request: request(fixture, {
          kind: "transfer",
          quantity: 1,
          from: { locationId: fixture.locationId, disposition: "available" },
          to: { locationId: inactiveDestinationId, disposition: "available" },
          reasonCode: "wind-down",
          sourceType: "inventory_command"
        })
      })
    ).rejects.toThrow("inventory-location-inactive");
    await expect(
      rawMovement({
        skuId: fixture.skuId,
        actorId: fixture.actorIds[1],
        kind: "inbound",
        toLocationId: inactiveDestinationId
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        message: "inventory destination location is inactive"
      })
    });

    await payload.update({
      collection: "product-variants",
      id: fixture.skuId,
      overrideAccess: true,
      data: { active: false }
    });
    await expect(
      rawMovement({
        skuId: fixture.skuId,
        actorId: fixture.actorIds[1],
        kind: "inbound",
        toLocationId: fixture.locationId
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        message: "inventory movement SKU is inactive"
      })
    });
  });

  it("rejects every movement kind while SKU identity is unlocked", async () => {
    const fixture = await harness.createFixture();
    await payload.db.drizzle.execute(sql`
      UPDATE product_variants SET identity_locked = false WHERE id = ${fixture.skuId}
    `);
    for (const movement of [
      { kind: "inbound" as const, toLocationId: fixture.locationId },
      { kind: "outbound" as const, fromLocationId: fixture.locationId },
      {
        kind: "transfer" as const,
        fromLocationId: fixture.locationId,
        toLocationId: fixture.locationId
      }
    ]) {
      await expect(
        rawMovement({
          skuId: fixture.skuId,
          actorId: fixture.actorIds[1],
          ...movement
        })
      ).rejects.toMatchObject({
        cause: expect.objectContaining({
          code: "23514",
          message: "inventory movement SKU identity is unlocked"
        })
      });
    }
  });
});
