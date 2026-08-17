import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientProps: [] as unknown[],
  find: vi.fn(),
  getServerSession: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    find: mocks.find
  }))
}));

vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  })
}));

vi.mock("./page.client", () => ({
  default: (props: unknown) => {
    mocks.clientProps.push(props);
    return React.createElement("mock-my-tickets-page-client");
  }
}));

async function renderMyTicketsPage() {
  const { default: MyTicketsPage } = await import("./page");
  return MyTicketsPage();
}

describe("/tickets/my", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.clientProps.length = 0;
    mocks.find.mockReset().mockResolvedValue({
      docs: [{ id: "ticket-1", purchaser: "user-1", user: null }]
    });
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user-1", role: "user", email: "buyer@example.com" }
    });
  });

  it("lists tickets owned by the viewer as holder or purchaser", async () => {
    const element = await renderMyTicketsPage();

    expect(React.isValidElement(element)).toBe(true);
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        where: {
          or: [
            { user: { equals: "user-1" } },
            { purchaser: { equals: "user-1" } }
          ]
        }
      })
    );
    expect(element.props).toEqual({
      tickets: [{ id: "ticket-1", purchaser: "user-1", user: null }]
    });
  });

  it("redirects anonymous viewers to sign in", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(renderMyTicketsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?redirectTo=%2Ftickets%2Fmy"
    );
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
