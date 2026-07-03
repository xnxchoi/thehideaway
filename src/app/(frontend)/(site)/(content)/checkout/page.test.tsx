import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  count: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn()
}));

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    auth: mocks.auth,
    count: mocks.count,
    find: mocks.find,
    findByID: mocks.findByID
  }))
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  })
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    async () => (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key
  ),
  getLocale: vi.fn(async () => "en")
}));

vi.mock("@/lib/lost-commerce/portone", () => ({
  isPortOneCheckoutEnabled: vi.fn(() => true)
}));

vi.mock("@/components/Shells/Footer/CheckoutColophon", () => ({
  CheckoutColophon: () => React.createElement("mock-colophon")
}));

vi.mock("./CheckoutRefundInfo", () => ({
  CheckoutRefundInfo: () => React.createElement("mock-refund-info")
}));

vi.mock("@/components/sections/Pricing/Pricing.module.scss", () => ({
  default: {
    cta: "cta",
    eyebrow: "eyebrow",
    gradientTitle: "gradientTitle",
    pricingShell: "pricingShell"
  }
}));

vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: React.ReactNode }) =>
    React.createElement("mock-r-page", null, children)
}));

vi.mock("./CheckoutClient", () => ({
  CheckoutClient: Object.assign(
    (props: Record<string, unknown>) =>
      React.createElement("mock-checkout-client", props),
    { displayName: "MockCheckoutClient" }
  )
}));

async function renderCheckoutPage(plan = "plan-1") {
  const { default: CheckoutPage } = await import("./page");
  return CheckoutPage({
    searchParams: Promise.resolve({ plan })
  });
}

function findCheckoutClientProps(node: unknown): unknown {
  if (!React.isValidElement(node)) return null;
  const elementType = node.type as { displayName?: string };
  if (elementType.displayName === "MockCheckoutClient") {
    return node.props;
  }

  const children = (node.props as { children?: React.ReactNode }).children;
  const childArray = React.Children.toArray(children);
  for (const child of childArray) {
    const found = findCheckoutClientProps(child);
    if (found) return found;
  }
  return null;
}

describe("/checkout membership page", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.auth.mockReset().mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" }
    });
    mocks.count.mockReset().mockResolvedValue({ totalDocs: 0 });
    mocks.findByID.mockReset().mockResolvedValue({
      id: "plan-1",
      name: "Resident",
      tier_label: "Resident",
      state: "active",
      validity: "yearly",
      seat_limit: null,
      payment_methods: ["card", "bank_transfer"]
    });
    mocks.find.mockReset().mockResolvedValue({
      docs: [
        {
          id: "price-1",
          active: true,
          unit_amount: 33000,
          currency: { id: "currency-krw", name: "KRW" }
        }
      ]
    });
  });

  it("uses active Price rows instead of the retired plan.price currencies shape", async () => {
    const element = await renderCheckoutPage();

    expect(React.isValidElement(element)).toBe(true);
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "prices",
        depth: 1,
        where: {
          and: [{ plan: { equals: "plan-1" } }, { active: { equals: true } }]
        }
      })
    );
    expect(findCheckoutClientProps(element)).toMatchObject({
      planId: "plan-1",
      priceId: "price-1",
      tierLabel: "Resident",
      cardEnabled: true,
      manualMethods: ["bank_transfer"]
    });
  });
});
