import { describe, expect, it, vi } from "vitest";

import {
  reconcileInventoryLedger,
  reconstructInventoryLedger
} from "./inventory-reconciliation";

const movements = [
  {
    id: "movement-3",
    sku: "sku-1",
    kind: "transfer",
    quantity: 2,
    from_location: "location-a",
    from_disposition: "quarantine",
    to_location: "location-a",
    to_disposition: "available"
  },
  {
    id: "movement-1",
    sku: { id: "sku-1" },
    kind: "inbound",
    quantity: 5,
    from_location: null,
    from_disposition: null,
    to_location: { id: "location-a" },
    to_disposition: "quarantine"
  },
  {
    id: "movement-4",
    sku: "sku-1",
    kind: "outbound",
    quantity: 1,
    from_location: "location-a",
    from_disposition: "available",
    to_location: null,
    to_disposition: null
  },
  {
    id: "movement-2",
    sku: "sku-2",
    kind: "inbound",
    quantity: 7,
    to_location: "location-b",
    to_disposition: "damaged"
  }
];

function makePayload(input: {
  movements?: Record<string, unknown>[];
  levels?: Record<string, unknown>[];
}) {
  const create = vi.fn();
  const update = vi.fn();
  const remove = vi.fn();
  const execute = vi.fn(async () => undefined);
  const find = vi.fn(async ({ collection }: any) => ({
    docs:
      collection === "inventory-movements"
        ? (input.movements ?? [])
        : (input.levels ?? [])
  }));
  const db = {
    beginTransaction: vi.fn(async () => "tx-1"),
    commitTransaction: vi.fn(async () => undefined),
    rollbackTransaction: vi.fn(async () => undefined),
    sessions: { "tx-1": { db: { execute } } }
  };
  return {
    payload: { find, create, update, delete: remove, db } as any,
    find,
    create,
    update,
    remove,
    execute,
    db
  };
}

describe("inventory ledger reconstruction", () => {
  it("folds both movement endpoints and returns stable aggregate-key order", async () => {
    const { payload } = makePayload({ movements });

    await expect(reconstructInventoryLedger(payload)).resolves.toEqual([
      {
        aggregateKey: "sku-1:location-a:available",
        skuId: "sku-1",
        locationId: "location-a",
        disposition: "available",
        quantity: 1,
        movementCount: 2
      },
      {
        aggregateKey: "sku-1:location-a:quarantine",
        skuId: "sku-1",
        locationId: "location-a",
        disposition: "quarantine",
        quantity: 3,
        movementCount: 2
      },
      {
        aggregateKey: "sku-2:location-b:damaged",
        skuId: "sku-2",
        locationId: "location-b",
        disposition: "damaged",
        quantity: 7,
        movementCount: 1
      }
    ]);
  });

  it("returns an empty reconstruction for no movements", async () => {
    const { payload } = makePayload({ movements: [] });
    await expect(reconstructInventoryLedger(payload)).resolves.toEqual([]);
  });

  it("fails explicitly on malformed durable movement evidence", async () => {
    const { payload } = makePayload({
      movements: [{ ...movements[0], quantity: 0 }]
    });
    await expect(reconstructInventoryLedger(payload)).rejects.toThrow(
      "inventory-movement-record-corrupt"
    );
  });
});

describe("inventory ledger reconciliation", () => {
  it("reports missing, unexpected, quantity, and movement-count mismatches in stable order", async () => {
    const { payload, create, update, remove, execute, db, find } = makePayload({
      movements,
      levels: [
        {
          aggregate_key: "sku-1:location-a:available",
          sku: "sku-1",
          location: "location-a",
          disposition: "available",
          quantity: 99,
          movement_count: 2
        },
        {
          aggregate_key: "sku-1:location-a:quarantine",
          sku: "sku-1",
          location: "location-a",
          disposition: "quarantine",
          quantity: 3,
          movement_count: 99
        },
        {
          aggregate_key: "sku-9:location-z:discarded",
          sku: "sku-9",
          location: "location-z",
          disposition: "discarded",
          quantity: 1,
          movement_count: 1
        }
      ]
    });

    const report = await reconcileInventoryLedger(payload);

    expect(report).toEqual([
      expect.objectContaining({
        kind: "quantity_mismatch",
        aggregateKey: "sku-1:location-a:available",
        expected: 1,
        actual: 99
      }),
      expect.objectContaining({
        kind: "movement_count_mismatch",
        aggregateKey: "sku-1:location-a:quarantine",
        expected: 2,
        actual: 99
      }),
      expect.objectContaining({
        kind: "missing_projection",
        aggregateKey: "sku-2:location-b:damaged"
      }),
      expect.objectContaining({
        kind: "unexpected_projection",
        aggregateKey: "sku-9:location-z:discarded"
      })
    ]);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(find.mock.calls.map(([args]) => args.req)).toEqual([
      expect.objectContaining({ transactionID: "tx-1" }),
      expect.objectContaining({ transactionID: "tx-1" })
    ]);
    expect(find.mock.calls[0]?.[0].req).toBe(find.mock.calls[1]?.[0].req);
    expect(db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("returns no mismatches when cached projections match the fold", async () => {
    const { payload } = makePayload({
      movements,
      levels: [
        {
          aggregate_key: "sku-1:location-a:available",
          quantity: 1,
          movement_count: 2
        },
        {
          aggregate_key: "sku-1:location-a:quarantine",
          quantity: 3,
          movement_count: 2
        },
        {
          aggregate_key: "sku-2:location-b:damaged",
          quantity: 7,
          movement_count: 1
        }
      ]
    });
    await expect(reconcileInventoryLedger(payload)).resolves.toEqual([]);
  });
});
