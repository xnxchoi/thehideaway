import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("not-found");
});

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({ find }))
}));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "user-1" } }))
}));
vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: unknown }) => children
}));
vi.mock("../status-shell", () => ({
  LostPaymentStatusShell: () => null
}));

describe("LOSTINSEOUL payment success", () => {
  beforeEach(() => {
    notFound.mockClear();
    find.mockReset();
  });

  it("renders only an owned paid PortOne order", async () => {
    find.mockImplementation(async ({ collection }) => ({
      docs:
        collection === "product-orders"
          ? [{ id: "order-1", payment_status: "paid" }]
          : [{ provider: "portone" }]
    }));
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("rejects a direct success URL for a pending PortOne order", async () => {
    find.mockImplementation(async ({ collection }) => ({
      docs:
        collection === "product-orders"
          ? [{ id: "order-1", payment_status: "pending" }]
          : [{ provider: "portone" }]
    }));
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("not-found");
  });

  it("rejects a pending manual order", async () => {
    find.mockImplementation(async ({ collection }) => ({
      docs:
        collection === "product-orders"
          ? [{ id: "order-1", payment_status: "pending_manual" }]
          : [{ provider: "manual" }]
    }));
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("not-found");
  });
});
