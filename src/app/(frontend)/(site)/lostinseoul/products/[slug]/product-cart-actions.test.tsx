// @vitest-environment happy-dom
import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../../../../messages/en.json";

const cart = vi.hoisted(() => ({
  add: vi.fn(),
  isLoading: false,
  unconfirmed: false
}));
const push = vi.hoisted(() => vi.fn());
vi.mock("@/lib/lost-commerce/useStoreCart", () => ({
  useStoreCart: () => cart
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/core/Button", () => ({
  Button: (props: ComponentProps<"button">) => <button {...props} />
}));
vi.mock("@/components/core/Link/Link", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />
}));
vi.mock("@/components/UX/RichText", () => ({ default: () => null }));
vi.mock("@lostinseoul/components", () => ({ ProductSection: () => null }));
vi.mock("../../fragrance/product-stage/LostProductStage", () => ({
  LostProductStage: () => null
}));
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children
}));
vi.mock("motion/react-m", () => ({
  div: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));
vi.mock("@lostinseoul/index.css", () => ({}));
import { LostProductDetailClient } from "./product.client";

type Props = ComponentProps<typeof LostProductDetailClient>;
const props: Props = {
  drops: [],
  relatedProducts: [],
  checkoutEnabled: true,
  commerce: {
    eyebrow: "Commerce",
    refundTitle: "",
    refundBody: "",
    deliveryTitle: "",
    deliveryBody: "",
    link: ""
  },
  labels: {
    announcement: "",
    allProducts: "",
    archiveLabel: "",
    back: "",
    cart: "",
    checkoutLabel: "",
    clearSearchLabel: "",
    emptyLabel: "",
    request: "",
    private: "",
    requestQuote: "",
    quoteFailed: "",
    campaign: "",
    progress: "",
    privateQuote: "",
    related: "",
    collectionPush: "",
    viewProduct: "",
    variants: "",
    origin: "",
    madeInSeoul: "",
    selected: "",
    status: "",
    stockInStock: "",
    stockOutOfStock: "",
    stockOnRequest: "",
    stockPreOrder: "",
    removeLabel: "",
    searchLabel: "",
    searchPlaceholder: "",
    shopLabel: "",
    totalLabel: "",
    add: "Add to cart",
    added: "Added",
    directPurchase: "Buy now",
    details: "Details",
    care: "Care",
    shipping: "Shipping",
    standard: "Standard"
  },
  product: {
    id: "product",
    name: "Shirt",
    slug: "shirt",
    gallery: [],
    currency: "KRW",
    unitAmount: 1000,
    modes: ["standard_purchase"],
    variants: [
      {
        id: "variant",
        sku: "SHIRT",
        label: "Standard",
        amount: 1000,
        actionableModes: ["standard_purchase"]
      }
    ]
  }
};
let root: Root;
let container: HTMLDivElement;
const buttons = (label: string) =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].filter(
    (button) => button.textContent === label
  );
async function render() {
  await act(async () =>
    root.render(
      <NextIntlClientProvider locale="en" messages={en}>
        <LostProductDetailClient {...props} />
      </NextIntlClientProvider>
    )
  );
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  cart.add.mockReset().mockResolvedValue(false);
  push.mockReset();
  cart.isLoading = false;
  cart.unconfirmed = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
describe("product cart acknowledgements", () => {
  it("offers recovery for a rejected add without claiming success", async () => {
    cart.add.mockRejectedValue(new Error("Connection lost"));
    await render();
    await act(async () => buttons("Buy now")[0].click());
    expect(push).not.toHaveBeenCalled();
    expect(buttons("Added")).toHaveLength(0);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
  });
  it("does not show success or navigate for an unconfirmed add", async () => {
    await render();
    await act(async () => buttons("Add to cart")[0].click());
    expect(buttons("Added")).toHaveLength(0);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
    expect(push).not.toHaveBeenCalled();
  });
  it("waits for confirmation before both desktop and mobile Buy now navigate", async () => {
    let resolve!: (value: boolean) => void;
    cart.add.mockImplementation(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        })
    );
    await render();
    expect(
      container.querySelector(
        'a[href="/lostinseoul/checkout"][class*="lost-source-button"]'
      )
    ).toBeNull();
    expect(buttons("Buy now")).toHaveLength(2);
    await act(async () => buttons("Buy now")[1].click());
    expect(push).not.toHaveBeenCalled();
    await act(async () => resolve(true));
    expect(push).toHaveBeenCalledWith("/lostinseoul/checkout");
    expect(buttons("Added")).toHaveLength(2);
  });
  it("disables purchase actions and offers recovery while another operation is uncertain", async () => {
    cart.isLoading = true;
    cart.unconfirmed = true;
    await render();
    for (const button of [...buttons("Buy now"), ...buttons("Add to cart")])
      expect(button.disabled).toBe(true);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
    expect(buttons("Reload cart").length).toBeGreaterThan(0);
  });
});
