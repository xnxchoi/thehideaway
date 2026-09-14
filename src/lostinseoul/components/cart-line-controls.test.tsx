// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import en from "../../../messages/en.json";
import { CartLineControls } from "./cart-line-controls";

let root: Root;
let container: HTMLDivElement;
let quantity: number;
let resolveMutation: ((value: Response) => void) | undefined;
const calls: { path: string; body?: Record<string, unknown> }[] = [];
function Harness() {
  const { lines } = useStoreCart();
  return (
    <>
      {lines.map((line) => (
        <CartLineControls key={line.itemId} line={line} />
      ))}
    </>
  );
}
beforeEach(async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  quantity = 2;
  calls.length = 0;
  resolveMutation = undefined;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url, "https://store.test").pathname;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path, body });
      if (path === "/api/users/me")
        return Response.json({
          user: { id: "user", cart: { docs: ["cart"] } }
        });
      if (path === "/api/addresses") return Response.json({ docs: [] });
      if (
        path === "/api/carts/cart/update-item" ||
        path === "/api/carts/cart/remove-item"
      )
        return new Promise<Response>((resolve) => {
          resolveMutation = resolve;
        });
      if (path === "/api/carts/cart")
        return Response.json({
          id: "cart",
          currency: "KRW",
          items: quantity
            ? [
                {
                  id: "line",
                  product: "product",
                  product_name: "Shirt",
                  unit_amount: 1000,
                  quantity
                }
              ]
            : []
        });
      throw new Error(`Unhandled request ${path}`);
    })
  );
  await act(async () =>
    root.render(
      <NextIntlClientProvider locale="en" messages={en}>
        <EcommerceProvider syncLocalStorage={false}>
          <Harness />
        </EcommerceProvider>
      </NextIntlClientProvider>
    )
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const button = (name: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;

describe("mounted cart quantity controls over the official provider", () => {
  it("keeps the confirmed count while pending and updates after the server response", async () => {
    await act(async () => button("Increase quantity for Shirt").click());
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(button("Increase quantity for Shirt").disabled).toBe(true);
    expect(
      calls.find(({ path }) => path.endsWith("update-item"))?.body
    ).toMatchObject({ itemID: "line", quantity: { $inc: 1 } });
    quantity = 3;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(container.querySelector("output")?.textContent).toBe("3");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(button("Increase quantity for Shirt").disabled).toBe(false);
  });

  it("preserves the last confirmed count and offers reload on swallowed mutation failure", async () => {
    await act(async () => button("Decrease quantity for Shirt").click());
    await act(async () =>
      resolveMutation!(Response.json({ error: "capacity" }, { status: 409 }))
    );
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
    expect(button("Decrease quantity for Shirt").disabled).toBe(true);
    expect(container.textContent).toContain("Reload cart");
    expect(
      calls.filter(({ path }) => path.endsWith("update-item"))
    ).toHaveLength(1);
  });

  it("decrements through the official endpoint and disables decrement at one", async () => {
    await act(async () => button("Decrease quantity for Shirt").click());
    quantity = 1;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(container.querySelector("output")?.textContent).toBe("1");
    expect(button("Decrease quantity for Shirt").disabled).toBe(true);
    expect(button("Remove Shirt").disabled).toBe(false);
  });

  it("removes through the official endpoint and awaits the confirmed cart", async () => {
    await act(async () => button("Remove Shirt").click());
    expect(container.textContent).toContain("2");
    quantity = 0;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(container.querySelector("output")).toBeNull();
  });
});
