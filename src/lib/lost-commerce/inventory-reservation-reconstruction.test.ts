import { describe, expect, it, vi } from "vitest";

import {
  activeReservedForAggregate,
  reconstructInventoryReservations,
  reconstructReservationHistory,
  reservationHistory
} from "./inventory-reservation-reconstruction";

const activeReservation = {
  id: "reservation-active",
  sku: "sku-b",
  location: "location-1",
  quantity: 2,
  status: "active"
};

const reserveEntry = {
  id: "entry-reserve",
  reservation: activeReservation.id,
  operation: "reserve",
  quantity: 2,
  createdAt: "2026-07-22T00:00:00.000Z"
};

function payloadWithHistory(input?: {
  reservations?: Record<string, unknown>[];
  entries?: Record<string, unknown>[];
}) {
  const reservations = input?.reservations ?? [activeReservation];
  const entries = input?.entries ?? [reserveEntry];
  const find = vi.fn(async ({ collection, where }: any) => {
    if (collection === "inventory-reservations") {
      const clauses = where?.and ?? [];
      return {
        docs: reservations.filter((reservation) =>
          clauses.every((clause: any) => {
            const [field, condition] = Object.entries(clause)[0] as [
              string,
              { equals: unknown }
            ];
            return reservation[field] === condition.equals;
          })
        )
      };
    }
    return {
      docs: entries.filter(
        (entry) => entry.reservation === where?.reservation?.equals
      )
    };
  });
  return { payload: { find } as any, find };
}

describe("inventory reservation reconstruction", () => {
  it.each([
    ["active", [reserveEntry], 2],
    [
      "active",
      [
        reserveEntry,
        {
          ...reserveEntry,
          id: "entry-review",
          operation: "late_payment_detected"
        }
      ],
      2
    ],
    ["released", [reserveEntry, { ...reserveEntry, operation: "release" }], 0],
    ["expired", [reserveEntry, { ...reserveEntry, operation: "expire" }], 0],
    ["consumed", [reserveEntry, { ...reserveEntry, operation: "consume" }], 0]
  ] as const)(
    "reconstructs a valid %s history",
    (status, entries, activeQuantity) => {
      expect(
        reconstructReservationHistory({ ...activeReservation, status }, entries)
      ).toEqual({ status, activeQuantity });
    }
  );

  it("rejects review evidence that precedes the reservation event", () => {
    expect(() =>
      reconstructReservationHistory(activeReservation, [
        { ...reserveEntry, operation: "late_payment_detected" },
        reserveEntry
      ])
    ).toThrow("inventory-reservation-history-corrupt");
  });

  it.each([
    { entries: [{ ...reserveEntry, quantity: 1 }] },
    { entries: [reserveEntry, reserveEntry] },
    { entries: [{ ...reserveEntry, operation: "release" }] },
    { entries: [reserveEntry, { ...reserveEntry, operation: "unknown" }] }
  ])("rejects corrupt event sequences", (entries) => {
    expect(() =>
      reconstructReservationHistory(activeReservation, entries.entries)
    ).toThrow("inventory-reservation-history-corrupt");
  });

  it("rejects a root status that disagrees with its append-only history", () => {
    expect(() =>
      reconstructReservationHistory(
        { ...activeReservation, status: "released" },
        [reserveEntry]
      )
    ).toThrow("inventory-reservation-history-corrupt");
  });

  it("loads one reservation history by relationship ID", async () => {
    const { payload, find } = payloadWithHistory();
    await expect(
      reservationHistory(payload, { transactionID: "tx-1" } as any, {
        ...activeReservation,
        id: { id: activeReservation.id }
      })
    ).resolves.toEqual({ status: "active", activeQuantity: 2 });
    expect(find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: "inventory-reservation-entries",
        sort: ["createdAt", "id"],
        where: { reservation: { equals: activeReservation.id } }
      })
    );
  });

  it("rejects a reservation without a usable ID", async () => {
    const { payload } = payloadWithHistory();
    await expect(
      reservationHistory(payload, { transactionID: "tx-1" } as any, {
        ...activeReservation,
        id: null
      })
    ).rejects.toThrow("inventory-reservation-history-corrupt");
  });

  it("sums active reservations for one SKU and location", async () => {
    const second = {
      ...activeReservation,
      id: "reservation-second",
      quantity: 3
    };
    const { payload } = payloadWithHistory({
      reservations: [activeReservation, second],
      entries: [
        reserveEntry,
        { ...reserveEntry, reservation: second.id, quantity: 3 }
      ]
    });
    await expect(
      activeReservedForAggregate(
        payload,
        { transactionID: "tx-1" } as any,
        "sku-b",
        "location-1"
      )
    ).resolves.toBe(5);
  });

  it("does not load terminal reservation history when computing ATP", async () => {
    const terminalReservations = Array.from({ length: 100 }, (_, index) => ({
      ...activeReservation,
      id: `reservation-consumed-${index}`,
      status: "consumed"
    }));
    const { payload, find } = payloadWithHistory({
      reservations: [activeReservation, ...terminalReservations],
      entries: [reserveEntry]
    });

    await expect(
      activeReservedForAggregate(
        payload,
        { transactionID: "tx-1" } as any,
        "sku-b",
        "location-1"
      )
    ).resolves.toBe(2);

    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "inventory-reservations",
        where: {
          and: [
            { sku: { equals: "sku-b" } },
            { location: { equals: "location-1" } },
            { status: { equals: "active" } }
          ]
        }
      })
    );
  });

  it("reconstructs sorted immutable aggregate projections", async () => {
    const consumed = {
      ...activeReservation,
      id: "reservation-consumed",
      sku: "sku-a",
      quantity: 1,
      status: "consumed"
    };
    const { payload } = payloadWithHistory({
      reservations: [activeReservation, consumed],
      entries: [
        reserveEntry,
        { ...reserveEntry, reservation: consumed.id, quantity: 1 },
        {
          ...reserveEntry,
          id: "entry-consume",
          reservation: consumed.id,
          quantity: 1,
          operation: "consume"
        }
      ]
    });
    const result = await reconstructInventoryReservations({
      payload,
      req: { transactionID: "tx-1" } as any
    });
    expect(result).toEqual([
      {
        aggregateKey: "sku-a:location-1",
        skuId: "sku-a",
        locationId: "location-1",
        activeReserved: 0,
        reservationCount: 1
      },
      {
        aggregateKey: "sku-b:location-1",
        skuId: "sku-b",
        locationId: "location-1",
        activeReserved: 2,
        reservationCount: 1
      }
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
  });

  it("requires a transaction and complete aggregate relationships", async () => {
    const { payload } = payloadWithHistory({
      reservations: [{ ...activeReservation, sku: null }]
    });
    await expect(
      reconstructInventoryReservations({ payload, req: {} as any })
    ).rejects.toThrow("inventory-reservation-transaction-required");
    await expect(
      reconstructInventoryReservations({
        payload,
        req: { transactionID: "tx-1" } as any
      })
    ).rejects.toThrow("inventory-reservation-history-corrupt");
  });
});
