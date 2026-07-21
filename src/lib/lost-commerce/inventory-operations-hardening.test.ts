import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adjustInventory,
  cancelInventoryReceipt,
  createInventoryReceipt,
  receiveInventoryReceipt,
  releaseInventoryLot
} from "./inventory-operations";
import {
  assertInventoryWorkflowAuthorization,
  executeClaimedInventoryOperation
} from "./inventory-operation-runtime";

const tracked = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  lock: vi.fn(),
  movements: vi.fn()
}));

vi.mock("./commerce-commands", () => ({
  claimCommerceCommand: tracked.claim,
  completeCommerceCommand: tracked.complete,
  validateCommerceCommandKey: (value: unknown) => value
}));

vi.mock("@/lib/db/sequences", () => ({
  commerceCommandLock: tracked.lock,
  inventoryAggregateLock: vi.fn()
}));

vi.mock("./inventory-ledger", () => ({
  recordInventoryMovementsInTransaction: tracked.movements
}));

const NOW = new Date("2026-07-22T09:30:00.000Z");
const adminReq = {
  user: { id: "admin-1", role: "admin" },
  context: {}
} as unknown as PayloadRequest;

type Doc = Record<string, any>;

function makePayload(input?: {
  byId?: Record<string, Doc>;
  finds?: Record<string, Doc[]>;
}) {
  let id = 0;
  const byId = input?.byId ?? {};
  const finds = input?.finds ?? {};
  return {
    db: {
      beginTransaction: vi.fn(async () => "tx-operation"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    },
    findByID: vi.fn(async ({ collection, id: docId }) => {
      const doc = byId[`${collection}:${docId}`];
      if (!doc) throw new Error(`missing:${collection}:${docId}`);
      return doc;
    }),
    find: vi.fn(async ({ collection }) => ({ docs: finds[collection] ?? [] })),
    create: vi.fn(async ({ collection, data }) => ({
      id: `${collection}-${++id}`,
      ...data
    })),
    update: vi.fn(async ({ id: docId, data }) => ({ id: docId, ...data }))
  } as any;
}

function common(payload: any, commandKey: string) {
  return {
    payload,
    req: adminReq,
    commandKey,
    clock: () => NOW
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tracked.claim.mockResolvedValue({
    kind: "claimed",
    businessKey: "inventory-operation-1",
    requestHash: "a".repeat(64),
    leaseToken: "lease-token-1",
    leaseExpiresAt: "2026-07-22T09:31:00.000Z"
  });
  tracked.complete.mockResolvedValue({ businessKey: "inventory-operation-1" });
  tracked.movements.mockResolvedValue({ results: [], projections: [] });
});

describe("inventory operation hardening", () => {
  it("scopes workflow authorization to the authenticated operation callback", async () => {
    const payload = makePayload();
    let captured: unknown;

    await executeClaimedInventoryOperation(
      common(payload, "authorization-scope1"),
      "authorization-test",
      {},
      async ({ authorization, actorId }) => {
        captured = authorization;
        expect(() =>
          assertInventoryWorkflowAuthorization(authorization, actorId)
        ).not.toThrow();
        expect(() =>
          assertInventoryWorkflowAuthorization(authorization, "admin-2")
        ).toThrow("inventory-workflow-authorization-required");
        return {
          resourceId: "resource-1",
          resourceType: "inventory-test",
          status: "applied"
        };
      }
    );

    expect(() =>
      assertInventoryWorkflowAuthorization(captured, "admin-1")
    ).toThrow("inventory-workflow-authorization-required");
  });

  it("bounds receipt line count and optional text before claiming", async () => {
    const payload = makePayload();
    const tooManyLines = Array.from({ length: 501 }, (_, index) => ({
      skuId: `sku-${index}`
    }));

    await expect(
      createInventoryReceipt({
        ...common(payload, "receipt-bounds-0001"),
        input: { locationId: "location-1", lines: tooManyLines }
      })
    ).rejects.toThrow("inventory-receipt-lines-limit-exceeded");
    await expect(
      createInventoryReceipt({
        ...common(payload, "receipt-bounds-0002"),
        input: {
          locationId: "location-1",
          supplierName: "x".repeat(201),
          lines: [{ skuId: "sku-1" }]
        }
      })
    ).rejects.toThrow("invalid-inventory-receipt-supplier");
    expect(tracked.claim).not.toHaveBeenCalled();
  });

  it.each(["draft", "open"])("cancels a %s receipt", async (status) => {
    const payload = makePayload({
      byId: { "inventory-receipts:receipt-1": { id: "receipt-1", status } }
    });

    await cancelInventoryReceipt({
      ...common(payload, `receipt-cancel-${status}-1`),
      input: { receiptId: "receipt-1" }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "cancelled",
          cancelled_at: NOW.toISOString(),
          cancelled_by: "admin-1"
        }
      })
    );
  });

  it("does not cancel a closed receipt", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": { id: "receipt-1", status: "closed" }
      }
    });
    await expect(
      cancelInventoryReceipt({
        ...common(payload, "receipt-cancel-closed-1"),
        input: { receiptId: "receipt-1" }
      })
    ).rejects.toThrow("inventory-receipt-cancel-invalid-status");
  });

  it("does not cancel an open receipt after stock was received", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": { id: "receipt-1", status: "open" }
      },
      finds: { "inventory-movements": [{ id: "movement-1" }] }
    });
    await expect(
      cancelInventoryReceipt({
        ...common(payload, "receipt-cancel-received1"),
        input: { receiptId: "receipt-1" }
      })
    ).rejects.toThrow("inventory-receipt-cancel-has-receipts");
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("reports a partial release and passes workflow authorization", async () => {
    const payload = makePayload({
      byId: {
        "inventory-lots:lot-1": {
          id: "lot-1",
          receipt_line: "line-1",
          received_quantity: 5
        },
        "inventory-receipt-lines:line-1": {
          id: "line-1",
          receipt: "receipt-1",
          sku: "sku-1"
        },
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          location: "location-1"
        }
      },
      finds: { "inventory-movements": [] }
    });

    await expect(
      releaseInventoryLot({
        ...common(payload, "lot-release-partial1"),
        input: { lotId: "lot-1", quantity: 2 }
      })
    ).resolves.toMatchObject({ status: "partially-released" });
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        authorization: expect.any(Object),
        requests: [expect.objectContaining({ actorId: "admin-1" })]
      })
    );
  });

  it("bounds external lot codes before claiming", async () => {
    const payload = makePayload();
    await expect(
      receiveInventoryReceipt({
        ...common(payload, "receipt-lot-code-1"),
        input: {
          receiptId: "receipt-1",
          receiptLineId: "line-1",
          quantity: 1,
          externalLotCode: "x".repeat(201)
        }
      })
    ).rejects.toThrow("invalid-inventory-lot-code");
    expect(tracked.claim).not.toHaveBeenCalled();
  });

  it("rejects adjustment-based quarantine release before claiming", async () => {
    const payload = makePayload();
    await expect(
      adjustInventory({
        ...common(payload, "adjustment-release1"),
        input: {
          skuId: "sku-1",
          kind: "transfer",
          quantity: 1,
          from: { locationId: "location-1", disposition: "quarantine" },
          to: { locationId: "location-1", disposition: "available" },
          reasonCode: "manual-release"
        }
      })
    ).rejects.toThrow("inventory-lot-release-workflow-required");
    expect(tracked.claim).not.toHaveBeenCalled();
  });
});
