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
  cancelInventoryCycleCount,
  cancelInventoryReceipt,
  createInventoryCycleCount,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  rejectInventoryCycleCount,
  releaseInventoryLot,
  submitInventoryCycleCount
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
describeWithPostgres.sequential(
  "PR5 inventory terminal service scenarios with PostgreSQL",
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
          secret: "commerce-pr5-terminal-scenario-secret",
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

    async function findDoc(collection: string, id: string): Promise<TestDoc> {
      return payload.findByID({
        collection: collection as never,
        id,
        depth: 0,
        overrideAccess: true
      } as never) as unknown as Promise<TestDoc>;
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

    it("cancels draft and open receipts with terminal actor and timestamp evidence", async () => {
      const fixture = await createFixture();
      const draft = await createReceipt(fixture);
      const draftKey = commandKey("pr5-service-cancel-draft");
      const draftTime = "2026-07-22T03:00:00.000Z";
      await cancelInventoryReceipt({
        payload,
        req: reqFor(checker),
        commandKey: draftKey,
        clock: clock(draftTime),
        input: { receiptId: draft.receiptId }
      });
      await expect(
        findDoc("inventory-receipts", draft.receiptId)
      ).resolves.toMatchObject({
        status: "cancelled",
        cancelled_at: draftTime,
        cancelled_by: checker.id,
        opened_at: null,
        closed_at: null
      });
      await expectSucceededCommand(
        draftKey,
        "inventory-receipt",
        draft.receiptId,
        draftTime
      );

      const opened = await createReceipt(fixture, { open: true });
      const openKey = commandKey("pr5-service-cancel-open");
      const openTime = "2026-07-22T03:01:00.000Z";
      await cancelInventoryReceipt({
        payload,
        req: reqFor(checker),
        commandKey: openKey,
        clock: clock(openTime),
        input: { receiptId: opened.receiptId }
      });
      await expect(
        findDoc("inventory-receipts", opened.receiptId)
      ).resolves.toMatchObject({
        status: "cancelled",
        opened_at: expect.any(String),
        opened_by: maker.id,
        cancelled_at: openTime,
        cancelled_by: checker.id,
        closed_at: null
      });
      expect(
        await findDocs("inventory-movements", {
          receipt: { in: [draft.receiptId, opened.receiptId] }
        })
      ).toHaveLength(0);
      expect(
        await findDocs("inventory-lots", {
          receipt_line: { in: [draft.lineId, opened.lineId] }
        })
      ).toHaveLength(0);
      expect(
        await projection(fixture.skuId, fixture.locationId, "quarantine")
      ).toEqual({ quantity: 0, movementCount: 0 });
    }, 20_000);

    it("serializes cancel against receive without partial lot or projection evidence", async () => {
      const fixture = await createFixture();
      const receipt = await createReceipt(fixture, { open: true });
      const cancelKey = commandKey("pr5-service-cancel-race");
      const receiveKey = commandKey("pr5-service-receive-race");
      const cancelTime = "2026-07-22T04:00:00.000Z";
      const receiveTime = "2026-07-22T04:00:01.000Z";
      const outcomes = await Promise.allSettled([
        cancelInventoryReceipt({
          payload,
          req: reqFor(checker),
          commandKey: cancelKey,
          clock: clock(cancelTime),
          input: { receiptId: receipt.receiptId }
        }),
        receiveInventoryReceipt({
          payload,
          req: reqFor(maker),
          commandKey: receiveKey,
          clock: clock(receiveTime),
          input: {
            receiptId: receipt.receiptId,
            receiptLineId: receipt.lineId,
            quantity: 3
          }
        })
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === "fulfilled")
      ).toHaveLength(1);
      expect(
        outcomes.filter((outcome) => outcome.status === "rejected")
      ).toHaveLength(1);

      const stored = await findDoc("inventory-receipts", receipt.receiptId);
      const lots = await findDocs("inventory-lots", {
        receipt_line: { equals: receipt.lineId }
      });
      const movements = await findDocs("inventory-movements", {
        receipt: { equals: receipt.receiptId }
      });
      if (outcomes[0].status === "fulfilled") {
        expect(stored).toMatchObject({
          status: "cancelled",
          cancelled_at: cancelTime,
          cancelled_by: checker.id
        });
        expect(lots).toHaveLength(0);
        expect(movements).toHaveLength(0);
        expect(
          await projection(fixture.skuId, fixture.locationId, "quarantine")
        ).toEqual({ quantity: 0, movementCount: 0 });
        await expectSucceededCommand(
          cancelKey,
          "inventory-receipt",
          receipt.receiptId,
          cancelTime
        );
        await expect(command(receiveKey)).resolves.toMatchObject({
          status: "in_progress",
          completed_at: null
        });
      } else {
        expect(stored).toMatchObject({ status: "open", cancelled_at: null });
        expect(lots).toEqual([
          expect.objectContaining({
            received_quantity: 3,
            received_at: receiveTime,
            actor: maker.id
          })
        ]);
        expect(movements).toEqual([
          expect.objectContaining({
            quantity: 3,
            actor: maker.id,
            effective_at: receiveTime,
            lot: lots[0]?.id
          })
        ]);
        expect(
          await projection(fixture.skuId, fixture.locationId, "quarantine")
        ).toEqual({ quantity: 3, movementCount: 1 });
        await expect(command(cancelKey)).resolves.toMatchObject({
          status: "in_progress",
          completed_at: null
        });
        await expect(command(receiveKey)).resolves.toMatchObject({
          status: "succeeded",
          resource_type: "inventory-lot",
          resource_id: lots[0]?.id,
          completed_at: receiveTime
        });
      }
    }, 20_000);

    async function createCount(
      fixture: Fixture,
      countedQuantity: number,
      options: { submit?: boolean } = {}
    ): Promise<string> {
      const created = await createInventoryCycleCount({
        payload,
        req: reqFor(maker),
        commandKey: commandKey("pr5-service-count-create"),
        input: {
          locationId: fixture.locationId,
          lines: [
            {
              skuId: fixture.skuId,
              disposition: "available",
              countedQuantity
            }
          ]
        }
      });
      if (created.kind !== "succeeded") throw new Error("count-create-failed");
      if (options.submit) {
        await submitInventoryCycleCount({
          payload,
          req: reqFor(maker),
          commandKey: commandKey("pr5-service-count-submit"),
          input: { countId: created.resourceId }
        });
      }
      return created.resourceId;
    }

    it("cancels draft counts and rejects submitted counts without ledger side effects", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 2);
      const draftId = await createCount(fixture, 2);
      const cancelKey = commandKey("pr5-service-count-cancel");
      const cancelTime = "2026-07-22T05:00:00.000Z";
      await cancelInventoryCycleCount({
        payload,
        req: reqFor(checker),
        commandKey: cancelKey,
        clock: clock(cancelTime),
        input: { countId: draftId }
      });
      await expect(
        findDoc("inventory-cycle-counts", draftId)
      ).resolves.toMatchObject({
        status: "cancelled",
        cancelled_at: cancelTime,
        cancelled_by: checker.id,
        submitted_at: null,
        applied_at: null
      });

      const submittedId = await createCount(fixture, 3, { submit: true });
      const rejectKey = commandKey("pr5-service-count-reject");
      const rejectTime = "2026-07-22T05:01:00.000Z";
      await rejectInventoryCycleCount({
        payload,
        req: reqFor(checker),
        commandKey: rejectKey,
        clock: clock(rejectTime),
        input: { countId: submittedId }
      });
      await expect(
        findDoc("inventory-cycle-counts", submittedId)
      ).resolves.toMatchObject({
        status: "rejected",
        submitted_at: expect.any(String),
        submitted_by: maker.id,
        rejected_at: rejectTime,
        rejected_by: checker.id,
        applied_at: null
      });
      expect(
        await findDocs("inventory-movements", {
          cycle_count: { in: [draftId, submittedId] }
        })
      ).toHaveLength(0);
      expect(
        await projection(fixture.skuId, fixture.locationId, "available")
      ).toEqual({ quantity: 2, movementCount: 1 });
      await Promise.all([
        expectSucceededCommand(
          cancelKey,
          "inventory-cycle-count",
          draftId,
          cancelTime
        ),
        expectSucceededCommand(
          rejectKey,
          "inventory-cycle-count",
          submittedId,
          rejectTime
        )
      ]);
    }, 20_000);

    it("serializes reject against apply with one coherent terminal outcome", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 1);
      const countId = await createCount(fixture, 2, { submit: true });
      const rejectKey = commandKey("pr5-service-reject-race");
      const applyKey = commandKey("pr5-service-apply-race");
      const rejectTime = "2026-07-22T06:00:00.000Z";
      const applyTime = "2026-07-22T06:00:01.000Z";
      const outcomes = await Promise.allSettled([
        rejectInventoryCycleCount({
          payload,
          req: reqFor(maker),
          commandKey: rejectKey,
          clock: clock(rejectTime),
          input: { countId }
        }),
        applyInventoryCycleCount({
          payload,
          req: reqFor(checker),
          commandKey: applyKey,
          clock: clock(applyTime),
          input: { countId }
        })
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === "fulfilled")
      ).toHaveLength(1);
      expect(
        outcomes.filter((outcome) => outcome.status === "rejected")
      ).toHaveLength(1);

      const stored = await findDoc("inventory-cycle-counts", countId);
      const movements = await findDocs("inventory-movements", {
        cycle_count: { equals: countId }
      });
      if (outcomes[0].status === "fulfilled") {
        expect(stored).toMatchObject({
          status: "rejected",
          rejected_at: rejectTime,
          rejected_by: maker.id,
          applied_at: null
        });
        expect(movements).toHaveLength(0);
        expect(
          await projection(fixture.skuId, fixture.locationId, "available")
        ).toEqual({ quantity: 1, movementCount: 1 });
        await expectSucceededCommand(
          rejectKey,
          "inventory-cycle-count",
          countId,
          rejectTime
        );
        await expect(command(applyKey)).resolves.toMatchObject({
          status: "in_progress",
          completed_at: null
        });
      } else {
        expect(stored).toMatchObject({
          status: "applied",
          applied_at: applyTime,
          applied_by: checker.id,
          rejected_at: null
        });
        expect(movements).toEqual([
          expect.objectContaining({
            kind: "inbound",
            quantity: 1,
            actor: checker.id,
            effective_at: applyTime,
            cycle_count: countId,
            cycle_count_line: expect.any(String)
          })
        ]);
        expect(
          await projection(fixture.skuId, fixture.locationId, "available")
        ).toEqual({ quantity: 2, movementCount: 2 });
        await expect(command(rejectKey)).resolves.toMatchObject({
          status: "in_progress",
          completed_at: null
        });
        await expectSucceededCommand(
          applyKey,
          "inventory-cycle-count",
          countId,
          applyTime
        );
      }
    }, 20_000);

    it("serializes two apply command keys and applies count evidence exactly once", async () => {
      const fixture = await createFixture();
      await seedAvailable(fixture, 4);
      const countId = await createCount(fixture, 1, { submit: true });
      const firstKey = commandKey("pr5-service-two-key-apply-a");
      const secondKey = commandKey("pr5-service-two-key-apply-b");
      const firstTime = "2026-07-22T07:00:00.000Z";
      const secondTime = "2026-07-22T07:00:01.000Z";
      const outcomes = await Promise.allSettled([
        applyInventoryCycleCount({
          payload,
          req: reqFor(maker),
          commandKey: firstKey,
          clock: clock(firstTime),
          input: { countId }
        }),
        applyInventoryCycleCount({
          payload,
          req: reqFor(checker),
          commandKey: secondKey,
          clock: clock(secondTime),
          input: { countId }
        })
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === "fulfilled")
      ).toHaveLength(1);
      expect(
        outcomes.filter((outcome) => outcome.status === "rejected")
      ).toHaveLength(1);

      const firstWon = outcomes[0].status === "fulfilled";
      const winner = firstWon
        ? { key: firstKey, actor: maker, time: firstTime }
        : { key: secondKey, actor: checker, time: secondTime };
      const loserKey = firstWon ? secondKey : firstKey;
      await expect(
        findDoc("inventory-cycle-counts", countId)
      ).resolves.toMatchObject({
        status: "applied",
        applied_at: winner.time,
        applied_by: winner.actor.id,
        rejected_at: null
      });
      expect(
        await findDocs("inventory-movements", {
          cycle_count: { equals: countId }
        })
      ).toEqual([
        expect.objectContaining({
          kind: "outbound",
          quantity: 3,
          actor: winner.actor.id,
          effective_at: winner.time,
          cycle_count: countId,
          cycle_count_line: expect.any(String)
        })
      ]);
      expect(
        await projection(fixture.skuId, fixture.locationId, "available")
      ).toEqual({ quantity: 1, movementCount: 2 });
      await expectSucceededCommand(
        winner.key,
        "inventory-cycle-count",
        countId,
        winner.time
      );
      await expect(command(loserKey)).resolves.toMatchObject({
        status: "in_progress",
        completed_at: null,
        safe_response: null
      });
    }, 20_000);
  }
);
