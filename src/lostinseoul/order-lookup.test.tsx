// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";
import { OrderLookup } from "./order-lookup";
import { OrderDetail } from "./order-detail";
import { rememberPurchasePayment } from "@/payload/plugins/ecommerce/client/purchase-confirmation";
import type { CustomerOrder } from "@/payload/plugins/ecommerce/order-history";

const order: CustomerOrder = {
  orderRef: "LOST-1",
  createdAt: null,
  currency: "KRW",
  amount: 3000,
  lifecycleStatus: "pending_payment",
  paymentStatus: "pending",
  fulfillmentStatus: "unfulfilled",
  shippingAddress: { addressLine1: "Seoul" },
  billingAddress: {},
  deliveryNote: "Door",
  shippingAmount: null,
  taxAmount: null,
  items: ["Original A", "Original B"].map((productName, index) => ({
    key: String(index),
    productName,
    sku: "SKU",
    skuLabel: "Small",
    quantity: index + 1,
    unitAmount: 1000,
    lineAmount: (index + 1) * 1000,
    options: [{ label: "Size", value: "S" }]
  }))
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("sessionStorage", new window.Storage());
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ order })));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function mount(locale: "en" | "ko" = "en", detail = false) {
  await act(async () =>
    root.render(
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ko" ? ko : en}
        timeZone="Asia/Seoul"
      >
        {detail ? (
          <OrderDetail order={order} />
        ) : (
          <OrderLookup orderRef="LOST-1" />
        )}
      </NextIntlClientProvider>
    )
  );
}
describe("mounted order details", () => {
  it.each(["en", "ko"] as const)(
    "renders all immutable lines and fields in %s",
    async (locale) => {
      await mount(locale, true);
      expect(container.querySelectorAll("li")).toHaveLength(2);
      expect(container.textContent).toContain("Original A");
      expect(container.textContent).toContain("Original B");
      expect(container.textContent).toContain("Seoul");
      expect(container.textContent).toContain("Door");
      expect(container.textContent).not.toContain("LOSTINSEOUL.");
    }
  );
  it("submits a saved capability in a no-store POST body and renders the returned detail", async () => {
    rememberPurchasePayment({
      orderRef: "LOST-1",
      cartID: "cart",
      paymentId: "pay",
      purchaseAccessToken: "secret-code"
    });
    await mount();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/lost/orders",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          orderRef: "LOST-1",
          purchaseAccessToken: "secret-code"
        })
      })
    );
    expect(container.textContent).toContain("Original B");
    expect(container.innerHTML).not.toContain("secret-code");
  });
  it("shows an accessible failure on denied access without order details", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "order-not-found" }, { status: 404 })
    );
    await mount();
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      en.LOSTINSEOUL.orders.lookupError
    );
    expect(container.textContent).not.toContain("Original A");
  });
});
