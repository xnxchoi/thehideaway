// @vitest-environment happy-dom
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartOperationsProvider } from "@/payload/plugins/ecommerce/client/cart-operations";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import en from "../../../../../../messages/en.json";
import { LostCheckoutPageClient } from "./page.client";
import { LostCartPageClient } from "../cart/page.client";

const sdk = vi.hoisted(() => ({
  load: vi.fn(async (): Promise<void> => undefined)
}));
vi.mock("@/payload/plugins/ecommerce/client/portone-sdk", () => ({
  loadPortOneSdk: sdk.load
}));
vi.mock("@/lib/auth/session/RP_SessionProvider", () => ({
  useRPSession: (selector: (session: { id: string }) => unknown) =>
    selector({ id: "user" })
}));
vi.mock("@/components/core/Button", () => ({
  Button: (props: ComponentProps<"button">) => <button {...props} />
}));
vi.mock("@/components/core/Link/Link", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />
}));
vi.mock("@lostinseoul/index.css", () => ({}));

let root: Root;
let container: HTMLDivElement;
let resolveMutation: (response: Response) => void;
const requests: string[] = [];
const labels = {
  title: "Checkout",
  back: "Back",
  contact: "Contact",
  shipping: "Shipping",
  payment: "Payment",
  portone: "Card",
  manual: "Manual",
  submit: "Pay",
  pending: "Pending",
  recovering: "Recovering",
  recovery: "Recover",
  failed: "Failed",
  portoneUnavailable: "Unavailable",
  name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  note: "Note",
  empty: "Empty",
  total: "Total"
};
function Harness({ surface }: { surface: "checkout" | "cart" }) {
  const { lines, increment, clear } = useStoreCart();
  return (
    <>
      <button onClick={() => void increment(lines[0])} data-increase>
        Increase
      </button>
      <button onClick={() => void clear()} data-clear>
        Clear
      </button>
      {surface === "checkout" ? (
        <LostCheckoutPageClient
          labels={labels}
          manualPaymentEnabled={false}
          paymentPreviewEnabled={false}
          portOneEnabled
          portOneSdkVersion="v2"
        />
      ) : (
        <LostCartPageClient
          labels={{
            title: "Cart",
            empty: "Empty",
            checkout: "Checkout",
            remove: "Remove",
            total: "Total",
            back: "Back",
            objects: "Objects"
          }}
        />
      )}
    </>
  );
}
async function mount(surface: "checkout" | "cart" = "checkout") {
  await act(async () =>
    root.render(
      <NextIntlClientProvider locale="en" messages={en}>
        <EcommerceProvider syncLocalStorage={false}>
          <CartOperationsProvider>
            <Harness surface={surface} />
          </CartOperationsProvider>
        </EcommerceProvider>
      </NextIntlClientProvider>
    )
  );
}
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  requests.length = 0;
  sdk.load.mockReset();
  sdk.load.mockResolvedValue(undefined);
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = new URL(url, "https://store.test").pathname;
      requests.push(path);
      if (path === "/api/users/me")
        return Response.json({
          user: { id: "user", cart: { docs: ["cart"] } }
        });
      if (path === "/api/addresses") return Response.json({ docs: [] });
      if (
        path === "/api/carts/cart/update-item" ||
        path === "/api/carts/cart/clear"
      )
        return new Promise<Response>((resolve) => {
          resolveMutation = resolve;
        });
      if (path === "/api/carts/cart")
        return Response.json({
          id: "cart",
          currency: "KRW",
          items: [
            {
              id: "line",
              product: "product",
              product_name: "Shirt",
              unit_amount: 1000,
              quantity: 2
            }
          ]
        });
      throw new Error(`Unexpected request ${path}`);
    })
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function submit() {
  container
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("mounted cart and checkout mutation recovery", () => {
  it("blocks same-tick payment submission before cart mutation state rerenders", async () => {
    await mount();
    await act(async () => {
      container.querySelector<HTMLButtonElement>("[data-increase]")!.click();
      submit();
    });
    expect(sdk.load).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled
    ).toBe(true);
  });
  it("rechecks cart readiness after the asynchronous SDK load", async () => {
    let releaseSdk: () => void = () => {};
    sdk.load.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseSdk = resolve;
        })
    );
    const requestPayment = vi.fn();
    vi.stubGlobal("PortOne", { requestPayment });
    await mount();
    await act(async () => submit());
    expect(sdk.load).toHaveBeenCalledOnce();
    await act(async () =>
      container.querySelector<HTMLButtonElement>("[data-increase]")!.click()
    );
    await act(async () => releaseSdk());
    expect(requestPayment).not.toHaveBeenCalled();
    expect(requests.some((path) => path.startsWith("/api/payments/"))).toBe(
      false
    );
  });
  it("blocks direct form submission and shows recovery after an uncertain update", async () => {
    await mount();
    await act(async () =>
      container.querySelector<HTMLButtonElement>("[data-increase]")!.click()
    );
    await act(async () =>
      resolveMutation(Response.json({ error: "unavailable" }, { status: 503 }))
    );
    await act(async () => submit());
    expect(sdk.load).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled
    ).toBe(true);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
    expect(container.textContent).toContain("Reload cart");
  });
  it.each(["cart", "checkout"] as const)(
    "keeps recovery visible on %s when the vendor drops the cart",
    async (surface) => {
      await mount(surface);
      await act(async () =>
        container.querySelector<HTMLButtonElement>("[data-clear]")!.click()
      );
      await act(async () => resolveMutation(Response.json({ success: false })));
      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        "Could not confirm"
      );
      expect(container.textContent).toContain("Reload cart");
    }
  );
  it("cancels same-tick checkout navigation before the cart link rerenders", async () => {
    await mount("cart");
    const link = container.querySelector<HTMLAnchorElement>(
      'a[href="/lostinseoul/checkout"]'
    )!;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => {
      container.querySelector<HTMLButtonElement>("[data-increase]")!.click();
      link.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });
  it("uses shared quantity controls and prevents checkout navigation while updating", async () => {
    await mount("cart");
    expect(
      container.querySelector(
        'button[aria-label="Increase quantity for Shirt"]'
      )
    ).not.toBeNull();
    await act(async () =>
      container.querySelector<HTMLButtonElement>("[data-increase]")!.click()
    );
    expect(
      container.querySelector('a[href="/lostinseoul/checkout"]')
    ).toBeNull();
  });
});
