import { describe, expect, it, vi } from "vitest";

import { recordInventoryReservationReviewEvidence } from "./inventory-reservation-review-evidence";

const baseInput = {
  reservation: { id: "reservation-1", status: "expired" },
  reservationId: "reservation-1",
  paymentId: "payment-1",
  providerEventRef: "portone-event-1",
  quantity: 2,
  baseKey: "payment-confirmation-1",
  providerPaidAt: "2026-07-22T00:16:00.000Z",
  evidenceCode: "provider_payment_late" as const
};

function makePayload() {
  const entries: Record<string, unknown>[] = [];
  const find = vi.fn(async ({ where }: any) => ({
    docs: entries.filter(
      (entry) => entry.idempotency_key === where.idempotency_key.equals
    )
  }));
  const create = vi.fn(async ({ data }: any) => {
    const created = { id: `entry-${entries.length + 1}`, ...data };
    entries.push(created);
    return created;
  });
  return {
    payload: {
      find,
      create,
      db: {
        sessions: {
          "tx-1": {
            db: {
              execute: vi.fn(async () => ({
                rows: [{ transaction_now: "2026-07-22T00:17:00.000Z" }]
              }))
            }
          }
        }
      }
    } as any,
    entries,
    create
  };
}

describe("inventory reservation review evidence", () => {
  it("persists provider evidence at the database transaction time", async () => {
    const { payload, create } = makePayload();
    const req = { transactionID: "tx-1" } as any;
    await expect(
      recordInventoryReservationReviewEvidence({ ...baseInput, payload, req })
    ).resolves.toEqual(
      expect.objectContaining({
        operation: "late_payment_detected",
        provider_event_ref: baseInput.providerEventRef,
        provider_paid_at: baseInput.providerPaidAt,
        evidence_code: baseInput.evidenceCode,
        effective_at: "2026-07-22T00:17:00.000Z"
      })
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-reservation-entries",
        overrideAccess: true,
        req
      })
    );
  });

  it("replays identical evidence without creating a duplicate", async () => {
    const { payload, create } = makePayload();
    const req = { transactionID: "tx-1" } as any;
    const first = await recordInventoryReservationReviewEvidence({
      ...baseInput,
      payload,
      req
    });
    const replay = await recordInventoryReservationReviewEvidence({
      ...baseInput,
      payload,
      req
    });
    expect(replay).toEqual(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("rejects reuse of an evidence key with a different provider event", async () => {
    const { payload, create } = makePayload();
    const req = { transactionID: "tx-1" } as any;
    await recordInventoryReservationReviewEvidence({
      ...baseInput,
      payload,
      req
    });
    await expect(
      recordInventoryReservationReviewEvidence({
        ...baseInput,
        payload,
        req,
        providerEventRef: "portone-event-2"
      })
    ).rejects.toThrow("inventory-reservation-idempotency-conflict");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
