import { beforeEach, describe, expect, it, vi } from "vitest";

const getPortOnePayment = vi.fn();
const cancelUnpaidProductOrder = vi.fn();
const finalizePaidOrderInventoryInTransaction = vi.fn();
const recordCommerceProviderEventStandalone = vi.fn();
const lockEvents = vi.hoisted(() => [] as string[]);
const paymentWebhookLock = vi.hoisted(() =>
  vi.fn(async () => lockEvents.push("payment"))
);
const lockOrderInventoryReservationsInTransaction = vi.hoisted(() =>
  vi.fn(async () => lockEvents.push("reservation"))
);

vi.mock("./verify-payment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./verify-payment")>();
  return { ...actual, getPortOnePayment };
});

vi.mock("@/lib/db/sequences", () => ({
  paymentWebhookLock
}));

vi.mock("./campaigns", () => ({
  markRequestOrderPaid: vi.fn(async () => undefined)
}));

vi.mock("./orders", () => ({ cancelUnpaidProductOrder }));
vi.mock("./inventory-reservations", () => ({
  finalizePaidOrderInventoryInTransaction,
  lockOrderInventoryReservationsInTransaction
}));
vi.mock("./provider-events", () => ({ recordCommerceProviderEventStandalone }));

const baseOrder = {
  id: "order-1",
  order_ref: "lis_1",
  user: "user-1",
  order_mode: "standard_purchase",
  payment_status: "pending",
  status: "pending_payment",
  total_amount: 1000,
  currency: "KRW"
};

const basePayment = {
  id: "payment-1",
  provider: "portone",
  order: "order-1",
  user: "user-1",
  status: "pending",
  amount: 1000,
  currency: "KRW"
};

function sequencedPayload(input?: {
  preOrder?: any;
  prePayment?: any;
  lockedOrder?: any;
  lockedPayment?: any;
  transactionID?: string | null;
}) {
  let orderReads = 0;
  let paymentReads = 0;
  const find = vi.fn(async ({ collection }) => {
    if (collection === "product-orders") {
      const preOrder =
        input && Object.hasOwn(input, "preOrder") ? input.preOrder : baseOrder;
      const lockedOrder =
        input && Object.hasOwn(input, "lockedOrder")
          ? input.lockedOrder
          : preOrder;
      const record = orderReads++ === 0 ? preOrder : lockedOrder;
      return { docs: record ? [record] : [] };
    }
    const prePayment =
      input && Object.hasOwn(input, "prePayment")
        ? input.prePayment
        : basePayment;
    const lockedPayment =
      input && Object.hasOwn(input, "lockedPayment")
        ? input.lockedPayment
        : prePayment;
    const record = paymentReads++ === 0 ? prePayment : lockedPayment;
    return { docs: record ? [record] : [] };
  });
  return {
    find,
    update: vi.fn(async () => ({ id: "updated" })),
    db: {
      beginTransaction: vi.fn(async () =>
        input && Object.hasOwn(input, "transactionID")
          ? input.transactionID
          : "tx-1"
      ),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    },
    logger: { error: vi.fn() }
  } as any;
}

describe("syncProductPayment", () => {
  beforeEach(() => {
    lockEvents.length = 0;
    getPortOnePayment.mockReset().mockResolvedValue({
      status: "PAID",
      amount: { total: 1000, paid: 1000 },
      currency: "KRW",
      channel: { type: "TEST" },
      paidAt: "2026-07-22T03:05:00.000Z",
      transactionId: "txn-1"
    });
    cancelUnpaidProductOrder.mockReset();
    finalizePaidOrderInventoryInTransaction
      .mockReset()
      .mockResolvedValue({ kind: "created", results: [] });
    recordCommerceProviderEventStandalone.mockReset().mockResolvedValue({
      recorded: true,
      duplicate: false,
      conflict: false,
      eventId: "provider-event-row-1"
    });
  });

  it("verifies and commits a V2 payment by paymentId", async () => {
    const find = vi.fn(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              user: { id: "user-1" },
              order_mode: "standard_purchase",
              payment_status: "paid",
              status: "confirmed",
              total_amount: 1000,
              currency: "KRW"
            }
          ]
        };
      }
      return {
        docs: [
          {
            id: "payment-1",
            provider: "portone",
            order: { id: "order-1" },
            user: { id: "user-1" },
            status: "pending",
            amount: 1000,
            currency: "KRW",
            portone_order_ref: "lis_1",
            events: []
          }
        ]
      };
    });
    const payload = {
      find,
      update: vi.fn(async () => ({ id: "updated" })),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined),
        sessions: { "tx-1": { db: { execute: vi.fn() } } }
      },
      logger: { error: vi.fn() }
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({
      payload,
      paymentId: "lis_1",
      event: { type: "Transaction.Paid", data: { paymentId: "lis_1" } }
    });

    expect(result).toMatchObject({ ok: true, orderId: "order-1" });
    expect(getPortOnePayment).toHaveBeenCalledWith("lis_1");
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        data: expect.objectContaining({
          payment_status: "paid",
          status: "confirmed"
        })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        id: "payment-1",
        data: expect.objectContaining({
          status: "paid",
          portone_transaction_ref: "txn-1"
        })
      })
    );
    expect(finalizePaidOrderInventoryInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        payload,
        req: expect.objectContaining({ transactionID: "tx-1" }),
        orderId: "order-1",
        paymentId: "payment-1",
        providerEventRef: "provider-event-row-1",
        providerPaidAt: "2026-07-22T03:05:00.000Z",
        locksHeld: true
      })
    );
    expect(lockEvents).toEqual(["reservation", "payment"]);
  });

  it.each([
    ["request_to_order", "paid"],
    ["private_order", "confirmed"]
  ] as const)(
    "reconciles a paid %s order without requiring stock reservations",
    async (orderMode, expectedStatus) => {
      const payload = {
        find: vi.fn(async ({ collection }) => ({
          docs:
            collection === "product-orders"
              ? [
                  {
                    id: "order-1",
                    order_ref: "lis_1",
                    user: "user-1",
                    order_mode: orderMode,
                    payment_status: "pending",
                    status: "pending_payment",
                    total_amount: 1000,
                    currency: "KRW"
                  }
                ]
              : [
                  {
                    id: "payment-1",
                    provider: "portone",
                    order: "order-1",
                    user: "user-1",
                    status: "pending",
                    amount: 1000,
                    currency: "KRW"
                  }
                ]
        })),
        update: vi.fn(async () => ({ id: "updated" })),
        db: {
          beginTransaction: vi.fn(async () => "tx-1"),
          commitTransaction: vi.fn(async () => undefined),
          rollbackTransaction: vi.fn(async () => undefined)
        },
        logger: { error: vi.fn() }
      } as any;

      const { syncProductPayment } = await import("./product-payment");
      await expect(
        syncProductPayment({ payload, paymentId: "lis_1" })
      ).resolves.toMatchObject({ ok: true, status: "paid" });

      expect(finalizePaidOrderInventoryInTransaction).not.toHaveBeenCalled();
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "product-orders",
          data: expect.objectContaining({
            payment_status: "paid",
            status: expectedStatus
          })
        })
      );
      expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
    }
  );

  it.each([
    ["request_to_order", "failed"],
    ["private_order", "canceled"]
  ] as const)(
    "routes a paid %s order from %s to manual inventory review",
    async (orderMode, status) => {
      const order = { ...baseOrder, order_mode: orderMode, status };
      const payload = sequencedPayload({
        preOrder: order,
        lockedOrder: order
      });
      const { syncProductPayment } = await import("./product-payment");

      await expect(
        syncProductPayment({ payload, paymentId: "lis_1" })
      ).resolves.toMatchObject({ ok: true, status: "paid" });
      expect(finalizePaidOrderInventoryInTransaction).not.toHaveBeenCalled();
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "product-orders",
          data: expect.objectContaining({
            payment_status: "paid",
            status: "paid_inventory_review"
          })
        })
      );
    }
  );

  it("records provider truth and routes missing paidAt to inventory review", async () => {
    getPortOnePayment.mockResolvedValue({
      status: "PAID",
      amount: { total: 1000, paid: 1000 },
      currency: "KRW",
      channel: { type: "TEST" },
      transactionId: "txn-review"
    });
    finalizePaidOrderInventoryInTransaction.mockResolvedValue({
      kind: "paid_inventory_review",
      results: []
    });
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-1",
                  order_mode: "standard_purchase",
                  payment_status: "pending",
                  status: "pending_payment",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-1",
                  user: "user-1",
                  status: "pending",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      })),
      update: vi.fn(async () => ({ id: "updated" })),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    await expect(
      syncProductPayment({ payload, paymentId: "lis_1" })
    ).resolves.toMatchObject({ ok: true, status: "paid" });

    expect(finalizePaidOrderInventoryInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ providerPaidAt: undefined })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        data: expect.objectContaining({ status: "paid" })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        data: expect.objectContaining({
          payment_status: "paid",
          status: "paid_inventory_review"
        })
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("does not reconcile an event without durable provider evidence", async () => {
    recordCommerceProviderEventStandalone.mockResolvedValue({
      recorded: false,
      duplicate: false
    });
    const payload = { find: vi.fn() } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({
      payload,
      paymentId: "lis_1",
      event: { type: "Transaction.Paid" }
    });

    expect(result).toEqual({ ok: false, status: 400, reason: "malformed" });
    expect(payload.find).not.toHaveBeenCalled();
    expect(getPortOnePayment).not.toHaveBeenCalled();
  });

  it("rejects a malformed durable provider event reference before database work", async () => {
    const payload = { find: vi.fn() } as any;
    const { syncProductPayment } = await import("./product-payment");

    await expect(
      syncProductPayment({
        payload,
        paymentId: "lis_1",
        providerEventRef: "invalid provider event"
      })
    ).resolves.toEqual({ ok: false, status: 400, reason: "malformed" });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it("rejects a mismatched amount without mutating local payment state", async () => {
    getPortOnePayment.mockResolvedValue({
      status: "PAID",
      amount: { total: 999, paid: 999 },
      currency: "KRW",
      channel: { type: "TEST" }
    });
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-1",
                  payment_status: "pending",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-1",
                  user: "user-1",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      })),
      update: vi.fn(),
      db: { beginTransaction: vi.fn() }
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({ payload, paymentId: "lis_1" });

    expect(result).toEqual({
      ok: false,
      status: 409,
      reason: "amount-mismatch"
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("checks browser ownership before calling PortOne", async () => {
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-2",
                  payment_status: "pending",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : []
      }))
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({
      payload,
      paymentId: "lis_1",
      expectedUserId: "user-1"
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      reason: "order-not-found"
    });
    expect(getPortOnePayment).not.toHaveBeenCalled();
  });

  it("rejects a payment row linked to a different order", async () => {
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-1",
                  payment_status: "pending",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-other",
                  user: "user-1",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      }))
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({ payload, paymentId: "lis_1" });

    expect(result).toEqual({
      ok: false,
      status: 404,
      reason: "payment-not-found"
    });
    expect(getPortOnePayment).not.toHaveBeenCalled();
  });

  it("returns a retryable error when a preflight database read fails", async () => {
    const payload = {
      find: vi.fn(async () => {
        throw new Error("database unavailable");
      })
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({ payload, paymentId: "lis_1" });

    expect(result).toEqual({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });
    expect(getPortOnePayment).not.toHaveBeenCalled();
  });

  it("releases a reservation only after PortOne reports a terminal failure", async () => {
    getPortOnePayment.mockResolvedValue({
      status: "FAILED",
      amount: { total: 1000, paid: 0 },
      currency: "KRW",
      channel: { type: "TEST" }
    });
    cancelUnpaidProductOrder.mockResolvedValue({ ok: true, canceled: true });
    const order = {
      id: "order-1",
      order_ref: "lis_1",
      user: "user-1",
      payment_status: "pending",
      status: "pending_payment",
      total_amount: 1000,
      currency: "KRW"
    };
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [order]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-1",
                  user: "user-1",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      }))
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({ payload, paymentId: "lis_1" });

    expect(result).toEqual({
      ok: false,
      status: 402,
      reason: "payment-failed"
    });
    expect(cancelUnpaidProductOrder).toHaveBeenCalledWith({ payload, order });
  });

  it("rejects an inconsistent refunded payment instead of restoring it to paid", async () => {
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-1",
                  order_mode: "standard_purchase",
                  payment_status: "pending",
                  status: "pending_payment",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-1",
                  user: "user-1",
                  status: "refunded",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      })),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({ payload, paymentId: "lis_1" });

    expect(result).toEqual({
      ok: false,
      status: 409,
      reason: "order-final"
    });
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("revalidates locked money values before committing payment", async () => {
    let orderReads = 0;
    let paymentReads = 0;
    const payload = {
      find: vi.fn(async ({ collection }) => {
        if (collection === "product-orders") {
          orderReads += 1;
          return {
            docs: [
              {
                id: "order-1",
                order_ref: "lis_1",
                user: "user-1",
                order_mode: "standard_purchase",
                payment_status: "pending",
                status: "pending_payment",
                total_amount: orderReads === 1 ? 1000 : 2000,
                currency: "KRW"
              }
            ]
          };
        }
        paymentReads += 1;
        return {
          docs: [
            {
              id: "payment-1",
              provider: "portone",
              order: "order-1",
              user: "user-1",
              status: "pending",
              amount: paymentReads === 1 ? 1000 : 2000,
              currency: "KRW"
            }
          ]
        };
      }),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({
      payload,
      paymentId: "lis_1",
      expectedUserId: "user-1"
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      reason: "amount-mismatch"
    });
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("records a signed provider event when payment state is already applied", async () => {
    const payload = {
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  user: "user-1",
                  order_mode: "standard_purchase",
                  payment_status: "paid",
                  status: "confirmed",
                  total_amount: 1000,
                  currency: "KRW"
                }
              ]
            : [
                {
                  id: "payment-1",
                  provider: "portone",
                  order: "order-1",
                  user: "user-1",
                  status: "paid",
                  amount: 1000,
                  currency: "KRW"
                }
              ]
      })),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;
    const event = {
      provider_event_id: "evt-1",
      type: "Transaction.Paid"
    };

    const { syncProductPayment } = await import("./product-payment");
    const result = await syncProductPayment({
      payload,
      paymentId: "lis_1",
      event
    });

    expect(result).toMatchObject({ ok: true, alreadyProcessed: true });
    expect(recordCommerceProviderEventStandalone).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1",
        event
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("fails closed when durable provider-event recording throws or omits its ID", async () => {
    const { syncProductPayment } = await import("./product-payment");
    const payload = { find: vi.fn() } as any;
    recordCommerceProviderEventStandalone.mockRejectedValueOnce(
      new Error("provider-event-write-failed")
    );
    await expect(
      syncProductPayment({
        payload,
        paymentId: "lis_1",
        event: { type: "Transaction.Paid" }
      })
    ).resolves.toEqual({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });

    recordCommerceProviderEventStandalone.mockResolvedValueOnce({
      recorded: true,
      duplicate: false
    });
    await expect(
      syncProductPayment({
        payload,
        paymentId: "lis_1",
        event: { type: "Transaction.Paid" }
      })
    ).resolves.toEqual({ ok: false, status: 400, reason: "malformed" });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it.each([
    [
      "missing order",
      { preOrder: null },
      { ok: false, status: 404, reason: "order-not-found" }
    ],
    [
      "missing payment",
      { prePayment: null },
      { ok: false, status: 404, reason: "payment-not-found" }
    ],
    [
      "wrong provider",
      { prePayment: { ...basePayment, provider: "manual" } },
      { ok: false, status: 404, reason: "payment-not-found" }
    ],
    [
      "wrong currency",
      { prePayment: { ...basePayment, currency: "USD" } },
      { ok: false, status: 409, reason: "currency-mismatch" }
    ],
    [
      "unavailable transaction",
      { transactionID: null },
      { ok: false, status: 503, reason: "verify-unavailable" }
    ]
  ] as const)(
    "rejects preflight boundary: %s",
    async (_name, setup, expected) => {
      const payload = sequencedPayload(setup);
      const { syncProductPayment } = await import("./product-payment");

      await expect(
        syncProductPayment({ payload, paymentId: "lis_1" })
      ).resolves.toEqual(expected);
      expect(payload.update).not.toHaveBeenCalled();
    }
  );

  it.each([
    [
      "order disappears",
      { lockedOrder: null },
      { ok: false, status: 404, reason: "order-not-found" }
    ],
    [
      "payment disappears",
      { lockedPayment: null },
      { ok: false, status: 404, reason: "payment-not-found" }
    ],
    [
      "order is refunded",
      { lockedOrder: { ...baseOrder, status: "refunded" } },
      { ok: false, status: 409, reason: "order-final" }
    ],
    [
      "order state is invalid",
      { lockedOrder: { ...baseOrder, status: "unknown" } },
      { ok: false, status: 409, reason: "order-final" }
    ]
  ] as const)("rolls back when locked %s", async (_name, setup, expected) => {
    const payload = sequencedPayload(setup);
    const { syncProductPayment } = await import("./product-payment");

    await expect(
      syncProductPayment({ payload, paymentId: "lis_1" })
    ).resolves.toEqual(expected);
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("returns a retryable error when reservation finalization fails unexpectedly", async () => {
    finalizePaidOrderInventoryInTransaction.mockRejectedValueOnce(
      new Error("reservation-write-failed")
    );
    const payload = sequencedPayload();
    const { syncProductPayment } = await import("./product-payment");

    await expect(
      syncProductPayment({ payload, paymentId: "lis_1" })
    ).resolves.toEqual({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(payload.logger.error).toHaveBeenCalled();
  });
});
