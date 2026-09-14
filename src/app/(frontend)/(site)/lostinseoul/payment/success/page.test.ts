import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
const session = vi.fn(
  async () => ({ user: { id: "user-1" } }) as { user: { id: string } } | null
);
const notFound = vi.fn(() => {
  throw new Error("not-found");
});

vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("../purchase-status", () => ({ PurchaseStatus: () => null }));
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
  getServerSession: session
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
    session.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("renders only an owned paid order", async () => {
    find.mockResolvedValue({
      docs: [{ id: "order-1", customer: "user-1", payment_status: "paid" }]
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("rejects a direct success URL for a pending PortOne order", async () => {
    find.mockResolvedValue({
      docs: [{ id: "order-1", customer: "user-1", payment_status: "pending" }]
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("not-found");
  });

  it("rejects a pending bank-transfer order", async () => {
    find.mockResolvedValue({
      docs: [{ id: "order-1", customer: "user-1", payment_status: "pending" }]
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("not-found");
  });
  it("does not disclose guest success from a guessed order reference", async () => {
    session.mockResolvedValue(null);
    const { default: Page } = await import("./page");
    const result = await Page({
      searchParams: Promise.resolve({ order: "LIS-guessed" })
    });
    expect(result.props.children.props.orderRef).toBe("LIS-guessed");
    expect(find).not.toHaveBeenCalled();
  });
  it("rejects another account's paid order", async () => {
    find.mockResolvedValue({
      docs: [{ id: "order-2", customer: "user-2", payment_status: "paid" }]
    });
    const { default: Page } = await import("./page");
    await expect(
      Page({ searchParams: Promise.resolve({ order: "LIS-2" }) })
    ).rejects.toThrow("not-found");
  });
});
