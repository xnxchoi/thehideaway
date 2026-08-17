import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const findByID = vi.fn();
const update = vi.fn();
const create = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find,
    findByID,
    update,
    create,
    logger: {
      error: vi.fn()
    }
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: vi.fn(async () => ({
    user: {
      id: "buyer-user",
      email: "buyer@example.com",
      name: "Buyer Person",
      role: "user"
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

describe("POST /api/tickets/payment-submitted", () => {
  beforeEach(() => {
    vi.resetModules();
    find.mockReset();
    findByID.mockReset();
    update.mockReset();
    create.mockReset();

    find.mockResolvedValue({
      docs: [{ id: "admin-user", role: "admin" }]
    });
    findByID.mockImplementation(async ({ collection }) => {
      if (collection === "ticket-orders") {
        return {
          id: "order-1",
          purchaser: "buyer-user",
          event: "event-1",
          purchaser_name: "Buyer Person",
          sender_name: "Bank Sender",
          paid: false,
          payment_submitted_at: null
        };
      }
      if (collection === "events") {
        return { id: "event-1", name: "Day n Night" };
      }
      return null;
    });
    update.mockResolvedValue({
      id: "order-1",
      purchaser: "buyer-user",
      event: "event-1",
      purchaser_name: "Buyer Person",
      sender_name: "Bank Sender",
      paid: false,
      payment_submitted_at: "2026-05-24T01:15:00.000Z"
    });
  });

  it("stamps a purchaser-owned order as payment submitted without marking it paid", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest(
      "https://hideaway.test/api/tickets/payment-submitted",
      {
        method: "POST",
        body: JSON.stringify({ order_id: "order-1" })
      }
    );

    const res = await POST(req);
    const body = (await res.json()) as {
      ok: boolean;
      paid: boolean;
      payment_submitted_at: string;
    };

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      paid: false,
      payment_submitted_at: "2026-05-24T01:15:00.000Z"
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "ticket-orders",
        id: "order-1",
        overrideAccess: true,
        data: expect.objectContaining({
          payment_submitted_at: expect.any(String)
        })
      })
    );
    expect(update.mock.calls[0]?.[0].data).not.toHaveProperty("paid");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "notifications",
        data: expect.objectContaining({
          recipient: "admin-user",
          title: "Ticket payment submitted"
        })
      })
    );
  });

  it("does not let a purchaser stamp someone else's order", async () => {
    findByID.mockResolvedValueOnce({
      id: "order-2",
      purchaser: "other-user",
      paid: false,
      payment_submitted_at: null
    });

    const { POST } = await import("./route");
    const req = new NextRequest(
      "https://hideaway.test/api/tickets/payment-submitted",
      {
        method: "POST",
        body: JSON.stringify({ order_id: "order-2" })
      }
    );

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(404);
    expect(body).toEqual({ ok: false, error: "not-found" });
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
