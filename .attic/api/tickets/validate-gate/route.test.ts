import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ find }))
}));

vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: vi.fn(() => true)
}));

vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: vi.fn(async () => null)
}));

const makeRequest = (body: unknown) =>
  new NextRequest("https://hideaway.test/api/tickets/validate-gate", {
    method: "POST",
    headers: {
      origin: "https://hideaway.test",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

describe("POST /api/tickets/validate-gate", () => {
  beforeEach(() => {
    process.env.PAYLOAD_SECRET = "test-payload-secret";
    find.mockReset();
    find.mockResolvedValue({
      docs: [
        {
          id: "event-1",
          slug: "day-n-night",
          gate_password: "seoul2026",
          state: "open"
        }
      ]
    });
  });

  it("sets the signed Day n Night event-gate cookie when the shared gate opens", async () => {
    const { POST } = await import("./route");

    const res = await POST(
      makeRequest({ event_slug: "day-n-night", password: "seoul2026" })
    );
    const body = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("event-gate.day-n-night=");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
  });

  it("does not set an event-gate cookie when the password is invalid", async () => {
    const { POST } = await import("./route");

    const res = await POST(
      makeRequest({ event_slug: "day-n-night", password: "wrong" })
    );
    const body = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "invalid" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
