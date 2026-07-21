import { randomUUID } from "node:crypto";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  buildConfig,
  createLocalReq,
  getPayload,
  type CollectionConfig,
  type Payload,
  type PayloadRequest
} from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CommerceCommands } from "@/payload/collections/(consumption)/CommerceCommands";
import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import {
  adjustInventory,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  releaseInventoryLot
} from "./inventory-operations";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

const TestProducts: CollectionConfig = {
  slug: "products",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "currency", type: "select", options: ["KRW", "USD"] },
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

type Actor = NonNullable<PayloadRequest["user"]>;
type TestDoc = Record<string, unknown>;
type Fixture = {
  productId: string;
  skuId: string;
  locationId: string;
};
type Endpoint = { locationId: string; disposition: string };

describeWithPostgres.sequential(
  "PR5 inventory service scenarios with PostgreSQL",
  () => {
    let payload: Payload;
    let maker: Actor;
    let checker: Actor;
    let makerRequest: PayloadRequest;
    let checkerRequest: PayloadRequest;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      payload = await getPayload({
        config: buildConfig({
          secret: "commerce-pr5-service-scenario-secret",
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
            CommerceCommands,
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
      const [makerDoc, checkerDoc] = await Promise.all([
        createDoc("users", { name: "PR5 service maker", role: "admin" }),
        createDoc("users", { name: "PR5 service checker", role: "admin" })
      ]);
      maker = { ...makerDoc, role: "admin" } as unknown as Actor;
      checker = { ...checkerDoc, role: "admin" } as unknown as Actor;
      makerRequest = await createLocalReq({ user: maker }, payload);
      checkerRequest = await createLocalReq({ user: checker }, payload);
    }, 60_000);

    afterAll(async () => {
      await payload?.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    });

    const commandKey = (label: string) => `${label}-${randomUUID()}`;
    const clock = (iso: string) => () => new Date(iso);
    const reqFor = (actor: Actor): PayloadRequest => {
      const base = actor.id === maker.id ? makerRequest : checkerRequest;
      return { ...base, payload, user: actor, context: { ...base.context } };
    };

    async function createDoc(
      collection: "products" | "users" | "product-variants" | "stock-locations",
      data: Record<string, unknown>
    ): Promise<TestDoc & { id: string }> {
      return payload.create({
        collection,
        overrideAccess: true,
        data
      } as never) as unknown as Promise<TestDoc & { id: string }>;
    }

    async function createLocation(label: string): Promise<string> {
      const suffix = randomUUID();
      const location = await createDoc("stock-locations", {
        code: `${label}-${suffix}`.toUpperCase(),
        name: `${label} ${suffix}`,
        active: true
      });
      return String(location.id);
    }

    async function createFixture(locationId?: string): Promise<Fixture> {
      const suffix = randomUUID();
      const product = await createDoc("products", {
        name: `PR5 service ${suffix}`,
        slug: `pr5-service-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      });
      const sku = await createDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `PR5-SERVICE-${suffix}`.toUpperCase(),
        options: []
      });
      return {
        productId: String(product.id),
        skuId: String(sku.id),
        locationId: locationId ?? (await createLocation("PR5-SERVICE"))
      };
    }

    async function findDocs(
      collection: string,
      where: Record<string, unknown>
    ): Promise<TestDoc[]> {
      const result = (await payload.find({
        collection: collection as never,
        depth: 0,
        overrideAccess: true,
        pagination: false,
        where
      } as never)) as unknown as { docs: TestDoc[] };
      return result.docs;
    }

    async function projection(
      skuId: string,
      locationId: string,
      disposition: string
    ): Promise<{ quantity: number; movementCount: number }> {
      const docs = await findDocs("inventory-levels", {
        aggregate_key: { equals: `${skuId}:${locationId}:${disposition}` }
      });
      return {
        quantity: Number(docs[0]?.quantity ?? 0),
        movementCount: Number(docs[0]?.movement_count ?? 0)
      };
    }

    async function command(command: string): Promise<TestDoc> {
      const docs = await findDocs("commerce-commands", {
        command_key: { equals: command }
      });
      expect(docs).toHaveLength(1);
      return docs[0]!;
    }

    async function expectSucceededCommand(
      key: string,
      resourceType: string,
      resourceId: string,
      completedAt: string
    ): Promise<void> {
      await expect(command(key)).resolves.toMatchObject({
        status: "succeeded",
        resource_type: resourceType,
        resource_id: resourceId,
        safe_response: { resourceId, status: expect.any(String) },
        completed_at: completedAt
      });
    }

    async function createReceipt(
      fixture: Fixture,
      options: { open?: boolean; expectedQuantity?: number } = {}
    ): Promise<{ receiptId: string; lineId: string }> {
      const created = await createInventoryReceipt({
        payload,
        req: reqFor(maker),
        commandKey: commandKey("pr5-service-receipt-create"),
        input: {
          locationId: fixture.locationId,
          externalReference: `PO-${randomUUID()}`,
          lines: [
            {
              skuId: fixture.skuId,
              expectedQuantity: options.expectedQuantity ?? 10
            }
          ]
        }
      });
      if (created.kind !== "succeeded")
        throw new Error("receipt-create-failed");
      const lines = await findDocs("inventory-receipt-lines", {
        receipt: { equals: created.resourceId }
      });
      const receipt = {
        receiptId: created.resourceId,
        lineId: String(lines[0]?.id)
      };
      if (options.open) {
        await openInventoryReceipt({
          payload,
          req: reqFor(maker),
          commandKey: commandKey("pr5-service-receipt-open"),
          input: { receiptId: receipt.receiptId }
        });
      }
      return receipt;
    }

    async function seedAvailable(fixture: Fixture, quantity: number) {
      const receipt = await createReceipt(fixture, {
        open: true,
        expectedQuantity: quantity
      });
      const received = await receiveInventoryReceipt({
        payload,
        req: reqFor(maker),
        commandKey: commandKey("pr5-service-seed-receive"),
        input: {
          receiptId: receipt.receiptId,
          receiptLineId: receipt.lineId,
          quantity
        }
      });
      if (received.kind !== "succeeded") throw new Error("seed-receive-failed");
      await releaseInventoryLot({
        payload,
        req: reqFor(maker),
        commandKey: commandKey("pr5-service-seed-release"),
        input: { lotId: received.resourceId, quantity }
      });
    }

    async function deactivateLocation(locationId: string): Promise<void> {
      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("location-update-transaction-failed");
      const req = { ...reqFor(maker), transactionID } as PayloadRequest;
      try {
        await payload.update({
          collection: "stock-locations" as never,
          id: locationId,
          overrideAccess: true,
          req,
          data: { active: false } as never
        });
        await payload.db.commitTransaction(transactionID);
      } catch (error) {
        await payload.db
          .rollbackTransaction(transactionID)
          .catch(() => undefined);
        throw error;
      }
    }

    const adjustment = (
      fixture: Fixture,
      key: string,
      input: {
        kind: "outbound" | "transfer";
        quantity: number;
        from: Endpoint;
        to?: Endpoint;
        sourceRef: string;
      },
      actor = maker,
      effectiveAt = "2026-07-22T01:00:00.000Z"
    ) =>
      adjustInventory({
        payload,
        req: reqFor(actor),
        commandKey: key,
        clock: clock(effectiveAt),
        input: {
          ...input,
          skuId: fixture.skuId,
          reasonCode: "service-scenario"
        }
      });

    it("atomically applies outbound, same-location reclassification, and cross-location transfer", async () => {
      const fixture = await createFixture();
      const destinationId = await createLocation("PR5-TRANSFER");
      await seedAvailable(fixture, 10);
      const cases = [
        {
          key: commandKey("pr5-service-outbound"),
          time: "2026-07-22T01:01:00.000Z",
          input: {
            kind: "outbound" as const,
            quantity: 2,
            from: { locationId: fixture.locationId, disposition: "available" },
            sourceRef: `shipment:${randomUUID()}`
          }
        },
        {
          key: commandKey("pr5-service-reclassify"),
          time: "2026-07-22T01:02:00.000Z",
          input: {
            kind: "transfer" as const,
            quantity: 3,
            from: { locationId: fixture.locationId, disposition: "available" },
            to: { locationId: fixture.locationId, disposition: "damaged" },
            sourceRef: `damage-review:${randomUUID()}`
          }
        },
        {
          key: commandKey("pr5-service-transfer"),
          time: "2026-07-22T01:03:00.000Z",
          input: {
            kind: "transfer" as const,
            quantity: 4,
            from: { locationId: fixture.locationId, disposition: "available" },
            to: { locationId: destinationId, disposition: "available" },
            sourceRef: `warehouse-transfer:${randomUUID()}`
          }
        }
      ];

      for (const scenario of cases) {
        const result = await adjustment(
          fixture,
          scenario.key,
          scenario.input,
          maker,
          scenario.time
        );
        expect(result).toMatchObject({ kind: "succeeded", status: "applied" });
        await expectSucceededCommand(
          scenario.key,
          "inventory-adjustment",
          scenario.key,
          scenario.time
        );
      }

      await expect(
        Promise.all([
          projection(fixture.skuId, fixture.locationId, "available"),
          projection(fixture.skuId, fixture.locationId, "damaged"),
          projection(fixture.skuId, destinationId, "available")
        ])
      ).resolves.toEqual([
        { quantity: 1, movementCount: 4 },
        { quantity: 3, movementCount: 1 },
        { quantity: 4, movementCount: 1 }
      ]);
      const movements = await findDocs("inventory-movements", {
        source_type: { equals: "inventory_adjustment" }
      });
      const scenarioMovements = movements.filter((movement) =>
        cases.some(
          (scenario) => scenario.input.sourceRef === movement.source_ref
        )
      );
      expect(scenarioMovements).toHaveLength(3);
      for (const scenario of cases) {
        expect(scenarioMovements).toContainEqual(
          expect.objectContaining({
            sku: fixture.skuId,
            kind: scenario.input.kind,
            quantity: scenario.input.quantity,
            source_ref: scenario.input.sourceRef,
            actor: maker.id,
            effective_at: scenario.time
          })
        );
      }
    }, 20_000);

    it("rolls back failed adjustments while preserving durable replay and conflict evidence", async () => {
      const fixture = await createFixture();
      const inactiveDestinationId = await createLocation("PR5-INACTIVE");
      await seedAvailable(fixture, 5);

      const insufficientKey = commandKey("pr5-service-insufficient");
      const insufficientRef = `shipment:${randomUUID()}`;
      await expect(
        adjustment(fixture, insufficientKey, {
          kind: "outbound",
          quantity: 6,
          from: { locationId: fixture.locationId, disposition: "available" },
          sourceRef: insufficientRef
        })
      ).rejects.toThrow("insufficient-inventory-balance");
      expect(
        await projection(fixture.skuId, fixture.locationId, "available")
      ).toEqual({ quantity: 5, movementCount: 1 });
      expect(
        await findDocs("inventory-movements", {
          source_ref: { equals: insufficientRef }
        })
      ).toHaveLength(0);
      await expect(command(insufficientKey)).resolves.toMatchObject({
        status: "in_progress",
        completed_at: null,
        safe_response: null
      });

      const replayKey = commandKey("pr5-service-replay");
      const replayTime = "2026-07-22T02:00:00.000Z";
      const replayInput = {
        kind: "outbound" as const,
        quantity: 1,
        from: { locationId: fixture.locationId, disposition: "available" },
        sourceRef: `shipment:${randomUUID()}`
      };
      const created = await adjustment(
        fixture,
        replayKey,
        replayInput,
        maker,
        replayTime
      );
      const replayed = await adjustment(
        fixture,
        replayKey,
        replayInput,
        checker,
        "2026-07-22T02:01:00.000Z"
      );
      const conflict = await adjustment(
        fixture,
        replayKey,
        { ...replayInput, quantity: 2 },
        checker,
        "2026-07-22T02:02:00.000Z"
      );
      expect([created.kind, replayed.kind, conflict.kind]).toEqual([
        "succeeded",
        "replay",
        "conflict"
      ]);
      expect(
        await projection(fixture.skuId, fixture.locationId, "available")
      ).toEqual({ quantity: 4, movementCount: 2 });
      expect(
        await findDocs("inventory-movements", {
          source_ref: { equals: replayInput.sourceRef }
        })
      ).toEqual([
        expect.objectContaining({ actor: maker.id, effective_at: replayTime })
      ]);

      await deactivateLocation(inactiveDestinationId);
      const inactiveKey = commandKey("pr5-service-inactive-destination");
      const inactiveRef = `transfer:${randomUUID()}`;
      await expect(
        adjustment(fixture, inactiveKey, {
          kind: "transfer",
          quantity: 1,
          from: { locationId: fixture.locationId, disposition: "available" },
          to: { locationId: inactiveDestinationId, disposition: "available" },
          sourceRef: inactiveRef
        })
      ).rejects.toThrow("inventory-location-inactive");
      expect(
        await projection(fixture.skuId, fixture.locationId, "available")
      ).toEqual({ quantity: 4, movementCount: 2 });
      expect(
        await projection(fixture.skuId, inactiveDestinationId, "available")
      ).toEqual({ quantity: 0, movementCount: 0 });
      expect(
        await findDocs("inventory-movements", {
          source_ref: { equals: inactiveRef }
        })
      ).toHaveLength(0);
      await expect(command(inactiveKey)).resolves.toMatchObject({
        status: "in_progress",
        completed_at: null
      });
    }, 20_000);
  }
);
