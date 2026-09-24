// @vitest-environment happy-dom
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../../../messages/en.json";
import ko from "../../../../../../messages/ko.json";
import { LostCheckoutPageClient } from "./page.client";
import {
  readPendingPurchaseForViewer,
  readPurchasePayment,
  rememberPurchasePayment
} from "@/payload/plugins/ecommerce/client/purchase-confirmation";

const mocks = vi.hoisted(() => ({
  initiate: vi.fn(),
  confirm: vi.fn(),
  sdk: vi.fn(),
  request: vi.fn(),
  viewer: "user"
}));
vi.mock("@/payload/plugins/ecommerce/client/portone-sdk", () => ({
  loadPortOneSdk: mocks.sdk
}));
vi.mock("@/lib/auth/session/RP_SessionProvider", () => ({
  useRPSession: (selector: (session: { id: string }) => unknown) =>
    selector({ id: mocks.viewer })
}));
vi.mock("@/lib/lost-commerce/useStoreCart", () => ({
  useStoreCart: () => ({
    lines: [
      {
        productId: "product",
        skuId: "sku",
        productName: "Shirt",
        quantity: 1,
        unitAmount: 1000,
        currency: "USD"
      }
    ],
    total: 1000,
    isLoading: false,
    unconfirmed: false,
    isBlocked: () => false
  })
}));
vi.mock("@payloadcms/plugin-ecommerce/client/react", () => ({
  useCart: () => ({ cart: { id: "cart" } }),
  usePayments: () => ({
    initiatePayment: mocks.initiate,
    confirmOrder: mocks.confirm
  })
}));
vi.mock("@lostinseoul/components/cart-mutation-feedback", () => ({
  CartMutationFeedback: () => null
}));
vi.mock("@/components/core/Button", () => ({
  Button: (props: ComponentProps<"button">) => <button {...props} />
}));
vi.mock("@/components/core/Link/Link", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />
}));
vi.mock("@lostinseoul/index.css", () => ({}));
let container: HTMLDivElement;
let root: Root;
async function mount(
  locale: "en" | "ko" = "en",
  options: {
    portOneEnabled?: boolean;
    paymentPreviewEnabled?: boolean;
    manualPaymentEnabled?: boolean;
  } = {}
) {
  const messages = locale === "en" ? en : ko;
  const labels = {
    ...messages.LOSTINSEOUL.checkout,
    back: "Back",
    empty: "Empty",
    total: "Total"
  };
  await act(async () =>
    root.render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LostCheckoutPageClient
          labels={labels}
          manualPaymentEnabled={options.manualPaymentEnabled ?? false}
          paymentPreviewEnabled={options.paymentPreviewEnabled ?? false}
          portOneEnabled={options.portOneEnabled ?? true}
          portOneSdkVersion="v2"
        />
      </NextIntlClientProvider>
    )
  );
}
function field(name: string) {
  return container.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
}
function fill() {
  for (const [name, value] of Object.entries({
    name: "  Kim   Min  ",
    email: "buyer@example.com",
    phone: "+82 10 1234 5678",
    address: "  10   Seoul Road  ",
    postalCode: "  01234  ",
    addressLine2: "  Apt   2  ",
    note: "Leave at door"
  })) {
    const input = field(name);
    if (input) input.value = value;
  }
}
async function submit() {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.resetAllMocks();
  mocks.viewer = "user";
  window.location.href = "http://localhost:3000/lostinseoul/checkout";
  mocks.sdk.mockResolvedValue(undefined);
  mocks.initiate.mockRejectedValue(new Error("invalid-shipping-address"));
  sessionStorage.clear();
  vi.stubGlobal("PortOne", { requestPayment: mocks.request });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
describe("physical checkout shipping", () => {
  it.each(["en", "ko"] as const)(
    "labels a fixed KR destination and address fields in %s",
    async (locale) => {
      await mount(locale);
      const copy = (locale === "en" ? en : ko).LOSTINSEOUL.checkout as Record<
        string,
        string
      >;
      expect(container.textContent).toContain(
        locale === "en" ? "South Korea" : "대한민국"
      );
      for (const name of ["name", "phone", "address", "postalCode"])
        expect(field(name).required).toBe(true);
      for (const name of ["addressLine2", "postalCode"]) {
        expect(
          container.querySelector(`label[for="${field(name).id}"]`)?.textContent
        ).toBe(copy[name]);
      }
      expect(field("addressLine2").required).toBe(false);
      expect(field("note").required).toBe(false);
    }
  );
  it.each(["name", "phone", "address", "postalCode"])(
    "blocks whitespace-only %s before SDK or initiation",
    async (name) => {
      await mount();
      fill();
      if (field(name)) field(name).value = "   ";
      await submit();
      expect(mocks.sdk).not.toHaveBeenCalled();
      expect(mocks.initiate).not.toHaveBeenCalled();
      expect(mocks.request).not.toHaveBeenCalled();
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Check the shipping address."
      );
    }
  );
  it("submits a normalized complete KR address without restricting currency", async () => {
    await mount();
    fill();
    await submit();
    expect(mocks.initiate).toHaveBeenCalledWith("portone", {
      additionalData: expect.objectContaining({
        expectedAmount: 1000,
        expectedCurrency: "USD",
        deliveryNote: "Leave at door",
        shippingAddress: {
          firstName: "Kim Min",
          phone: "+82 10 1234 5678",
          country: "KR",
          addressLine1: "10 Seoul Road",
          addressLine2: "Apt 2",
          postalCode: "01234"
        },
        billingAddress: {
          firstName: "Kim Min",
          phone: "+82 10 1234 5678",
          country: "KR",
          addressLine1: "10 Seoul Road",
          addressLine2: "Apt 2",
          postalCode: "01234"
        }
      })
    });
  });
  it.each([
    "shipping-address-required",
    "invalid-shipping-address",
    "unsupported-shipping-country"
  ])("retains values and the cart after %s", async (code) => {
    mocks.initiate.mockRejectedValue(
      new Error(JSON.stringify({ error: code }))
    );
    await mount();
    fill();
    await submit();
    expect(field("address").value).toBe("  10   Seoul Road  ");
    expect(field("postalCode").value).toBe("  01234  ");
    expect(container.textContent).toContain("Shirt");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      code === "unsupported-shipping-country"
        ? "Shipping is available within South Korea only."
        : code === "shipping-address-required"
          ? "Enter a shipping address."
          : "Check the shipping address."
    );
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it.each(["name", "phone", "address", "postalCode", "addressLine2"])(
    "blocks an oversized %s before loading the SDK",
    async (name) => {
      await mount();
      fill();
      field(name).value = "x".repeat(501);
      await submit();
      expect(mocks.sdk).not.toHaveBeenCalled();
      expect(mocks.initiate).not.toHaveBeenCalled();
    }
  );
  it("accepts structural postal and phone values with optional fields empty", async () => {
    await mount();
    fill();
    field("postalCode").value = "Postal value";
    field("phone").value = "+1 202 555 0199 ext 4";
    field("addressLine2").value = " ";
    field("note").value = "";
    await submit();
    expect(mocks.initiate).toHaveBeenCalledWith("portone", {
      additionalData: expect.objectContaining({
        deliveryNote: "",
        shippingAddress: {
          country: "KR",
          firstName: "Kim Min",
          phone: "+1 202 555 0199 ext 4",
          addressLine1: "10 Seoul Road",
          postalCode: "Postal value"
        }
      })
    });
  });
  it("allows correction and resubmission after a server address error", async () => {
    await mount();
    fill();
    await submit();
    field("address").value = "20 Seoul Road";
    await submit();
    expect(mocks.initiate).toHaveBeenCalledTimes(2);
    expect(mocks.initiate).toHaveBeenLastCalledWith("portone", {
      additionalData: expect.objectContaining({
        shippingAddress: expect.objectContaining({
          addressLine1: "20 Seoul Road"
        })
      })
    });
  });
  it("keeps pending payment recovery independent of the address form", async () => {
    rememberPurchasePayment({
      orderRef: "LIS-1",
      paymentId: "pay-1",
      cartID: "cart",
      customerID: "user"
    });
    mocks.confirm.mockResolvedValue({
      order_ref: "LIS-1",
      paymentStatus: "pending",
      reconciliationRequired: true
    });
    await mount();
    expect(container.querySelector("form")).toBeNull();
    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")!.click();
    });
    expect(mocks.confirm).toHaveBeenCalled();
    expect(mocks.sdk).not.toHaveBeenCalled();
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
});

const pendingPurchase = {
  orderRef: "LIS-1",
  paymentId: "pay-1",
  cartID: "cart",
  customerID: "user"
};
const initiation = {
  order_ref: "LIS-1",
  paymentId: "pay-1",
  cartID: "cart",
  customerID: "user",
  clientPayload: { paymentId: "pay-1", totalAmount: 1000, currency: "USD" }
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}
async function recover() {
  await act(async () => {
    container.querySelector<HTMLButtonElement>("button")!.click();
  });
}
describe("checkout payment state preservation", () => {
  it.each(["failed", "cancelled"])(
    "returns a terminal %s recovery to editable checkout without losing retry authority",
    async (attemptStatus) => {
      rememberPurchasePayment(pendingPurchase);
      mocks.confirm.mockResolvedValue({
        order_ref: "LIS-1",
        paymentStatus: "pending",
        reconciliationRequired: false,
        attemptStatus
      });
      await mount();
      await recover();
      expect(container.querySelector("form")).not.toBeNull();
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Payment failed."
      );
      expect(readPendingPurchaseForViewer("user")?.retryPayment).toBe(true);
      fill();
      await submit();
      expect(mocks.initiate).toHaveBeenCalledWith("portone", {
        additionalData: expect.objectContaining({ retryPayment: true })
      });
    }
  );
  it("shows recovery errors and allows confirmation retry without an address form", async () => {
    rememberPurchasePayment(pendingPurchase);
    mocks.confirm
      .mockRejectedValueOnce(
        new Error(
          JSON.stringify({
            code: "checkout-rate-limited",
            message: "Rate limited"
          })
        )
      )
      .mockResolvedValueOnce({
        order_ref: "LIS-1",
        paymentStatus: "pending",
        reconciliationRequired: true
      });
    await mount();
    await recover();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Too many requests. Try again later."
    );
    expect(container.querySelector("form")).toBeNull();
    await recover();
    expect(mocks.confirm).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Payment verification is pending."
    );
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("disables recovery during confirmation and stores a paid receipt before navigation", async () => {
    rememberPurchasePayment(pendingPurchase);
    const confirmation = deferred<unknown>();
    mocks.confirm.mockReturnValue(confirmation.promise);
    await mount();
    await recover();
    expect(container.querySelector<HTMLButtonElement>("button")?.disabled).toBe(
      true
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Verifying payment"
    );
    await act(async () =>
      confirmation.resolve({
        order_ref: "LIS-1",
        paymentStatus: "paid",
        reconciliationRequired: false
      })
    );
    expect(readPurchasePayment("LIS-1")).toEqual(pendingPurchase);
    expect(window.location.pathname).toBe("/lostinseoul/payment/success");
    expect(window.location.search).toBe("?order=LIS-1");
    expect(mocks.sdk).not.toHaveBeenCalled();
  });
  it("keeps a paid but unreconciled attempt in recovery", async () => {
    rememberPurchasePayment(pendingPurchase);
    mocks.confirm.mockResolvedValue({
      order_ref: "LIS-1",
      paymentStatus: "paid",
      reconciliationRequired: true
    });
    await mount();
    await recover();
    expect(window.location.pathname).toBe("/lostinseoul/checkout");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Payment verification is pending."
    );
  });
  it("persists recovery before calling the SDK and keeps it after an uncertain provider result", async () => {
    mocks.initiate.mockResolvedValue(initiation);
    mocks.request.mockImplementation(async () => {
      expect(readPendingPurchaseForViewer("user")).toEqual(pendingPurchase);
      return { code: "PAY_PROCESS_CANCELED" };
    });
    await mount();
    fill();
    await submit();
    expect(mocks.request).toHaveBeenCalledWith(initiation.clientPayload);
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Payment verification is pending."
    );
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
  it("confirms a successful provider response and navigates using the server order", async () => {
    mocks.initiate.mockResolvedValue(initiation);
    mocks.request.mockResolvedValue({ paymentId: "pay-1" });
    mocks.confirm.mockResolvedValue({
      order_ref: "LIS-1",
      paymentStatus: "paid",
      reconciliationRequired: false
    });
    await mount();
    fill();
    await submit();
    expect(mocks.confirm).toHaveBeenCalledWith("portone", {
      additionalData: { paymentId: "pay-1", cartID: "cart" }
    });
    expect(window.location.pathname).toBe("/lostinseoul/payment/success");
  });
  it("keeps uncertain SDK transport failures recoverable", async () => {
    mocks.initiate.mockResolvedValue(initiation);
    mocks.request.mockRejectedValue(new Error("Network interrupted"));
    await mount();
    fill();
    await submit();
    expect(container.querySelector("form")).toBeNull();
    expect(readPendingPurchaseForViewer("user")).toEqual(pendingPurchase);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Could not create the order."
    );
  });
  it("does not initiate when the SDK loads without its payment API", async () => {
    vi.stubGlobal("PortOne", undefined);
    await mount();
    fill();
    await submit();
    expect(mocks.initiate).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Could not create the order."
    );
    expect(field("address").value).toBe("  10   Seoul Road  ");
  });
  it.each([{ order_ref: "LIS-1" }, { ...initiation, paymentId: undefined }])(
    "does not open the SDK for a malformed initiation response",
    async (response) => {
      mocks.initiate.mockResolvedValue(response);
      await mount();
      fill();
      await submit();
      expect(mocks.request).not.toHaveBeenCalled();
      expect(readPendingPurchaseForViewer("user")).toBeNull();
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Could not create the order."
      );
    }
  );
  it("does not execute payment in preview mode", async () => {
    await mount("en", { portOneEnabled: false, paymentPreviewEnabled: true });
    fill();
    await submit();
    expect(mocks.sdk).not.toHaveBeenCalled();
    expect(mocks.initiate).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled
    ).toBe(false);
  });
  it("does not execute a manual selection through PortOne", async () => {
    await mount("en", { manualPaymentEnabled: true });
    fill();
    const manual = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button")
    ).find((button) => button.textContent === "Manual")!;
    await act(async () => manual.click());
    await submit();
    expect(mocks.sdk).not.toHaveBeenCalled();
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("disables checkout while card payments are unavailable", async () => {
    await mount("en", { portOneEnabled: false });
    expect(container.textContent).toContain("Card payments are not open yet.");
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled
    ).toBe(true);
  });
  it.each(["name", "addressLine2"])(
    "rejects control characters in %s before SDK load",
    async (name) => {
      await mount();
      fill();
      field(name).value = "bad\u0085value";
      await submit();
      expect(mocks.sdk).not.toHaveBeenCalled();
      expect(mocks.initiate).not.toHaveBeenCalled();
    }
  );
  it("does not initiate with an invalid contact email on a direct submit event", async () => {
    await mount();
    fill();
    field("email").value = "invalid";
    await submit();
    expect(mocks.sdk).not.toHaveBeenCalled();
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("does not open a payment after the viewer changes during SDK loading", async () => {
    const loading = deferred<void>();
    mocks.sdk.mockReturnValue(loading.promise);
    await mount();
    fill();
    await submit();
    mocks.viewer = "other-user";
    await mount();
    await act(async () => loading.resolve());
    expect(mocks.initiate).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
    expect(container.querySelector("form")).not.toBeNull();
  });
  it("does not open a payment after the viewer changes during initiation", async () => {
    const pending = deferred<unknown>();
    mocks.initiate.mockReturnValue(pending.promise);
    await mount();
    fill();
    await submit();
    mocks.viewer = "other-user";
    await mount();
    await act(async () => pending.resolve(initiation));
    expect(mocks.request).not.toHaveBeenCalled();
    expect(readPendingPurchaseForViewer("other-user")).toBeNull();
  });
  it("does not navigate after the viewer changes during recovery confirmation", async () => {
    rememberPurchasePayment(pendingPurchase);
    const confirmation = deferred<unknown>();
    mocks.confirm.mockReturnValue(confirmation.promise);
    await mount();
    await recover();
    mocks.viewer = "other-user";
    await mount();
    await act(async () =>
      confirmation.resolve({
        order_ref: "LIS-1",
        paymentStatus: "paid",
        reconciliationRequired: false
      })
    );
    expect(window.location.pathname).toBe("/lostinseoul/checkout");
    expect(container.querySelector("form")).not.toBeNull();
  });
});
