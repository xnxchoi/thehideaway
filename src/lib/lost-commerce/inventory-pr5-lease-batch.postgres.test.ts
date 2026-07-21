import { randomUUID } from "node:crypto";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  buildConfig,
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
  completeCommerceCommand,
  type CommerceCommandClaim
} from "./commerce-commands";
import {
  executeClaimedInventoryOperation,
  MAX_INVENTORY_OPERATION_LINES
} from "./inventory-operation-runtime";
import {
  applyInventoryCycleCount,
  createInventoryCycleCount,
  createInventoryReceipt,
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

type TestDoc = Record<string, unknown> & { id: string };
type ClaimedCommand = Extract<CommerceCommandClaim, { kind: "claimed" }>;

describeWithPostgres.sequential(
  "PR5 inventory lease recovery and maximum batches with PostgreSQL",
  () => {
    let payload: Payload;
    let adminRequest: PayloadRequest;
    let checkerRequest: PayloadRequest;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      payload = await getPayload({
        config: buildConfig({
          secret: "commerce-pr5-lease-batch-postgres-secret",
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
      const [actor, checker] = await Promise.all([
        createDoc("users", {
          name: `PR5 lease and batch admin ${randomUUID()}`,
          role: "admin"
        }),
        createDoc("users", {
          name: `PR5 lease and batch checker ${randomUUID()}`,
          role: "admin"
        })
      ]);
      adminRequest = {
        payload,
        context: {},
        user: { ...actor, role: "admin" }
      } as unknown as PayloadRequest;
      checkerRequest = {
        payload,
        context: {},
        user: { ...checker, role: "admin" }
      } as unknown as PayloadRequest;
    }, 60_000);

    afterAll(async () => {
      await payload?.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    });

    async function createDoc(
      collection: "products" | "users" | "product-variants" | "stock-locations",
      data: Record<string, unknown>
    ): Promise<TestDoc> {
      return payload.create({
        collection,
        data,
        overrideAccess: true
      } as never) as unknown as Promise<TestDoc>;
    }

    async function createLocation(label: string): Promise<string> {
      const suffix = randomUUID();
      const location = await createDoc("stock-locations", {
        code: `${label}-${suffix}`.toUpperCase(),
        name: `${label} ${suffix}`,
        active: true
      });
      return location.id;
    }

    async function createSku(label: string, index: number): Promise<string> {
      const suffix = randomUUID();
      const product = await createDoc("products", {
        name: `${label} ${index} ${suffix}`,
        slug: `${label.toLowerCase()}-${index}-${suffix}`,
        currency: "KRW",
        unit_amount: index + 1
      });
      const sku = await createDoc("product-variants", {
        product: product.id,
        active: true,
        sku: `${label}-${index}-${suffix}`.toUpperCase(),
        options: []
      });
      return sku.id;
    }

    function createSkus(label: string, count: number): Promise<string[]> {
      return Array.from({ length: count }, (_, index) => index).reduce(
        async (skuIdsPromise, index) => [
          ...(await skuIdsPromise),
          await createSku(label, index)
        ],
        Promise.resolve<string[]>([])
      );
    }

    function findDocs(collection: string, where: Record<string, unknown>) {
      return payload.find({
        collection: collection as never,
        depth: 0,
        overrideAccess: true,
        pagination: false,
        where
      } as never) as unknown as Promise<{ docs: TestDoc[] }>;
    }

    async function findCommand(commandKey: string): Promise<TestDoc> {
      const commands = await findDocs("commerce-commands", {
        command_key: { equals: commandKey }
      });
      expect(commands.docs).toHaveLength(1);
      return commands.docs[0]!;
    }

    function findDoc(collection: string, id: string): Promise<TestDoc> {
      return payload.findByID({
        collection: collection as never,
        id,
        depth: 0,
        overrideAccess: true
      } as never) as unknown as Promise<TestDoc>;
    }

    it("keeps a failed operation claimed and fences its lease after one post-expiry retry wins", async () => {
      const locationId = await createLocation("LEASE");
      const skuId = await createSku("LEASE", 0);
      const commandKey = `lease-recovery-${randomUUID()}`;
      const externalReference = `lease-ref-${randomUUID()}`;
      const input = {
        locationId,
        externalReference,
        lines: [{ skuId, expectedQuantity: 7 }]
      };
      const validatedInput = {
        locationId,
        supplierName: null,
        externalReference,
        lines: [{ skuId, expectedQuantity: 7 }]
      };
      const claimTime = new Date("2026-07-22T00:00:00.000Z");
      const immediateRetryTime = new Date("2026-07-22T00:00:01.000Z");
      const retryTime = new Date("2026-07-22T00:05:01.000Z");
      let failedClaim: ClaimedCommand | undefined;

      await expect(
        executeClaimedInventoryOperation(
          {
            payload,
            req: adminRequest,
            commandKey,
            clock: () => claimTime
          },
          "receipt-create",
          validatedInput,
          async ({ req, claim }) => {
            failedClaim = claim;
            await payload.create({
              collection: "inventory-receipts",
              overrideAccess: true,
              req,
              data: {
                location: locationId,
                status: "draft",
                external_reference: externalReference
              }
            });
            throw new Error("injected-inventory-operation-failure");
          }
        )
      ).rejects.toThrow("injected-inventory-operation-failure");
      if (!failedClaim) throw new Error("failed-operation-claim-not-captured");

      expect(await findCommand(commandKey)).toMatchObject({
        status: "in_progress",
        attempt_count: 1,
        safe_response: null
      });
      const rolledBackReceipts = await findDocs("inventory-receipts", {
        external_reference: { equals: externalReference }
      });
      expect(rolledBackReceipts.docs).toEqual([]);

      let immediateRetryExecuted = false;
      await expect(
        executeClaimedInventoryOperation(
          {
            payload,
            req: adminRequest,
            commandKey,
            clock: () => immediateRetryTime
          },
          "receipt-create",
          validatedInput,
          async () => {
            immediateRetryExecuted = true;
            throw new Error("active-lease-executed");
          }
        )
      ).resolves.toMatchObject({ kind: "in_progress", retryAfterMs: 299_000 });
      expect(immediateRetryExecuted).toBe(false);

      let releaseWinner: (() => void) | undefined;
      let markWinnerStarted: (() => void) | undefined;
      let retryExecutionCount = 0;
      const winnerGate = new Promise<void>((resolve) => {
        releaseWinner = resolve;
      });
      const winnerStarted = new Promise<void>((resolve) => {
        markWinnerStarted = resolve;
      });
      const retryOperation = () =>
        executeClaimedInventoryOperation(
          {
            payload,
            req: adminRequest,
            commandKey,
            clock: () => retryTime
          },
          "receipt-create",
          validatedInput,
          async ({ req }) => {
            retryExecutionCount += 1;
            markWinnerStarted?.();
            await winnerGate;
            const receipt = await payload.create({
              collection: "inventory-receipts",
              overrideAccess: true,
              req,
              data: {
                location: locationId,
                status: "draft",
                external_reference: externalReference
              }
            });
            const receiptId = String(receipt.id);
            await payload.create({
              collection: "inventory-receipt-lines",
              overrideAccess: true,
              req,
              data: {
                receipt: receiptId,
                sku: skuId,
                expected_quantity: 7,
                receipt_sku_key: `${receiptId}:${skuId}`
              }
            });
            return {
              resourceId: receiptId,
              resourceType: "inventory-receipt",
              status: "draft"
            };
          }
        );
      const retryPromises = [retryOperation(), retryOperation()];

      try {
        await winnerStarted;
        expect(retryExecutionCount).toBe(1);
        const staleCompletionTransaction = await payload.db.beginTransaction();
        if (!staleCompletionTransaction) throw new Error("transaction-failed");
        try {
          await expect(
            completeCommerceCommand({
              payload,
              req: {
                payload,
                transactionID: staleCompletionTransaction,
                context: {}
              } as PayloadRequest,
              commandKey,
              requestHash: failedClaim.requestHash,
              leaseToken: failedClaim.leaseToken,
              response: { resourceId: "stale", status: "draft" },
              resource: { type: "inventory-receipt", id: "stale" },
              now: retryTime
            })
          ).rejects.toThrow("commerce-command-lease-lost");
        } finally {
          await payload.db.rollbackTransaction(staleCompletionTransaction);
        }
      } finally {
        releaseWinner?.();
      }

      const retries = await Promise.all(retryPromises);
      expect(retries.map((result) => result.kind).sort()).toEqual([
        "in_progress",
        "succeeded"
      ]);
      expect(retryExecutionCount).toBe(1);

      const replay = await createInventoryReceipt({
        payload,
        req: adminRequest,
        commandKey,
        clock: () => retryTime,
        input
      });
      expect(replay).toMatchObject({ kind: "replay" });
      const receipts = await findDocs("inventory-receipts", {
        external_reference: { equals: externalReference }
      });
      expect(receipts.docs).toHaveLength(1);
      const receiptId = receipts.docs[0]!.id;
      const lines = await findDocs("inventory-receipt-lines", {
        receipt: { equals: receiptId }
      });
      expect(lines.docs).toEqual([
        expect.objectContaining({
          receipt: receiptId,
          sku: skuId,
          expected_quantity: 7
        })
      ]);
      expect(await findCommand(commandKey)).toMatchObject({
        status: "succeeded",
        attempt_count: 2,
        lease_token_hash: null,
        lease_expires_at: null,
        resource_type: "inventory-receipt",
        resource_id: receiptId,
        safe_response: { resourceId: receiptId, status: "draft" },
        completed_at: expect.any(String)
      });
    });

    it("completes 50-line receipt and count commands with exact unique evidence", async () => {
      const locationId = await createLocation("BATCH");
      const skuIds = await createSkus("BATCH", MAX_INVENTORY_OPERATION_LINES);
      const receiptCommandKey = `batch-receipt-${randomUUID()}`;
      const receipt = await createInventoryReceipt({
        payload,
        req: adminRequest,
        commandKey: receiptCommandKey,
        input: {
          locationId,
          lines: skuIds.map((skuId, index) => ({
            skuId,
            expectedQuantity: index + 1
          }))
        }
      });
      expect(receipt).toMatchObject({ kind: "succeeded", status: "draft" });
      if (receipt.kind !== "succeeded") {
        throw new Error("maximum-receipt-create-failed");
      }
      const receiptLines = await findDocs("inventory-receipt-lines", {
        receipt: { equals: receipt.resourceId }
      });
      expect(receiptLines.docs).toHaveLength(MAX_INVENTORY_OPERATION_LINES);
      expect(
        new Map(
          receiptLines.docs.map((line) => [
            String(line.sku),
            Number(line.expected_quantity)
          ])
        )
      ).toEqual(new Map(skuIds.map((skuId, index) => [skuId, index + 1])));

      const countCommandKey = `batch-count-${randomUUID()}`;
      const count = await createInventoryCycleCount({
        payload,
        req: adminRequest,
        commandKey: countCommandKey,
        input: {
          locationId,
          lines: skuIds.map((skuId, index) => ({
            skuId,
            disposition: "available",
            countedQuantity: index + 1
          }))
        }
      });
      expect(count).toMatchObject({ kind: "succeeded", status: "draft" });
      if (count.kind !== "succeeded") {
        throw new Error("maximum-cycle-count-create-failed");
      }
      const countLines = await findDocs("inventory-cycle-count-lines", {
        count: { equals: count.resourceId }
      });
      expect(countLines.docs).toHaveLength(MAX_INVENTORY_OPERATION_LINES);
      expect(
        new Set(countLines.docs.map((line) => line.count_aggregate_key)).size
      ).toBe(MAX_INVENTORY_OPERATION_LINES);
      expect(
        new Map(
          countLines.docs.map((line) => [
            `${line.sku}:${line.disposition}`,
            {
              counted: Number(line.counted_quantity),
              system: Number(line.system_quantity),
              movements: Number(line.movement_count_snapshot),
              variance: Number(line.variance)
            }
          ])
        )
      ).toEqual(
        new Map(
          skuIds.map((skuId, index) => [
            `${skuId}:available`,
            {
              counted: index + 1,
              system: 0,
              movements: 0,
              variance: index + 1
            }
          ])
        )
      );

      const submitCommandKey = `batch-count-submit-${randomUUID()}`;
      const applyCommandKey = `batch-count-apply-${randomUUID()}`;
      const submitTime = new Date("2026-07-22T05:00:00.000Z");
      const applyTime = new Date("2026-07-22T05:00:01.000Z");
      await expect(
        submitInventoryCycleCount({
          payload,
          req: adminRequest,
          commandKey: submitCommandKey,
          clock: () => submitTime,
          input: { countId: count.resourceId }
        })
      ).resolves.toMatchObject({ kind: "succeeded", status: "submitted" });
      await expect(
        applyInventoryCycleCount({
          payload,
          req: checkerRequest,
          commandKey: applyCommandKey,
          clock: () => applyTime,
          input: { countId: count.resourceId }
        })
      ).resolves.toMatchObject({ kind: "succeeded", status: "applied" });

      const appliedCount = await findDoc(
        "inventory-cycle-counts",
        count.resourceId
      );
      expect(appliedCount).toMatchObject({
        status: "applied",
        submitted_at: submitTime.toISOString(),
        submitted_by: adminRequest.user!.id,
        applied_at: applyTime.toISOString(),
        applied_by: checkerRequest.user!.id
      });

      const countLineBySku = new Map(
        countLines.docs.map((line) => [String(line.sku), line])
      );
      const movements = await findDocs("inventory-movements", {
        cycle_count: { equals: count.resourceId }
      });
      expect(movements.docs).toHaveLength(MAX_INVENTORY_OPERATION_LINES);
      expect(
        new Map(
          movements.docs.map((movement) => [
            String(movement.sku),
            {
              kind: movement.kind,
              quantity: Number(movement.quantity),
              toLocation: movement.to_location,
              toDisposition: movement.to_disposition,
              sourceType: movement.source_type,
              sourceRef: movement.source_ref,
              cycleCount: movement.cycle_count,
              cycleCountLine: movement.cycle_count_line,
              actor: movement.actor,
              effectiveAt: movement.effective_at
            }
          ])
        )
      ).toEqual(
        new Map(
          skuIds.map((skuId, index) => {
            const lineId = countLineBySku.get(skuId)?.id;
            if (!lineId) throw new Error("maximum-count-line-missing");
            return [
              skuId,
              {
                kind: "inbound",
                quantity: index + 1,
                toLocation: locationId,
                toDisposition: "available",
                sourceType: "inventory_cycle_count",
                sourceRef: lineId,
                cycleCount: count.resourceId,
                cycleCountLine: lineId,
                actor: checkerRequest.user!.id,
                effectiveAt: applyTime.toISOString()
              }
            ];
          })
        )
      );

      const projections = await findDocs("inventory-levels", {
        and: [
          { location: { equals: locationId } },
          { disposition: { equals: "available" } }
        ]
      });
      expect(projections.docs).toHaveLength(MAX_INVENTORY_OPERATION_LINES);
      expect(
        new Map(
          projections.docs.map((projection) => [
            String(projection.aggregate_key),
            {
              sku: projection.sku,
              location: projection.location,
              disposition: projection.disposition,
              quantity: Number(projection.quantity),
              movementCount: Number(projection.movement_count)
            }
          ])
        )
      ).toEqual(
        new Map(
          skuIds.map((skuId, index) => [
            `${skuId}:${locationId}:available`,
            {
              sku: skuId,
              location: locationId,
              disposition: "available",
              quantity: index + 1,
              movementCount: 1
            }
          ])
        )
      );

      expect(await findCommand(receiptCommandKey)).toMatchObject({
        status: "succeeded",
        attempt_count: 1,
        lease_token_hash: null,
        lease_expires_at: null,
        resource_type: "inventory-receipt",
        resource_id: receipt.resourceId,
        completed_at: expect.any(String)
      });
      expect(await findCommand(countCommandKey)).toMatchObject({
        status: "succeeded",
        attempt_count: 1,
        lease_token_hash: null,
        lease_expires_at: null,
        resource_type: "inventory-cycle-count",
        resource_id: count.resourceId,
        completed_at: expect.any(String)
      });
      expect(await findCommand(submitCommandKey)).toMatchObject({
        status: "succeeded",
        attempt_count: 1,
        lease_token_hash: null,
        lease_expires_at: null,
        resource_type: "inventory-cycle-count",
        resource_id: count.resourceId,
        safe_response: { resourceId: count.resourceId, status: "submitted" },
        completed_at: submitTime.toISOString()
      });
      expect(await findCommand(applyCommandKey)).toMatchObject({
        status: "succeeded",
        attempt_count: 1,
        lease_token_hash: null,
        lease_expires_at: null,
        resource_type: "inventory-cycle-count",
        resource_id: count.resourceId,
        safe_response: { resourceId: count.resourceId, status: "applied" },
        completed_at: applyTime.toISOString()
      });
    }, 60_000);

    it("rejects 51 receipt and count lines before command or evidence creation", async () => {
      const receiptLocationId = await createLocation("OVER-RECEIPT");
      const countLocationId = await createLocation("OVER-COUNT");
      const skuIds = await createSkus(
        "OVER",
        MAX_INVENTORY_OPERATION_LINES + 1
      );
      const receiptCommandKey = `over-receipt-${randomUUID()}`;
      const receiptReference = `over-receipt-ref-${randomUUID()}`;
      await expect(
        createInventoryReceipt({
          payload,
          req: adminRequest,
          commandKey: receiptCommandKey,
          input: {
            locationId: receiptLocationId,
            externalReference: receiptReference,
            lines: skuIds.map((skuId) => ({ skuId, expectedQuantity: 1 }))
          }
        })
      ).rejects.toThrow("inventory-receipt-lines-limit-exceeded");

      const countCommandKey = `over-count-${randomUUID()}`;
      await expect(
        createInventoryCycleCount({
          payload,
          req: adminRequest,
          commandKey: countCommandKey,
          input: {
            locationId: countLocationId,
            lines: skuIds.map((skuId) => ({
              skuId,
              disposition: "available",
              countedQuantity: 0
            }))
          }
        })
      ).rejects.toThrow("inventory-cycle-count-lines-limit-exceeded");

      const [receiptCommands, countCommands, receipts, counts] =
        await Promise.all([
          findDocs("commerce-commands", {
            command_key: { equals: receiptCommandKey }
          }),
          findDocs("commerce-commands", {
            command_key: { equals: countCommandKey }
          }),
          findDocs("inventory-receipts", {
            external_reference: { equals: receiptReference }
          }),
          findDocs("inventory-cycle-counts", {
            location: { equals: countLocationId }
          })
        ]);
      expect({
        receiptCommands: receiptCommands.docs,
        countCommands: countCommands.docs,
        receipts: receipts.docs,
        counts: counts.docs
      }).toEqual({
        receiptCommands: [],
        countCommands: [],
        receipts: [],
        counts: []
      });
    }, 60_000);
  }
);
