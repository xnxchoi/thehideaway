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
  applyInventoryCycleCount,
  closeInventoryReceipt,
  createInventoryCycleCount,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  releaseInventoryLot,
  submitInventoryCycleCount
} from "./inventory-operations";
import {
  recordInventoryMovementsInTransaction,
  type InventoryTransactionRequest
} from "./inventory-ledger";
import type { InventoryMovementRequest } from "./inventory-ledger-contracts";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
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

type Actor = NonNullable<PayloadRequest["user"]>;
type TestDoc = Record<string, unknown>;
type Fixture = {
  productId: string;
  skuId: string;
  locationId: string;
  suffix: string;
};

describeWithPostgres.sequential(
  "PR5 inventory scenarios with PostgreSQL",
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
          secret: "commerce-pr5-postgres-scenario-secret",
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
        createTestDoc("users", { name: "PR5 maker", role: "admin" }),
        createTestDoc("users", { name: "PR5 checker", role: "admin" })
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
    const adminReq = (actor: Actor): PayloadRequest => {
      const base = actor.id === maker.id ? makerRequest : checkerRequest;
      return { ...base, payload, user: actor, context: { ...base.context } };
    };

    async function createTestDoc(
      collection: "products" | "users" | "product-variants" | "stock-locations",
      data: Record<string, unknown>
    ): Promise<TestDoc & { id: string }> {
      // This test-local Payload config is intentionally narrower than generated app types.
      return payload.create({
        collection,
        overrideAccess: true,
        data
      } as never) as unknown as Promise<TestDoc & { id: string }>;
    }

    async function createFixture(locationId?: string): Promise<Fixture> {
      const suffix = randomUUID();
      const product = await createTestDoc("products", {
        name: `PR5 ${suffix}`,
        slug: `pr5-${suffix}`,
        currency: "KRW",
        unit_amount: 1
      });
      const sku = await createTestDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `PR5-${suffix}`.toUpperCase(),
        options: []
      });
      const location = locationId
        ? { id: locationId }
        : await createTestDoc("stock-locations", {
            code: `PR5-${suffix}`.toUpperCase(),
            name: `PR5 ${suffix}`,
            active: true
          });
      return {
        productId: String(product.id),
        skuId: String(sku.id),
        locationId: String(location.id),
        suffix
      };
    }

    async function createLocation(label: string): Promise<string> {
      const suffix = randomUUID();
      const location = await createTestDoc("stock-locations", {
        code: `${label}-${suffix}`.toUpperCase(),
        name: `${label} ${suffix}`,
        active: true
      });
      return String(location.id);
    }

    async function seedAvailable(fixture: Fixture, quantity: number) {
      const receipt = await createOpenReceipt(fixture, quantity);
      const received = await receive(receipt, quantity);
      if (received.kind !== "succeeded") throw new Error("seed-receive-failed");
      return releaseInventoryLot({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-seed-release"),
        input: { lotId: received.resourceId, quantity }
      });
    }

    async function findDocs(
      collection: string,
      where: Record<string, unknown>
    ) {
      return payload.find({
        collection: collection as never,
        depth: 0,
        overrideAccess: true,
        pagination: false,
        where
      } as never) as unknown as Promise<{ docs: TestDoc[] }>;
    }

    async function findDoc(collection: string, id: string): Promise<TestDoc> {
      return payload.findByID({
        collection: collection as never,
        id,
        depth: 0,
        overrideAccess: true
      } as never) as unknown as Promise<TestDoc>;
    }

    async function quantity(
      fixture: Pick<Fixture, "skuId" | "locationId">,
      disposition: string
    ): Promise<number> {
      const result = await findDocs("inventory-levels", {
        aggregate_key: {
          equals: `${fixture.skuId}:${fixture.locationId}:${disposition}`
        }
      });
      return Number(result.docs[0]?.quantity ?? 0);
    }

    async function createOpenReceipt(fixture: Fixture, expectedQuantity = 10) {
      const create = await createInventoryReceipt({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-receipt-create"),
        input: {
          locationId: fixture.locationId,
          lines: [{ skuId: fixture.skuId, expectedQuantity }]
        }
      });
      if (create.kind !== "succeeded") throw new Error("receipt-create-failed");
      const lines = await findDocs("inventory-receipt-lines", {
        receipt: { equals: create.resourceId }
      });
      const lineId = String(lines.docs[0]?.id);
      await openInventoryReceipt({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-receipt-open"),
        input: { receiptId: create.resourceId }
      });
      return { receiptId: create.resourceId, lineId };
    }

    async function receive(
      receipt: { receiptId: string; lineId: string },
      quantityReceived: number,
      key = commandKey("pr5-receive")
    ) {
      return receiveInventoryReceipt({
        payload,
        req: adminReq(maker),
        commandKey: key,
        input: {
          receiptId: receipt.receiptId,
          receiptLineId: receipt.lineId,
          quantity: quantityReceived
        }
      });
    }

    it("keeps partial and over-receipts durable, replayable, and fully linked", async () => {
      const fixture = await createFixture();
      const receipt = await createOpenReceipt(fixture, 10);
      const partialKey = commandKey("pr5-partial");
      const partial = await receive(receipt, 4, partialKey);
      const replay = await receive(receipt, 4, partialKey);
      const over = await receive(receipt, 12);

      expect([partial.kind, replay.kind, over.kind]).toEqual([
        "succeeded",
        "replay",
        "succeeded"
      ]);
      expect(await quantity(fixture, "quarantine")).toBe(16);
      const lots = await findDocs("inventory-lots", {
        receipt_line: { equals: receipt.lineId }
      });
      expect(
        lots.docs
          .map((lot) => Number(lot.received_quantity))
          .sort((left, right) => left - right)
      ).toEqual([4, 12]);
      const movements = await findDocs("inventory-movements", {
        receipt: { equals: receipt.receiptId }
      });
      expect(movements.docs).toHaveLength(2);
      expect(
        movements.docs.every(
          (movement) =>
            movement.source_type === "inventory_receipt" &&
            movement.receipt === receipt.receiptId &&
            movement.receipt_line === receipt.lineId &&
            movement.to_disposition === "quarantine"
        )
      ).toBe(true);
      expect(new Set(movements.docs.map((movement) => movement.lot))).toEqual(
        new Set(lots.docs.map((lot) => lot.id))
      );
    });

    it("serializes close against receive without accepting stock after closure", async () => {
      const fixture = await createFixture();
      const receipt = await createOpenReceipt(fixture);
      let releaseRead: (() => void) | undefined;
      let markRead: (() => void) | undefined;
      const readGate = new Promise<void>((resolve) => (releaseRead = resolve));
      const readStarted = new Promise<void>((resolve) => (markRead = resolve));
      const racingPayload = new Proxy(payload, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (typeof value !== "function") return value;
          return async (...methodArgs: unknown[]) => {
            const result = await Reflect.apply(value, target, methodArgs);
            const args = methodArgs[0] as
              | {
                  collection?: string;
                  req?: PayloadRequest;
                }
              | undefined;
            if (args?.req) args.req.payload = racingPayload;
            if (
              property === "findByID" &&
              args?.collection === "inventory-receipts"
            ) {
              markRead?.();
              await readGate;
            }
            return result;
          };
        }
      });
      const competingReceive = receiveInventoryReceipt({
        payload: racingPayload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-receive-race"),
        input: {
          receiptId: receipt.receiptId,
          receiptLineId: receipt.lineId,
          quantity: 1
        }
      });
      await readStarted;
      const close = closeInventoryReceipt({
        payload,
        req: adminReq(checker),
        commandKey: commandKey("pr5-close-race"),
        input: { receiptId: receipt.receiptId }
      });
      let observed: unknown;
      try {
        observed = await Promise.race([
          close.then(
            () => "settled",
            (error) => error
          ),
          new Promise((resolve) => setTimeout(() => resolve("waiting"), 50))
        ]);
      } finally {
        releaseRead?.();
      }
      const outcomes = await Promise.allSettled([competingReceive, close]);
      expect(observed).toBe("waiting");
      expect(outcomes).toEqual([
        expect.objectContaining({
          status: "fulfilled",
          value: expect.objectContaining({ kind: "succeeded" })
        }),
        expect.objectContaining({
          status: "fulfilled",
          value: expect.objectContaining({ status: "closed" })
        })
      ]);
      const stored = await findDoc("inventory-receipts", receipt.receiptId);
      expect(stored.status).toBe("closed");
      const lots = await findDocs("inventory-lots", {
        receipt_line: { equals: receipt.lineId }
      });
      expect(lots.docs).toHaveLength(1);
    });

    it("serializes concurrent partial lot release and rejects over-release", async () => {
      const fixture = await createFixture();
      const receipt = await createOpenReceipt(fixture);
      const received = await receive(receipt, 10);
      if (received.kind !== "succeeded") throw new Error("receive-failed");
      const releases = await Promise.all([
        releaseInventoryLot({
          payload,
          req: adminReq(maker),
          commandKey: commandKey("pr5-release-a"),
          input: { lotId: received.resourceId, quantity: 4 }
        }),
        releaseInventoryLot({
          payload,
          req: adminReq(checker),
          commandKey: commandKey("pr5-release-b"),
          input: { lotId: received.resourceId, quantity: 6 }
        })
      ]);
      expect(releases.map((result) => result.kind)).toEqual([
        "succeeded",
        "succeeded"
      ]);
      await expect(
        releaseInventoryLot({
          payload,
          req: adminReq(checker),
          commandKey: commandKey("pr5-release-over"),
          input: { lotId: received.resourceId, quantity: 1 }
        })
      ).rejects.toThrow("inventory-lot-release-exceeds-remaining");
      expect(await quantity(fixture, "quarantine")).toBe(0);
      expect(await quantity(fixture, "available")).toBe(10);
      const movements = await findDocs("inventory-movements", {
        and: [
          { lot: { equals: received.resourceId } },
          { source_type: { equals: "inventory_lot_release" } }
        ]
      });
      expect(movements.docs).toHaveLength(2);
      expect(
        movements.docs.every(
          (movement) => movement.receipt === receipt.receiptId
        )
      ).toBe(true);
    });

    it("requires a different checker for a positive count and preserves typed evidence", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 2);
      const created = await createInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-create"),
        input: {
          locationId: fixture.locationId,
          lines: [
            {
              skuId: fixture.skuId,
              disposition: "available",
              countedQuantity: 5
            }
          ]
        }
      });
      if (created.kind !== "succeeded") throw new Error("count-create-failed");
      await submitInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-submit"),
        input: { countId: created.resourceId }
      });
      await expect(
        applyInventoryCycleCount({
          payload,
          req: adminReq(maker),
          commandKey: commandKey("pr5-count-self-apply"),
          input: { countId: created.resourceId }
        })
      ).rejects.toThrow("inventory-cycle-count-self-approval-forbidden");
      await applyInventoryCycleCount({
        payload,
        req: adminReq(checker),
        commandKey: commandKey("pr5-count-checker-apply"),
        input: { countId: created.resourceId }
      });
      expect(await quantity(fixture, "available")).toBe(5);
      const movements = await findDocs("inventory-movements", {
        cycle_count: { equals: created.resourceId }
      });
      expect(movements.docs).toEqual([
        expect.objectContaining({
          source_type: "inventory_cycle_count",
          kind: "inbound",
          quantity: 3,
          cycle_count: created.resourceId,
          cycle_count_line: expect.any(String),
          actor: checker.id
        })
      ]);
    });

    it("applies negative and no-variance lines without creating a zero movement", async () => {
      const first = await createFixture();
      const second = await createFixture(first.locationId);
      await Promise.all([seedAvailable(first, 5), seedAvailable(second, 3)]);
      const created = await createInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-mixed-create"),
        input: {
          locationId: first.locationId,
          lines: [
            {
              skuId: first.skuId,
              disposition: "available",
              countedQuantity: 3
            },
            {
              skuId: second.skuId,
              disposition: "available",
              countedQuantity: 3
            }
          ]
        }
      });
      if (created.kind !== "succeeded") throw new Error("count-create-failed");
      await submitInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-mixed-submit"),
        input: { countId: created.resourceId }
      });
      await applyInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-mixed-apply"),
        input: { countId: created.resourceId }
      });
      expect(await quantity(first, "available")).toBe(3);
      expect(await quantity(second, "available")).toBe(3);
      const movements = await findDocs("inventory-movements", {
        cycle_count: { equals: created.resourceId }
      });
      expect(movements.docs).toEqual([
        expect.objectContaining({
          kind: "outbound",
          quantity: 2,
          sku: first.skuId
        })
      ]);
    });

    it("rejects a count whose inventory snapshot became stale", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 4);
      const created = await createInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-stale-create"),
        input: {
          locationId: fixture.locationId,
          lines: [
            {
              skuId: fixture.skuId,
              disposition: "available",
              countedQuantity: 4
            }
          ]
        }
      });
      if (created.kind !== "succeeded") throw new Error("count-create-failed");
      await submitInventoryCycleCount({
        payload,
        req: adminReq(maker),
        commandKey: commandKey("pr5-count-stale-submit"),
        input: { countId: created.resourceId }
      });
      await seedAvailable(fixture, 1);
      await expect(
        applyInventoryCycleCount({
          payload,
          req: adminReq(checker),
          commandKey: commandKey("pr5-count-stale-apply"),
          input: { countId: created.resourceId }
        })
      ).rejects.toThrow("inventory-cycle-count-snapshot-stale");
      await expect(
        findDoc("inventory-cycle-counts", created.resourceId)
      ).resolves.toMatchObject({
        status: "submitted"
      });
      expect(await quantity(fixture, "available")).toBe(5);
      expect(
        (
          await findDocs("inventory-movements", {
            cycle_count: { equals: created.resourceId }
          })
        ).docs
      ).toHaveLength(0);
    });

    it("does not let overrideAccess bypass operation write protection", async () => {
      const fixture = await createFixture();
      await expect(
        payload.create({
          collection: "inventory-receipts" as never,
          overrideAccess: true,
          data: { location: fixture.locationId, status: "draft" } as never
        })
      ).rejects.toThrow("inventory-operation-write-forbidden");
      await expect(
        payload.create({
          collection: "inventory-lots" as never,
          overrideAccess: true,
          data: {
            operation_key: commandKey("pr5-direct-lot"),
            receipt_line: randomUUID(),
            received_quantity: 1,
            received_at: new Date().toISOString(),
            actor: maker.id
          } as never
        })
      ).rejects.toThrow("inventory-operation-write-forbidden");
    });

    const authorizeRequests = (requests: InventoryMovementRequest[]) =>
      requests.map((request) => ({ ...request, actorId: String(maker.id) }));
    const transactionReq = (
      batchPayload: Payload,
      transactionID: string | number
    ) =>
      ({
        ...adminReq(maker),
        payload: batchPayload,
        transactionID
      }) as InventoryTransactionRequest;

    async function runBatch(requests: InventoryMovementRequest[]) {
      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("batch-transaction-failed");
      try {
        const result = await recordInventoryMovementsInTransaction({
          payload,
          req: transactionReq(payload, transactionID),
          requests: authorizeRequests(requests)
        });
        await payload.db.commitTransaction(transactionID);
        return result;
      } catch (error) {
        try {
          await payload.db.rollbackTransaction(transactionID);
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "batch-rollback-failed"
          );
        }
        throw error;
      }
    }

    const transfer = (
      fixture: Fixture,
      fromLocationId: string,
      toLocationId: string,
      amount: number,
      label: string
    ): InventoryMovementRequest => ({
      idempotencyKey: commandKey(label),
      skuId: fixture.skuId,
      kind: "transfer",
      quantity: amount,
      from: { locationId: fromLocationId, disposition: "available" },
      to: { locationId: toLocationId, disposition: "available" },
      reasonCode: "batch-scenario",
      sourceType: "inventory_command"
    });

    it("completes reversed overlapping batches without a deadlock", async () => {
      const fixture = await createFixture();
      const secondLocationId = await createLocation("PR5-BATCH");
      await seedAvailable(fixture, 10);
      await seedAvailable({ ...fixture, locationId: secondLocationId }, 10);
      const first = [
        transfer(
          fixture,
          fixture.locationId,
          secondLocationId,
          3,
          "pr5-batch-a1"
        ),
        transfer(
          fixture,
          secondLocationId,
          fixture.locationId,
          2,
          "pr5-batch-a2"
        )
      ];
      const second = [
        transfer(
          fixture,
          secondLocationId,
          fixture.locationId,
          2,
          "pr5-batch-b2"
        ),
        transfer(
          fixture,
          fixture.locationId,
          secondLocationId,
          3,
          "pr5-batch-b1"
        )
      ];
      const results = await Promise.all([runBatch(first), runBatch(second)]);
      expect(
        results.flatMap((result) => result.results).map((result) => result.kind)
      ).toEqual(["created", "created", "created", "created"]);
      const firstQuantity = await quantity(fixture, "available");
      const secondQuantity = await quantity(
        { skuId: fixture.skuId, locationId: secondLocationId },
        "available"
      );
      expect([firstQuantity, secondQuantity]).toEqual([8, 12]);
    }, 10_000);

    it("leaves caller rollback in control after an injected projection failure", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 2);
      const request: InventoryMovementRequest = {
        idempotencyKey: commandKey("pr5-batch-rollback"),
        skuId: fixture.skuId,
        kind: "transfer",
        quantity: 1,
        from: { locationId: fixture.locationId, disposition: "available" },
        to: { locationId: fixture.locationId, disposition: "damaged" },
        reasonCode: "rollback-scenario",
        sourceType: "inventory_command"
      };
      const failingPayload = new Proxy(payload, {
        get(target, property) {
          if (property === "update") {
            return async (args: Parameters<Payload["update"]>[0]) => {
              if (args.collection === "inventory-levels") {
                throw new Error("injected-projection-failure");
              }
              return target.update(args);
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        }
      });
      const transactionID = await failingPayload.db.beginTransaction();
      if (!transactionID) throw new Error("batch-transaction-failed");
      try {
        await expect(
          recordInventoryMovementsInTransaction({
            payload: failingPayload,
            req: transactionReq(failingPayload, transactionID),
            requests: authorizeRequests([request])
          })
        ).rejects.toThrow("injected-projection-failure");
      } finally {
        await failingPayload.db.rollbackTransaction(transactionID);
      }
      expect(await quantity(fixture, "available")).toBe(2);
      const movements = await findDocs("inventory-movements", {
        idempotency_key: { equals: request.idempotencyKey }
      });
      expect(movements.docs).toHaveLength(0);
    });

    it("returns a replay beside a new movement on the same aggregate", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 5);
      const replayed: InventoryMovementRequest = {
        idempotencyKey: commandKey("pr5-batch-replay"),
        skuId: fixture.skuId,
        kind: "outbound",
        quantity: 2,
        from: { locationId: fixture.locationId, disposition: "available" },
        reasonCode: "batch-replay",
        sourceType: "inventory_command"
      };
      await runBatch([replayed]);
      const created = {
        ...replayed,
        idempotencyKey: commandKey("pr5-batch-new"),
        quantity: 3
      };
      const result = await runBatch([replayed, created]);
      expect(result.results.map((entry) => entry.kind)).toEqual([
        "replay",
        "created"
      ]);
      expect(await quantity(fixture, "available")).toBe(0);
    });
  }
);
