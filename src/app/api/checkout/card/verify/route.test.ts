import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const isSameOrigin = vi.fn(() => true);
const rateLimitOr429 = vi.fn(async () => null);
const syncPlanPayment = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth,
    logger: { error: vi.fn(), warn: vi.fn() }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin }));
vi.mock("@/lib/api/rateLimit", () => ({ rateLimitOr429 }));
vi.mock("@/lib/lost-commerce/plan-payment", () => ({ syncPlanPayment }));

function req(body: unknown): NextRequest {
  return new NextRequest("https://hideawayseoul.com/api/checkout/card/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://hideawayseoul.com"
    },
    body: JSON.stringify(body)
  });
}

async function POST(request: NextRequest) {
  const mod = await import("./route");
  return mod.POST(request);
}

beforeEach(() => {
  vi.resetModules();
  auth.mockReset().mockResolvedValue({ user: { id: "user-1" } });
  isSameOrigin.mockReset().mockReturnValue(true);
  rateLimitOr429.mockReset().mockResolvedValue(null);
  syncPlanPayment.mockReset();
});

describe("POST /api/checkout/card/verify", () => {
  it("403s a cross-origin request (CSRF)", async () => {
    isSameOrigin.mockReturnValueOnce(false);
    const res = await POST(req({ payment_ref: "hda_plan_1" }));
    expect(res.status).toBe(403);
    expect(syncPlanPayment).not.toHaveBeenCalled();
  });

  it("401s an unauthenticated request (no PortOne fetch)", async () => {
    auth.mockResolvedValueOnce({ user: null });
    const res = await POST(req({ payment_ref: "hda_plan_1" }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("unauthorized");
    expect(syncPlanPayment).not.toHaveBeenCalled();
  });

  it("429s when the caller is over the rate limit", async () => {
    const limited = new Response(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: { "content-type": "application/json" }
      }
    );
    rateLimitOr429.mockResolvedValueOnce(limited as never);
    const res = await POST(req({ payment_ref: "hda_plan_1" }));
    expect(res.status).toBe(429);
    expect(syncPlanPayment).not.toHaveBeenCalled();
  });

  it("passes the caller's id as expectedUserId (ownership enforced downstream)", async () => {
    syncPlanPayment.mockResolvedValue({
      ok: true,
      subscriptionId: "sub-1",
      status: "active",
      alreadyProcessed: false
    });
    const res = await POST(req({ payment_ref: "hda_plan_1" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, subscriptionId: "sub-1" });
    expect(syncPlanPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "hda_plan_1",
        expectedUserId: "user-1"
      })
    );
  });

  it("returns 404 for a non-owner / missing ref (no existence oracle)", async () => {
    // syncPlanPayment collapses "not yours" and "doesn't exist" into the same
    // 404 subscription-not-found when expectedUserId does not match.
    syncPlanPayment.mockResolvedValue({
      ok: false,
      status: 404,
      reason: "subscription-not-found"
    });
    const res = await POST(req({ payment_ref: "someone-elses-ref" }));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("subscription-not-found");
  });

  it("400s a malformed body", async () => {
    const res = await POST(req({ not_payment_ref: 1 }));
    expect(res.status).toBe(400);
    expect(syncPlanPayment).not.toHaveBeenCalled();
  });
});
