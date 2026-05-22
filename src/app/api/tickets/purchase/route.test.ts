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

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) }))
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
  nextTicketNumber: vi
    .fn()
    .mockResolvedValueOnce(101)
    .mockResolvedValueOnce(102)
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
    find.mockReset();
    count.mockReset();
    create.mockReset();
    beginTransaction.mockReset().mockResolvedValue("tx-1");
    commitTransaction.mockReset().mockResolvedValue(undefined);
    rollbackTransaction.mockReset().mockResolvedValue(undefined);
    sendPurchaseReceipt.mockClear();
    sendGiftInvite.mockClear();
    idemPut.mockClear();

    find.mockResolvedValue({
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
    });
    count.mockResolvedValue({ totalDocs: 0 });
    create.mockImplementation(async ({ collection, data }) => {
      if (collection === "ticket-orders") return { id: "order-1", ...data };
      if (collection === "tickets") {
        return {
          id:
            data.ticket_number === 101
              ? "ticket-purchaser"
              : "ticket-gift",
          ...data
        };
      }
      throw new Error(`Unexpected collection: ${collection}`);
    });
  });

  it("keeps a Day n Night purchase inside the event-owned manage and claim loop", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("https://hideaway.test/api/tickets/purchase", {
      method: "POST",
      body: JSON.stringify({
        event_slug: "day-n-night",
        quantity: 2,
        password: "seoul2026",
        purchaser_name: "Buyer Person",
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
});
