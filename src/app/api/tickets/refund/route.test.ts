import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findByID = vi.fn();
const update = vi.fn();
const create = vi.fn();
const sendRefund = vi.fn(async () => true);
const idemPut = vi.fn(async () => undefined);

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    findByID,
    update,
    create,
    logger: {
      info: vi.fn(),
      warn: vi.fn()
    }
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: vi.fn(async () => ({
    user: {
      id: "admin-user",
      email: "admin@example.com",
      role: "admin"
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

vi.mock("@/lib/api/idempotency", () => ({
  beginIdempotent: vi.fn(() => ({
    get: () => null,
    put: idemPut
  }))
}));

vi.mock("@/lib/email/ticket-mailer", () => ({
  TicketMailer: vi.fn(function TicketMailer() {
    return { sendRefund };
  })
}));

describe("POST /api/tickets/refund", () => {
  beforeEach(() => {
    vi.resetModules();
    findByID.mockReset();
    update.mockReset();
    create.mockReset();
    sendRefund.mockClear();
    idemPut.mockClear();

    findByID.mockImplementation(async ({ collection }) => {
      if (collection === "tickets") {
        return {
          id: "ticket-1",
          ticket_number: 101,
          status: "active",
          paid: true,
          user: "attendee-user",
          event: "event-1",
          order: "order-1"
        };
      }
      if (collection === "ticket-orders") {
        return {
          id: "order-1",
          unit_amount: 65000,
          total_amount: 65000,
          quantity: 1,
          currency: "KRW"
        };
      }
      if (collection === "events") {
        return {
          id: "event-1",
          name: "Day n Night",
          date: "2026-06-25T12:00:00.000Z",
          location: "Haebangchon",
          ticket_price: 99000
        };
      }
      if (collection === "users") {
        return {
          id: "attendee-user",
          email: "attendee@example.com",
          name: "Attendee"
        };
      }
      return null;
    });
    update.mockResolvedValue({ docs: [{ id: "ticket-1" }] });
  });

  it("uses the ticket order price snapshot instead of the current event price", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/refund", {
      method: "POST",
      body: JSON.stringify({ ticket_id: "ticket-1", override_percent: 50 })
    });

    const res = await POST(req);
    const body = (await res.json()) as {
      ok: boolean;
      refund_amount: number;
      refund_percent: number;
    };

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      refund_percent: 50,
      refund_amount: 32500
    });
    expect(sendRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketPrice: 65000,
        refundAmount: 32500,
        refundPercent: 50
      })
    );
  });
});
