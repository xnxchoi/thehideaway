import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashInventoryMovementRequest } from "./inventory-ledger-contracts";
import { recordInventoryMovement } from "./inventory-ledger";

const tracked = vi.hoisted(() => ({
  events: [] as string[],
  authorize: vi.fn(),
  idempotency: vi.fn(),
  product: vi.fn(),
  sku: vi.fn(),
  location: vi.fn(),
  aggregate: vi.fn()
}));

vi.mock("@/lib/db/sequences", () => ({
  inventoryMovementIdempotencyLock: tracked.idempotency,
  productInventoryLock: tracked.product,
  productSkuMutationLock: tracked.sku,
  inventoryLocationLock: tracked.location,
  inventoryAggregateLock: tracked.aggregate
}));

vi.mock(
  "@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection",
  () => ({
    authorizeInventoryLedgerRequest: tracked.authorize
  })
);

const request = {
  idempotencyKey: "inventory-event-0001",
  skuId: "sku-1",
  kind: "inbound" as const,
  quantity: 4,
  to: { locationId: "location-b", disposition: "available" as const },
  reasonCode: "verified-stock-in",
  sourceType: "inventory_command" as const,
  sourceRef: "source-1",
  actorId: "actor-1",
  effectiveAt: "2026-07-22T00:00:00.000Z"
};

type Stored = Record<string, unknown>;

function makePayload(input?: {
  movement?: Stored;
  levels?: Stored[];
  createError?: Error;
  updateError?: Error;
  rollbackError?: Error;
}) {
  const levels = input?.levels ?? [];
  let skuReadCount = 0;
  const findByID = vi.fn(async ({ collection, id }: any) => {
    tracked.events.push(`read:${collection}:${id}`);
    if (collection === "product-variants") {
      skuReadCount += 1;
      return {
        id,
        active: true,
        sku: "LIS-001",
        product: { id: "product-1" },
        identity_locked: true,
        read: skuReadCount
      };
    }
    if (collection === "stock-locations") {
      return { id, code: id.toUpperCase(), active: true };
    }
    throw new Error("unexpected-read");
  });
  const find = vi.fn(async ({ collection, where }: any) => {
    tracked.events.push(`find:${collection}`);
    if (collection === "inventory-movements") {
      return { docs: input?.movement ? [input.movement] : [] };
    }
    if (collection === "inventory-levels") {
      const aggregateKey = where?.aggregate_key?.equals;
      return {
        docs: levels.filter((level) => level.aggregate_key === aggregateKey)
      };
    }
    throw new Error("unexpected-find");
  });
  const create = vi.fn(async (args: any) => {
    tracked.events.push(`create:${args.collection}`);
    if (input?.createError) throw input.createError;
    return { id: `${args.collection}-1`, ...args.data };
  });
  const update = vi.fn(async (args: any) => {
    tracked.events.push(`update:${args.collection}:${args.id}`);
    if (input?.updateError) throw input.updateError;
    return { id: args.id, ...args.data };
  });
  const payload = {
    db: {
      beginTransaction: vi.fn(async () => "tx-1"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => {
        if (input?.rollbackError) throw input.rollbackError;
      })
    },
    findByID,
    find,
    create,
    update
  } as any;
  return { payload, findByID, find, create, update };
}

describe("recordInventoryMovement", () => {
  beforeEach(() => {
    tracked.events.length = 0;
    for (const mock of Object.values(tracked)) {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    }
    tracked.authorize.mockImplementation((req) => {
      expect(req.transactionID).toBe("tx-1");
      tracked.events.push("authorize");
    });
    tracked.idempotency.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`lock:idempotency:${key}`)
    );
    tracked.product.mockImplementation(async (_p, _t, id) =>
      tracked.events.push(`lock:product:${id}`)
    );
    tracked.sku.mockImplementation(async (_p, _t, id) =>
      tracked.events.push(`lock:sku:${id}`)
    );
    tracked.location.mockImplementation(async (_p, _t, id) =>
      tracked.events.push(`lock:location:${id}`)
    );
    tracked.aggregate.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`lock:aggregate:${key}`)
    );
  });

  it("locks identity and aggregates, appends one movement, and creates an absent projection", async () => {
    const { payload, create } = makePayload();

    const result = await recordInventoryMovement({ payload, request });

    expect(result.kind).toBe("created");
    expect(tracked.events).toEqual([
      "lock:idempotency:inventory-event-0001",
      "find:inventory-movements",
      "read:product-variants:sku-1",
      "lock:product:product-1",
      "lock:sku:sku-1",
      "lock:location:location-b",
      "lock:aggregate:sku-1:location-b:available",
      "read:product-variants:sku-1",
      "read:stock-locations:location-b",
      "find:inventory-levels",
      "authorize",
      "create:inventory-movements",
      "authorize",
      "create:inventory-levels"
    ]);
    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "inventory-movements",
        overrideAccess: true,
        data: expect.objectContaining({
          idempotency_key: request.idempotencyKey,
          request_hash: hashInventoryMovementRequest(request),
          sku: "sku-1",
          kind: "inbound",
          quantity: 4,
          from_location: null,
          from_disposition: null,
          to_location: "location-b",
          to_disposition: "available",
          source_type: "inventory_command"
        })
      })
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "inventory-levels",
        data: {
          aggregate_key: "sku-1:location-b:available",
          sku: "sku-1",
          location: "location-b",
          disposition: "available",
          quantity: 4,
          movement_count: 1
        }
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("replays the permanently stored event without projection writes", async () => {
    const stored = {
      id: "movement-1",
      idempotency_key: request.idempotencyKey,
      request_hash: hashInventoryMovementRequest(request)
    };
    const { payload, create, update, findByID } = makePayload({
      movement: stored
    });

    await expect(
      recordInventoryMovement({ payload, request })
    ).resolves.toEqual({ kind: "replay", movement: stored });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(findByID).not.toHaveBeenCalled();
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("rejects an idempotency key reused with a different canonical request", async () => {
    const { payload } = makePayload({
      movement: {
        id: "movement-1",
        idempotency_key: request.idempotencyKey,
        request_hash: "0".repeat(64)
      }
    });

    await expect(recordInventoryMovement({ payload, request })).rejects.toThrow(
      "inventory-movement-idempotency-conflict"
    );
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("updates both transfer endpoints in stable aggregate order", async () => {
    const transfer = {
      ...request,
      kind: "transfer" as const,
      from: { locationId: "location-b", disposition: "available" as const },
      to: { locationId: "location-a", disposition: "quarantine" as const }
    };
    const sourceKey = "sku-1:location-b:available";
    const targetKey = "sku-1:location-a:quarantine";
    const { payload, create, update } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: sourceKey,
          quantity: 5,
          movement_count: 2
        }
      ]
    });

    await recordInventoryMovement({ payload, request: transfer });

    expect(tracked.location.mock.calls.map((call) => call[2])).toEqual([
      "location-a",
      "location-b"
    ]);
    expect(tracked.aggregate.mock.calls.map((call) => call[2])).toEqual([
      targetKey,
      sourceKey
    ]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-levels",
        id: "level-source",
        data: { quantity: 1, movement_count: 3 }
      })
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-levels",
        data: expect.objectContaining({
          aggregate_key: targetKey,
          quantity: 4,
          movement_count: 1
        })
      })
    );
  });

  it("treats a missing debit projection as zero and never goes negative", async () => {
    const { payload, create } = makePayload();
    const outbound = {
      ...request,
      kind: "outbound" as const,
      to: undefined,
      from: { locationId: "location-b", disposition: "available" as const }
    };

    await expect(
      recordInventoryMovement({ payload, request: outbound })
    ).rejects.toThrow("insufficient-inventory-balance");
    expect(create).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("rolls back every write and preserves the original error", async () => {
    const original = new Error("projection-write-failed");
    const { payload } = makePayload({
      updateError: original,
      rollbackError: new Error("rollback-failed"),
      levels: [
        {
          id: "level-1",
          aggregate_key: "sku-1:location-b:available",
          quantity: 1,
          movement_count: 1
        }
      ]
    });

    await expect(recordInventoryMovement({ payload, request })).rejects.toBe(
      original
    );
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
  });

  it("rejects inbound stock for an inactive SKU", async () => {
    const { payload, findByID } = makePayload();
    findByID
      .mockResolvedValueOnce({
        id: "sku-1",
        active: true,
        sku: "LIS-001",
        product: "product-1",
        identity_locked: true
      })
      .mockResolvedValueOnce({
        id: "sku-1",
        active: false,
        sku: "LIS-001",
        product: "product-1",
        identity_locked: true
      });

    await expect(recordInventoryMovement({ payload, request })).rejects.toThrow(
      "inventory-sku-inactive"
    );
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("allows outbound stock to drain an inactive identity-locked SKU and location", async () => {
    const sourceKey = "sku-1:location-b:available";
    const { payload, findByID } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: sourceKey,
          quantity: 2,
          movement_count: 1
        }
      ]
    });
    findByID.mockImplementation(async ({ collection, id }: any) =>
      collection === "product-variants"
        ? {
            id,
            active: false,
            sku: "LIS-001",
            product: "product-1",
            identity_locked: true
          }
        : { id, code: "CLOSED", active: false }
    );

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          kind: "outbound",
          quantity: 1,
          to: undefined,
          from: {
            locationId: "location-b",
            disposition: "available"
          }
        }
      })
    ).resolves.toMatchObject({ kind: "created" });
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 1, movement_count: 2 } })
    );
  });

  it.each([
    {
      kind: "outbound" as const,
      to: undefined,
      from: {
        locationId: "location-b",
        disposition: "available" as const
      }
    },
    {
      kind: "transfer" as const,
      from: {
        locationId: "location-b",
        disposition: "available" as const
      },
      to: {
        locationId: "location-b",
        disposition: "quarantine" as const
      }
    }
  ])("rejects an identity-unlocked $kind SKU", async (movement) => {
    const { payload, findByID } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: "sku-1:location-b:available",
          quantity: 2,
          movement_count: 1
        }
      ]
    });
    findByID.mockImplementation(async ({ collection, id }: any) =>
      collection === "product-variants"
        ? {
            id,
            active: false,
            sku: "LIS-001",
            product: "product-1",
            identity_locked: false
          }
        : { id, code: "CLOSED", active: false }
    );

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          ...movement,
          quantity: 1
        }
      })
    ).rejects.toThrow("inventory-sku-identity-unlocked");
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("allows transfer from an inactive source into a different active destination", async () => {
    const sourceKey = "sku-1:location-b:available";
    const { payload, findByID } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: sourceKey,
          quantity: 2,
          movement_count: 1
        }
      ]
    });
    findByID.mockImplementation(async ({ collection, id }: any) => {
      if (collection === "product-variants") {
        return {
          id,
          active: false,
          sku: "LIS-001",
          product: "product-1",
          identity_locked: true
        };
      }
      return { id, code: id, active: id === "location-a" };
    });

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          kind: "transfer",
          quantity: 1,
          from: {
            locationId: "location-b",
            disposition: "available"
          },
          to: {
            locationId: "location-a",
            disposition: "quarantine"
          }
        }
      })
    ).resolves.toMatchObject({ kind: "created" });
  });

  it("allows same-location disposition transfer inside an inactive location", async () => {
    const sourceKey = "sku-1:location-b:quarantine";
    const { payload, findByID } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: sourceKey,
          quantity: 2,
          movement_count: 1
        }
      ]
    });
    findByID.mockImplementation(async ({ collection, id }: any) =>
      collection === "product-variants"
        ? {
            id,
            active: false,
            sku: "LIS-001",
            product: "product-1",
            identity_locked: true
          }
        : { id, code: "CLOSED", active: false }
    );

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          kind: "transfer",
          quantity: 1,
          from: {
            locationId: "location-b",
            disposition: "quarantine"
          },
          to: {
            locationId: "location-b",
            disposition: "available"
          }
        }
      })
    ).resolves.toMatchObject({ kind: "created" });
  });

  it("rejects inbound and cross-location transfer into an inactive destination", async () => {
    const sourceKey = "sku-1:location-b:available";
    const { payload, findByID } = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: sourceKey,
          quantity: 2,
          movement_count: 1
        }
      ]
    });
    findByID.mockImplementation(async ({ collection, id }: any) =>
      collection === "product-variants"
        ? {
            id,
            active: true,
            sku: "LIS-001",
            product: "product-1",
            identity_locked: true
          }
        : { id, code: id, active: id === "location-b" }
    );

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          kind: "transfer",
          quantity: 1,
          from: {
            locationId: "location-b",
            disposition: "available"
          },
          to: {
            locationId: "location-a",
            disposition: "quarantine"
          }
        }
      })
    ).rejects.toThrow("inventory-location-inactive");

    await expect(
      recordInventoryMovement({
        payload,
        request: {
          ...request,
          idempotencyKey: "inventory-event-0002",
          to: {
            locationId: "location-a",
            disposition: "available"
          }
        }
      })
    ).rejects.toThrow("inventory-location-inactive");
  });
});
