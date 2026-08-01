import { describe, expect, it, vi } from "vitest";

import {
  listInventoryReservationOperatorQueue,
  loadInventoryReservationOperatorOrderState
} from "./inventory-reservation-operator-queries";

describe("inventory reservation operator queries", () => {
  it("returns a bounded PII-free stuck queue with evidence links", async () => {
    const find = vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === "inventory-reservations") {
        return {
          docs: [
            {
              id: "reservation-1",
              order: "order-1",
              sku: "sku-1",
              location: "location-1",
              status: "active",
              expires_at: "2026-07-23T00:00:00.000Z",
              updatedAt: "2026-07-22T23:00:00.000Z",
              terminal_at: null
            }
          ]
        };
      }
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              status: "pending_payment",
              payment_status: "pending",
              updatedAt: "2026-07-22T23:00:00.000Z",
              email_snapshot: "private@example.com",
              delivery_address_snapshot: { line1: "private" }
            }
          ]
        };
      }
      if (collection === "product-payments") {
        return {
          docs: [
            {
              id: "payment-1",
              order: "order-1",
              status: "pending",
              paid_at: null,
              updatedAt: "2026-07-22T23:00:00.000Z"
            }
          ]
        };
      }
      if (collection === "inventory-reservation-entries") {
        return { docs: [{ id: "entry-1", reservation: "reservation-1" }] };
      }
      if (collection === "inventory-levels") {
        return {
          docs: [
            {
              id: "level-1",
              aggregate_key: "sku-1:location-1:available",
              quantity: 2
            }
          ]
        };
      }
      throw new Error(`unexpected collection ${collection}`);
    });

    const result = await listInventoryReservationOperatorQueue({
      payload: { find } as never,
      queue: "stuck",
      now: new Date("2026-07-23T00:00:00.000Z"),
      expiringHorizonMinutes: 15,
      limit: 10
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      orderId: "order-1",
      queue: "stuck",
      permittedActions: ["expire"],
      reservationIds: ["reservation-1"],
      evidence: {
        entryIds: ["entry-1"],
        inventoryLevelIds: ["level-1"]
      }
    });
    expect(JSON.stringify(result)).not.toContain("private@example.com");
    expect(JSON.stringify(result)).not.toContain("delivery_address");
  });

  it("shares authoritative payment selection and inventory versioning between queue and order state", async () => {
    let inventoryQuantity = 0;
    let inventoryMovementCount = 1;
    const order = {
      id: "order-1",
      order_ref: "order-ref-1",
      status: "paid_inventory_review",
      payment_status: "paid",
      updatedAt: "2026-07-23T00:00:00.000Z"
    };
    const reservations = [
      {
        id: "reservation-1",
        order: "order-1",
        sku: "sku-1",
        location: "location-1",
        status: "expired",
        expires_at: "2026-07-22T23:55:00.000Z",
        updatedAt: "2026-07-23T00:00:00.000Z",
        terminal_at: "2026-07-23T00:00:00.000Z"
      }
    ];
    const payments = [
      {
        id: "payment-newer-pending",
        order: "order-1",
        payment_ref: "payment-z-pending",
        provider: "portone",
        status: "pending",
        paid_at: null,
        portone_transaction_ref: null,
        updatedAt: "2026-07-23T00:02:00.000Z"
      },
      {
        id: "payment-authoritative-paid",
        order: "order-1",
        payment_ref: "payment-a-paid",
        provider: "portone",
        status: "paid",
        paid_at: "2026-07-23T00:00:00.000Z",
        portone_transaction_ref: "portone:transaction-1",
        updatedAt: "2026-07-23T00:01:00.000Z"
      }
    ];
    const find = vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === "product-orders") return { docs: [order] };
      if (collection === "inventory-reservations") {
        return { docs: reservations };
      }
      if (collection === "product-payments") return { docs: payments };
      if (collection === "inventory-reservation-entries") {
        return { docs: [{ id: "entry-1", reservation: "reservation-1" }] };
      }
      if (collection === "inventory-levels") {
        return {
          docs: [
            {
              id: "level-1",
              aggregate_key: "sku-1:location-1:available",
              quantity: inventoryQuantity,
              movement_count: inventoryMovementCount,
              updatedAt: "2026-07-23T00:03:00.000Z"
            }
          ]
        };
      }
      throw new Error(`unexpected collection ${collection}`);
    });
    const payload = {
      find,
      findByID: vi.fn(async () => order)
    } as never;
    const req = { user: { id: "admin-1", role: "admin" } } as never;

    const beforeQueue = await listInventoryReservationOperatorQueue({
      payload,
      req,
      queue: "paid_inventory_review",
      now: new Date("2026-07-23T00:05:00.000Z"),
      limit: 10
    });
    const beforeState = await loadInventoryReservationOperatorOrderState({
      payload,
      req,
      orderId: "order-1"
    });

    expect(beforeQueue.items[0]).toMatchObject({
      paymentId: "payment-authoritative-paid",
      paymentStatus: "paid",
      stateHash: beforeState.stateHash
    });
    expect(beforeState.payment?.id).toBe("payment-authoritative-paid");

    inventoryQuantity = 1;
    inventoryMovementCount = 2;
    const afterQueue = await listInventoryReservationOperatorQueue({
      payload,
      req,
      queue: "paid_inventory_review",
      now: new Date("2026-07-23T00:05:00.000Z"),
      limit: 10
    });
    const afterState = await loadInventoryReservationOperatorOrderState({
      payload,
      req,
      orderId: "order-1"
    });

    expect(afterQueue.items[0]?.stateHash).toBe(afterState.stateHash);
    expect(afterState.stateHash).not.toBe(beforeState.stateHash);
    expect(afterQueue.items[0]?.stateHash).not.toBe(
      beforeQueue.items[0]?.stateHash
    );
  });

  it("finds an authoritative older paid payment beyond four newer rows", async () => {
    const order = {
      id: "order-1",
      order_ref: "order-ref-1",
      status: "paid_inventory_review",
      payment_status: "paid",
      updatedAt: "2026-07-23T00:10:00.000Z"
    };
    const reservations = [
      {
        id: "reservation-1",
        order: "order-1",
        sku: "sku-1",
        location: "location-1",
        status: "expired",
        expires_at: "2026-07-23T00:00:00.000Z",
        updatedAt: "2026-07-23T00:01:00.000Z",
        terminal_at: "2026-07-23T00:01:00.000Z"
      }
    ];
    const payments = [
      ...[4, 3, 2, 1].map((minute) => ({
        id: `payment-newer-${minute}`,
        order: "order-1",
        payment_ref: `payment-newer-${minute}`,
        provider: "portone",
        status: "pending",
        paid_at: null,
        portone_transaction_ref: null,
        updatedAt: `2026-07-23T00:0${minute + 5}:00.000Z`
      })),
      {
        id: "payment-authoritative-older",
        order: "order-1",
        payment_ref: "payment-authoritative-older",
        provider: "portone",
        status: "paid",
        paid_at: "2026-07-23T00:01:00.000Z",
        portone_transaction_ref: "portone:authoritative-older",
        updatedAt: "2026-07-23T00:02:00.000Z"
      }
    ];
    const find = vi.fn(
      async ({ collection, limit }: { collection: string; limit: number }) => {
        if (collection === "inventory-reservations") {
          return { docs: reservations };
        }
        if (collection === "product-payments") {
          return { docs: payments.slice(0, limit) };
        }
        if (collection === "inventory-levels") return { docs: [] };
        throw new Error(`unexpected collection ${collection}`);
      }
    );

    const state = await loadInventoryReservationOperatorOrderState({
      payload: { find, findByID: vi.fn(async () => order) } as never,
      req: { user: { id: "admin-1", role: "admin" } } as never,
      orderId: "order-1"
    });

    expect(state.payment).toMatchObject({
      id: "payment-authoritative-older",
      status: "paid",
      transactionReference: "portone:authoritative-older"
    });
  });

  it("does not let another order starve authoritative payments from the queue page", async () => {
    const orders = [
      {
        id: "order-noisy",
        order_ref: "order-ref-noisy",
        status: "paid_inventory_review",
        payment_status: "paid",
        updatedAt: "2026-07-23T00:00:00.000Z"
      },
      {
        id: "order-target",
        order_ref: "order-ref-target",
        status: "paid_inventory_review",
        payment_status: "paid",
        updatedAt: "2026-07-23T00:01:00.000Z"
      }
    ];
    const reservations = orders.map((order, index) => ({
      id: `reservation-${index}`,
      order: order.id,
      sku: `sku-${index}`,
      location: "location-1",
      status: "expired",
      expires_at: "2026-07-22T23:55:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
      terminal_at: "2026-07-23T00:00:00.000Z"
    }));
    const payments = [
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `payment-noisy-${index}`,
        order: "order-noisy",
        payment_ref: `payment-noisy-${index}`,
        provider: "portone",
        status: "pending",
        paid_at: null,
        portone_transaction_ref: null,
        updatedAt: `2026-07-23T00:${String(index).padStart(2, "0")}:00.000Z`
      })),
      {
        id: "payment-target-authoritative",
        order: "order-target",
        payment_ref: "payment-target-authoritative",
        provider: "portone",
        status: "paid",
        paid_at: "2026-07-22T23:59:00.000Z",
        portone_transaction_ref: "portone:target-authoritative",
        updatedAt: "2026-07-22T23:59:00.000Z"
      }
    ];
    const find = vi.fn(
      async ({
        collection,
        limit,
        where
      }: {
        collection: string;
        limit: number;
        where: Record<string, { equals?: string; in?: string[] }>;
      }) => {
        if (collection === "product-orders") return { docs: orders };
        if (collection === "inventory-reservations") {
          return { docs: reservations };
        }
        if (collection === "product-payments") {
          const orderFilter = where.order;
          const matching = payments.filter((payment) =>
            orderFilter?.equals
              ? payment.order === orderFilter.equals
              : orderFilter?.in?.includes(payment.order)
          );
          return { docs: matching.slice(0, limit) };
        }
        if (collection === "inventory-reservation-entries") {
          return { docs: [] };
        }
        if (collection === "inventory-levels") return { docs: [] };
        throw new Error(`unexpected collection ${collection}`);
      }
    );

    const queue = await listInventoryReservationOperatorQueue({
      payload: { find } as never,
      req: { user: { id: "admin-1", role: "admin" } } as never,
      queue: "paid_inventory_review",
      now: new Date("2026-07-23T00:10:00.000Z"),
      limit: 2
    });

    expect(
      queue.items.find((item) => item.orderId === "order-target")
    ).toMatchObject({
      paymentId: "payment-target-authoritative",
      paymentStatus: "paid"
    });
  });

  it("fails closed when a complete queue scan exceeds its bound", async () => {
    await expect(
      listInventoryReservationOperatorQueue({
        payload: {
          find: vi.fn(async () => ({
            docs: [],
            hasNextPage: true,
            totalDocs: 5001
          }))
        } as never,
        queue: "active",
        limit: 25
      })
    ).rejects.toThrow("inventory-reservation-operator-scan-limit");
  });
});
