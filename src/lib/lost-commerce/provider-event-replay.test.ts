import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cancelPendingPlanPayment: vi.fn(),
  claimCommerceProviderEvent: vi.fn(),
  completeCommerceProviderEvent: vi.fn(),
  syncPlanPayment: vi.fn(),
  syncProductPayment: vi.fn()
}));

vi.mock("./provider-events", () => ({
  claimCommerceProviderEvent: mocks.claimCommerceProviderEvent,
  completeCommerceProviderEvent: mocks.completeCommerceProviderEvent
}));

vi.mock("./plan-payment", () => ({
  cancelPendingPlanPayment: mocks.cancelPendingPlanPayment,
  syncPlanPayment: mocks.syncPlanPayment
}));

vi.mock("./product-payment", () => ({
  syncProductPayment: mocks.syncProductPayment
}));

import { replayCommerceProviderEvent } from "./provider-event-replay";

describe("provider event replay", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.claimCommerceProviderEvent.mockResolvedValue({
      kind: "claimed",
      leaseToken: "lease-1"
    });
    mocks.completeCommerceProviderEvent.mockResolvedValue(undefined);
  });

  it("re-fetches authoritative product payment state and completes the inbox event", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        payment_ref: "lis_order_1",
        provider: "portone",
        processing_status: "processing"
      })),
      find: vi.fn(async () => ({ docs: [] }))
    } as any;
    mocks.syncProductPayment.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      status: "paid",
      alreadyProcessed: false
    });

    const result = await replayCommerceProviderEvent({
      payload,
      eventId: "event-row-1"
    });

    expect(mocks.claimCommerceProviderEvent).toHaveBeenCalledWith({
      payload,
      eventId: "event-row-1",
      allowRejectedReplay: true
    });
    expect(mocks.syncProductPayment).toHaveBeenCalledWith({
      payload,
      paymentId: "lis_order_1",
      providerEventRef: "event-row-1"
    });
    expect(mocks.completeCommerceProviderEvent).toHaveBeenCalledWith({
      payload,
      eventId: "event-row-1",
      leaseToken: "lease-1",
      status: "processed",
      outcomeCode: "product-payment-paid"
    });
    expect(result).toEqual({
      kind: "completed",
      status: "processed",
      outcomeCode: "product-payment-paid"
    });
  });

  it("keeps provider outages retryable", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        payment_ref: "lis_order_1",
        provider: "portone"
      })),
      find: vi.fn(async () => ({ docs: [] }))
    } as any;
    mocks.syncProductPayment.mockResolvedValue({
      ok: false,
      status: 503,
      reason: "verify-unavailable"
    });

    const result = await replayCommerceProviderEvent({
      payload,
      eventId: "event-row-1"
    });

    expect(mocks.completeCommerceProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "retryable",
        outcomeCode: "verify-unavailable"
      })
    );
    expect(result).toEqual({
      kind: "completed",
      status: "retryable",
      outcomeCode: "verify-unavailable"
    });
  });

  it("does not reprocess a completed event", async () => {
    const payload = {} as any;
    mocks.claimCommerceProviderEvent.mockResolvedValue({
      kind: "terminal",
      status: "processed",
      outcomeCode: "product-payment-paid"
    });

    const result = await replayCommerceProviderEvent({
      payload,
      eventId: "event-row-1"
    });

    expect(result).toEqual({
      kind: "terminal",
      status: "processed",
      outcomeCode: "product-payment-paid"
    });
    expect(mocks.syncProductPayment).not.toHaveBeenCalled();
    expect(mocks.completeCommerceProviderEvent).not.toHaveBeenCalled();
  });

  it("returns busy without reading or processing the event", async () => {
    const payload = { findByID: vi.fn() } as any;
    mocks.claimCommerceProviderEvent.mockResolvedValue({ kind: "busy" });

    await expect(
      replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
    ).resolves.toEqual({ kind: "busy" });
    expect(payload.findByID).not.toHaveBeenCalled();
  });

  it("records event read and classification failures as retryable", async () => {
    const unreadablePayload = {
      findByID: vi.fn(async () => {
        throw new Error("database unavailable");
      })
    } as any;

    await expect(
      replayCommerceProviderEvent({
        payload: unreadablePayload,
        eventId: "event-row-1"
      })
    ).resolves.toMatchObject({
      status: "retryable",
      outcomeCode: "provider-event-read-unavailable"
    });

    mocks.completeCommerceProviderEvent.mockClear();
    const unclassifiedPayload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        provider: "portone",
        payment_ref: "lis_order_1"
      })),
      find: vi.fn(async () => {
        throw new Error("database unavailable");
      })
    } as any;
    await expect(
      replayCommerceProviderEvent({
        payload: unclassifiedPayload,
        eventId: "event-row-1"
      })
    ).resolves.toMatchObject({
      status: "retryable",
      outcomeCode: "webhook-classification-unavailable"
    });
  });

  it("rejects persisted evidence without a usable provider reference", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        provider: "portone"
      }))
    } as any;

    await expect(
      replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
    ).resolves.toMatchObject({
      status: "rejected",
      outcomeCode: "missing-payment-ref"
    });

    payload.findByID.mockResolvedValue({
      id: "event-row-1",
      provider: "other",
      payment_ref: "payment-1"
    });
    await expect(
      replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
    ).resolves.toMatchObject({
      status: "rejected",
      outcomeCode: "unsupported-provider"
    });
  });

  it.each([
    {
      event: { provider_status: "FAILED" },
      expected: "plan-payment-failed"
    },
    {
      event: { event_type: "Transaction.Refunded" },
      expected: "plan-payment-refunded"
    }
  ])(
    "replays terminal plan event as $expected",
    async ({ event, expected }) => {
      const payload = {
        findByID: vi.fn(async () => ({
          id: "event-row-1",
          provider: "portone",
          payment_ref: "plan-payment-1",
          ...event
        })),
        find: vi.fn(async () => ({ docs: [{ id: "subscription-1" }] }))
      } as any;
      mocks.cancelPendingPlanPayment.mockResolvedValue({
        ok: true,
        canceled: true
      });
      mocks.syncPlanPayment.mockResolvedValue({
        ok: false,
        status: 402,
        reason: "not-paid"
      });

      await expect(
        replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
      ).resolves.toMatchObject({ status: "processed", outcomeCode: expected });
    }
  );

  it("uses current paid state instead of stale failed event evidence", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        provider: "portone",
        payment_ref: "plan-payment-1",
        provider_status: "FAILED"
      })),
      find: vi.fn(async () => ({ docs: [{ id: "subscription-1" }] }))
    } as any;
    mocks.syncPlanPayment.mockResolvedValue({
      ok: true,
      subscriptionId: "subscription-1",
      status: "active",
      alreadyProcessed: false
    });

    await expect(
      replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
    ).resolves.toMatchObject({
      status: "processed",
      outcomeCode: "plan-payment-paid"
    });
    expect(mocks.cancelPendingPlanPayment).not.toHaveBeenCalled();
  });

  it("reconciles a non-terminal plan event and preserves terminal rejection", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "event-row-1",
        provider: "portone",
        payment_ref: "plan-payment-1",
        provider_status: "PAID"
      })),
      find: vi.fn(async () => ({ docs: [{ id: "subscription-1" }] }))
    } as any;
    mocks.syncPlanPayment.mockResolvedValue({
      ok: false,
      status: 409,
      reason: "amount-mismatch"
    });

    await expect(
      replayCommerceProviderEvent({ payload, eventId: "event-row-1" })
    ).resolves.toMatchObject({
      status: "rejected",
      outcomeCode: "amount-mismatch"
    });
  });
});
