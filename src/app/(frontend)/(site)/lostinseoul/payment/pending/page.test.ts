import { beforeEach, describe, expect, it, vi } from "vitest";

const find = vi.fn();
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
vi.mock("payload", () => ({ getPayload: vi.fn(async () => ({ find })) }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "user-1" } }))
}));
vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: unknown }) => children
}));
vi.mock("../status-shell", () => ({ LostPaymentStatusShell: () => null }));

describe("LOSTINSEOUL payment pending", () => {
  beforeEach(() => {
    notFound.mockClear();
    find.mockReset();
  });

  it("renders only an owned pending bank-transfer order", async () => {
    find.mockResolvedValue({
      docs: [
        {
          id: "order-1",
          payment_method: "bank_transfer",
          payment_status: "pending"
        }
      ]
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("rejects paid or card orders", async () => {
    find.mockResolvedValue({
      docs: [{ id: "order-1", payment_method: "card", payment_status: "paid" }]
    });
    const { default: Page } = await import("./page");

    await expect(
      Page({ searchParams: Promise.resolve({ order: "lis_1" }) })
    ).rejects.toThrow("not-found");
  });
});
