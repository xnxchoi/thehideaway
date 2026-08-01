import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashInventoryReservationRequest } from "./inventory-reservation-contracts";
import { finalizePaidOrderInventoryInTransaction } from "./inventory-reservation-payment-finalization";
import {
  expireInventoryReservationInTransaction,
  releaseOrderInventoryInTransaction,
  reserveOrderInventoryInTransaction
} from "./inventory-reservations";

const tracked = vi.hoisted(() => ({
  events: [] as string[],
  recordBatch: vi.fn(),
  idempotency: vi.fn(),
  movementIdempotency: vi.fn(),
  product: vi.fn(),
  sku: vi.fn(),
  location: vi.fn(),
  physicalAggregate: vi.fn(),
  reservationAggregate: vi.fn(),
  reservation: vi.fn()
}));

vi.mock("./inventory-ledger", () => ({
  recordInventoryMovementsInTransaction: tracked.recordBatch
}));

vi.mock("@/lib/db/sequences", () => ({
  inventoryReservationIdempotencyLock: tracked.idempotency,
  inventoryMovementIdempotencyLock: tracked.movementIdempotency,
  productInventoryLock: tracked.product,
  productSkuMutationLock: tracked.sku,
  inventoryLocationLock: tracked.location,
  inventoryAggregateLock: tracked.physicalAggregate,
  inventoryReservationAggregateLock: tracked.reservationAggregate,
  inventoryReservationLock: tracked.reservation
}));

const policy = {
  enabled: true as const,
  ttlMinutes: 15,
  locationCode: "SEOUL-01",
  safetyStock: 1,
  consumePoint: "payment_confirmed" as const,
  expiryBoundary: "at_or_after" as const,
  paymentTimeSource: "provider_paid_at" as const,
  latePaymentPolicy: "manual_review" as const,
  backorderMode: "disabled" as const
};

const reserveRequest = {
  idempotencyKey: "reservation-command-0001",
  operation: "reserve" as const,
  orderId: "order-1",
  skuId: "sku-1",
  locationId: "location-1",
  quantity: 2,
  expiresAt: "2026-07-22T03:15:00.000Z",
  effectiveAt: "2026-07-22T03:00:00.000Z"
};

const reservation = {
  id: "reservation-1",
  order: "order-1",
  sku: "sku-1",
  location: "location-1",
  quantity: 2,
  status: "active",
  expires_at: reserveRequest.expiresAt,
  reserved_at: reserveRequest.effectiveAt
};

const reserveEntry = {
  id: "reservation-entry-reserve",
  reservation: reservation.id,
  idempotency_key: reserveRequest.idempotencyKey,
  request_hash: "reserve-request-hash",
  operation: "reserve",
  quantity: reservation.quantity,
  effective_at: reserveRequest.effectiveAt
};

const req = {
  user: { id: "user-1", role: "user" },
  transactionID: "tx-1",
  context: {}
} as any;

type Stored = Record<string, any>;

function relationshipId(value: unknown): unknown {
  if (value && typeof value === "object") return (value as Stored).id;
  return value;
}

function matchesWhere(doc: Stored, where: any): boolean {
  if (!where) return true;
  if (Array.isArray(where.and)) {
    return where.and.every((clause: any) => matchesWhere(doc, clause));
  }
  if (Array.isArray(where.or)) {
    return where.or.some((clause: any) => matchesWhere(doc, clause));
  }
  return Object.entries(where).every(([field, condition]) => {
    if (field === "and" || field === "or") return true;
    const actual = relationshipId(doc[field]);
    if (!condition || typeof condition !== "object") {
      return actual === condition;
    }
    const comparison = condition as Stored;
    if ("equals" in comparison) return actual === comparison.equals;
    if ("in" in comparison) return comparison.in.includes(actual);
    if ("less_than_equal" in comparison) {
      return String(actual) <= String(comparison.less_than_equal);
    }
    if ("greater_than" in comparison) {
      return String(actual) > String(comparison.greater_than);
    }
    return true;
  });
}

function makePayload(input?: {
  reservations?: Stored[];
  entries?: Stored[];
  available?: number;
}) {
  let nextId = 1;
  const docs: Record<string, Stored[]> = {
    "product-orders": [{ id: "order-1", user: "user-1" }],
    "product-payments": [
      {
        id: "payment-1",
        order: "order-1",
        provider: "portone",
        status: "paid"
      }
    ],
    "product-variants": [
      {
        id: "sku-1",
        product: "product-1",
        sku: "LIS-001",
        active: true,
        identity_locked: true
      }
    ],
    "stock-locations": [{ id: "location-1", code: "SEOUL-01", active: true }],
    "inventory-levels": [
      {
        id: "physical-level-1",
        aggregate_key: "sku-1:location-1:available",
        sku: "sku-1",
        location: "location-1",
        disposition: "available",
        quantity: input?.available ?? 5,
        movement_count: 1
      }
    ],
    "inventory-reservations": [...(input?.reservations ?? [])],
    "inventory-reservation-entries": [...(input?.entries ?? [])]
  };

  const find = vi.fn(async ({ collection, where }: any) => ({
    docs: (docs[collection] ?? []).filter((doc) => matchesWhere(doc, where))
  }));
  const findByID = vi.fn(async ({ collection, id }: any) =>
    (docs[collection] ?? []).find((doc) => doc.id === id)
  );
  const create = vi.fn(async ({ collection, data }: any) => {
    const created = { id: `${collection}-${nextId++}`, ...data };
    (docs[collection] ??= []).push(created);
    return created;
  });
  const update = vi.fn(async ({ collection, id, data }: any) => {
    const index = (docs[collection] ?? []).findIndex((doc) => doc.id === id);
    if (index < 0) throw new Error(`missing-${collection}`);
    const updated = { ...docs[collection][index], ...data };
    docs[collection][index] = updated;
    return updated;
  });

  return {
    payload: {
      find,
      findByID,
      create,
      update,
      db: {
        sessions: {
          "tx-1": {
            db: {
              execute: vi.fn(async () => ({
                rows: [{ transaction_now: "2026-07-22T03:15:00.000Z" }]
              }))
            }
          }
        }
      }
    } as any,
    docs,
    find,
    findByID,
    create,
    update
  };
}

function terminalRequest(operation: "release" | "expire" | "consume") {
  return {
    ...reserveRequest,
    idempotencyKey: `reservation-${operation}-0001`,
    operation,
    reservationId: reservation.id,
    expiresAt: undefined,
    effectiveAt:
      operation === "expire"
        ? "2026-07-22T03:15:00.000Z"
        : "2026-07-22T03:05:00.000Z"
  };
}

describe("inventory reservation service", () => {
  beforeEach(() => {
    tracked.events.length = 0;
    for (const mock of Object.values(tracked)) {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    }
    tracked.recordBatch.mockResolvedValue({ results: [], projections: [] });
    tracked.idempotency.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`idempotency:${key}`)
    );
    tracked.product.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`product:${key}`)
    );
    tracked.movementIdempotency.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`movement:${key}`)
    );
    tracked.sku.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`sku:${key}`)
    );
    tracked.location.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`location:${key}`)
    );
    tracked.physicalAggregate.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`physical:${key}`)
    );
    tracked.reservationAggregate.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`reserved:${key}`)
    );
    tracked.reservation.mockImplementation(async (_p, _t, key) =>
      tracked.events.push(`reservation:${key}`)
    );
  });

  it("reserves a checkout batch without recording a physical movement", async () => {
    const { payload, create } = makePayload();

    const result = await reserveOrderInventoryInTransaction({
      payload,
      req,
      requests: [reserveRequest],
      policy
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ kind: "created" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-reservation-entries",
        data: expect.objectContaining({ operation: "reserve", quantity: 2 })
      })
    );
    expect(tracked.events).toEqual([
      "idempotency:reservation-command-0001",
      "product:product-1",
      "sku:sku-1",
      "location:location-1",
      "physical:sku-1:location-1:available",
      "reserved:sku-1:location-1",
      "reservation:order-1:sku-1:location-1"
    ]);
    expect(tracked.recordBatch).not.toHaveBeenCalled();
  });

  it("replays the same reserve command and rejects a changed request with the same key", async () => {
    const requestHash = hashInventoryReservationRequest(reserveRequest);
    const existingEntry = {
      id: "reservation-entry-1",
      reservation: reservation.id,
      idempotency_key: reserveRequest.idempotencyKey,
      request_hash: requestHash,
      operation: "reserve",
      quantity: 2
    };
    const { payload, create, update } = makePayload({
      reservations: [reservation],
      entries: [existingEntry]
    });

    await expect(
      reserveOrderInventoryInTransaction({
        payload,
        req,
        requests: [reserveRequest],
        policy
      })
    ).resolves.toMatchObject({ results: [{ kind: "replay" }] });
    await expect(
      reserveOrderInventoryInTransaction({
        payload,
        req,
        requests: [{ ...reserveRequest, quantity: 3 }],
        policy
      })
    ).rejects.toThrow("inventory-reservation-idempotency-conflict");
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(tracked.recordBatch).not.toHaveBeenCalled();
  });

  it.each([
    ["release", releaseOrderInventoryInTransaction],
    ["expire", expireInventoryReservationInTransaction]
  ] as const)(
    "%s closes reserved quantity without a physical movement",
    async (operation, execute) => {
      const { payload, docs } = makePayload({
        reservations: [{ ...reservation }],
        entries: [{ ...reserveEntry }]
      });

      await expect(
        execute({
          payload,
          req: { ...req, user: undefined },
          request: terminalRequest(operation)
        })
      ).resolves.toMatchObject({ kind: "created" });
      await expect(
        execute({
          payload,
          req: { ...req, user: undefined },
          request: terminalRequest(operation)
        })
      ).resolves.toMatchObject({ kind: "replay" });
      await expect(
        execute({
          payload,
          req: { ...req, user: undefined },
          request: { ...terminalRequest(operation), quantity: 3 }
        })
      ).rejects.toThrow("inventory-reservation-idempotency-conflict");

      expect(docs["inventory-reservations"][0].status).toBe(
        operation === "release" ? "released" : "expired"
      );
      expect(docs["inventory-reservation-entries"]).toContainEqual(
        expect.objectContaining({
          operation,
          actor: "system:inventory-reservation"
        })
      );
      expect(
        docs["inventory-reservation-entries"].filter(
          (entry) => entry.operation === operation
        )
      ).toHaveLength(1);
      expect(tracked.recordBatch).not.toHaveBeenCalled();
    }
  );

  it("consumes each active reservation once at authoritative payment confirmation", async () => {
    const { payload, docs } = makePayload({
      reservations: [{ ...reservation }],
      entries: [{ ...reserveEntry }]
    });

    const input = {
      payload,
      req: { ...req, user: undefined },
      orderId: "order-1",
      paymentId: "payment-1",
      idempotencyKey: "reservation-payment-0001",
      providerEventRef: "provider-event-row-1",
      providerPaidAt: "2026-07-22T03:05:00.000Z",
      policy
    };

    await expect(
      finalizePaidOrderInventoryInTransaction(input)
    ).resolves.toMatchObject({ kind: "created" });
    expect(tracked.recordBatch).toHaveBeenCalledTimes(1);
    expect(tracked.recordBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            kind: "outbound",
            quantity: 2,
            from: {
              locationId: "location-1",
              disposition: "available"
            },
            sourceType: "inventory_reservation",
            sourceRef: "reservation-1",
            actorId: "system:inventory-reservation"
          })
        ]
      })
    );
    expect(docs["inventory-reservations"][0].status).toBe("consumed");
    expect(docs["inventory-reservation-entries"]).toContainEqual(
      expect.objectContaining({
        operation: "consume",
        actor: "system:inventory-reservation",
        provider_event_ref: "provider-event-row-1"
      })
    );

    await expect(
      finalizePaidOrderInventoryInTransaction(input)
    ).resolves.toMatchObject({ kind: "replay" });
    expect(tracked.recordBatch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [undefined, "provider_timestamp_missing"],
    ["2026-07-22T02:59:59.999Z", "provider_timestamp_before_reservation"],
    ["2026-07-22T03:15:00.000Z", "provider_payment_late"]
  ] as const)(
    "records review evidence without consuming when paidAt is %s",
    async (providerPaidAt, evidenceCode) => {
      const { payload, docs } = makePayload({
        reservations: [{ ...reservation }],
        entries: [{ ...reserveEntry }]
      });

      await expect(
        finalizePaidOrderInventoryInTransaction({
          payload,
          req,
          orderId: "order-1",
          paymentId: "payment-1",
          idempotencyKey: "reservation-payment-review-0001",
          providerEventRef: "provider-event-row-1",
          providerPaidAt
        })
      ).resolves.toMatchObject({ kind: "paid_inventory_review" });

      expect(tracked.recordBatch).not.toHaveBeenCalled();
      expect(docs["inventory-reservations"][0].status).toBe("active");
      expect(docs["inventory-reservation-entries"]).toContainEqual(
        expect.objectContaining({
          operation: "late_payment_detected",
          evidence_code: evidenceCode,
          payment: "payment-1",
          provider_event_ref: "provider-event-row-1"
        })
      );
    }
  );

  it("records review evidence when physical stock is lost after reservation", async () => {
    tracked.recordBatch.mockRejectedValueOnce(
      new Error("insufficient-inventory-balance")
    );
    const { payload, docs } = makePayload({
      reservations: [{ ...reservation }],
      entries: [{ ...reserveEntry }]
    });

    await expect(
      finalizePaidOrderInventoryInTransaction({
        payload,
        req,
        orderId: "order-1",
        paymentId: "payment-1",
        idempotencyKey: "reservation-payment-shortfall-0001",
        providerEventRef: "provider-event-row-1",
        providerPaidAt: "2026-07-22T03:05:00.000Z"
      })
    ).resolves.toMatchObject({ kind: "paid_inventory_review" });

    expect(docs["inventory-reservations"][0].status).toBe("active");
    expect(docs["inventory-reservation-entries"]).toContainEqual(
      expect.objectContaining({
        operation: "late_payment_detected",
        evidence_code: "physical_inventory_unavailable",
        payment: "payment-1",
        provider_event_ref: "provider-event-row-1"
      })
    );
  });
});
