import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  getServerSession: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    find: mocks.find,
    logger: { error: vi.fn() }
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: vi.fn() })),
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  })
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    async () => (key: string, values?: { count?: number }) =>
      values?.count === undefined ? key : `${key}:${values.count}`
  )
}));

vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: React.ReactNode }) =>
    React.createElement("mock-r-page", null, children)
}));

vi.mock("./PasswordReveal", () => ({
  PasswordReveal: ({ password }: { password: string }) =>
    React.createElement("mock-password-reveal", { password })
}));

vi.mock("./TicketWallet", () => ({
  TicketWallet: ({ tickets }: { tickets: unknown[] }) =>
    React.createElement("mock-ticket-wallet", { count: tickets.length })
}));

vi.mock("@/utilities/getURL", () => ({
  getServerSideURL: () => "https://hideaway.test"
}));

async function renderDayNNightMyPage() {
  const { default: DayNNightMyPage } = await import("./page");
  return DayNNightMyPage();
}

describe("/day-n-night/my", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({ user: null });
    mocks.getServerSession.mockReset().mockResolvedValue({
      user: {
        id: "user-1",
        email: "buyer@example.com",
        name: "Buyer Person",
        role: "user"
      }
    });
    mocks.find.mockReset().mockImplementation(async ({ collection }) => {
      if (collection === "events") return { docs: [{ id: "event-1" }] };
      if (collection === "ticket-orders") {
        return {
          docs: [
            {
              id: "order-1",
              paid: false,
              payment_submitted_at: null
            }
          ]
        };
      }
      if (collection === "tickets") {
        return {
          docs: [
            {
              id: "ticket-1",
              order: "order-1",
              user: "user-1",
              event: {
                name: "Day n Night",
                date: null,
                location: null,
                ticket_price: 65000
              },
              status: "pending",
              paid: false,
              checked_in: false
            }
          ]
        };
      }
      return { docs: [] };
    });
  });

  it("uses the Better Auth session when loading the purchaser dashboard", async () => {
    const element = await renderDayNNightMyPage();

    expect(React.isValidElement(element)).toBe(true);
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "ticket-orders",
        where: { purchaser: { equals: "user-1" } }
      })
    );
    expect(mocks.auth).not.toHaveBeenCalled();
  });
});
