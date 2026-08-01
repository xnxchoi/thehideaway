import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLocalReq: vi.fn(),
  getPayload: vi.fn(),
  getServerSession: vi.fn(),
  listQueue: vi.fn(),
  nextHeaders: vi.fn(),
  rateLimitOr429: vi.fn()
}));

vi.mock("next/headers", () => ({ headers: mocks.nextHeaders }));
vi.mock("payload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("payload")>()),
  createLocalReq: mocks.createLocalReq,
  getPayload: mocks.getPayload
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));
vi.mock("@/lib/lost-commerce/inventory-reservation-operator-queries", () => ({
  listInventoryReservationOperatorQueue: mocks.listQueue
}));

const userId = "00000000-0000-7000-8000-000000000001";
const payload = { findByID: vi.fn(), logger: { error: vi.fn() } };

function request(query = "") {
  return new NextRequest(
    `https://lostinseoul.com/api/lost/inventory/reservations${query}`
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nextHeaders.mockResolvedValue(new Headers({ cookie: "session=test" }));
  mocks.getServerSession.mockResolvedValue({
    user: { id: userId, role: "admin" }
  });
  mocks.getPayload.mockResolvedValue(payload);
  payload.findByID.mockResolvedValue({ id: userId, role: "admin" });
  mocks.createLocalReq.mockResolvedValue({
    payload,
    context: {},
    user: { id: userId, role: "admin" }
  });
  mocks.rateLimitOr429.mockResolvedValue(null);
  mocks.listQueue.mockResolvedValue({
    queue: "stuck",
    generatedAt: "2026-07-23T00:00:00.000Z",
    stateHash: "a".repeat(64),
    items: []
  });
});

describe("GET inventory reservation operator queue", () => {
  it("returns an admin-only no-store queue", async () => {
    const { GET } = await import("./route");
    const response = await GET(request("?queue=stuck"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      ok: true,
      data: { queue: "stuck" }
    });
  });

  it("rejects a non-admin session", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { id: userId, role: "editor" }
    });
    const { GET } = await import("./route");
    const response = await GET(request("?queue=active"));

    expect(response.status).toBe(403);
    expect(mocks.listQueue).not.toHaveBeenCalled();
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-queue-rejected",
      actorId: userId,
      errorCode: "session-admin-required"
    });
  });

  it("rejects an unauthenticated request", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unauthorized"
    });
    expect(mocks.rateLimitOr429).not.toHaveBeenCalled();
  });

  it("rejects an admin whose persisted role was downgraded", async () => {
    payload.findByID.mockResolvedValue({ id: userId, role: "editor" });
    const { GET } = await import("./route");
    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.listQueue).not.toHaveBeenCalled();
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-queue-rejected",
      actorId: userId,
      errorCode: "persisted-admin-required"
    });
  });

  it("returns the authenticated read rate-limit response", async () => {
    const limited = Response.json(
      { ok: false, error: "rate-limited" },
      { status: 429 }
    );
    mocks.rateLimitOr429.mockResolvedValue(limited);
    const { GET } = await import("./route");
    const response = await GET(request("?queue=invalid"));

    expect(response).toBe(limited);
    expect(mocks.rateLimitOr429).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "auth",
      userId
    );
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("uses the documented query defaults", async () => {
    const { GET } = await import("./route");
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(mocks.listQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        queue: "active",
        limit: 25,
        expiringHorizonMinutes: 15
      })
    );
  });

  it.each(["active", "expiring", "stuck", "paid_inventory_review"])(
    "accepts the %s queue",
    async (queue) => {
      const { GET } = await import("./route");
      const response = await GET(
        request(`?queue=${queue}&limit=100&horizonMinutes=1440`)
      );

      expect(response.status).toBe(200);
      expect(mocks.listQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          queue,
          limit: 100,
          expiringHorizonMinutes: 1440
        })
      );
    }
  );

  it.each([
    "?queue=unknown",
    "?limit=0",
    "?limit=-1",
    "?limit=1.5",
    "?limit=101",
    "?limit=9007199254740992",
    "?horizonMinutes=0",
    "?horizonMinutes=-1",
    "?horizonMinutes=1.5",
    "?horizonMinutes=1441",
    "?horizonMinutes=9007199254740992"
  ])("rejects invalid queue parameters: %s", async (query) => {
    const { GET } = await import("./route");
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "bad-request" });
    expect(mocks.getPayload).not.toHaveBeenCalled();
    expect(mocks.listQueue).not.toHaveBeenCalled();
  });

  it("sanitizes queue failures and logs fixed context", async () => {
    mocks.listQueue.mockRejectedValue(
      new Error("database failed with customer@example.com")
    );
    const { GET } = await import("./route");
    const response = await GET(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-reservation-queue-failed"
    });
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-queue-failed",
      context: "GET /api/lost/inventory/reservations"
    });
  });
});
