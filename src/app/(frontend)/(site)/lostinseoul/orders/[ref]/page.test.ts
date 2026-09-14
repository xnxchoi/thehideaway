import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  detail: vi.fn(),
  payload: vi.fn()
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.session
}));
vi.mock("@/lib/payload", () => ({ getPayload: mocks.payload }));
vi.mock("@/payload/plugins/ecommerce/order-history", () => ({
  getCustomerOrder: mocks.detail
}));
vi.mock("@/components/UX/Transition", () => ({ RPage: () => null }));
vi.mock("@/components/core/Link/Link", () => ({ Link: () => null }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key
}));
vi.mock("@/lostinseoul/order-detail", () => ({ OrderDetail: () => null }));
vi.mock("@/lostinseoul/order-lookup", () => ({ OrderLookup: () => null }));
import Page from "./page";
import { OrderDetail } from "@/lostinseoul/order-detail";
import { OrderLookup } from "@/lostinseoul/order-lookup";
function find(
  node: unknown,
  type: unknown
): { props: Record<string, unknown> } | undefined {
  if (Array.isArray(node))
    return node.map((child) => find(child, type)).find(Boolean);
  if (!node || typeof node !== "object") return undefined;
  const element = node as { type: unknown; props: Record<string, unknown> };
  return element.type === type ? element : find(element.props?.children, type);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.payload.mockResolvedValue({});
});
it("passes the server-verified owner's complete order to the detail view", async () => {
  const order = {
    orderRef: "LIS-1",
    items: [{ productName: "First" }, { productName: "Second" }]
  };
  mocks.session.mockResolvedValue({ user: { id: "user-1" } });
  mocks.detail.mockResolvedValue(order);
  const page = await Page({ params: Promise.resolve({ ref: "LIS-1" }) });
  expect(mocks.detail).toHaveBeenCalledWith(
    {},
    { orderRef: "LIS-1", customerID: "user-1" }
  );
  expect(find(page, OrderDetail)?.props.order).toEqual(order);
  expect(find(page, OrderLookup)).toBeUndefined();
});
it("renders a guest capability form without an anonymous database lookup", async () => {
  mocks.session.mockResolvedValue(null);
  const page = await Page({ params: Promise.resolve({ ref: "LIS-1" }) });
  expect(mocks.detail).not.toHaveBeenCalled();
  expect(mocks.payload).not.toHaveBeenCalled();
  expect(find(page, OrderLookup)?.props.orderRef).toBe("LIS-1");
});
