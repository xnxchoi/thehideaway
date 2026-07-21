import { beforeEach, describe, expect, it, vi } from "vitest";

import { isInventoryLedgerRequestAuthorized } from "@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection";
import { hashInventoryMovementRequest } from "./inventory-ledger-contracts";
import {
  recordInventoryMovement,
  recordInventoryMovementsInTransaction as recordInventoryMovementsInTransactionProduction
} from "./inventory-ledger";

const tracked = vi.hoisted(() => ({
  events: [] as string[],
  authorize: vi.fn(),
  idempotency: vi.fn(),
  product: vi.fn(),
  sku: vi.fn(),
  location: vi.fn(),
  aggregate: vi.fn(),
  workflowAuthorization: Object.freeze({})
}));

vi.mock("./inventory-operation-runtime", () => ({
  assertInventoryWorkflowAuthorization: (
    authorization: unknown,
    actorId: string
  ) => {
    if (
      authorization !== tracked.workflowAuthorization ||
      actorId !== "admin-1"
    ) {
      throw new Error("inventory-workflow-authorization-required");
    }
  },
  requireInventoryAdmin: (req: { user?: { id?: string; role?: string } }) => {
    if (req.user?.role !== "admin" || req.user.id !== "admin-1") {
      throw new Error("inventory-operation-admin-required");
    }
    return req.user.id;
  }
}));

function recordInventoryMovementsInTransaction(
  input: Parameters<typeof recordInventoryMovementsInTransactionProduction>[0]
) {
  return recordInventoryMovementsInTransactionProduction({
    ...input,
    authorization: tracked.workflowAuthorization as never
  });
}

vi.mock("@/lib/db/sequences", () => ({
  inventoryMovementIdempotencyLock: tracked.idempotency,
  productInventoryLock: tracked.product,
  productSkuMutationLock: tracked.sku,
  inventoryLocationLock: tracked.location,
  inventoryAggregateLock: tracked.aggregate
}));

vi.mock(
  "@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection")
      >();
    return {
      ...actual,
      authorizeInventoryLedgerRequest: (req: object) => {
        tracked.authorize(req);
        actual.authorizeInventoryLedgerRequest(req);
      }
    };
  }
);

type Stored = Record<string, any>;

const requests = [
  {
    idempotencyKey: "receipt-event-0002",
    skuId: "sku-b",
    kind: "inbound" as const,
    quantity: 2,
    to: { locationId: "location-b", disposition: "quarantine" as const },
    reasonCode: "receipt",
    sourceType: "inventory_receipt" as const,
    sourceRef: "lot-b",
    receiptId: "receipt-1",
    receiptLineId: "line-b",
    lotId: "lot-b",
    actorId: "admin-1"
  },
  {
    idempotencyKey: "receipt-event-0001",
    skuId: "sku-a",
    kind: "inbound" as const,
    quantity: 3,
    to: { locationId: "location-a", disposition: "quarantine" as const },
    reasonCode: "receipt",
    sourceType: "inventory_receipt" as const,
    sourceRef: "lot-a",
    receiptId: "receipt-1",
    receiptLineId: "line-a",
    lotId: "lot-a",
    actorId: "admin-1"
  }
];

function makePayload(input?: {
  movements?: Stored[];
  levels?: Stored[];
  updateError?: Error;
}) {
  const movements = new Map(
    (input?.movements ?? []).map((movement) => [
      movement.idempotency_key,
      movement
    ])
  );
  const levels = new Map(
    (input?.levels ?? []).map((level) => [level.aggregate_key, level])
  );
  const findByID = vi.fn(async ({ collection, id }: any) => {
    tracked.events.push(`read:${collection}:${id}`);
    if (collection === "product-variants") {
      return {
        id,
        active: true,
        sku: `CODE-${id}`,
        product: { id: id === "sku-a" ? "product-z" : "product-a" },
        identity_locked: true
      };
    }
    if (collection === "stock-locations") {
      return { id, active: true };
    }
    throw new Error("unexpected-read");
  });
  const find = vi.fn(async ({ collection, where }: any) => {
    if (collection === "inventory-movements") {
      const key = where.idempotency_key.equals;
      tracked.events.push(`find:movement:${key}`);
      const movement = movements.get(key);
      return { docs: movement ? [movement] : [] };
    }
    if (collection === "inventory-levels") {
      const key = where.aggregate_key.equals;
      tracked.events.push(`find:level:${key}`);
      const level = levels.get(key);
      return { docs: level ? [level] : [] };
    }
    throw new Error("unexpected-find");
  });
  let nextMovement = 0;
  const create = vi.fn(async (args: any) => {
    tracked.events.push(`create:${args.collection}`);
    if (args.collection === "inventory-movements") {
      nextMovement += 1;
      return { id: `movement-${nextMovement}`, ...args.data };
    }
    return { id: `level-${args.data.aggregate_key}`, ...args.data };
  });
  const update = vi.fn(async (args: any) => {
    tracked.events.push(`update:${args.collection}:${args.id}`);
    if (input?.updateError) throw input.updateError;
    return { id: args.id, ...args.data };
  });
  const payload = {
    db: {
      beginTransaction: vi.fn(async () => "wrapper-tx"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    },
    findByID,
    find,
    create,
    update
  } as any;
  const req = {
    payload,
    transactionID: "caller-tx",
    context: {},
    user: { id: "admin-1", role: "admin" }
  } as any;
  return { payload, req, create, update, find };
}

describe("recordInventoryMovementsInTransaction", () => {
  beforeEach(() => {
    tracked.events.length = 0;
    for (const mock of Object.values(tracked)) {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    }
    tracked.authorize.mockImplementation(() => undefined);
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

  it("validates every request before taking locks or reading transaction data", async () => {
    const { payload, req, find } = makePayload();

    await expect(
      recordInventoryMovementsInTransactionProduction({
        payload,
        req,
        requests: [requests[0], { ...requests[1], quantity: 0 }]
      })
    ).rejects.toThrow("invalid-inventory-movement-quantity");

    expect(tracked.idempotency).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("rejects privileged workflow sources without an issued capability", async () => {
    const { payload, req, find } = makePayload();
    const receiptRequest = {
      ...requests[0],
      sourceType: "inventory_receipt",
      to: { locationId: "location-b", disposition: "quarantine" },
      receiptId: "receipt-1",
      receiptLineId: "line-1",
      lotId: "lot-b",
      actorId: "admin-1"
    };

    await expect(
      recordInventoryMovementsInTransactionProduction({
        payload,
        req: {
          ...req,
          user: { id: "admin-1", role: "admin" }
        },
        requests: [receiptRequest]
      })
    ).rejects.toThrow("inventory-workflow-authorization-required");
    expect(tracked.idempotency).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("matches privileged movement actors to the authenticated admin", async () => {
    const { payload, req } = makePayload();
    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [{ ...requests[0], actorId: "admin-2" }]
      })
    ).rejects.toThrow("inventory-movement-actor-mismatch");
    expect(tracked.idempotency).not.toHaveBeenCalled();
  });

  it("requires admin identity and matching actor on generic batch movements", async () => {
    const { payload, req } = makePayload();
    const command = {
      idempotencyKey: "inventory-command-batch-0001",
      skuId: "sku-b",
      kind: "outbound" as const,
      quantity: 1,
      from: { locationId: "location-b", disposition: "quarantine" as const },
      reasonCode: "verified-writeoff",
      sourceType: "inventory_command" as const,
      actorId: "admin-1"
    };

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req: { ...req, user: null },
        requests: [command]
      })
    ).rejects.toThrow("inventory-operation-admin-required");
    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [{ ...command, actorId: "admin-2" }]
      })
    ).rejects.toThrow("inventory-movement-actor-mismatch");
    expect(tracked.idempotency).not.toHaveBeenCalled();
  });

  it("keeps privileged PR5 sources out of the generic one-movement wrapper", async () => {
    const { payload } = makePayload();
    await expect(
      recordInventoryMovement({
        payload,
        req: { user: { id: "admin-1", role: "admin" }, context: {} } as any,
        request: {
          ...requests[0],
          sourceType: "inventory_receipt",
          to: { locationId: "location-b", disposition: "quarantine" },
          receiptId: "receipt-1",
          receiptLineId: "line-1",
          lotId: "lot-b",
          actorId: "admin-1"
        }
      })
    ).rejects.toThrow("inventory-workflow-operation-required");
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
  });

  it("validates every projection expectation before taking locks", async () => {
    const { payload, req, find } = makePayload();

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0]],
        expectedProjections: [
          {
            aggregateKey: "sku-b:location-b:quarantine",
            quantity: -1,
            movementCount: 0
          }
        ]
      })
    ).rejects.toThrow("invalid-inventory-projection-expectation");

    expect(tracked.idempotency).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("requires a caller-owned transaction", async () => {
    const { payload, req } = makePayload();
    delete req.transactionID;

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0]]
      })
    ).rejects.toThrow("inventory-movement-transaction-required");

    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
  });

  it("rejects a promised transaction ID outside the concrete API contract", async () => {
    const { payload, req } = makePayload();
    req.transactionID = Promise.resolve("promised-tx");

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0]]
      })
    ).rejects.toThrow("inventory-movement-transaction-required");

    expect(tracked.idempotency).not.toHaveBeenCalled();
  });

  it("rejects a request and payload from different transaction contexts", async () => {
    const { payload, req } = makePayload();

    await expect(
      recordInventoryMovementsInTransaction({
        payload: { ...payload } as any,
        req,
        requests: [requests[0]]
      })
    ).rejects.toThrow("inventory-movement-payload-mismatch");

    expect(tracked.idempotency).not.toHaveBeenCalled();
  });

  it("rejects duplicate idempotency keys before taking any locks", async () => {
    const { payload, req } = makePayload();

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [
          requests[0],
          { ...requests[1], idempotencyKey: requests[0].idempotencyKey }
        ]
      })
    ).rejects.toThrow("inventory-movement-duplicate-idempotency-key");

    expect(tracked.idempotency).not.toHaveBeenCalled();
  });

  it("also rejects byte-identical duplicate requests as ambiguous input", async () => {
    const { payload, req, find } = makePayload();

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0], requests[0]]
      })
    ).rejects.toThrow("inventory-movement-duplicate-idempotency-key");

    expect(tracked.idempotency).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("acquires every lock class once in global sorted order", async () => {
    const { payload, req, create } = makePayload();

    await recordInventoryMovementsInTransaction({ payload, req, requests });

    expect(tracked.idempotency.mock.calls.map((call) => call[2])).toEqual([
      "receipt-event-0001",
      "receipt-event-0002"
    ]);
    expect(tracked.product.mock.calls.map((call) => call[2])).toEqual([
      "product-a",
      "product-z"
    ]);
    expect(tracked.sku.mock.calls.map((call) => call[2])).toEqual([
      "sku-a",
      "sku-b"
    ]);
    expect(tracked.location.mock.calls.map((call) => call[2])).toEqual([
      "location-a",
      "location-b"
    ]);
    expect(tracked.aggregate.mock.calls.map((call) => call[2])).toEqual([
      "sku-a:location-a:quarantine",
      "sku-b:location-b:quarantine"
    ]);

    const lockEvents = tracked.events.filter((event) =>
      event.startsWith("lock:")
    );
    expect(lockEvents).toEqual([
      "lock:idempotency:receipt-event-0001",
      "lock:idempotency:receipt-event-0002",
      "lock:product:product-a",
      "lock:product:product-z",
      "lock:sku:sku-a",
      "lock:sku:sku-b",
      "lock:location:location-a",
      "lock:location:location-b",
      "lock:aggregate:sku-a:location-a:quarantine",
      "lock:aggregate:sku-b:location-b:quarantine"
    ]);
    for (const lock of [
      tracked.idempotency,
      tracked.product,
      tracked.sku,
      tracked.location,
      tracked.aggregate
    ]) {
      expect(lock.mock.calls.every((call) => call[1] === "caller-tx")).toBe(
        true
      );
    }
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).not.toHaveBeenCalled();
    const authorizedReq = tracked.authorize.mock.calls[0]?.[0];
    expect(authorizedReq).not.toBe(req);
    expect(isInventoryLedgerRequestAuthorized(req)).toBe(false);
    expect(isInventoryLedgerRequestAuthorized(authorizedReq)).toBe(true);
    expect(
      create.mock.calls.every(([args]) => args.req === authorizedReq)
    ).toBe(true);
  });

  it("creates one projection for multiple movements into an absent aggregate", async () => {
    const { payload, req, create } = makePayload();

    await recordInventoryMovementsInTransaction({
      payload,
      req,
      requests: [
        { ...requests[0], quantity: 2 },
        {
          ...requests[0],
          idempotencyKey: "receipt-event-0003",
          quantity: 3
        }
      ]
    });

    const movementCreates = create.mock.calls.filter(
      ([args]) => args.collection === "inventory-movements"
    );
    const projectionCreates = create.mock.calls.filter(
      ([args]) => args.collection === "inventory-levels"
    );
    expect(movementCreates).toHaveLength(2);
    expect(projectionCreates).toEqual([
      [
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 5, movement_count: 2 })
        })
      ]
    ]);
  });

  it("calculates repeated aggregate changes cumulatively and writes one final projection", async () => {
    const sameAggregateRequests = [
      { ...requests[0], quantity: 2 },
      {
        ...requests[0],
        idempotencyKey: "receipt-event-0003",
        quantity: 3
      }
    ];
    const aggregateKey = "sku-b:location-b:quarantine";
    const { payload, req, update } = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: aggregateKey,
          quantity: 5,
          movement_count: 2
        }
      ]
    });

    const result = await recordInventoryMovementsInTransaction({
      payload,
      req,
      requests: sameAggregateRequests,
      expectedProjections: [
        {
          aggregateKey,
          quantity: 5,
          movementCount: 2
        }
      ]
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "level-1",
        data: { quantity: 10, movement_count: 4 }
      })
    );
    expect(result.results).toHaveLength(2);
    expect(result.results).toEqual([
      expect.objectContaining({ kind: "created" }),
      expect.objectContaining({ kind: "created" })
    ]);
    expect(result.projections).toEqual([
      expect.objectContaining({
        id: "level-1",
        quantity: 10,
        movement_count: 4
      })
    ]);
  });

  it("rejects a stale projection expectation after canonical locks and before writes", async () => {
    const aggregateKey = "sku-b:location-b:quarantine";
    const { payload, req, create } = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: aggregateKey,
          quantity: 5,
          movement_count: 2
        }
      ]
    });

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0]],
        expectedProjections: [
          {
            aggregateKey,
            quantity: 4,
            movementCount: 2
          }
        ]
      })
    ).rejects.toThrow("inventory-projection-expectation-stale");

    expect(create).not.toHaveBeenCalled();
    expect(tracked.events.indexOf("lock:product:product-a")).toBeLessThan(
      tracked.events.indexOf(`lock:aggregate:${aggregateKey}`)
    );
    expect(
      tracked.events.indexOf(`lock:aggregate:${aggregateKey}`)
    ).toBeLessThan(tracked.events.indexOf(`find:level:${aggregateKey}`));
  });

  it("can lock and verify an expectation-only batch without writing", async () => {
    const aggregateKey = "sku-b:location-b:quarantine";
    const { payload, req, create, update } = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: aggregateKey,
          quantity: 5,
          movement_count: 2
        }
      ]
    });

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [],
        expectedProjections: [
          {
            aggregateKey,
            quantity: 5,
            movementCount: 2
          }
        ]
      })
    ).resolves.toEqual({ results: [], projections: [] });

    expect(tracked.aggregate).toHaveBeenCalledWith(
      payload,
      "caller-tx",
      aggregateKey
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects cumulative underflow before appending either movement", async () => {
    const aggregateKey = "sku-b:location-b:quarantine";
    const outbound = {
      ...requests[0],
      kind: "outbound" as const,
      quantity: 3,
      to: undefined,
      from: { locationId: "location-b", disposition: "quarantine" as const },
      sourceType: "inventory_command" as const,
      receiptId: undefined,
      receiptLineId: undefined,
      lotId: undefined
    };
    const { payload, req, create } = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: aggregateKey,
          quantity: 5,
          movement_count: 2
        }
      ]
    });

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [
          outbound,
          { ...outbound, idempotencyKey: "receipt-event-0003" }
        ]
      })
    ).rejects.toThrow("insufficient-inventory-balance");

    expect(create).not.toHaveBeenCalled();
  });

  it("returns permanent replays beside newly created movements", async () => {
    const replay = {
      id: "stored-movement",
      idempotency_key: requests[0].idempotencyKey,
      request_hash: hashInventoryMovementRequest(requests[0])
    };
    const { payload, req, create } = makePayload({ movements: [replay] });

    const result = await recordInventoryMovementsInTransaction({
      payload,
      req,
      requests
    });

    expect(result.results[0]).toEqual({ kind: "replay", movement: replay });
    expect(result.results[1]).toMatchObject({ kind: "created" });
    expect(
      create.mock.calls.filter(
        ([args]) => args.collection === "inventory-movements"
      )
    ).toHaveLength(1);
  });

  it("rejects a permanent idempotency conflict without writing any movement", async () => {
    const { payload, req, create } = makePayload({
      movements: [
        {
          id: "stored-movement",
          idempotency_key: requests[0].idempotencyKey,
          request_hash: "0".repeat(64)
        }
      ]
    });

    await expect(
      recordInventoryMovementsInTransaction({ payload, req, requests })
    ).rejects.toThrow("inventory-movement-idempotency-conflict");

    expect(create).not.toHaveBeenCalled();
  });

  it("never commits or rolls back the caller transaction when a write fails", async () => {
    const original = new Error("projection-write-failed");
    const { payload, req } = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: "sku-b:location-b:quarantine",
          quantity: 1,
          movement_count: 1
        }
      ],
      updateError: original
    });

    await expect(
      recordInventoryMovementsInTransaction({
        payload,
        req,
        requests: [requests[0]]
      })
    ).rejects.toBe(original);

    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).not.toHaveBeenCalled();
    expect(isInventoryLedgerRequestAuthorized(req)).toBe(false);
  });

  it("keeps the one-movement wrapper responsible for commit and rollback", async () => {
    const genericRequest = {
      idempotencyKey: "inventory-command-0001",
      skuId: "sku-b",
      kind: "transfer" as const,
      quantity: 1,
      from: { locationId: "location-b", disposition: "quarantine" as const },
      to: { locationId: "location-a", disposition: "damaged" as const },
      reasonCode: "verified-transfer",
      sourceType: "inventory_command" as const
    };
    const successful = makePayload({
      levels: [
        {
          id: "level-source",
          aggregate_key: "sku-b:location-b:quarantine",
          quantity: 2,
          movement_count: 1
        }
      ]
    });

    await expect(
      recordInventoryMovement({
        payload: successful.payload,
        req: successful.req,
        request: genericRequest
      })
    ).resolves.toMatchObject({ kind: "created" });
    expect(successful.payload.db.commitTransaction).toHaveBeenCalledWith(
      "wrapper-tx"
    );

    const original = new Error("projection-write-failed");
    const failing = makePayload({
      levels: [
        {
          id: "level-1",
          aggregate_key: "sku-b:location-b:quarantine",
          quantity: 2,
          movement_count: 1
        }
      ],
      updateError: original
    });
    await expect(
      recordInventoryMovement({
        payload: failing.payload,
        req: failing.req,
        request: genericRequest
      })
    ).rejects.toBe(original);
    expect(failing.payload.db.rollbackTransaction).toHaveBeenCalledWith(
      "wrapper-tx"
    );
  });
});
