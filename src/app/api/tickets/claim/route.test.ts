import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const findByID = vi.fn();
const count = vi.fn();
const update = vi.fn();
const sendActivation = vi.fn(async () => true);

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find,
    findByID,
    count,
    update,
    logger: {
      error: vi.fn()
    }
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: vi.fn(async () => ({
    user: {
      id: "recipient-user",
      email: "gift@example.com",
      name: "Gift Recipient",
      role: "user"
    }
  }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/email/ticket-mailer", () => ({
  siteUrl: "https://hideaway.test",
  TicketMailer: vi.fn(function TicketMailer() {
    return { sendActivation };
  })
}));

describe("POST /api/tickets/claim", () => {
  beforeEach(() => {
    vi.resetModules();
    find.mockReset();
    findByID.mockReset();
    count.mockReset();
    update.mockReset();
    sendActivation.mockClear();

    count.mockResolvedValue({ totalDocs: 0 });
  });

  it("rejects Day n Night gift tokens from the generic claim endpoint", async () => {
    find.mockResolvedValueOnce({
      docs: [
        {
          id: "ticket-1",
          ticket_number: 102,
          event: "event-day-n-night",
          order: "order-1",
          status: "pending",
          paid: false,
          user: null,
          claim_token: "gift-token",
          claim_email: "gift@example.com"
        }
      ]
    });
    findByID.mockResolvedValueOnce({
      id: "event-day-n-night",
      slug: "day-n-night",
      name: "Day n Night",
      max_per_user: 3
    });

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/claim", {
      method: "POST",
      body: JSON.stringify({ token: "gift-token" })
    });

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(403);
    expect(body).toEqual({ ok: false, error: "password-required" });
    expect(update).not.toHaveBeenCalled();
    expect(sendActivation).not.toHaveBeenCalled();
  });

  it("still allows non-Day n Night gift tokens through the generic claim endpoint", async () => {
    find.mockResolvedValueOnce({
      docs: [
        {
          id: "ticket-2",
          ticket_number: 203,
          event: "event-salon",
          order: "order-2",
          status: "pending",
          paid: false,
          user: null,
          claim_token: "salon-token",
          claim_email: "gift@example.com"
        }
      ]
    });
    findByID.mockResolvedValueOnce({
      id: "event-salon",
      slug: "spring-salon",
      name: "Spring Salon",
      max_per_user: 3
    });
    update.mockResolvedValueOnce({ id: "ticket-2" });

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/claim", {
      method: "POST",
      body: JSON.stringify({ token: "salon-token" })
    });

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; ticket_id: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, ticket_id: "ticket-2" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        id: "ticket-2",
        overrideAccess: true,
        data: expect.objectContaining({
          user: "recipient-user",
          claim_token: null,
          claimed_at: expect.any(String)
        })
      })
    );
  });
});
