import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  commerceTestDatabaseUri,
  createInventoryPostgresHarness,
  type InventoryLevelDoc,
  type InventoryPostgresHarness
} from "./inventory-ledger.postgres.fixtures";
import {
  reconcileInventoryLedger,
  reconstructInventoryLedger
} from "./inventory-reconciliation";

const testDatabaseUri = commerceTestDatabaseUri;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

describeWithPostgres.sequential(
  "inventory ledger PostgreSQL invariants",
  () => {
    let harness: InventoryPostgresHarness;
    let payload: Payload;
    let createFixture: InventoryPostgresHarness["createFixture"];
    let createLocation: InventoryPostgresHarness["createLocation"];
    let seedInventoryForTest: InventoryPostgresHarness["seedInventoryForTest"];
    let outboundRequest: InventoryPostgresHarness["outboundRequest"];
    let transferRequest: InventoryPostgresHarness["transferRequest"];
    let expectStillWaiting: InventoryPostgresHarness["expectStillWaiting"];
    let findInventory: InventoryPostgresHarness["findInventory"];
    let insertRawLevel: InventoryPostgresHarness["insertRawLevel"];
    let insertRawMovement: InventoryPostgresHarness["insertRawMovement"];

    beforeAll(async () => {
      harness = await createInventoryPostgresHarness(testDatabaseUri as string);
      ({
        payload,
        createFixture,
        createLocation,
        seedInventoryForTest,
        outboundRequest,
        transferRequest,
        expectStillWaiting,
        findInventory,
        insertRawLevel,
        insertRawMovement
      } = harness);
    }, 60_000);

    afterEach(async () => {
      await harness.cleanup();
    });

    it("serializes location deactivation behind an in-flight movement", async () => {
      const fixture = await createFixture();
      await seedInventoryForTest(
        fixture,
        `inventory-location-race-seed-${fixture.suffix}`,
        1
      );
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

      const movement = harness.recordCommand(fixture, {
        payload: gatedPayload,
        request: outboundRequest(
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

    it("serializes SKU deactivation behind an in-flight movement", async () => {
      const fixture = await createFixture();
      await seedInventoryForTest(
        fixture,
        `inventory-sku-race-seed-${fixture.suffix}`,
        1
      );
      let skuReadCount = 0;
      let releaseLockedSkuRead: (() => void) | undefined;
      const lockedSkuReadGate = new Promise<void>((resolve) => {
        releaseLockedSkuRead = resolve;
      });
      let markLockedSkuRead: (() => void) | undefined;
      const lockedSkuReadStarted = new Promise<void>((resolve) => {
        markLockedSkuRead = resolve;
      });
      const gatedPayload = new Proxy(payload, {
        get(target, property) {
          if (property === "findByID") {
            return async (args: Parameters<Payload["findByID"]>[0]) => {
              const result = await target.findByID(args);
              if (
                args.collection === "product-variants" &&
                String(args.id) === fixture.skuId &&
                ++skuReadCount === 2
              ) {
                markLockedSkuRead?.();
                await lockedSkuReadGate;
              }
              return result;
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        }
      });

      const movement = harness.recordCommand(fixture, {
        payload: gatedPayload,
        request: outboundRequest(
          fixture,
          `inventory-sku-race-${fixture.suffix}`,
          1
        )
      });
      await lockedSkuReadStarted;
      const deactivation = payload.update({
        collection: "product-variants",
        id: fixture.skuId,
        overrideAccess: true,
        data: { active: false }
      });

      try {
        await expectStillWaiting(deactivation);
        releaseLockedSkuRead?.();
        await expect(movement).resolves.toMatchObject({ kind: "created" });
        await expect(deactivation).resolves.toMatchObject({ active: false });
      } catch (error) {
        releaseLockedSkuRead?.();
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
          })
      ];
      const invalidMovementQuantities = [
        () =>
          insertRawMovement({
            fixture,
            idempotencyKey: `raw-negative-${fixture.suffix}`,
            kind: "outbound",
            quantity: -1,
            fromDisposition: "available"
          }),
        () =>
          insertRawMovement({
            fixture,
            idempotencyKey: `raw-fractional-${fixture.suffix}`,
            kind: "outbound",
            quantity: 0.5,
            fromDisposition: "available"
          }),
        () =>
          insertRawMovement({
            fixture,
            idempotencyKey: `raw-unsafe-${fixture.suffix}`,
            kind: "outbound",
            quantity: unsafeInteger,
            fromDisposition: "available"
          }),
        () =>
          insertRawMovement({
            fixture,
            idempotencyKey: `raw-nan-${fixture.suffix}`,
            kind: "outbound",
            quantity: numericNaN,
            fromDisposition: "available"
          })
      ];
      const invalidMovementShapes = [
        () =>
          insertRawMovement({
            fixture,
            idempotencyKey: `raw-outbound-shape-${fixture.suffix}`,
            kind: "outbound",
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
      for (const write of invalidMovementQuantities) {
        await expect(write()).rejects.toMatchObject({
          cause: expect.objectContaining({
            code: "23514",
            constraint: "inventory_movements_positive_integer_quantity_check"
          })
        });
      }
      for (const write of invalidMovementShapes) {
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
      await seedInventoryForTest(
        fixture,
        `inventory-reconstruct-in-${fixture.suffix}`,
        5
      );
      await harness.recordCommand(fixture, {
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
      await seedInventoryForTest(
        fixture,
        `inventory-drift-${fixture.suffix}`,
        2
      );
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

    it("allows existing stock to drain after SKU deactivation", async () => {
      const fixture = await createFixture();
      await seedInventoryForTest(
        fixture,
        `inventory-inactive-sku-seed-${fixture.suffix}`,
        1
      );
      await payload.update({
        collection: "product-variants",
        id: fixture.skuId,
        overrideAccess: true,
        data: { active: false }
      });

      await expect(
        harness.recordCommand(fixture, {
          payload,
          request: outboundRequest(
            fixture,
            `inventory-inactive-sku-${fixture.suffix}`,
            1
          )
        })
      ).resolves.toMatchObject({
        kind: "created",
        projections: [expect.objectContaining({ quantity: 0 })]
      });
    });

    it("allows existing stock to drain after source-location deactivation", async () => {
      const fixture = await createFixture();
      await seedInventoryForTest(
        fixture,
        `inventory-inactive-source-seed-${fixture.suffix}`,
        1
      );
      await payload.update({
        collection: "stock-locations" as never,
        id: fixture.locationId,
        overrideAccess: true,
        data: { active: false } as never
      });

      await expect(
        harness.recordCommand(fixture, {
          payload,
          request: outboundRequest(
            fixture,
            `inventory-inactive-source-${fixture.suffix}`,
            1
          )
        })
      ).resolves.toMatchObject({
        kind: "created",
        projections: [expect.objectContaining({ quantity: 0 })]
      });
    });

    it("rejects transfers to inactive locations before persistence", async () => {
      const fixture = await createFixture();
      const destinationId = await createLocation(
        fixture.suffix,
        "inactive-destination"
      );
      await seedInventoryForTest(
        fixture,
        `inventory-inactive-destination-seed-${fixture.suffix}`,
        1
      );
      await payload.update({
        collection: "stock-locations" as never,
        id: destinationId,
        overrideAccess: true,
        data: { active: false } as never
      });

      await expect(
        harness.recordCommand(fixture, {
          payload,
          request: transferRequest(
            fixture,
            `inventory-inactive-destination-${fixture.suffix}`,
            1,
            destinationId,
            "quarantine"
          )
        })
      ).rejects.toThrow("inventory-location-inactive");
    });

    it("rejects generic inbound commands before database access", async () => {
      const fixture = await createFixture();
      await expect(
        harness.recordCommand(fixture, {
          payload,
          request: {
            idempotencyKey: `inventory-command-inbound-${fixture.suffix}`,
            skuId: fixture.skuId,
            kind: "inbound",
            quantity: 1,
            to: {
              locationId: fixture.locationId,
              disposition: "available"
            },
            reasonCode: "postgres-test",
            sourceType: "inventory_command"
          }
        })
      ).rejects.toThrow("inventory-inbound-requires-workflow");
    });
  }
);
