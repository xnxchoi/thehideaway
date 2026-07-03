import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const update = vi.fn();
const beginTransaction = vi.fn();
const commitTransaction = vi.fn();
const rollbackTransaction = vi.fn();
const markRequestOrderPaid = vi.fn(async () => undefined);
const releaseStandardInventory = vi.fn(async () => undefined);
const syncPlanPayment = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("@/lib/lost-commerce/plan-payment", () => ({
  syncPlanPayment
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find,
    update,
    db: {
      beginTransaction,
      commitTransaction,
      rollbackTransaction,
      sessions: {
        "tx-1": {
          db: { execute: vi.fn(async () => undefined) }
        }
      }
    },
    logger: {
      error: vi.fn()
    }
  }))
}));

vi.mock("@/lib/lost-commerce/campaigns", () => ({
  markRequestOrderPaid
}));

vi.mock("@/lib/lost-commerce/inventory", () => ({
  releaseStandardInventory
}));

const OLD_ENV = { ...process.env };

function webhookRequest(body: unknown, secret?: string) {
  return new NextRequest("https://hideaway.test/api/lost/webhooks/portone", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-portone-webhook-secret": secret } : {})
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/lost/webhooks/portone", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
    process.env.PORTONE_WEBHOOK_SECRET = "webhook-secret";

    find.mockReset();
    update.mockReset();
    beginTransaction.mockReset().mockResolvedValue("tx-1");
    commitTransaction.mockReset().mockResolvedValue(undefined);
    rollbackTransaction.mockReset().mockResolvedValue(undefined);
    markRequestOrderPaid.mockClear();
    releaseStandardInventory.mockClear();
    syncPlanPayment.mockReset();

    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              lines: [
                {
                  mode: "standard_purchase",
                  productId: "product-1",
                  quantity: 1
                }
              ],
              payment_status: "pending",
              total_amount: 1000,
              currency: "KRW"
            }
          ]
        };
      }
      if (collection === "product-payments") {
        return {
          docs: [
            {
              id: "payment-1",
              amount: 1000,
              currency: "KRW",
              provider: "portone",
              portone_order_ref: "lis_1",
              events: []
            }
          ]
        };
      }
      return { docs: [] };
    });
    update.mockResolvedValue({ id: "updated" });
  });

  it("rejects webhooks when the shared secret is missing", async () => {
    delete process.env.PORTONE_WEBHOOK_SECRET;

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest({
        merchant_order_id: "lis_1",
        status: "PAID",
        amount: 1000,
        currency: "KRW"
      })
    );
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "webhook-secret-not-configured" });
    expect(find).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects events that omit currency before mutating state", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-no-currency",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000
        },
        "webhook-secret"
      )
    );
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(409);
    expect(body).toEqual({ ok: false, error: "payment-mismatch" });
    expect(update).not.toHaveBeenCalled();
    expect(markRequestOrderPaid).not.toHaveBeenCalled();
  });

  it("rejects amount and currency mismatches before mutating state", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-1",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 2000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(409);
    expect(body).toEqual({ ok: false, error: "payment-mismatch" });
    expect(update).not.toHaveBeenCalled();
    expect(markRequestOrderPaid).not.toHaveBeenCalled();
  });

  it("detects duplicate events before mutating product orders", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              payment_status: "paid",
              total_amount: 1000,
              currency: "KRW"
            }
          ]
        };
      }
      if (collection === "product-payments") {
        return {
          docs: [
            {
              id: "payment-1",
              amount: 1000,
              currency: "KRW",
              provider: "portone",
              portone_order_ref: "lis_1",
              events: [{ webhook_id: "evt-1" }]
            }
          ]
        };
      }
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-1",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );
    const body = (await res.json()) as { ok: boolean; duplicate?: boolean };

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, duplicate: true });
    expect(update).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(markRequestOrderPaid).not.toHaveBeenCalled();
  });

  it("maps non-paid PortOne events to valid product order statuses", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-2",
          merchant_order_id: "lis_1",
          status: "PENDING",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        data: expect.objectContaining({
          payment_status: "pending",
          status: "pending_payment"
        })
      })
    );
  });

  it("releases standard inventory when PortOne reports payment failure", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-failed",
          merchant_order_id: "lis_1",
          status: "FAILED",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(releaseStandardInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ update }),
        req: expect.objectContaining({ transactionID: "tx-1" }),
        order: expect.objectContaining({
          id: "order-1",
          order_mode: "standard_purchase"
        })
      })
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        data: expect.objectContaining({
          payment_status: "failed",
          status: "failed"
        })
      })
    );
  });

  it("does not release inventory again for an order already marked failed", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              status: "failed",
              lines: [
                {
                  mode: "standard_purchase",
                  productId: "product-1",
                  quantity: 1
                }
              ],
              payment_status: "failed",
              total_amount: 1000,
              currency: "KRW"
            }
          ]
        };
      }
      if (collection === "product-payments") {
        return {
          docs: [
            {
              id: "payment-1",
              amount: 1000,
              currency: "KRW",
              provider: "portone",
              portone_order_ref: "lis_1",
              events: []
            }
          ]
        };
      }
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-failed-again",
          merchant_order_id: "lis_1",
          status: "FAILED",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(releaseStandardInventory).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        data: expect.objectContaining({
          events: [expect.objectContaining({ webhook_id: "evt-failed-again" })]
        })
      })
    );
  });

  describe("plans (membership) branch", () => {
    function withPlanSub(overrides: Record<string, unknown> = {}) {
      // A subscription carries this paymentId as its payment_ref → plan event.
      find.mockImplementation(async ({ collection }) => {
        if (collection === "subscriptions") {
          return {
            docs: [
              {
                id: "sub-1",
                payment_ref: "hda_plan_1",
                subscription_status: "pending",
                paid: false,
                ...overrides
              }
            ]
          };
        }
        return { docs: [] };
      });
    }

    it("reconciles a paid plan webhook via syncPlanPayment (2xx)", async () => {
      withPlanSub();
      syncPlanPayment.mockResolvedValue({
        ok: true,
        subscriptionId: "sub-1",
        status: "active",
        alreadyProcessed: false
      });
      const { POST } = await import("./route");
      const res = await POST(
        webhookRequest(
          { type: "Transaction.Paid", data: { paymentId: "hda_plan_1" } },
          "webhook-secret"
        )
      );
      expect(res.status).toBe(200);
      expect(syncPlanPayment).toHaveBeenCalledWith(
        expect.objectContaining({ paymentId: "hda_plan_1" })
      );
    });

    it("ACKs a FAILED plan webhook 2xx and cancels the pending hold (no retry storm)", async () => {
      withPlanSub();
      const { POST } = await import("./route");
      const res = await POST(
        webhookRequest(
          { type: "Transaction.Failed", data: { paymentId: "hda_plan_1" } },
          "webhook-secret"
        )
      );
      const body = (await res.json()) as { ok: boolean; terminal?: string };
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ ok: true, terminal: "failed" });
      // Terminal path must NOT re-fetch PortOne.
      expect(syncPlanPayment).not.toHaveBeenCalled();
      // Pending hold canceled so its seat is freed.
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "subscriptions",
          id: "sub-1",
          data: expect.objectContaining({ subscription_status: "canceled" })
        })
      );
    });

    it("a duplicate/reordered FAILED does NOT cancel an already-active membership", async () => {
      withPlanSub({ subscription_status: "active", paid: true });
      const { POST } = await import("./route");
      const res = await POST(
        webhookRequest(
          { type: "Transaction.Failed", data: { paymentId: "hda_plan_1" } },
          "webhook-secret"
        )
      );
      expect(res.status).toBe(200);
      // No cancel write against the active row.
      expect(update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "subscriptions",
          data: expect.objectContaining({ subscription_status: "canceled" })
        })
      );
    });

    it("ACKs a verified rejection 2xx (terminal), only 503s on verify-unavailable", async () => {
      withPlanSub();
      syncPlanPayment.mockResolvedValue({
        ok: false,
        status: 409,
        reason: "amount-mismatch"
      });
      const { POST } = await import("./route");
      const rejected = await POST(
        webhookRequest(
          { type: "Transaction.Paid", data: { paymentId: "hda_plan_1" } },
          "webhook-secret"
        )
      );
      expect(rejected.status).toBe(200);
      expect((await rejected.json()).rejected).toBe("amount-mismatch");

      syncPlanPayment.mockResolvedValue({
        ok: false,
        status: 503,
        reason: "verify-unavailable"
      });
      const transient = await POST(
        webhookRequest(
          { type: "Transaction.Paid", data: { paymentId: "hda_plan_1" } },
          "webhook-secret"
        )
      );
      expect(transient.status).toBe(503);
    });
  });
});
