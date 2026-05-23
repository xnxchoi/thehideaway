import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientProps: [] as unknown[],
  count: vi.fn(),
  cookiesGet: vi.fn(),
  find: vi.fn(),
  getServerSession: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    count: mocks.count,
    find: mocks.find
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookiesGet })),
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  })
}));

vi.mock("./page.client", () => ({
  TicketEventClient: (props: unknown) => {
    mocks.clientProps.push(props);
    return React.createElement("mock-ticket-event-client");
  }
}));

async function renderTicketPage(slug = "day-n-night") {
  const { default: TicketEventPage } = await import("./page");
  return TicketEventPage({ params: Promise.resolve({ event: slug }) });
}

async function renderTicketClientProps(slug = "day-n-night") {
  const element = await renderTicketPage(slug);
  if (!React.isValidElement(element)) {
    throw new Error("TicketEventPage did not return a React element");
  }
  return element.props as { gateInitiallyOpen?: boolean };
}

const baseEvent = {
  id: "event-1",
  name: "Day n Night",
  slug: "day-n-night",
  state: "open",
  capacity: 20,
  max_per_user: 3,
  ticket_price: 30000,
  gate_password: "secret"
};

describe("/tickets/[event] Day n Night gate routing", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.clientProps.length = 0;
    process.env.PAYLOAD_SECRET = "test-payload-secret";
    mocks.cookiesGet.mockReset().mockReturnValue(undefined);
    mocks.count.mockResolvedValue({ totalDocs: 0 });
    mocks.find.mockReset();
    mocks.find.mockImplementation(async ({ collection }) => {
      if (collection === "events") return { docs: [baseEvent] };
      if (collection === "ticket-orders") return { docs: [] };
      return { docs: [] };
    });
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user-1", role: "user", email: "a@b.com", name: "A" }
    });
  });

  it("keeps the Day n Night ticket flow gated on direct hits without a signed gate cookie", async () => {
    const props = await renderTicketClientProps();

    expect(props.gateInitiallyOpen).toBe(false);
  });

  it("opens the Day n Night ticket flow after the story gate has issued a signed cookie", async () => {
    const { eventGateCookieName, issueEventGateCookieValue } =
      await import("@/lib/event-gate");
    const issued = issueEventGateCookieValue(baseEvent.id);
    mocks.cookiesGet.mockImplementation((name: string) =>
      name === eventGateCookieName("day-n-night")
        ? { name, value: issued.value }
        : undefined
    );

    const props = await renderTicketClientProps();

    expect(props.gateInitiallyOpen).toBe(true);
  });

  it("keeps legacy event ticket flows gated when they still have a passcode", async () => {
    mocks.find.mockImplementation(async ({ collection }) => {
      if (collection === "events") {
        return {
          docs: [
            { ...baseEvent, slug: "legacy-event", gate_password: "secret" }
          ]
        };
      }
      return { docs: [] };
    });

    const props = await renderTicketClientProps("legacy-event");

    expect(props.gateInitiallyOpen).toBe(false);
  });

  it("redirects signed-in Day n Night purchasers from register to their tickets", async () => {
    mocks.find.mockImplementation(async ({ collection }) => {
      if (collection === "events") return { docs: [baseEvent] };
      if (collection === "ticket-orders") {
        return { docs: [{ id: "order-1", purchaser: "user-1" }] };
      }
      return { docs: [] };
    });

    await expect(renderTicketPage()).rejects.toThrow(
      "NEXT_REDIRECT:/day-n-night/my"
    );
    expect(mocks.clientProps).toHaveLength(0);
  });
});
