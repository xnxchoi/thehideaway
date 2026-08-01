import { describe, expect, it } from "vitest";

import { selectAuthoritativeInventoryReservationPayment } from "./inventory-reservation-operator-payment";

const time = (minute: number) =>
  new Date(Date.UTC(2026, 6, 23, 0, minute)).toISOString();

describe("authoritative inventory reservation payment selection", () => {
  it("prefers complete PortOne paid evidence over newer attempts", () => {
    const authoritative = {
      id: "payment-authoritative",
      provider: "portone",
      status: "paid",
      paid_at: time(1),
      updatedAt: time(1),
      portone_transaction_ref: "portone:transaction-1"
    };
    expect(
      selectAuthoritativeInventoryReservationPayment([
        { id: "payment-new", status: "pending", updatedAt: time(10) },
        authoritative
      ])
    ).toBe(authoritative);
  });

  it("uses paid, canonical reference, timestamps, reference, and id tie-breakers", () => {
    const cases = [
      [
        [
          { id: "pending", status: "pending" },
          { id: "paid", status: "paid" }
        ],
        "paid",
        undefined
      ],
      [
        [
          { id: "other", status: "pending", payment_ref: "other" },
          { id: "canonical", status: "pending", payment_ref: "order-1_portone" }
        ],
        "canonical",
        "order-1"
      ],
      [
        [
          { id: "older", status: "pending", paid_at: time(1) },
          { id: "newer", status: "pending", paid_at: time(2) }
        ],
        "newer",
        undefined
      ],
      [
        [
          { id: "older", status: "pending", updatedAt: time(1) },
          { id: "newer", status: "pending", updatedAt: time(2) }
        ],
        "newer",
        undefined
      ],
      [
        [
          { id: "z", status: "pending", payment_ref: "z" },
          { id: "a", status: "pending", payment_ref: "a" }
        ],
        "a",
        undefined
      ],
      [
        [
          { id: { id: "z" }, status: "pending" },
          { id: { id: "a" }, status: "pending" }
        ],
        { id: "a" },
        undefined
      ]
    ] as const;

    for (const [payments, expectedId, orderRef] of cases) {
      expect(
        selectAuthoritativeInventoryReservationPayment(payments, orderRef)?.id
      ).toEqual(expectedId);
    }
  });

  it("returns no candidate for an empty history", () => {
    expect(selectAuthoritativeInventoryReservationPayment([])).toBeUndefined();
  });
});
