import { beforeEach, describe, expect, it, vi } from "vitest";

const replayCommerceProviderEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lost-commerce/provider-event-replay", () => ({
  replayCommerceProviderEvent
}));

import { replayProviderEventHandler } from "./replay";

describe("provider event replay endpoint", () => {
  beforeEach(() => replayCommerceProviderEvent.mockReset());

  it("requires an admin", async () => {
    const response = await replayProviderEventHandler({
      payload: {},
      routeParams: { id: "event-row-1" },
      user: { id: "user-1", role: "editor" }
    } as any);

    expect(response.status).toBe(403);
    expect(replayCommerceProviderEvent).not.toHaveBeenCalled();
  });

  it("runs a fenced replay for an admin", async () => {
    replayCommerceProviderEvent.mockResolvedValue({
      kind: "completed",
      status: "processed",
      outcomeCode: "product-payment-paid"
    });
    const payload = {};

    const response = await replayProviderEventHandler({
      payload,
      routeParams: { id: "event-row-1" },
      user: { id: "admin-1", role: "admin" }
    } as any);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      result: {
        kind: "completed",
        status: "processed",
        outcomeCode: "product-payment-paid"
      }
    });
    expect(replayCommerceProviderEvent).toHaveBeenCalledWith({
      payload,
      eventId: "event-row-1"
    });
  });

  it("reports a retryable replay as unavailable", async () => {
    replayCommerceProviderEvent.mockResolvedValue({
      kind: "completed",
      status: "retryable",
      outcomeCode: "verify-unavailable"
    });

    const response = await replayProviderEventHandler({
      payload: {},
      routeParams: { id: "event-row-1" },
      user: { id: "admin-1", role: "admin" }
    } as any);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      result: {
        kind: "completed",
        status: "retryable",
        outcomeCode: "verify-unavailable"
      }
    });
  });
});
