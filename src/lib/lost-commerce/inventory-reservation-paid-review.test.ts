import { beforeEach, describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({
  recover: vi.fn(),
  authorize: vi.fn(),
  transition: vi.fn(),
  markPaid: vi.fn()
}));

vi.mock("./inventory-reservation-recovery", () => ({
  recoverPaidInventoryReservationsInTransaction: tracked.recover
}));
vi.mock("./lifecycle-authorization", () => ({
  authorizeCommerceLifecycleRequest: tracked.authorize
}));
vi.mock("./transitions", () => ({
  assertOrderTransition: tracked.transition
}));
vi.mock("./campaigns", () => ({ markRequestOrderPaid: tracked.markPaid }));

import { reconcilePaidInventoryReviewInTransaction } from "./inventory-reservation-paid-review";

const state = {
  stateHash: "a".repeat(64),
  order: {
    id: "order-1",
    orderRef: "order-ref-1",
    status: "paid_inventory_review",
    paymentStatus: "paid",
    updatedAt: "2026-07-23T00:00:00.000Z",
    doc: { id: "order-1", order_mode: "standard_purchase" }
  },
  payment: {
    id: "payment-1",
    status: "paid",
    paidAt: "2026-07-22T23:59:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
    paymentRef: "order-ref-1_portone",
    provider: "portone",
    transactionReference: "portone:transaction-1",
    doc: {
      id: "payment-1",
      order: "order-1",
      provider: "portone",
      portone_transaction_ref: "portone:transaction-1"
    }
  },
  reservations: [
    {
      id: "reservation-1",
      status: "active",
      expiresAt: "2026-07-23T00:15:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
      terminalAt: null,
      skuId: "sku-1",
      locationId: "location-1",
      quantity: 1,
      safetyStock: 0,
      recoveryOf: null,
      doc: {
        id: "reservation-1",
        reserved_at: "2026-07-22T23:58:00.000Z"
      }
    }
  ],
  inventoryLevels: []
} as const;

describe("paid inventory review reconciliation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps review open without authoritative paid evidence", async () => {
    const payload = { update: vi.fn() } as never;
    await expect(
      reconcilePaidInventoryReviewInTransaction({
        payload,
        req: {
          payload,
          context: {},
          transactionID: "tx-1",
          user: { id: "admin-1", role: "admin" }
        } as never,
        orderId: "order-1",
        idempotencyKey: "a".repeat(32),
        effectiveAt: "2026-07-23T00:01:00.000Z",
        locksHeld: true,
        state: { ...state, payment: null }
      })
    ).resolves.toEqual({
      status: "review_remaining",
      affectedCount: 0,
      paymentId: undefined
    });
    expect(tracked.recover).not.toHaveBeenCalled();
  });

  it("does not treat the local payment reference as provider evidence", async () => {
    const payload = { update: vi.fn() } as never;
    await expect(
      reconcilePaidInventoryReviewInTransaction({
        payload,
        req: {
          payload,
          context: {},
          transactionID: "tx-1",
          user: { id: "admin-1", role: "admin" }
        } as never,
        orderId: "order-1",
        idempotencyKey: "a".repeat(32),
        effectiveAt: "2026-07-23T00:01:00.000Z",
        locksHeld: true,
        state: {
          ...state,
          payment: {
            ...state.payment,
            paymentRef: null,
            provider: "portone",
            transactionReference: null,
            doc: {
              ...state.payment.doc,
              portone_transaction_ref: undefined,
              payment_ref: "local-payment-reference"
            }
          }
        }
      })
    ).resolves.toEqual({
      status: "review_remaining",
      affectedCount: 0,
      paymentId: "payment-1"
    });
    expect(tracked.recover).not.toHaveBeenCalled();
  });

  it("confirms only after the guarded stock recovery succeeds", async () => {
    tracked.recover.mockResolvedValue({ kind: "confirmed", affectedCount: 1 });
    const update = vi.fn(async () => ({ id: "order-1", status: "confirmed" }));
    const payload = { update } as never;

    await expect(
      reconcilePaidInventoryReviewInTransaction({
        payload,
        req: {
          payload,
          context: {},
          transactionID: "tx-1",
          user: { id: "admin-1", role: "admin" }
        } as never,
        orderId: "order-1",
        idempotencyKey: "a".repeat(32),
        effectiveAt: "2026-07-23T00:01:00.000Z",
        locksHeld: true,
        state
      })
    ).resolves.toEqual({
      status: "confirmed",
      affectedCount: 1,
      paymentId: "payment-1"
    });
    expect(tracked.authorize).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        data: { status: "confirmed" }
      })
    );
  });
});
