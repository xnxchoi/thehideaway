import { describe, expect, it, vi } from "vitest";

import {
  claimCommerceProviderEvent,
  completeCommerceProviderEvent,
  hashCommerceProviderPayload,
  recordCommerceProviderEvent,
  recordCommerceProviderEventStandalone,
  sanitizeCommerceProviderEvent
} from "./provider-events";

vi.mock("@/lib/db/sequences", () => ({
  paymentWebhookLock: vi.fn(async () => undefined)
}));

describe("commerce provider events", () => {
  it("keeps only the required provider evidence", () => {
    const record = sanitizeCommerceProviderEvent({
      paymentId: "lis_1",
      event: {
        provider_event_id: "evt-1",
        type: "Transaction.Paid",
        data: {
          status: "PAID",
          transactionId: "txn-1",
          customerEmail: "private@example.com"
        },
        rawCustomer: { phone: "010-0000-0000" }
      }
    });

    expect(record).toEqual({
      dedupe_key: "portone:evt-1",
      provider: "portone",
      event_key: "evt-1",
      event_type: "Transaction.Paid",
      payment_ref: "lis_1",
      provider_status: "PAID",
      transaction_ref: "txn-1"
    });
    expect(JSON.stringify(record)).not.toContain("private@example.com");
    expect(JSON.stringify(record)).not.toContain("010-0000-0000");
  });

  it("returns null when no stable provider event id exists", () => {
    expect(
      sanitizeCommerceProviderEvent({
        paymentId: "lis_1",
        event: { type: "Transaction.Paid" }
      })
    ).toBeNull();
  });

  it("creates an immutable event once inside the caller transaction", async () => {
    const req = { transactionID: "tx-1" };
    const payload = {
      find: vi.fn(async () => ({ docs: [] })),
      create: vi.fn(async () => ({ id: "event-row-1" }))
    } as any;

    const result = await recordCommerceProviderEvent({
      payload,
      req,
      paymentId: "lis_1",
      productPaymentId: "payment-1",
      event: { provider_event_id: "evt-1", type: "Transaction.Paid" }
    });

    expect(result).toEqual({
      recorded: true,
      duplicate: false,
      conflict: false,
      eventId: "event-row-1"
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "commerce-provider-events",
        req,
        data: expect.objectContaining({
          dedupe_key: "portone:evt-1",
          product_payment: "payment-1"
        })
      })
    );
  });

  it("treats an existing dedupe key as a replay", async () => {
    const rawBody = JSON.stringify({
      provider_event_id: "evt-1",
      type: "Transaction.Paid"
    });
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: "event-row-1",
            payload_hash: hashCommerceProviderPayload(rawBody)
          }
        ]
      })),
      create: vi.fn()
    } as any;

    const result = await recordCommerceProviderEvent({
      payload,
      req: { transactionID: "tx-1" },
      paymentId: "lis_1",
      event: { provider_event_id: "evt-1" },
      rawBody
    });

    expect(result).toEqual({
      recorded: false,
      duplicate: true,
      conflict: false,
      eventId: "event-row-1"
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("rejects a reused provider event id with different authenticated bytes", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            id: "event-row-1",
            payload_hash: hashCommerceProviderPayload('{"status":"PAID"}')
          }
        ]
      })),
      create: vi.fn()
    } as any;

    const result = await recordCommerceProviderEvent({
      payload,
      req: { transactionID: "tx-1" },
      paymentId: "lis_1",
      event: { provider_event_id: "evt-1" },
      rawBody: '{"status":"FAILED"}'
    });

    expect(result).toEqual({
      recorded: false,
      duplicate: false,
      conflict: true,
      eventId: "event-row-1"
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("commits authenticated evidence independently from business reconciliation", async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [] })),
      create: vi.fn(async () => ({ id: "event-row-1" })),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;

    const result = await recordCommerceProviderEventStandalone({
      payload,
      paymentId: "lis_1",
      event: { provider_event_id: "evt-rejected" }
    });

    expect(result).toEqual({
      recorded: true,
      duplicate: false,
      conflict: false,
      eventId: "event-row-1"
    });
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("claims retryable processing with a fencing token", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        processing_status: "received",
        attempt_count: 0
      })),
      update: vi.fn(async ({ data }) => ({ id: "event-row-1", ...data })),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      logger: { error: vi.fn() }
    } as any;

    const result = await claimCommerceProviderEvent({
      payload,
      eventId: "event-row-1",
      now: new Date("2026-07-21T08:00:00.000Z")
    });

    expect(result.kind).toBe("claimed");
    expect(result).toHaveProperty("leaseToken");
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processing_status: "processing",
          attempt_count: 1,
          last_attempt_at: "2026-07-21T08:00:00.000Z"
        })
      })
    );
  });

  it("rejects completion by a stale processing lease", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        processing_status: "processing",
        lease_token_hash: hashCommerceProviderPayload("current-token")
      })),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => {
          throw new Error("rollback failed");
        })
      },
      logger: { error: vi.fn() }
    } as any;

    await expect(
      completeCommerceProviderEvent({
        payload,
        eventId: "event-row-1",
        leaseToken: "stale-token",
        status: "processed",
        outcomeCode: "paid"
      })
    ).rejects.toThrow("provider-event-lease-lost");
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("does not steal an active processing lease", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        processing_status: "processing",
        attempt_count: 1,
        lease_expires_at: "2026-07-21T08:01:00.000Z"
      })),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      }
    } as any;

    const result = await claimCommerceProviderEvent({
      payload,
      eventId: "event-row-1",
      now: new Date("2026-07-21T08:00:00.000Z")
    });

    expect(result).toEqual({ kind: "busy" });
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("returns a stored terminal processing outcome", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        processing_status: "rejected",
        outcome_code: "amount-mismatch"
      })),
      update: vi.fn(),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      }
    } as any;

    const result = await claimCommerceProviderEvent({
      payload,
      eventId: "event-row-1"
    });

    expect(result).toEqual({
      kind: "terminal",
      status: "rejected",
      outcomeCode: "amount-mismatch"
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("allows an explicit operator replay to reclaim a rejected event", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        processing_status: "rejected",
        attempt_count: 2,
        outcome_code: "verify-unavailable"
      })),
      update: vi.fn(async ({ data }) => ({ id: "event-row-1", ...data })),
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      }
    } as any;

    const result = await claimCommerceProviderEvent({
      payload,
      eventId: "event-row-1",
      allowRejectedReplay: true,
      now: new Date("2026-07-21T08:00:00.000Z")
    });

    expect(result.kind).toBe("claimed");
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processing_status: "processing",
          attempt_count: 3,
          outcome_code: null,
          last_error_code: null,
          processed_at: null
        })
      })
    );
  });

  it.each([
    ["processed", "paid", "2026-07-21T08:00:00.000Z"],
    ["rejected", "amount-mismatch", "2026-07-21T08:00:00.000Z"],
    ["retryable", "database-unavailable", undefined]
  ] as const)(
    "stores a %s processing outcome and clears the lease",
    async (status, outcomeCode, processedAt) => {
      const payload = {
        findByID: vi.fn(async () => ({
          id: "event-row-1",
          processing_status: "processing",
          lease_token_hash: hashCommerceProviderPayload("current-token")
        })),
        update: vi.fn(async () => ({ id: "event-row-1" })),
        db: {
          beginTransaction: vi.fn(async () => "tx-1"),
          commitTransaction: vi.fn(async () => undefined),
          rollbackTransaction: vi.fn(async () => undefined)
        }
      } as any;

      await completeCommerceProviderEvent({
        payload,
        eventId: "event-row-1",
        leaseToken: "current-token",
        status,
        outcomeCode,
        now: new Date("2026-07-21T08:00:00.000Z")
      });

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            processing_status: status,
            outcome_code: status === "retryable" ? null : outcomeCode,
            last_error_code: status === "retryable" ? outcomeCode : null,
            processed_at: processedAt ?? null,
            lease_token_hash: null,
            lease_expires_at: null
          })
        })
      );
      expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
    }
  );
});
