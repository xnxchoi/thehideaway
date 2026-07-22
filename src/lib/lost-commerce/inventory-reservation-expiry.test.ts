import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";

import { expireDueInventoryReservationOrders } from "./inventory-reservation-expiry";

const tracked = vi.hoisted(() => ({
  events: [] as string[],
  expire: vi.fn(),
  findDocs: vi.fn(),
  history: vi.fn(),
  lockOrder: vi.fn(),
  transactionTimestamp: vi.fn()
}));

vi.mock("./inventory-reservation-locks", () => ({
  lockOrderInventoryReservationsInTransaction: tracked.lockOrder
}));

vi.mock("./inventory-reservation-reconstruction", () => ({
  reservationHistory: tracked.history
}));

vi.mock("./inventory-reservation-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./inventory-reservation-store")>();
  return {
    ...actual,
    findReservationDocs: tracked.findDocs,
    reservationTransactionTimestamp: tracked.transactionTimestamp
  };
});

vi.mock("./inventory-reservations", () => ({
  expireInventoryReservationInTransaction: tracked.expire
}));

type Reservation = {
  id: string;
  order: string;
  sku: string;
  location: string;
  quantity: number;
  status: "active" | "expired";
  expires_at: string;
};

const atBoundary = "2026-07-22T03:15:00.000Z";

function reservation(
  id: string,
  order: string,
  expiresAt = atBoundary,
  status: Reservation["status"] = "active"
): Reservation {
  return {
    id,
    order,
    sku: `sku-${id}`,
    location: "location-1",
    quantity: 1,
    status,
    expires_at: expiresAt
  };
}

function payloadWithTransactions(...transactionIDs: string[]) {
  const pendingTransactionIDs = [...transactionIDs];
  const find = vi.fn();
  const discoveryExecute = vi.fn(async () => {
    const result = (await find()) as { docs: Reservation[] };
    return {
      rows: [...new Set(result.docs.map(({ order }) => order))].map(
        (order_id) => ({ order_id })
      )
    };
  });
  const beginTransaction = vi.fn(async () => pendingTransactionIDs.shift());
  const commitTransaction = vi.fn(async (transactionID: string) => {
    tracked.events.push(`commit:${transactionID}`);
  });
  const rollbackTransaction = vi.fn(async (transactionID: string) => {
    tracked.events.push(`rollback:${transactionID}`);
  });
  const error = vi.fn();
  return {
    payload: {
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
        sessions: Object.fromEntries(
          transactionIDs.map((transactionID) => [
            transactionID,
            { db: { execute: discoveryExecute } }
          ])
        )
      },
      find,
      logger: { error }
    } as unknown as Payload,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    discoveryExecute,
    error,
    find
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  tracked.events.length = 0;
  tracked.transactionTimestamp.mockImplementation(async (_payload, req) => {
    tracked.events.push(`time:${req.transactionID}`);
    return atBoundary;
  });
  tracked.lockOrder.mockImplementation(async ({ req, orderId }) => {
    tracked.events.push(`lock:${String(orderId)}:${req.transactionID}`);
    return [];
  });
  tracked.history.mockImplementation(async (_payload, _req, value) => ({
    status: value.status,
    activeQuantity: value.status === "active" ? value.quantity : 0
  }));
  tracked.expire.mockImplementation(async ({ req, request }) => {
    tracked.events.push(`expire:${request.reservationId}:${req.transactionID}`);
    return { kind: "created" };
  });
});

describe("recurring inventory reservation expiry", () => {
  it.each([0, -1, 1.5, 101, "25"])(
    "rejects an invalid batch bound: %s",
    async (batchSize) => {
      const { payload, beginTransaction } = payloadWithTransactions();

      await expect(
        expireDueInventoryReservationOrders({
          payload,
          batchSize: batchSize as number
        })
      ).rejects.toThrow("invalid-inventory-reservation-expiry-batch-size");
      expect(beginTransaction).not.toHaveBeenCalled();
    }
  );

  it("discovers a bounded deterministic order batch using database transaction time", async () => {
    const firstSibling = reservation("1", "order-a");
    const secondSibling = reservation("2", "order-a");
    const laterOrder = reservation("3", "order-b");
    const { payload, discoveryExecute, find } = payloadWithTransactions(
      "tx-discovery",
      "tx-order-a",
      "tx-order-b"
    );
    discoveryExecute.mockResolvedValue({
      rows: [{ order_id: "order-a" }, { order_id: "order-b" }]
    });
    // A reservation-row bound would spend the whole budget on order-a.
    find.mockResolvedValue({ docs: [firstSibling, secondSibling] });
    tracked.findDocs
      .mockResolvedValueOnce([firstSibling, secondSibling])
      .mockResolvedValueOnce([laterOrder]);

    const result = await expireDueInventoryReservationOrders({
      payload,
      batchSize: 2
    });

    expect(discoveryExecute).toHaveBeenCalledTimes(1);
    expect(find).not.toHaveBeenCalled();
    expect(result).toEqual({
      ordersExamined: 2,
      ordersExpired: 2,
      ordersFailed: 0,
      reservationsExpired: 3
    });
  });

  it("locks the order reservation set before checking the exact boundary and expires every active sibling atomically", async () => {
    const first = reservation("1", "order-1");
    const second = reservation("2", "order-1");
    const { payload, find, commitTransaction } = payloadWithTransactions(
      "tx-discovery",
      "tx-order"
    );
    find.mockResolvedValue({ docs: [first] });
    tracked.findDocs.mockResolvedValue([second, first]);

    const result = await expireDueInventoryReservationOrders({
      payload,
      batchSize: 10
    });

    expect(tracked.events).toEqual([
      "commit:tx-discovery",
      "lock:order-1:tx-order",
      "time:tx-order",
      "expire:1:tx-order",
      "expire:2:tx-order",
      "commit:tx-order"
    ]);
    expect(tracked.expire).toHaveBeenCalledTimes(2);
    expect(tracked.expire).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        payload,
        locksHeld: true,
        req: expect.objectContaining({ transactionID: "tx-order" }),
        request: expect.objectContaining({
          operation: "expire",
          orderId: "order-1",
          reservationId: "1",
          effectiveAt: atBoundary
        })
      })
    );
    expect(commitTransaction).toHaveBeenLastCalledWith("tx-order");
    expect(result.reservationsExpired).toBe(2);
  });

  it("does not partially expire an order when any active sibling is not yet due", async () => {
    const due = reservation("1", "order-1");
    const future = reservation("2", "order-1", "2026-07-22T03:15:00.001Z");
    const { payload, find, commitTransaction } = payloadWithTransactions(
      "tx-discovery",
      "tx-order"
    );
    find.mockResolvedValue({ docs: [due] });
    tracked.findDocs.mockResolvedValue([due, future]);

    const result = await expireDueInventoryReservationOrders({ payload });

    expect(tracked.expire).not.toHaveBeenCalled();
    expect(commitTransaction).toHaveBeenCalledWith("tx-order");
    expect(result).toEqual({
      ordersExamined: 1,
      ordersExpired: 0,
      ordersFailed: 0,
      reservationsExpired: 0
    });
  });

  it("treats one millisecond before expiry as not due using the locked transaction clock", async () => {
    const candidate = reservation("1", "order-1");
    const { payload, find } = payloadWithTransactions(
      "tx-discovery",
      "tx-order"
    );
    find.mockResolvedValue({ docs: [candidate] });
    tracked.findDocs.mockResolvedValue([candidate]);
    tracked.transactionTimestamp.mockResolvedValueOnce(
      "2026-07-22T03:14:59.999Z"
    );

    const result = await expireDueInventoryReservationOrders({ payload });

    expect(tracked.expire).not.toHaveBeenCalled();
    expect(result.reservationsExpired).toBe(0);
  });

  it("rolls back an allowlisted corrupt order, reports its stable classification, and continues later candidates", async () => {
    const first = reservation("1", "order-1");
    const later = reservation("2", "order-2");
    const {
      payload,
      discoveryExecute,
      error,
      find,
      commitTransaction,
      rollbackTransaction
    } = payloadWithTransactions("tx-discovery", "tx-order-1", "tx-order-2");
    discoveryExecute.mockResolvedValue({
      rows: [{ order_id: "order-1" }, { order_id: "order-2" }]
    });
    find.mockResolvedValue({ docs: [first, later] });
    tracked.findDocs
      .mockResolvedValueOnce([first])
      .mockResolvedValueOnce([later]);
    tracked.history.mockImplementation(async (_payload, _req, value) => {
      if (value.order === "order-1") {
        throw new Error("inventory-reservation-history-corrupt");
      }
      return { status: value.status, activeQuantity: value.quantity };
    });

    const result = await expireDueInventoryReservationOrders({ payload });

    expect(rollbackTransaction).toHaveBeenCalledWith("tx-order-1");
    expect(commitTransaction).not.toHaveBeenCalledWith("tx-order-1");
    expect(commitTransaction).toHaveBeenCalledWith("tx-order-2");
    expect(error).toHaveBeenCalledWith({
      code: "inventory-reservation-expiry-order-data-invalid",
      msg: "inventory-reservation-expiry-order-failed",
      orderId: "order-1"
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain("history-corrupt");
    expect(result).toEqual({
      ordersExamined: 2,
      ordersExpired: 1,
      ordersFailed: 1,
      reservationsExpired: 1
    });
  });

  it("rethrows failures outside the recovery allowlist without logging private details", async () => {
    const candidate = reservation("1", "order-1");
    const later = reservation("2", "order-2");
    const { payload, discoveryExecute, error, rollbackTransaction } =
      payloadWithTransactions("tx-discovery", "tx-order-1", "tx-order-2");
    discoveryExecute.mockResolvedValue({
      rows: [{ order_id: "order-1" }, { order_id: "order-2" }]
    });
    tracked.findDocs
      .mockResolvedValueOnce([candidate])
      .mockResolvedValueOnce([later]);
    tracked.expire.mockRejectedValueOnce(
      new Error("sensitive-database-failure")
    );

    await expect(
      expireDueInventoryReservationOrders({ payload, batchSize: 2 })
    ).rejects.toThrow("sensitive-database-failure");

    expect(rollbackTransaction).toHaveBeenCalledWith("tx-order-1");
    expect(error).not.toHaveBeenCalled();
    expect(tracked.events).not.toContain("lock:order-2:tx-order-2");
  });

  it("rotates a bounded scan so persistent failures cannot starve a later backlog", async () => {
    const firstPoison = reservation("1", "order-a");
    const secondPoison = reservation("2", "order-b");
    const healthy = reservation("3", "order-c");
    const { payload, discoveryExecute } = payloadWithTransactions(
      "tx-discovery-1",
      "tx-order-a-1",
      "tx-order-b-1",
      "tx-discovery-2",
      "tx-order-c",
      "tx-order-a-2"
    );
    discoveryExecute
      .mockResolvedValueOnce({
        rows: [{ order_id: "order-a" }, { order_id: "order-b" }]
      })
      .mockResolvedValueOnce({
        rows: [{ order_id: "order-c" }, { order_id: "order-a" }]
      });
    tracked.findDocs
      .mockResolvedValueOnce([firstPoison])
      .mockResolvedValueOnce([secondPoison])
      .mockResolvedValueOnce([healthy])
      .mockResolvedValueOnce([firstPoison]);
    tracked.history.mockImplementation(async (_payload, _req, value) => {
      if (value.order === "order-a" || value.order === "order-b") {
        throw new Error("inventory-reservation-history-corrupt");
      }
      return { status: value.status, activeQuantity: value.quantity };
    });

    const firstRun = await expireDueInventoryReservationOrders({
      payload,
      batchSize: 1
    });
    const secondRun = await expireDueInventoryReservationOrders({
      payload,
      batchSize: 1
    });

    expect(firstRun).toEqual({
      ordersExamined: 2,
      ordersExpired: 0,
      ordersFailed: 2,
      reservationsExpired: 0
    });
    expect(secondRun).toEqual({
      ordersExamined: 1,
      ordersExpired: 1,
      ordersFailed: 0,
      reservationsExpired: 1
    });
    expect(tracked.events).toContain("expire:3:tx-order-c");
    expect(tracked.events).not.toContain("lock:order-a:tx-order-a-2");
  });

  it("is replay-safe when a previously selected order no longer has active reservations", async () => {
    const candidate = reservation("1", "order-1");
    const terminal = reservation("1", "order-1", atBoundary, "expired");
    const { payload, find } = payloadWithTransactions(
      "tx-discovery",
      "tx-order"
    );
    find.mockResolvedValue({ docs: [candidate] });
    tracked.findDocs.mockResolvedValue([terminal]);

    const result = await expireDueInventoryReservationOrders({ payload });

    expect(tracked.expire).not.toHaveBeenCalled();
    expect(result.reservationsExpired).toBe(0);
  });
});
