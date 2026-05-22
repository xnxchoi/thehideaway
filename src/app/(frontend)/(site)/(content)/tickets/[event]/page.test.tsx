import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientProps: [] as any[],
  count: vi.fn(),
  find: vi.fn(),
  getServerSession: vi.fn(),
  cookiesGet: vi.fn(),
  redirect: vi.fn(),
  verifyEventGateCookieValue: vi.fn()
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

vi.mock("@/lib/event-gate", () => ({
  eventGateCookieName: (slug: string) => `event-gate.${slug}`,
  verifyEventGateCookieValue: mocks.verifyEventGateCookieValue
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookiesGet })),
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: mocks.redirect
}));

vi.mock("./page.client", () => ({
  TicketEventClient: (props: any) => {
    mocks.clientProps.push(props);
    return React.createElement("mock-ticket-event-client");
  }
}));

vi.mock("./redirect.client", () => ({
  DayNNightTicketRedirect: "mock-day-n-night-ticket-redirect"
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
    mocks.count.mockResolvedValue({ totalDocs: 0 });
    mocks.cookiesGet.mockReset();
    mocks.find.mockReset();
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user-1", role: "user", email: "a@b.com", name: "A" }
    });
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation((href: string) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    });
    mocks.verifyEventGateCookieValue.mockReset();
  });

  it("returns a story redirect for direct Day n Night ticket hits when the signed gate cookie is missing", async () => {
    mocks.find.mockResolvedValue({ docs: [baseEvent] });
    mocks.cookiesGet.mockReturnValue(undefined);
    mocks.verifyEventGateCookieValue.mockReturnValue(false);

    const element = await renderTicketPage();

    if (!React.isValidElement(element)) {
      throw new Error("TicketEventPage did not return a React element");
    }
    expect(element.type).toBe("mock-day-n-night-ticket-redirect");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.clientProps).toHaveLength(0);
  });

  it("opens the Day n Night ticket flow after the story gate cookie verifies", async () => {
    mocks.find.mockResolvedValue({ docs: [baseEvent] });
    mocks.cookiesGet.mockReturnValue({ value: "signed-cookie" });
    mocks.verifyEventGateCookieValue.mockReturnValue(true);

    const props = await renderTicketClientProps();

    expect(mocks.verifyEventGateCookieValue).toHaveBeenCalledWith(
      "signed-cookie",
      "event-1"
    );
    expect(props.gateInitiallyOpen).toBe(true);
  });

  it("does not render a ticket-owned gate for Day n Night when the event has no passcode configured", async () => {
    mocks.find.mockResolvedValue({
      docs: [{ ...baseEvent, gate_password: null }]
    });

    const props = await renderTicketClientProps();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.verifyEventGateCookieValue).not.toHaveBeenCalled();
    expect(props.gateInitiallyOpen).toBe(true);
  });
});
