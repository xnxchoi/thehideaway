import { createHmac } from "node:crypto";
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
const cancelPendingPlanPayment = vi.fn();
const syncProductPayment = vi.fn();
const getPortOnePayment = vi.fn();
const recordCommerceProviderEventStandalone = vi.fn();
const claimCommerceProviderEvent = vi.fn();
const completeCommerceProviderEvent = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("@/lib/lost-commerce/plan-payment", () => ({
  cancelPendingPlanPayment,
  syncPlanPayment
}));

vi.mock("@/lib/lost-commerce/product-payment", () => ({
  syncProductPayment
}));
vi.mock("@/lib/lost-commerce/verify-payment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/lost-commerce/verify-payment")>()),
  getPortOnePayment
}));
vi.mock("@/lib/lost-commerce/provider-events", () => ({
  claimCommerceProviderEvent,
  completeCommerceProviderEvent,
  recordCommerceProviderEventStandalone
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
const LEGACY_SECRET = "legacy-webhook-secret-0123456789abcdef";

function webhookRequest(body: unknown, secret?: string) {
  const requestSecret =
    secret === "webhook-secret" ? LEGACY_SECRET : secret;
  return new NextRequest("https://hideaway.test/api/lost/webhooks/portone", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(requestSecret
        ? { "x-portone-webhook-secret": requestSecret }
        : {})
    },
    body: JSON.stringify(body)
  });
}

// Standard-Webhooks secret: whsec_ + base64(raw key bytes). The signature is
// base64(HMAC-SHA256(`${id}.${timestamp}.${rawBody}`, raw key bytes)).
const WHSEC_RAW = Buffer.from("lost-webhook-signing-key-0123456789");
const WHSEC = `whsec_${WHSEC_RAW.toString("base64")}`;

function signWebhook(
  id: string,
  timestamp: string,
  rawBody: string,
  key: Buffer = WHSEC_RAW
) {
  return createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");
}

function signedWebhookRequest(
  body: unknown,
  options: { signingKey?: Buffer; sendBody?: string } = {}
) {
  const rawBody = JSON.stringify(body);
  const id = "msg_sig_1";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signWebhook(id, timestamp, rawBody, options.signingKey);
  return new NextRequest("https://hideaway.test/api/lost/webhooks/portone", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`
    },
    // sendBody lets a test tamper with the payload after signing.
    body: options.sendBody ?? rawBody
  });
}

describe("POST /api/lost/webhooks/portone", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
    process.env.PORTONE_WEBHOOK_SECRET = LEGACY_SECRET;
    process.env.PORTONE_WEBHOOK_ALLOW_LEGACY = "true";

    find.mockReset();
    update.mockReset();
    beginTransaction.mockReset().mockResolvedValue("tx-1");
    commitTransaction.mockReset().mockResolvedValue(undefined);
    rollbackTransaction.mockReset().mockResolvedValue(undefined);
    markRequestOrderPaid.mockClear();
    releaseStandardInventory.mockClear();
    syncPlanPayment.mockReset();
    cancelPendingPlanPayment.mockReset();
    syncProductPayment.mockReset();
    getPortOnePayment.mockReset().mockResolvedValue({
      status: "PAID",
      amount: { total: 1000, paid: 1000 },
      currency: "KRW",
      channel: { type: "LIVE" },
      transactionId: "txn-1"
    });
    recordCommerceProviderEventStandalone.mockReset().mockResolvedValue({
      recorded: true,
      duplicate: false,
      conflict: false,
      eventId: "event-row-1"
    });
    claimCommerceProviderEvent.mockReset().mockResolvedValue({
      kind: "claimed",
      leaseToken: "lease-1"
    });
    completeCommerceProviderEvent.mockReset().mockResolvedValue(undefined);

    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              status: "pending_payment",
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
              status: "pending",
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

  it("rejects a public placeholder webhook secret", async () => {
    process.env.PORTONE_WEBHOOK_SECRET = "CHANGE_ME_API_KEY";
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-placeholder",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "CHANGE_ME_API_KEY"
      )
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: "webhook-secret-not-configured"
    });
    expect(find).not.toHaveBeenCalled();
  });

  it("rejects unsigned legacy webhooks unless compatibility is explicit", async () => {
    delete process.env.PORTONE_WEBHOOK_ALLOW_LEGACY;
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-unsigned-default",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "signature-required" });
    expect(find).not.toHaveBeenCalled();
  });

  it("requires signed webhooks in live mode even when legacy is enabled", async () => {
    process.env.PORTONE_ENVIRONMENT = "production";
    process.env.PORTONE_WEBHOOK_ALLOW_LEGACY = "true";
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-live-unsigned",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "signature-required" });
    expect(find).not.toHaveBeenCalled();
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

  it("reconciles a V2 product webhook from data.paymentId", async () => {
    syncProductPayment.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      status: "paid",
      alreadyProcessed: false
    });
    const { POST } = await import("./route");
    const event = {
      webhook_id: "evt-v2-product",
      type: "Transaction.Paid",
      data: { paymentId: "lis_1" }
    };
    const res = await POST(webhookRequest(event, "webhook-secret"));

    expect(res.status).toBe(200);
    expect(syncProductPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1"
      })
    );
    expect(recordCommerceProviderEventStandalone).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1",
        event: expect.objectContaining({
          ...event,
          provider_event_id: "evt-v2-product"
        })
      })
    );
    expect(completeCommerceProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-row-1",
        leaseToken: "lease-1",
        status: "processed"
      })
    );
  });

  it("rejects a provider event id reused with different authenticated bytes", async () => {
    recordCommerceProviderEventStandalone.mockResolvedValue({
      recorded: false,
      duplicate: false,
      conflict: true,
      eventId: "event-row-1"
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-conflict",
          type: "Transaction.Paid",
          data: { paymentId: "lis_1" }
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(409);
    expect(syncProductPayment).not.toHaveBeenCalled();
    expect(claimCommerceProviderEvent).not.toHaveBeenCalled();
  });

  it("does not reprocess a provider event with a terminal inbox outcome", async () => {
    claimCommerceProviderEvent.mockResolvedValue({
      kind: "terminal",
      status: "processed",
      outcomeCode: "paid"
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-already-processed",
          type: "Transaction.Paid",
          data: { paymentId: "lis_1" }
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(syncProductPayment).not.toHaveBeenCalled();
  });

  it("returns 503 when V2 payment classification cannot read subscriptions", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "subscriptions")
        throw new Error("database unavailable");
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-plan-classification",
          type: "Transaction.Paid",
          data: { paymentId: "hda_plan_1" }
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(503);
    expect(syncProductPayment).not.toHaveBeenCalled();
  });

  it("retries business reconciliation when event evidence already exists", async () => {
    recordCommerceProviderEventStandalone
      .mockResolvedValueOnce({
        recorded: true,
        duplicate: false,
        conflict: false,
        eventId: "event-row-1"
      })
      .mockResolvedValueOnce({
        recorded: false,
        duplicate: true,
        conflict: false,
        eventId: "event-row-1"
      });
    beginTransaction.mockResolvedValueOnce(null).mockResolvedValueOnce("tx-1");
    const { POST } = await import("./route");
    const event = {
      webhook_id: "evt-1",
      merchant_order_id: "lis_1",
      status: "PAID",
      amount: 1000,
      currency: "KRW"
    };

    const first = await POST(webhookRequest(event, "webhook-secret"));
    const retry = await POST(webhookRequest(event, "webhook-secret"));

    expect(first.status).toBe(500);
    expect(retry.status).toBe(200);
    expect(recordCommerceProviderEventStandalone).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(2);
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("does not rewrite settlement data after successful reconciliation", async () => {
    recordCommerceProviderEventStandalone.mockResolvedValue({
      recorded: false,
      duplicate: true,
      conflict: false,
      eventId: "event-row-1"
    });
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              status: "confirmed",
              payment_status: "paid",
              paid_at: "2026-07-21T07:00:00.000Z",
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
              status: "paid",
              paid_at: "2026-07-21T07:00:00.000Z",
              portone_order_ref: "lis_1",
              portone_transaction_ref: "txn-original"
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
          webhook_id: "evt-paid-replay",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW",
          transaction_ref: "txn-retry"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
    expect(markRequestOrderPaid).not.toHaveBeenCalled();
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("returns 503 when authenticated legacy event evidence cannot be stored", async () => {
    recordCommerceProviderEventStandalone.mockRejectedValue(
      new Error("database unavailable")
    );

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-persistence-failed",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      ok: false,
      error: "provider-event-persistence-failed"
    });
    expect(beginTransaction).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a mutating webhook without a stable provider event id", async () => {
    recordCommerceProviderEventStandalone.mockResolvedValue({
      recorded: false,
      duplicate: false,
      conflict: false,
      eventId: null
    });

    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "missing-provider-event-id"
    });
    expect(beginTransaction).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("records a terminal outcome when a legacy event has no order reference", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      webhookRequest(
        {
          webhook_id: "evt-missing-order",
          paymentId: "provider-payment-1",
          status: "PAID"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(400);
    expect(completeCommerceProviderEvent).toHaveBeenCalledWith({
      payload: expect.anything(),
      eventId: "event-row-1",
      leaseToken: "lease-1",
      status: "rejected",
      outcomeCode: "missing-order-ref"
    });
  });

  it("maps non-paid PortOne events to valid product order statuses", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              status: "pending_payment",
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
              status: "initiated",
              portone_order_ref: "lis_1"
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
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        where: {
          and: [
            { portone_order_ref: { equals: "lis_1" } },
            { provider: { equals: "portone" } }
          ]
        }
      })
    );
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
              status: "failed",
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
    expect(recordCommerceProviderEventStandalone).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "lis_1",
        event: expect.objectContaining({
          provider_event_id: "evt-failed-again"
        })
      })
    );
  });

  it("rejects a reordered failure after payment without mutating state", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "standard_purchase",
              status: "confirmed",
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
              status: "paid",
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
          webhook_id: "evt-reordered-failure",
          merchant_order_id: "lis_1",
          status: "FAILED",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      rejected: "invalid-commerce-transition"
    });
    expect(releaseStandardInventory).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("passes the paid order state to request-to-order campaign handling", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "product-orders") {
        return {
          docs: [
            {
              id: "order-1",
              order_ref: "lis_1",
              order_mode: "request_to_order",
              status: "pending_payment",
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
              status: "pending",
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
          webhook_id: "evt-request-paid",
          merchant_order_id: "lis_1",
          status: "PAID",
          amount: 1000,
          currency: "KRW"
        },
        "webhook-secret"
      )
    );

    expect(res.status).toBe(200);
    expect(markRequestOrderPaid).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({ status: "paid" })
      })
    );
  });

  describe("Standard-Webhooks signature verification", () => {
    const PAID_EVENT = {
      webhook_id: "evt-signed",
      merchant_order_id: "lis_1",
      status: "PAID",
      amount: 1000,
      currency: "KRW"
    };

    beforeEach(() => {
      process.env.PORTONE_WEBHOOK_SECRET = WHSEC;
    });

    it("accepts a webhook carrying a valid Standard-Webhooks signature", async () => {
      const { POST } = await import("./route");
      const res = await POST(signedWebhookRequest(PAID_EVENT));
      const body = (await res.json()) as { ok: boolean };

      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "product-orders",
          id: "order-1",
          data: expect.objectContaining({ payment_status: "paid" })
        })
      );
    });

    it("rejects a tampered body with 400 before any processing", async () => {
      const { POST } = await import("./route");
      const res = await POST(
        signedWebhookRequest(PAID_EVENT, {
          sendBody: JSON.stringify({ ...PAID_EVENT, amount: 999999 })
        })
      );
      const body = (await res.json()) as { ok: boolean; error: string };

      expect(res.status).toBe(400);
      expect(body).toEqual({ ok: false, error: "invalid-webhook-signature" });
      expect(find).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(markRequestOrderPaid).not.toHaveBeenCalled();
    });

    it("rejects a signature made with the wrong key with 400", async () => {
      const { POST } = await import("./route");
      const res = await POST(
        signedWebhookRequest(PAID_EVENT, {
          signingKey: Buffer.from("some-other-key-that-is-not-ours!")
        })
      );
      const body = (await res.json()) as { ok: boolean; error: string };

      expect(res.status).toBe(400);
      expect(body).toEqual({ ok: false, error: "invalid-webhook-signature" });
      expect(find).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it("rejects a partial Standard-Webhooks header set with 400 (no legacy fallback)", async () => {
      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("https://hideaway.test/api/lost/webhooks/portone", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "webhook-id": "msg_partial",
            // signature + timestamp missing; legacy secret must NOT rescue it
            "x-portone-webhook-secret": WHSEC
          },
          body: JSON.stringify(PAID_EVENT)
        })
      );
      const body = (await res.json()) as { ok: boolean; error: string };

      expect(res.status).toBe(400);
      expect(body).toEqual({ ok: false, error: "invalid-webhook-signature" });
      expect(find).not.toHaveBeenCalled();
    });

    it("accepts an unsigned webhook via the legacy shared secret (compat mode)", async () => {
      const { POST } = await import("./route");
      const res = await POST(webhookRequest(PAID_EVENT, WHSEC));

      expect(res.status).toBe(200);
      expect(getPortOnePayment).toHaveBeenCalledWith("lis_1");
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "product-orders",
          data: expect.objectContaining({ payment_status: "paid" })
        })
      );
    });

    it("rejects a legacy paid event when authoritative provider data disagrees", async () => {
      getPortOnePayment.mockResolvedValue({
        status: "PAID",
        amount: { total: 999, paid: 999 },
        currency: "KRW",
        channel: { type: "LIVE" },
        transactionId: "txn-wrong"
      });
      const { POST } = await import("./route");
      const res = await POST(webhookRequest(PAID_EVENT, WHSEC));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        ok: true,
        rejected: "amount-mismatch"
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("rejects unsigned webhooks with 401 when PORTONE_WEBHOOK_REQUIRE_SIGNATURE=true", async () => {
      process.env.PORTONE_WEBHOOK_REQUIRE_SIGNATURE = "true";

      const { POST } = await import("./route");
      // Even a valid legacy shared secret must not be consulted.
      const res = await POST(webhookRequest(PAID_EVENT, WHSEC));
      const body = (await res.json()) as { ok: boolean; error: string };

      expect(res.status).toBe(401);
      expect(body).toEqual({ ok: false, error: "signature-required" });
      expect(find).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it("still accepts signed webhooks when PORTONE_WEBHOOK_REQUIRE_SIGNATURE=true", async () => {
      process.env.PORTONE_WEBHOOK_REQUIRE_SIGNATURE = "true";

      const { POST } = await import("./route");
      const res = await POST(signedWebhookRequest(PAID_EVENT));

      expect(res.status).toBe(200);
      expect((await res.json()).ok).toBe(true);
    });
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
          {
            webhook_id: "evt-plan-paid",
            type: "Transaction.Paid",
            data: { paymentId: "hda_plan_1" }
          },
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
      cancelPendingPlanPayment.mockResolvedValue({ ok: true, canceled: true });
      const { POST } = await import("./route");
      const res = await POST(
        webhookRequest(
          {
            webhook_id: "evt-plan-failed",
            type: "Transaction.Failed",
            data: { paymentId: "hda_plan_1" }
          },
          "webhook-secret"
        )
      );
      const body = (await res.json()) as { ok: boolean; terminal?: string };
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ ok: true, terminal: "failed" });
      // Terminal path must NOT re-fetch PortOne.
      expect(syncPlanPayment).not.toHaveBeenCalled();
      // Pending hold canceled so its seat is freed.
      expect(cancelPendingPlanPayment).toHaveBeenCalledWith(
        expect.objectContaining({ paymentId: "hda_plan_1" })
      );
    });

    it("a duplicate/reordered FAILED does NOT cancel an already-active membership", async () => {
      withPlanSub({ subscription_status: "active", paid: true });
      cancelPendingPlanPayment.mockResolvedValue({ ok: true, canceled: false });
      const { POST } = await import("./route");
      const res = await POST(
        webhookRequest(
          {
            webhook_id: "evt-plan-failed-reordered",
            type: "Transaction.Failed",
            data: { paymentId: "hda_plan_1" }
          },
          "webhook-secret"
        )
      );
      expect(res.status).toBe(200);
      // No cancel write against the active row.
      expect(cancelPendingPlanPayment).toHaveBeenCalledTimes(1);
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
          {
            webhook_id: "evt-plan-rejected",
            type: "Transaction.Paid",
            data: { paymentId: "hda_plan_1" }
          },
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
          {
            webhook_id: "evt-plan-retry",
            type: "Transaction.Paid",
            data: { paymentId: "hda_plan_1" }
          },
          "webhook-secret"
        )
      );
      expect(transient.status).toBe(503);
    });
  });
});
