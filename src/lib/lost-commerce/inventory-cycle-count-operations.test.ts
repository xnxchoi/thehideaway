import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyInventoryCycleCount,
  cancelInventoryCycleCount,
  createInventoryCycleCount,
  rejectInventoryCycleCount,
  submitInventoryCycleCount
} from "./inventory-operations";

const tracked = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  lock: vi.fn(),
  aggregateLock: vi.fn(),
  movements: vi.fn()
}));

vi.mock("./commerce-commands", () => ({
  claimCommerceCommand: tracked.claim,
  completeCommerceCommand: tracked.complete,
  validateCommerceCommandKey: (value: unknown) => {
    if (typeof value !== "string" || value.length < 16) {
      throw new Error("invalid-commerce-command-key");
    }
    return value;
  }
}));

vi.mock("@/lib/db/sequences", () => ({
  commerceCommandLock: tracked.lock,
  inventoryAggregateLock: tracked.aggregateLock
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
    update: vi.fn(async ({ collection, id: docId, data }) => ({
      id: docId,
      collection,
      ...data
    }))
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

describe("cycle count lifecycle", () => {
  it("rejects duplicate SKU/disposition lines before a command is claimed", async () => {
    const payload = makePayload();
    await expect(
      createInventoryCycleCount({
        ...common(payload, "cycle-create-00000"),
        input: {
          locationId: "location-1",
          lines: [
            { skuId: "sku-1", disposition: "available", countedQuantity: 1 },
            { skuId: "sku-1", disposition: "available", countedQuantity: 2 }
          ]
        }
      })
    ).rejects.toThrow("inventory-cycle-count-duplicate-aggregate");
    expect(tracked.claim).not.toHaveBeenCalled();
  });

  it.each([
    [[], "inventory-cycle-count-lines-required"],
    [
      [{ skuId: "sku-1", disposition: "invalid", countedQuantity: 1 }],
      "invalid-inventory-disposition"
    ],
    [
      [{ skuId: "sku-1", disposition: "available", countedQuantity: -1 }],
      "invalid-inventory-operation-quantity"
    ]
  ])(
    "rejects invalid count evidence before command work",
    async (lines, errorCode) => {
      const payload = makePayload();
      await expect(
        createInventoryCycleCount({
          ...common(payload, "cycle-invalid-00001"),
          input: { locationId: "location-1", lines }
        })
      ).rejects.toThrow(errorCode);
      expect(tracked.claim).not.toHaveBeenCalled();
    }
  );

  it.each([
    [50, true],
    [51, false]
  ])(
    "enforces the fixed-lease count line bound at %i lines",
    async (lineCount, accepted) => {
      const payload = makePayload();
      if (accepted) {
        tracked.claim.mockResolvedValueOnce({ kind: "conflict" });
      }
      const operation = createInventoryCycleCount({
        ...common(payload, `cycle-lines-bound-${lineCount}`),
        input: {
          locationId: "location-1",
          lines: Array.from({ length: lineCount }, (_, index) => ({
            skuId: `sku-${index}`,
            disposition: "available",
            countedQuantity: 0
          }))
        }
      });

      if (accepted) {
        await expect(operation).resolves.toEqual({ kind: "conflict" });
        expect(tracked.claim).toHaveBeenCalledOnce();
      } else {
        await expect(operation).rejects.toThrow(
          "inventory-cycle-count-lines-limit-exceeded"
        );
        expect(tracked.claim).not.toHaveBeenCalled();
      }
    }
  );
  it("creates count evidence from an atomic projection snapshot", async () => {
    const payload = makePayload({
      finds: {
        "inventory-levels": [
          {
            aggregate_key: "sku-1:location-1:available",
            quantity: 7,
            movement_count: 4
          }
        ]
      }
    });

    await createInventoryCycleCount({
      ...common(payload, "cycle-create-00001"),
      input: {
        locationId: "location-1",
        lines: [
          { skuId: "sku-1", disposition: "available", countedQuantity: 5 }
        ]
      }
    });

    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "inventory-cycle-count-lines",
        data: expect.objectContaining({
          sku: "sku-1",
          disposition: "available",
          counted_quantity: 5,
          system_quantity: 7,
          movement_count_snapshot: 4,
          variance: -2,
          count_aggregate_key: expect.stringContaining(":sku-1:available")
        })
      })
    );
  });

  it("submits a draft and rejects a submitted count with immutable actor evidence", async () => {
    const submitPayload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": { id: "count-1", status: "draft" }
      }
    });
    await submitInventoryCycleCount({
      ...common(submitPayload, "cycle-submit-0001"),
      input: { countId: "count-1" }
    });
    expect(submitPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "submitted",
          submitted_at: NOW.toISOString(),
          submitted_by: "admin-1"
        }
      })
    );

    const rejectPayload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": { id: "count-1", status: "submitted" }
      }
    });
    await rejectInventoryCycleCount({
      ...common(rejectPayload, "cycle-reject-0001"),
      input: { countId: "count-1" }
    });
    expect(rejectPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "rejected",
          rejected_at: NOW.toISOString(),
          rejected_by: "admin-1"
        }
      })
    );
  });

  it("cancels only a draft count with immutable actor evidence", async () => {
    const payload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": { id: "count-1", status: "draft" }
      }
    });
    await cancelInventoryCycleCount({
      ...common(payload, "cycle-cancel-0001"),
      input: { countId: "count-1" }
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

    const submittedPayload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": {
          id: "count-1",
          status: "submitted"
        }
      }
    });
    await expect(
      cancelInventoryCycleCount({
        ...common(submittedPayload, "cycle-cancel-0002"),
        input: { countId: "count-1" }
      })
    ).rejects.toThrow("inventory-cycle-count-cancel-invalid-status");
  });

  it("applies positive and negative variance but emits no movement for no variance", async () => {
    const payload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": {
          id: "count-1",
          status: "submitted",
          location: { id: "location-1" },
          submitted_by: { id: "admin-2" }
        }
      },
      finds: {
        "inventory-cycle-count-lines": [
          {
            id: "line-plus",
            sku: { id: "sku-plus" },
            disposition: "available",
            system_quantity: 2,
            counted_quantity: 5,
            movement_count_snapshot: 4,
            variance: 3
          },
          {
            id: "line-minus",
            sku: "sku-minus",
            disposition: "quarantine",
            system_quantity: 6,
            counted_quantity: 4,
            movement_count_snapshot: 8,
            variance: -2
          },
          {
            id: "line-zero",
            sku: "sku-zero",
            disposition: "damaged",
            system_quantity: 1,
            counted_quantity: 1,
            movement_count_snapshot: 1,
            variance: 0
          }
        ],
        "inventory-levels": [
          {
            aggregate_key: "sku-plus:location-1:available",
            quantity: 2,
            movement_count: 4
          },
          {
            aggregate_key: "sku-minus:location-1:quarantine",
            quantity: 6,
            movement_count: 8
          },
          {
            aggregate_key: "sku-zero:location-1:damaged",
            quantity: 1,
            movement_count: 1
          }
        ]
      }
    });

    await applyInventoryCycleCount({
      ...common(payload, "cycle-apply-00001"),
      input: { countId: "count-1" }
    });

    const requests = tracked.movements.mock.calls[0]?.[0].requests;
    expect(requests).toHaveLength(2);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skuId: "sku-plus",
          kind: "inbound",
          quantity: 3,
          to: { locationId: "location-1", disposition: "available" },
          sourceRef: "line-plus",
          cycleCountId: "count-1",
          cycleCountLineId: "line-plus",
          reasonCode: "cycle-count-variance"
        }),
        expect.objectContaining({
          skuId: "sku-minus",
          kind: "outbound",
          quantity: 2,
          from: { locationId: "location-1", disposition: "quarantine" },
          sourceRef: "line-minus",
          cycleCountId: "count-1",
          cycleCountLineId: "line-minus",
          reasonCode: "cycle-count-variance"
        })
      ])
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-cycle-counts",
        data: {
          status: "applied",
          applied_at: NOW.toISOString(),
          applied_by: "admin-1"
        }
      })
    );
  });

  it("rejects an apply when any aggregate movement count changed after the snapshot", async () => {
    tracked.movements.mockRejectedValueOnce(
      new Error("inventory-projection-expectation-stale")
    );
    const payload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": {
          id: "count-1",
          status: "submitted",
          location: "location-1",
          submitted_by: "admin-2"
        }
      },
      finds: {
        "inventory-cycle-count-lines": [
          {
            id: "line-1",
            sku: "sku-1",
            disposition: "available",
            counted_quantity: 3,
            system_quantity: 2,
            movement_count_snapshot: 4,
            variance: 1
          }
        ],
        "inventory-levels": [
          {
            aggregate_key: "sku-1:location-1:available",
            quantity: 2,
            movement_count: 5
          }
        ]
      }
    });

    await expect(
      applyInventoryCycleCount({
        ...common(payload, "cycle-apply-00002"),
        input: { countId: "count-1" }
      })
    ).rejects.toThrow("inventory-cycle-count-snapshot-stale");
    expect(tracked.aggregateLock).not.toHaveBeenCalled();
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedProjections: [
          {
            aggregateKey: "sku-1:location-1:available",
            quantity: 2,
            movementCount: 4
          }
        ]
      })
    );
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalled();
  });

  it("rejects corrupt variance evidence before invoking the ledger", async () => {
    const payload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": {
          id: "count-1",
          status: "submitted",
          location: "location-1",
          submitted_by: "admin-2"
        }
      },
      finds: {
        "inventory-cycle-count-lines": [
          {
            id: "line-1",
            sku: "sku-1",
            disposition: "available",
            system_quantity: 2,
            counted_quantity: 3,
            movement_count_snapshot: 4,
            variance: 2
          }
        ]
      }
    });
    await expect(
      applyInventoryCycleCount({
        ...common(payload, "cycle-apply-corrupt1"),
        input: { countId: "count-1" }
      })
    ).rejects.toThrow("inventory-cycle-count-line-corrupt");
    expect(tracked.movements).not.toHaveBeenCalled();
  });

  it("applies a no-variance count atomically without manufacturing a movement", async () => {
    const payload = makePayload({
      byId: {
        "inventory-cycle-counts:count-1": {
          id: "count-1",
          status: "submitted",
          location: "location-1"
        }
      },
      finds: {
        "inventory-cycle-count-lines": [
          {
            id: "line-zero",
            sku: "sku-zero",
            disposition: "available",
            system_quantity: 4,
            counted_quantity: 4,
            movement_count_snapshot: 9,
            variance: 0
          }
        ],
        "inventory-levels": [
          {
            aggregate_key: "sku-zero:location-1:available",
            quantity: 4,
            movement_count: 9
          }
        ]
      }
    });

    await applyInventoryCycleCount({
      ...common(payload, "cycle-apply-00003"),
      input: { countId: "count-1" }
    });

    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [],
        expectedProjections: [
          {
            aggregateKey: "sku-zero:location-1:available",
            quantity: 4,
            movementCount: 9
          }
        ]
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-cycle-counts",
        data: expect.objectContaining({ status: "applied" })
      })
    );
    expect(tracked.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({ transactionID: "tx-operation" })
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-operation");
  });

  it.each([
    [undefined, "inventory-cycle-count-submitter-required"],
    ["admin-1", "inventory-cycle-count-self-approval-forbidden"]
  ])(
    "rejects positive variance without an independent submitter (%s)",
    async (submittedBy, errorCode) => {
      const payload = makePayload({
        byId: {
          "inventory-cycle-counts:count-1": {
            id: "count-1",
            status: "submitted",
            location: "location-1",
            ...(submittedBy ? { submitted_by: submittedBy } : {})
          }
        },
        finds: {
          "inventory-cycle-count-lines": [
            {
              id: "line-plus",
              sku: "sku-plus",
              disposition: "available",
              system_quantity: 2,
              counted_quantity: 3,
              movement_count_snapshot: 4,
              variance: 1
            }
          ],
          "inventory-levels": [
            {
              aggregate_key: "sku-plus:location-1:available",
              quantity: 2,
              movement_count: 4
            }
          ]
        }
      });

      await expect(
        applyInventoryCycleCount({
          ...common(payload, "cycle-apply-approval1"),
          input: { countId: "count-1" }
        })
      ).rejects.toThrow(errorCode);
      expect(tracked.movements).not.toHaveBeenCalled();
      expect(payload.update).not.toHaveBeenCalled();
      expect(payload.db.rollbackTransaction).toHaveBeenCalled();
    }
  );

  it("replays an already applied count without rereading snapshots or emitting movements", async () => {
    tracked.claim.mockResolvedValueOnce({
      kind: "replay",
      businessKey: "inventory:cycle-apply:cycle-apply-00004",
      response: { resourceId: "count-1", status: "applied" }
    });
    const payload = makePayload();

    await expect(
      applyInventoryCycleCount({
        ...common(payload, "cycle-apply-00004"),
        input: { countId: "count-1" }
      })
    ).resolves.toMatchObject({ kind: "replay" });
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
    expect(payload.findByID).not.toHaveBeenCalled();
    expect(tracked.movements).not.toHaveBeenCalled();
  });
});
