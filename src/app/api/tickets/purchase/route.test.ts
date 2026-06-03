import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const count = vi.fn();
const create = vi.fn();
const beginTransaction = vi.fn();
const commitTransaction = vi.fn();
const rollbackTransaction = vi.fn();
const sendPurchaseReceipt = vi.fn(async () => true);
const sendGiftInvite = vi.fn(async () => true);
const idemPut = vi.fn(async () => undefined);
const cookiesGet = vi.hoisted(() => vi.fn());
const nextTicketNumberMock = vi.hoisted(() => vi.fn());

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: cookiesGet }))
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find,
    count,
    create,
    db: {
      beginTransaction,
      commitTransaction,
      rollbackTransaction
    },
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    }
  }))
}));

vi.mock("nanoid", () => {
  let seq = 0;
  return {
    nanoid: vi.fn(() => {
      seq += 1;
      return `token-${seq}`;
    })
  };
});

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

vi.mock("@/lib/api/idempotency", () => ({
  beginIdempotent: vi.fn(() => ({
    get: () => null,
    put: idemPut
  }))
}));

vi.mock("@/lib/db/sequences", () => ({
  eventPurchaseLock: vi.fn(async () => undefined),
  nextTicketNumber: nextTicketNumberMock
}));

vi.mock("@/lib/email/ticket-mailer", () => ({
  siteUrl: "https://hideaway.test",
  TicketMailer: vi.fn(function TicketMailer() {
    return {
      sendPurchaseReceipt,
      sendGiftInvite
    };
  })
}));

describe("POST /api/tickets/purchase", () => {
  beforeEach(() => {
    process.env.PAYLOAD_SECRET = "test-payload-secret";
    find.mockReset();
    count.mockReset();
    create.mockReset();
    cookiesGet.mockReset().mockReturnValue(undefined);
    nextTicketNumberMock
      .mockReset()
      .mockResolvedValueOnce(101)
      .mockResolvedValueOnce(102)
      .mockResolvedValueOnce(103);
    beginTransaction.mockReset().mockResolvedValue("tx-1");
    commitTransaction.mockReset().mockResolvedValue(undefined);
    rollbackTransaction.mockReset().mockResolvedValue(undefined);
    sendPurchaseReceipt.mockClear();
    sendGiftInvite.mockClear();
    idemPut.mockClear();

    find.mockImplementation(async ({ collection }) => {
      if (collection === "events") {
        return {
          docs: [
            {
              id: "event-1",
              name: "Day n Night",
              slug: "day-n-night",
              gate_password: "seoul2026",
              capacity: 100,
              max_per_user: 3,
              ticket_price: 65000,
              payment_instructions: "Wire the host.",
              date: "2026-05-24T18:30:00.000Z",
              location: "Haebangchon",
              state: "open"
            }
          ]
        };
      }
      if (collection === "passkeys") {
        return { docs: [{ id: "passkey-1" }] };
      }
      return { docs: [] };
    });
    count.mockResolvedValue({ totalDocs: 0 });
    create.mockImplementation(async ({ collection, data }) => {
      if (collection === "ticket-orders") return { id: "order-1", ...data };
      if (collection === "tickets") {
        return {
          id: data.ticket_number === 101 ? "ticket-purchaser" : "ticket-gift",
          ...data
        };
      }
      throw new Error(`Unexpected collection: ${collection}`);
    });
  });

  it("keeps a gated Day n Night purchase inside the event-owned manage and claim loop", async () => {
    const { eventGateCookieName, issueEventGateCookieValue } =
      await import("@/lib/event-gate");
    const issued = issueEventGateCookieValue("event-1");
    cookiesGet.mockImplementation((name: string) =>
      name === eventGateCookieName("day-n-night")
        ? { name, value: issued.value }
        : undefined
    );

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "day-n-night",
        quantity: 2,
        purchaser_name: "Buyer Person",
        sender_name: "Bank Sender",
        gifts: [{ email: "gift@example.com" }]
      })
    });

    const res = await POST(req);
    const body = (await res.json()) as {
      ok: boolean;
      order_id: string;
      tickets: Array<{ claim_url: string | null }>;
    };

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, order_id: "order-1" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "ticket-orders",
        data: expect.objectContaining({
          purchaser_name: "Buyer Person",
          sender_name: "Bank Sender",
          quantity: 2,
          unit_amount: 65000,
          total_amount: 130000,
          currency: "KRW"
        })
      })
    );
    expect(body.tickets[1]?.claim_url).toBe(
      "https://hideaway.test/day-n-night/claim/token-2"
    );
    expect(sendPurchaseReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "buyer@example.com",
        managementUrl: "https://hideaway.test/day-n-night/my"
      })
    );
    expect(sendGiftInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "gift@example.com",
        claimUrl: "https://hideaway.test/day-n-night/claim/token-2"
      })
    );
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(rollbackTransaction).not.toHaveBeenCalled();
  });

  it("rejects Day n Night purchase attempts that skipped the RSVP gate", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "day-n-night",
        quantity: 1,
        purchaser_name: "Buyer Person",
        sender_name: "Bank Sender"
      })
    });

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "invalid-password" });
    expect(beginTransaction).not.toHaveBeenCalled();
  });

  it("requires a passkey before Day n Night purchase", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "events") {
        return {
          docs: [
            {
              id: "event-1",
              name: "Day n Night",
              slug: "day-n-night",
              gate_password: "seoul2026",
              capacity: 100,
              max_per_user: 3,
              ticket_price: 65000,
              payment_instructions: "Wire the host.",
              date: "2026-05-24T18:30:00.000Z",
              location: "Haebangchon",
              state: "open"
            }
          ]
        };
      }
      if (collection === "passkeys") {
        return { docs: [] };
      }
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "day-n-night",
        quantity: 1,
        password: "seoul2026",
        purchaser_name: "Buyer Person"
      })
    });

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(403);
    expect(body).toEqual({ ok: false, error: "passkey-required" });
    expect(beginTransaction).not.toHaveBeenCalled();
  });

  it("keeps events without a configured gate open to purchase", async () => {
    find.mockImplementation(async ({ collection }) => {
      if (collection === "events") {
        return {
          docs: [
            {
              id: "event-open",
              name: "Open Event",
              slug: "open-event",
              gate_password: null,
              capacity: 100,
              max_per_user: 3,
              ticket_price: 65000,
              payment_instructions: "Wire the host.",
              date: "2026-05-24T18:30:00.000Z",
              location: "Haebangchon",
              state: "open"
            }
          ]
        };
      }
      return { docs: [] };
    });

    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "open-event",
        quantity: 1,
        purchaser_name: "Buyer Person"
      })
    });

    const res = await POST(req);
    const body = (await res.json()) as { ok: boolean; order_id: string };

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, order_id: "order-1" });
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(rollbackTransaction).not.toHaveBeenCalled();
  });

  it("still accepts a valid signed event-gate cookie for gated legacy events", async () => {
    find.mockResolvedValue({
      docs: [
        {
          id: "event-legacy",
          name: "Legacy Event",
          slug: "legacy-event",
          gate_password: "legacy-pass",
          capacity: 100,
          max_per_user: 3,
          ticket_price: 65000,
          payment_instructions: "Wire the host.",
          date: "2026-05-24T18:30:00.000Z",
          location: "Haebangchon",
          state: "open"
        }
      ]
    });

    const { eventGateCookieName, issueEventGateCookieValue } =
      await import("@/lib/event-gate");
    const { POST } = await import("./route");
    const issued = issueEventGateCookieValue("event-legacy");
    cookiesGet.mockImplementation((name: string) =>
      name === eventGateCookieName("legacy-event")
        ? { name, value: issued.value }
        : undefined
    );

    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "legacy-event",
        quantity: 1,
        purchaser_name: "Buyer Person"
      })
    });

    const res = await POST(req);
    const body = (await res.json()) as {
      ok: boolean;
      order_id: string;
    };

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, order_id: "order-1" });
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(rollbackTransaction).not.toHaveBeenCalled();
  });
});
