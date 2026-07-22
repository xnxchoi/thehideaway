import { describe, expect, it, vi } from "vitest";

const reserveOrderInventoryInTransaction = vi.fn(async () => ({
  kind: "created",
  results: []
}));

vi.mock("./inventory-reservations", () => ({
  reserveOrderInventoryInTransaction
}));

describe("reserveCheckoutOrderInventoryInTransaction", () => {
  it("resolves the explicit location and aggregates duplicate standard SKU lines", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [{ id: "location-1", code: "SEOUL-01", active: true }]
      }))
    } as any;
    const req = { transactionID: "tx-1" } as any;
    const { reserveCheckoutOrderInventoryInTransaction } =
      await import("./checkout-inventory-reservations");

    await reserveCheckoutOrderInventoryInTransaction({
      payload,
      req,
      order: {
        id: "order-1",
        expires_at: "2026-07-22T03:15:00.000Z"
      },
      lines: [
        { mode: "standard_purchase", skuId: "sku-1", quantity: 2 },
        { mode: "standard_purchase", skuId: "sku-1", quantity: 1 },
        { mode: "request_to_order", skuId: "sku-2", quantity: 9 }
      ],
      policy: {
        enabled: true,
        ttlMinutes: 15,
        locationCode: "SEOUL-01",
        safetyStock: 0,
        consumePoint: "payment_confirmed",
        expiryBoundary: "at_or_after",
        paymentTimeSource: "provider_paid_at",
        latePaymentPolicy: "manual_review",
        backorderMode: "disabled"
      },
      commandKey: "checkout-command-0001",
      effectiveAt: "2026-07-22T03:00:00.000Z"
    });

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "stock-locations",
        limit: 2,
        where: { code: { equals: "SEOUL-01" } }
      })
    );
    expect(reserveOrderInventoryInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        payload,
        req,
        requests: [
          expect.objectContaining({
            operation: "reserve",
            orderId: "order-1",
            skuId: "sku-1",
            locationId: "location-1",
            quantity: 3,
            expiresAt: "2026-07-22T03:15:00.000Z",
            effectiveAt: "2026-07-22T03:00:00.000Z"
          })
        ]
      })
    );
  });

  it("fails closed when the configured location is missing or duplicated", async () => {
    reserveOrderInventoryInTransaction.mockClear();
    const { reserveCheckoutOrderInventoryInTransaction } =
      await import("./checkout-inventory-reservations");
    for (const docs of [[], [{ id: "a" }, { id: "b" }]]) {
      const payload = { find: vi.fn(async () => ({ docs })) } as any;
      await expect(
        reserveCheckoutOrderInventoryInTransaction({
          payload,
          req: { transactionID: "tx-1" } as any,
          order: {
            id: "order-1",
            expires_at: "2026-07-22T03:15:00.000Z"
          },
          lines: [{ mode: "standard_purchase", skuId: "sku-1", quantity: 1 }],
          policy: {
            enabled: true,
            ttlMinutes: 15,
            locationCode: "SEOUL-01",
            safetyStock: 0,
            consumePoint: "payment_confirmed",
            expiryBoundary: "at_or_after",
            paymentTimeSource: "provider_paid_at",
            latePaymentPolicy: "manual_review",
            backorderMode: "disabled"
          },
          commandKey: "checkout-command-0001",
          effectiveAt: "2026-07-22T03:00:00.000Z"
        })
      ).rejects.toThrow("inventory-reservation-location-unavailable");
    }
    expect(reserveOrderInventoryInTransaction).not.toHaveBeenCalled();
  });
});
