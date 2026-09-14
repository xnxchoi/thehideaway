import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  viewer: "alice" as string | null,
  values: [] as unknown[],
  cursor: 0,
  effects: [] as (() => unknown)[],
  operation: { current: 0 }
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useRef: () => state.operation,
  useEffect: (effect: () => unknown) => state.effects.push(effect),
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = initial;
    return [
      state.values[index],
      (value: unknown) => {
        state.values[index] = value;
      }
    ];
  }
}));
vi.mock("@/lib/auth/session/RP_SessionProvider", () => ({
  useRPSession: (selector: (session: { id: string | null }) => unknown) =>
    selector({ id: state.viewer })
}));
vi.mock("@/lib/lost-commerce/useStoreCart", () => ({
  useStoreCart: () => ({
    lines: [
      {
        productId: "p",
        skuId: "s",
        quantity: 1,
        unitAmount: 10,
        currency: "KRW"
      }
    ],
    total: 10
  })
}));
vi.mock("@payloadcms/plugin-ecommerce/client/react", () => ({
  useCart: () => ({ cart: { id: "cart" } }),
  usePayments: () => ({ confirmOrder: vi.fn(), initiatePayment: vi.fn() })
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/core/Button", () => ({ Button: () => null }));
vi.mock("@/components/core/Link/Link", () => ({ Link: () => null }));
vi.mock("@lostinseoul/index.css", () => ({}));
import { LostCheckoutPageClient } from "./page.client";
import {
  rememberPurchasePayment,
  readPendingPurchaseForViewer
} from "@/payload/plugins/ecommerce/client/purchase-confirmation";
const labels = {
  title: "",
  back: "",
  contact: "",
  shipping: "",
  payment: "",
  portone: "",
  manual: "",
  submit: "",
  pending: "",
  recovering: "",
  recovery: "",
  failed: "",
  portoneUnavailable: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  note: "",
  empty: "",
  total: ""
};
function render() {
  state.cursor = 0;
  state.effects = [];
  return LostCheckoutPageClient({
    labels,
    manualPaymentEnabled: false,
    paymentPreviewEnabled: false,
    portOneEnabled: true,
    portOneSdkVersion: "v2"
  });
}
function containsForm(node: any): boolean {
  return Array.isArray(node)
    ? node.some(containsForm)
    : !!node &&
        typeof node === "object" &&
        (node.type === "form" || containsForm(node.props?.children));
}
beforeEach(() => {
  state.viewer = "alice";
  state.values = [];
  state.operation = { current: 0 };
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
});
describe("checkout pending purchase ownership", () => {
  it("restores A but lets B and logged-out visitors reach their checkout", () => {
    const alice = {
      orderRef: "LIS-A",
      paymentId: "pay-A",
      cartID: "cart-A",
      customerID: "alice"
    };
    rememberPurchasePayment(alice);
    render();
    state.effects.forEach((effect) => effect());
    expect(containsForm(render())).toBe(false);
    state.viewer = "bob";
    expect(containsForm(render())).toBe(true);
    state.effects.forEach((effect) => effect());
    expect(containsForm(render())).toBe(true);
    state.viewer = null;
    expect(containsForm(render())).toBe(true);
    expect(readPendingPurchaseForViewer("alice")).toEqual(alice);
  });
  it("keeps guest recovery available after login", () => {
    rememberPurchasePayment({
      orderRef: "LIS-G",
      paymentId: "pay-G",
      cartID: "cart-G",
      purchaseAccessToken: "capability"
    });
    state.viewer = null;
    render();
    state.effects.forEach((effect) => effect());
    expect(containsForm(render())).toBe(false);
    state.viewer = "alice";
    expect(containsForm(render())).toBe(false);
  });
});
