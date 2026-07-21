import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  adjustInventory,
  closeInventoryReceipt,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  releaseInventoryLot
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

describe("inventory operation authorization and receipt lifecycle", () => {
  it("requires the admin role and a stable actor identity before claiming a command", async () => {
    const payload = makePayload();

    await expect(
      createInventoryReceipt({
        ...common(payload, "receipt-create-0001"),
        req: { user: { id: "editor-1", role: "editor" } } as any,
        input: { locationId: "location-1", lines: [{ skuId: "sku-1" }] }
      })
    ).rejects.toThrow("inventory-operation-admin-required");
    expect(tracked.claim).not.toHaveBeenCalled();
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
  });

  it.each([
    [
      { locationId: "location-1", lines: [] },
      "inventory-receipt-lines-required"
    ],
    [
      {
        locationId: "location-1",
        lines: [{ skuId: "sku-1" }, { skuId: "sku-1" }]
      },
      "inventory-receipt-duplicate-sku"
    ],
    [
      {
        locationId: "location-1",
        lines: [{ skuId: "sku-1", expectedQuantity: 0 }]
      },
      "invalid-inventory-operation-quantity"
    ],
    [
      {
        locationId: "location-1",
        supplierName: "  ",
        lines: [{ skuId: "sku-1" }]
      },
      "invalid-inventory-receipt-supplier"
    ]
  ])(
    "rejects invalid receipt input before durable command work",
    async (input, errorCode) => {
      const payload = makePayload();
      await expect(
        createInventoryReceipt({
          ...common(payload, "receipt-invalid-0001"),
          input
        })
      ).rejects.toThrow(errorCode);
      expect(tracked.claim).not.toHaveBeenCalled();
    }
  );

  it.each([
    [50, true],
    [51, false]
  ])(
    "enforces the fixed-lease receipt line bound at %i lines",
    async (lineCount, accepted) => {
      const payload = makePayload();
      if (accepted) {
        tracked.claim.mockResolvedValueOnce({ kind: "conflict" });
      }
      const operation = createInventoryReceipt({
        ...common(payload, `receipt-line-bound-${lineCount}`),
        input: {
          locationId: "location-1",
          lines: Array.from({ length: lineCount }, (_, index) => ({
            skuId: `sku-${index}`
          }))
        }
      });

      if (accepted) {
        await expect(operation).resolves.toEqual({ kind: "conflict" });
        expect(tracked.claim).toHaveBeenCalledOnce();
      } else {
        await expect(operation).rejects.toThrow(
          "inventory-receipt-lines-limit-exceeded"
        );
        expect(tracked.claim).not.toHaveBeenCalled();
      }
    }
  );

  it("creates a draft receipt and unique SKU lines without inventing optional provenance", async () => {
    const payload = makePayload();

    const result = await createInventoryReceipt({
      ...common(payload, "receipt-create-0001"),
      input: {
        locationId: "location-1",
        lines: [{ skuId: "sku-1", expectedQuantity: 8 }, { skuId: "sku-2" }]
      }
    });

    expect(result).toMatchObject({
      kind: "succeeded",
      resourceId: expect.any(String)
    });
    expect(payload.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "inventory-receipts",
        req: expect.objectContaining({ transactionID: "tx-operation" }),
        data: {
          location: "location-1",
          status: "draft",
          supplier_name: null,
          external_reference: null
        }
      })
    );
    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "inventory-receipt-lines",
        data: expect.objectContaining({
          sku: "sku-1",
          expected_quantity: 8,
          receipt_sku_key: expect.stringContaining(":sku-1")
        })
      })
    );
    expect(payload.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({ sku: "sku-2", expected_quantity: null })
      })
    );
    expect(tracked.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({ transactionID: "tx-operation" }),
        resource: expect.objectContaining({ type: "inventory-receipt" })
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-operation");
    for (const [write] of payload.create.mock.calls) {
      expect(write).toMatchObject({
        overrideAccess: true,
        req: expect.objectContaining({ transactionID: "tx-operation" })
      });
    }
  });

  it("returns a durable command replay without opening another transaction", async () => {
    tracked.claim.mockResolvedValueOnce({
      kind: "replay",
      businessKey: "inventory:receipt-create:receipt-create-0002",
      response: { resourceId: "receipt-existing", status: "draft" }
    });
    const payload = makePayload();

    await expect(
      createInventoryReceipt({
        ...common(payload, "receipt-create-0002"),
        input: { locationId: "location-1", lines: [{ skuId: "sku-1" }] }
      })
    ).resolves.toEqual({
      kind: "replay",
      businessKey: "inventory:receipt-create:receipt-create-0002",
      response: { resourceId: "receipt-existing", status: "draft" }
    });
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
    expect(payload.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ kind: "conflict" }, { kind: "conflict" }],
    [
      {
        kind: "in_progress",
        businessKey: "inventory:receipt-create:busy",
        retryAfterMs: 500
      },
      {
        kind: "in_progress",
        businessKey: "inventory:receipt-create:busy",
        retryAfterMs: 500
      }
    ]
  ])(
    "returns a non-executable command outcome without domain writes",
    async (claim, expected) => {
      tracked.claim.mockResolvedValueOnce(claim);
      const payload = makePayload();

      await expect(
        createInventoryReceipt({
          ...common(payload, "receipt-create-0003"),
          input: { locationId: "location-1", lines: [{ skuId: "sku-1" }] }
        })
      ).resolves.toEqual(expected);
      expect(payload.db.beginTransaction).not.toHaveBeenCalled();
      expect(payload.create).not.toHaveBeenCalled();
    }
  );

  it("opens only a draft receipt and derives transition evidence from the request and clock", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": { id: "receipt-1", status: "draft" }
      }
    });

    await openInventoryReceipt({
      ...common(payload, "receipt-open-00001"),
      input: { receiptId: "receipt-1" }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-receipts",
        id: "receipt-1",
        data: {
          status: "open",
          opened_at: NOW.toISOString(),
          opened_by: "admin-1"
        }
      })
    );
    expect(tracked.lock).toHaveBeenCalledWith(
      payload,
      "tx-operation",
      "inventory-receipt:receipt-1"
    );
  });

  it("rejects an invalid transition and rolls back without status mutation", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": { id: "receipt-1", status: "open" }
      }
    });
    await expect(
      openInventoryReceipt({
        ...common(payload, "receipt-open-00002"),
        input: { receiptId: "receipt-1" }
      })
    ).rejects.toThrow("inventory-receipt-open-invalid-status");
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalled();
  });

  it("receives a partial quantity as an immutable lot and quarantined inbound movement", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          status: "open",
          location: "location-1"
        },
        "inventory-receipt-lines:line-1": {
          id: "line-1",
          receipt: "receipt-1",
          sku: "sku-1",
          expected_quantity: 10
        }
      }
    });

    await receiveInventoryReceipt({
      ...common(payload, "receipt-receive-001"),
      input: {
        receiptId: "receipt-1",
        receiptLineId: "line-1",
        quantity: 4
      }
    });

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-lots",
        data: {
          receipt_line: "line-1",
          operation_key: "receipt-receive-001",
          external_lot_code: null,
          received_quantity: 4,
          received_at: NOW.toISOString(),
          actor: "admin-1"
        }
      })
    );
    const lot = payload.create.mock.results[0]?.value;
    await lot;
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({ transactionID: "tx-operation" }),
        requests: [
          expect.objectContaining({
            kind: "inbound",
            quantity: 4,
            skuId: "sku-1",
            to: { locationId: "location-1", disposition: "quarantine" },
            reasonCode: "receipt-received",
            sourceType: "inventory_receipt",
            sourceRef: expect.stringMatching(/^inventory-lots-/),
            receiptId: "receipt-1",
            receiptLineId: "line-1",
            lotId: expect.stringMatching(/^inventory-lots-/),
            actorId: "admin-1",
            effectiveAt: NOW.toISOString()
          })
        ]
      })
    );
    expect(tracked.lock).toHaveBeenCalledWith(
      payload,
      "tx-operation",
      "inventory-receipt:receipt-1"
    );
  });

  it("records an over-receipt as explicit lot evidence instead of truncating it", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          status: "open",
          location: "location-1"
        },
        "inventory-receipt-lines:line-1": {
          id: "line-1",
          receipt: "receipt-1",
          sku: "sku-1",
          expected_quantity: 10
        }
      }
    });

    await receiveInventoryReceipt({
      ...common(payload, "receipt-receive-004"),
      input: { receiptId: "receipt-1", receiptLineId: "line-1", quantity: 12 }
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-lots",
        data: expect.objectContaining({ received_quantity: 12 })
      })
    );
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [expect.objectContaining({ quantity: 12 })]
      })
    );
  });

  it("rolls back receipt evidence when its movement cannot be recorded", async () => {
    tracked.movements.mockRejectedValueOnce(new Error("movement-failed"));
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          status: "open",
          location: "location-1"
        },
        "inventory-receipt-lines:line-1": {
          id: "line-1",
          receipt: "receipt-1",
          sku: "sku-1"
        }
      }
    });

    await expect(
      receiveInventoryReceipt({
        ...common(payload, "receipt-receive-002"),
        input: { receiptId: "receipt-1", receiptLineId: "line-1", quantity: 1 }
      })
    ).rejects.toThrow("movement-failed");
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-operation");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
    expect(tracked.complete).not.toHaveBeenCalled();
  });

  it("does not create or mutate receipt lines after the receipt is closed", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          status: "closed",
          location: "location-1"
        }
      }
    });

    await expect(
      receiveInventoryReceipt({
        ...common(payload, "receipt-receive-003"),
        input: { receiptId: "receipt-1", receiptLineId: "line-1", quantity: 1 }
      })
    ).rejects.toThrow("inventory-receipt-receive-invalid-status");
    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
    expect(tracked.movements).not.toHaveBeenCalled();
  });

  it("rejects a receipt line owned by a different receipt", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": {
          id: "receipt-1",
          status: "open",
          location: "location-1"
        },
        "inventory-receipt-lines:line-1": {
          id: "line-1",
          receipt: "receipt-2",
          sku: "sku-1"
        }
      }
    });
    await expect(
      receiveInventoryReceipt({
        ...common(payload, "receipt-receive-005"),
        input: { receiptId: "receipt-1", receiptLineId: "line-1", quantity: 1 }
      })
    ).rejects.toThrow("inventory-receipt-line-mismatch");
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("closes an open receipt while allowing intentionally partial receiving", async () => {
    const payload = makePayload({
      byId: {
        "inventory-receipts:receipt-1": { id: "receipt-1", status: "open" }
      }
    });

    await closeInventoryReceipt({
      ...common(payload, "receipt-close-0001"),
      input: { receiptId: "receipt-1" }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "closed",
          closed_at: NOW.toISOString(),
          closed_by: "admin-1"
        }
      })
    );
  });
});

describe("lot release and guarded adjustments", () => {
  const lotDocs = {
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
  };

  it("rejects a quarantine release above the immutable lot remainder", async () => {
    const payload = makePayload({
      byId: lotDocs,
      finds: {
        "inventory-movements": [
          { kind: "transfer", from_disposition: "quarantine", quantity: 3 }
        ]
      }
    });

    await expect(
      releaseInventoryLot({
        ...common(payload, "lot-release-00001"),
        input: { lotId: "lot-1", quantity: 3 }
      })
    ).rejects.toThrow("inventory-lot-release-exceeds-remaining");
    expect(tracked.movements).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalled();
  });

  it("moves only the requested lot remainder from quarantine to available", async () => {
    const payload = makePayload({
      byId: lotDocs,
      finds: { "inventory-movements": [] }
    });

    const result = await releaseInventoryLot({
      ...common(payload, "lot-release-00002"),
      input: { lotId: "lot-1", quantity: 5 }
    });

    expect(result).toMatchObject({ kind: "succeeded", status: "released" });

    expect(tracked.lock).toHaveBeenCalledWith(
      payload,
      "tx-operation",
      "inventory-lot:lot-1"
    );
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-movements",
        where: {
          and: [
            { lot: { equals: "lot-1" } },
            { source_type: { equals: "inventory_lot_release" } },
            { kind: { equals: "transfer" } },
            { from_disposition: { equals: "quarantine" } }
          ]
        }
      })
    );
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            kind: "transfer",
            quantity: 5,
            from: { locationId: "location-1", disposition: "quarantine" },
            to: { locationId: "location-1", disposition: "available" },
            sourceRef: "lot-1",
            receiptId: "receipt-1",
            receiptLineId: "line-1",
            lotId: "lot-1",
            reasonCode: "lot-released"
          })
        ]
      })
    );
  });

  it("supports successive partial releases using serialized durable movement evidence", async () => {
    const payload = makePayload({
      byId: lotDocs,
      finds: {
        "inventory-movements": [
          { kind: "transfer", from_disposition: "quarantine", quantity: 3 }
        ]
      }
    });

    const result = await releaseInventoryLot({
      ...common(payload, "lot-release-00003"),
      input: { lotId: "lot-1", quantity: 2 }
    });
    expect(result).toMatchObject({
      kind: "succeeded",
      status: "released"
    });
    expect(tracked.lock).toHaveBeenCalledBefore(tracked.movements);
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [expect.objectContaining({ quantity: 2, sourceRef: "lot-1" })]
      })
    );
  });

  it("rejects a generic positive inbound adjustment before claiming a command", async () => {
    const payload = makePayload();

    await expect(
      adjustInventory({
        ...common(payload, "adjustment-inbound-1"),
        input: {
          skuId: "sku-1",
          kind: "inbound" as never,
          quantity: 1,
          to: { locationId: "location-1", disposition: "available" },
          reasonCode: "manual-correction"
        }
      })
    ).rejects.toThrow("inventory-positive-adjustment-requires-provenance");
    expect(tracked.claim).not.toHaveBeenCalled();
  });

  it("records outbound and transfer adjustments with server-derived evidence", async () => {
    const payload = makePayload();

    await adjustInventory({
      ...common(payload, "adjustment-outbound1"),
      input: {
        skuId: "sku-1",
        kind: "outbound",
        quantity: 2,
        from: {
          locationId: "location-1",
          disposition: "returned_pending_release"
        },
        reasonCode: "returned-writeoff"
      }
    });

    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            kind: "outbound",
            actorId: "admin-1",
            effectiveAt: NOW.toISOString(),
            sourceType: "inventory_adjustment"
          })
        ]
      })
    );
  });

  it("records a transfer adjustment with both validated endpoints", async () => {
    const payload = makePayload();
    await adjustInventory({
      ...common(payload, "adjustment-transfer1"),
      input: {
        skuId: "sku-1",
        kind: "transfer",
        quantity: 1,
        from: { locationId: "location-1", disposition: "available" },
        to: { locationId: "location-1", disposition: "damaged" },
        reasonCode: "move-to-damaged"
      }
    });
    expect(tracked.movements).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            kind: "transfer",
            to: { locationId: "location-1", disposition: "damaged" }
          })
        ]
      })
    );
  });

  it("delegates inactive SKU and location enforcement to the transactional ledger", async () => {
    tracked.movements.mockRejectedValueOnce(
      new Error("inventory-sku-inactive")
    );
    const payload = makePayload();

    await expect(
      adjustInventory({
        ...common(payload, "adjustment-outbound2"),
        input: {
          skuId: "sku-inactive",
          kind: "outbound",
          quantity: 1,
          from: { locationId: "location-inactive", disposition: "available" },
          reasonCode: "verified-writeoff"
        }
      })
    ).rejects.toThrow("inventory-sku-inactive");
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-operation");
    expect(tracked.complete).not.toHaveBeenCalled();
  });
});
