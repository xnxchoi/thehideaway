import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPortOnePayment, requiresLiveChannel } = vi.hoisted(() => ({
  getPortOnePayment: vi.fn(),
  requiresLiveChannel: vi.fn(() => true)
}));

vi.mock("./verify-payment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./verify-payment")>();
  return {
    ...actual,
    getPortOnePayment,
    requiresLiveChannel
  };
});

vi.mock("@/lib/db/sequences", () => ({
  paymentWebhookLock: vi.fn(async () => undefined)
}));

import { syncPlanPayment } from "./plan-payment";

type FakeSub = {
  id: string;
  amount: number;
  currency: { name: string } | string;
  paid: boolean;
  subscription_status: string;
  payment_ref: string;
  user?: string | { id: string };
};

function makePayload(sub: FakeSub | null) {
  const update = vi.fn(async (_args: Record<string, unknown>) => ({}));
  // Both the unlocked pre-check and the in-transaction re-read hit `find`;
  // return the same row for both.
  const find = vi.fn(async (_args?: Record<string, unknown>) => ({
    docs: (sub ? [sub] : []) as FakeSub[]
  }));
  const beginTransaction = vi.fn(async () => "txn-1");
  const commitTransaction = vi.fn(async () => undefined);
  const rollbackTransaction = vi.fn(async () => undefined);
  return {
    payload: {
      find,
      update,
      db: { beginTransaction, commitTransaction, rollbackTransaction },
      logger: { error: vi.fn(), info: vi.fn() }
    } as never,
    update,
    find,
    commitTransaction,
    rollbackTransaction
  };
}

const paidRecord = {
  status: "PAID",
  amount: { total: 120000 },
  currency: "KRW",
  channel: { type: "LIVE" },
  transactionId: "txn_1"
};

beforeEach(() => {
  getPortOnePayment.mockReset();
  requiresLiveChannel.mockReset().mockReturnValue(true);
});

describe("syncPlanPayment", () => {
  it("returns not-found when no subscription carries the payment ref", async () => {
    const { payload } = makePayload(null);
    const result = await syncPlanPayment({ payload, paymentId: "missing" });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("returns 404 (no oracle) when expectedUserId is not the row owner, before any PortOne fetch", async () => {
    const { payload } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1",
      user: "owner-user"
    });
    getPortOnePayment.mockResolvedValue(paidRecord);

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1",
      expectedUserId: "attacker-user"
    });

    // Same 404 as a genuinely missing row — indistinguishable to the caller.
    expect(result).toMatchObject({
      ok: false,
      status: 404,
      reason: "subscription-not-found"
    });
    // Ownership gate runs BEFORE the outbound PortOne fetch (no amplification).
    expect(getPortOnePayment).not.toHaveBeenCalled();
  });

  it("proceeds for the row owner when expectedUserId matches (relationship as object)", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1",
      user: { id: "owner-user" }
    });
    getPortOnePayment.mockResolvedValue(paidRecord);

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1",
      expectedUserId: "owner-user"
    });

    expect(result).toMatchObject({ ok: true, status: "active" });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("marks a pending subscription paid on a verified payment", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1"
    });
    getPortOnePayment.mockResolvedValue(paidRecord);

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toEqual({
      ok: true,
      subscriptionId: "sub-1",
      status: "active",
      alreadyProcessed: false
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0]).toMatchObject({
      collection: "subscriptions",
      id: "sub-1",
      data: expect.objectContaining({ paid: true, provider: "portone" })
    });
    // Normal (pending) case: does NOT force status — the hook promotes it.
    expect(
      (
        update.mock.calls[0][0] as {
          data: { subscription_status?: string };
        }
      ).data.subscription_status
    ).toBeUndefined();
  });

  it("recovers a swept (canceled) row — re-sets it pending so the hook activates", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "canceled",
      payment_ref: "hda_plan_1"
    });
    getPortOnePayment.mockResolvedValue(paidRecord);

    const result = await syncPlanPayment({ payload, paymentId: "hda_plan_1" });

    expect(result).toMatchObject({ ok: true, status: "active" });
    // Re-set to pending in the same write → autoActivateOnPaid promotes it,
    // stamps expiry, syncs role, issues invoice (no paid-but-canceled orphan).
    expect(update.mock.calls[0][0]).toMatchObject({
      data: expect.objectContaining({
        paid: true,
        subscription_status: "pending"
      })
    });
  });

  it("is idempotent — an already-active subscription is not re-processed", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: true,
      subscription_status: "active",
      payment_ref: "hda_plan_1"
    });

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toEqual({
      ok: true,
      subscriptionId: "sub-1",
      status: "active",
      alreadyProcessed: true
    });
    // No PortOne fetch, no write — pure short-circuit.
    expect(getPortOnePayment).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("is race-safe — if the row is paid by the time we hold the lock, no second write", async () => {
    // Pre-check sees pending; the in-transaction re-read sees the winner's
    // paid=true. Second call must be a no-op (no double invoice).
    const pending: FakeSub = {
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1"
    };
    const { payload, update, commitTransaction } = makePayload(pending);
    getPortOnePayment.mockResolvedValue(paidRecord);
    // First find (pre-check) → pending; second find (locked) → already paid.
    (payload as unknown as { find: ReturnType<typeof vi.fn> }).find
      .mockResolvedValueOnce({ docs: [pending] })
      .mockResolvedValueOnce({
        docs: [{ ...pending, paid: true, subscription_status: "active" }]
      });

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toMatchObject({ ok: true, alreadyProcessed: true });
    expect(update).not.toHaveBeenCalled();
    expect(commitTransaction).not.toHaveBeenCalled();
  });

  it("rejects an amount mismatch and leaves the row pending", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1"
    });
    getPortOnePayment.mockResolvedValue({
      ...paidRecord,
      amount: { total: 1000 }
    });

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      reason: "amount-mismatch"
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a TEST-channel payment in production", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1"
    });
    getPortOnePayment.mockResolvedValue({
      ...paidRecord,
      channel: { type: "TEST" }
    });

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      reason: "test-channel-rejected"
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 503 (retryable) when PortOne cannot be reached", async () => {
    const { payload, update } = makePayload({
      id: "sub-1",
      amount: 120000,
      currency: { name: "KRW" },
      paid: false,
      subscription_status: "pending",
      payment_ref: "hda_plan_1"
    });
    getPortOnePayment.mockRejectedValue(new Error("portone-verify-failed:500"));

    const result = await syncPlanPayment({
      payload,
      paymentId: "hda_plan_1"
    });

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });
    expect(update).not.toHaveBeenCalled();
  });
});
