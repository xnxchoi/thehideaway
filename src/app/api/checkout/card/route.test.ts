import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findByID = vi.fn();
const find = vi.fn();
const count = vi.fn();
const create = vi.fn();
const update = vi.fn();
const idemPut = vi.fn(async () => undefined);

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth,
    findByID,
    find,
    count,
    create,
    update,
    logger: { error: vi.fn(), warn: vi.fn() }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

vi.mock("@/lib/api/idempotency", () => ({
  beginIdempotent: vi.fn(() => ({ get: () => null, put: idemPut }))
}));

vi.mock("@/lib/lost-commerce/portone", () => ({
  isPortOneCheckoutEnabled: vi.fn(() => true),
  buildPlanPortOnePayload: vi.fn(() => ({ storeId: "store", paymentId: "p" }))
}));

function req(body: unknown): NextRequest {
  return new NextRequest("https://hideawayseoul.com/api/checkout/card", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://hideawayseoul.com"
    },
    body: JSON.stringify(body)
  });
}

const activeCardPlan = {
  id: "plan-1",
  state: "active",
  tier_label: "Patron",
  name: "Patron · Yearly · KRW",
  payment_methods: ["card"],
  seat_limit: 0
};

const krwPrice = {
  id: "price-1",
  active: true,
  unit_amount: 120000,
  plan: "plan-1",
  currency: { id: "cur-krw", name: "KRW" }
};

async function POST(request: NextRequest) {
  const mod = await import("./route");
  return mod.POST(request);
}

beforeEach(() => {
  vi.resetModules();
  auth.mockReset().mockResolvedValue({ user: { id: "user-1" } });
  findByID.mockReset();
  // Default: every `find` (sweep, existing-pending lookup) returns no docs.
  // Individual tests override the FIRST call (price resolution) via
  // mockResolvedValueOnce.
  find.mockReset().mockResolvedValue({ docs: [] });
  count.mockReset().mockResolvedValue({ totalDocs: 0 });
  create.mockReset().mockResolvedValue({ id: "sub-1" });
  update.mockReset().mockResolvedValue({});
  idemPut.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/checkout/card", () => {
  it("401s an unauthenticated request", async () => {
    auth.mockResolvedValueOnce({ user: null });
    const res = await POST(req({ plan_id: "plan-1" }));
    expect(res.status).toBe(401);
  });

  it("rejects when card is not enabled on the plan", async () => {
    findByID.mockResolvedValueOnce({
      ...activeCardPlan,
      payment_methods: ["bank_transfer"]
    });
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("card-not-enabled");
  });

  it("rejects a ₩0 price (no free products through card)", async () => {
    findByID.mockResolvedValueOnce(activeCardPlan);
    find.mockResolvedValueOnce({
      docs: [{ ...krwPrice, unit_amount: 0 }]
    });
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid-amount");
  });

  it("rejects a sold-out plan (seat cap re-checked server-side)", async () => {
    findByID.mockResolvedValueOnce({ ...activeCardPlan, seat_limit: 5 });
    find.mockResolvedValueOnce({ docs: [krwPrice] });
    count.mockResolvedValueOnce({ totalDocs: 5 });
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toBe("sold-out");
  });

  it("creates a pending subscription and returns the PortOne payload", async () => {
    findByID.mockResolvedValueOnce(activeCardPlan);
    find.mockResolvedValueOnce({ docs: [krwPrice] });
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.subscriptionId).toBe("sub-1");
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      collection: "subscriptions",
      data: expect.objectContaining({
        paid: false,
        provider: "portone",
        request_method: "card",
        amount: 120000
      })
    });
    // payment_ref is unique per checkout start.
    expect(create.mock.calls[0][0].data.payment_ref).toBe(body.paymentRef);
  });

  it("reuses (does not duplicate) the caller's own pending card sub on retry", async () => {
    findByID.mockResolvedValueOnce(activeCardPlan);
    find
      // 1) price resolution
      .mockResolvedValueOnce({ docs: [krwPrice] })
      // 2) sweep — nothing stale
      .mockResolvedValueOnce({ docs: [] })
      // 3) existing-pending lookup — the abandoned card hold
      .mockResolvedValueOnce({
        docs: [{ id: "sub-existing", paid: false, request_method: "card" }]
      });

    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.subscriptionId).toBe("sub-existing");
    // No new row minted — the existing pending row is refreshed instead.
    expect(create).not.toHaveBeenCalled();
    const refresh = update.mock.calls.find(
      (c) => (c[0] as { id?: string }).id === "sub-existing"
    );
    expect(refresh).toBeTruthy();
    expect(
      (refresh?.[0] as { data: { payment_ref: string } }).data.payment_ref
    ).toBe(body.paymentRef);
  });

  it("lets a retrying buyer reuse their hold on a SOLD-OUT seat-limited plan", async () => {
    // seat_limit=1 and the count would report the seat full — but the full
    // seat is THIS user's own pending hold, so reuse must not be rejected.
    findByID.mockResolvedValueOnce({ ...activeCardPlan, seat_limit: 1 });
    count.mockResolvedValue({ totalDocs: 1 });
    find
      .mockResolvedValueOnce({ docs: [krwPrice] }) // price
      .mockResolvedValueOnce({ docs: [] }) // sweep
      .mockResolvedValueOnce({
        docs: [{ id: "sub-existing", paid: false, request_method: "card" }]
      }); // existing-pending (before seat gate)

    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.subscriptionId).toBe("sub-existing");
    // Seat gate was NOT applied — count.mockResolvedValue(1) would have
    // rejected as sold-out if the reuse path had not short-circuited it.
    expect(create).not.toHaveBeenCalled();
  });

  it("does not hijack a pending MANUAL (bank/cash) sub into a card window", async () => {
    findByID.mockResolvedValueOnce(activeCardPlan);
    find
      .mockResolvedValueOnce({ docs: [krwPrice] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [
          { id: "sub-manual", paid: false, request_method: "bank_transfer" }
        ]
      });
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toBe("pending-manual-exists");
    expect(create).not.toHaveBeenCalled();
  });

  it("on a create race, adopts and refreshes the winner's pending row", async () => {
    findByID.mockResolvedValueOnce(activeCardPlan);
    find
      .mockResolvedValueOnce({ docs: [krwPrice] })
      .mockResolvedValueOnce({ docs: [] })
      // existing-pending lookup: none at first (we go to create)
      .mockResolvedValueOnce({ docs: [] })
      // race re-read after unique violation: the winner exists
      .mockResolvedValueOnce({ docs: [{ id: "sub-winner", paid: false }] });
    create.mockRejectedValueOnce(
      Object.assign(new Error("duplicate key value"), { code: "23505" })
    );
    const res = await POST(req({ plan_id: "plan-1" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.subscriptionId).toBe("sub-winner");
  });
});
