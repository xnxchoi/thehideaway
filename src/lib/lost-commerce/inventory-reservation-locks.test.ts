import { describe, expect, it, vi } from "vitest";

const events = vi.hoisted(() => [] as string[]);
vi.mock("@/lib/db/sequences", () => ({
  inventoryReservationIdempotencyLock: vi.fn(async () => events.push("entry")),
  inventoryMovementIdempotencyLock: vi.fn(async () => events.push("movement")),
  productInventoryLock: vi.fn(async () => events.push("product")),
  productSkuMutationLock: vi.fn(async () => events.push("sku")),
  inventoryLocationLock: vi.fn(async () => events.push("location")),
  inventoryAggregateLock: vi.fn(async () => events.push("physical")),
  inventoryReservationAggregateLock: vi.fn(async () => events.push("reserved")),
  inventoryReservationLock: vi.fn(async () => events.push("reservation"))
}));

describe("lockOrderInventoryReservationsInTransaction", () => {
  it("locks terminal idempotency before physical and reservation identities", async () => {
    events.length = 0;
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: "reservation-1",
            order: "order-1",
            sku: "sku-1",
            location: "location-1",
            quantity: 1
          }
        ]
      })),
      findByID: vi.fn(async () => ({ id: "sku-1", product: "product-1" }))
    } as any;

    const { lockOrderInventoryReservationsInTransaction } =
      await import("./inventory-reservation-locks");
    await lockOrderInventoryReservationsInTransaction({
      payload,
      req: { transactionID: "tx-1" } as any,
      orderId: "order-1",
      terminal: { operation: "consume", baseKey: "payment-command-0001" }
    });

    expect(events).toEqual([
      "entry",
      "movement",
      "product",
      "sku",
      "location",
      "physical",
      "reserved",
      "reservation"
    ]);
  });

  it("does not take a movement key for release terminal locks", async () => {
    events.length = 0;
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: "reservation-1",
            order: "order-1",
            sku: "sku-1",
            location: "location-1",
            quantity: 1
          }
        ]
      })),
      findByID: vi.fn(async () => ({
        id: "sku-1",
        product: "product-1"
      }))
    } as any;
    const { lockOrderInventoryReservationsInTransaction } =
      await import("./inventory-reservation-locks");

    await lockOrderInventoryReservationsInTransaction({
      payload,
      req: { transactionID: "tx-1" } as any,
      orderId: "order-1",
      terminal: { operation: "release", baseKey: "cancel-command-0001" }
    });

    expect(events).toEqual([
      "entry",
      "product",
      "sku",
      "location",
      "physical",
      "reserved",
      "reservation"
    ]);
  });

  it("locks identities without terminal command keys", async () => {
    events.length = 0;
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: "reservation-1",
            order: "order-1",
            sku: "sku-1",
            location: "location-1",
            quantity: 1
          }
        ]
      })),
      findByID: vi.fn(async () => ({ product: "product-1" }))
    } as any;
    const { lockOrderInventoryReservationsInTransaction } =
      await import("./inventory-reservation-locks");

    await lockOrderInventoryReservationsInTransaction({
      payload,
      req: { transactionID: "tx-1" } as any,
      orderId: "order-1"
    });

    expect(events).toEqual([
      "product",
      "sku",
      "location",
      "physical",
      "reserved",
      "reservation"
    ]);
  });

  it.each([
    [
      "corrupt reservation relationship",
      { id: null, sku: "sku-1", location: "location-1" },
      { product: "product-1" },
      "inventory-reservation-history-corrupt"
    ],
    [
      "missing product relationship",
      { id: "reservation-1", sku: "sku-1", location: "location-1" },
      { product: null },
      "inventory-reservation-sku-unavailable"
    ]
  ] as const)("rejects %s", async (_name, reservation, sku, error) => {
    const payload = {
      find: vi.fn(async () => ({ docs: [reservation] })),
      findByID: vi.fn(async () => sku)
    } as any;
    const { lockOrderInventoryReservationsInTransaction } =
      await import("./inventory-reservation-locks");

    await expect(
      lockOrderInventoryReservationsInTransaction({
        payload,
        req: { transactionID: "tx-1" } as any,
        orderId: "order-1"
      })
    ).rejects.toThrow(error);
  });
});
