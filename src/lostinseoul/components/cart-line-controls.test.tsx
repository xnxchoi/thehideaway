// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartOperationsProvider } from "@/payload/plugins/ecommerce/client/cart-operations";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import en from "../../../messages/en.json";
import { CartLineControls } from "./cart-line-controls";

let root: Root;
let container: HTMLDivElement;
let quantity: number;
let resolveMutation: ((value: Response) => void) | undefined;
let rejectMutation: ((reason: Error) => void) | undefined;
let refreshFails: boolean;
let hasCart: boolean;
let userResponse: Promise<Response> | undefined;
const calls: { path: string; body?: Record<string, unknown> }[] = [];
function Harness() {
  const {
    lines,
    add,
    clear,
    increment,
    decrement,
    remove,
    pending,
    unconfirmed,
    isBlocked
  } = useStoreCart();
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<boolean>();
  const [checkoutAttempts, setCheckoutAttempts] = useState(0);
  return (
    <>
      <span
        data-operation={
          pending ? "pending" : unconfirmed ? "unconfirmed" : "idle"
        }
        data-result={String(result)}
      />
      <span data-checkout-attempts={checkoutAttempts} />
      <button
        aria-label="Try checkout"
        onClick={() => {
          if (!isBlocked()) setCheckoutAttempts((count) => count + 1);
        }}
      >
        Checkout
      </button>
      <button
        aria-label="Add existing item"
        onClick={() =>
          void add(
            lines[0] ?? {
              productId: "product",
              productName: "Shirt",
              productSlug: "shirt",
              mode: "standard_purchase",
              quantity: 1,
              price: "1000",
              unitAmount: 1000,
              currency: "KRW"
            }
          ).then(setResult)
        }
      >
        Add
      </button>
      <button
        aria-label="Clear all items"
        onClick={() => void clear().then(setResult)}
      >
        Clear
      </button>
      <button
        aria-label="Toggle drawer"
        onClick={() => setOpen((value) => !value)}
      >
        Toggle drawer
      </button>
      <button
        aria-label="Try other mutations"
        onClick={() => {
          const line = lines[0];
          if (!line) return;
          void add(line);
          void clear();
          void increment(line);
          void decrement(line);
          void remove(line);
        }}
      >
        Try other mutations
      </button>
      {open &&
        lines.map((line) => <CartLineControls key={line.itemId} line={line} />)}
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
  rejectMutation = undefined;
  refreshFails = false;
  hasCart = true;
  userResponse = undefined;
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
        return (
          userResponse ??
          Response.json({
            user: { id: "user", cart: { docs: hasCart ? ["cart"] : [] } }
          })
        );
      if (path === "/api/addresses") return Response.json({ docs: [] });
      if (
        path === "/api/carts/cart/update-item" ||
        path === "/api/carts/cart/remove-item" ||
        path === "/api/carts/cart/add-item" ||
        path === "/api/carts/cart/clear" ||
        path === "/api/carts"
      )
        return new Promise<Response>((resolve, reject) => {
          resolveMutation = resolve;
          rejectMutation = reject;
        });
      if (path === "/api/carts/cart") {
        if (refreshFails) throw new Error("Response lost");
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
      }
      throw new Error(`Unhandled request ${path}`);
    })
  );
  await act(async () =>
    root.render(
      <NextIntlClientProvider locale="en" messages={en}>
        <EcommerceProvider syncLocalStorage={false}>
          <CartOperationsProvider>
            <Harness />
          </CartOperationsProvider>
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
  it("keeps focus on the quantity while mutation buttons become disabled", async () => {
    button("Decrease quantity for Shirt").focus();
    await act(async () => button("Decrease quantity for Shirt").click());
    expect(document.activeElement).toBe(container.querySelector("output"));
    quantity = 1;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(document.activeElement).toBe(container.querySelector("output"));
  });
  it("blocks same-tick checkout and keeps it blocked until mutation confirmation", async () => {
    await act(async () => {
      button("Increase quantity for Shirt").click();
      button("Try checkout").click();
    });
    expect(
      container
        .querySelector("[data-checkout-attempts]")
        ?.getAttribute("data-checkout-attempts")
    ).toBe("0");
    quantity = 3;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    await act(async () => button("Try checkout").click());
    expect(
      container
        .querySelector("[data-checkout-attempts]")
        ?.getAttribute("data-checkout-attempts")
    ).toBe("1");
  });

  it("blocks checkout after an unconfirmed write", async () => {
    await act(async () => button("Increase quantity for Shirt").click());
    await act(async () => rejectMutation!(new Error("Response lost")));
    await act(async () => button("Try checkout").click());
    expect(
      container
        .querySelector("[data-checkout-attempts]")
        ?.getAttribute("data-checkout-attempts")
    ).toBe("0");
  });

  it("blocks checkout throughout initialization and failed hydration", async () => {
    let finishUser: (response: Response) => void = () => {};
    userResponse = new Promise((resolve) => {
      finishUser = resolve;
    });
    await act(async () =>
      root.render(
        <NextIntlClientProvider locale="en" messages={en}>
          <EcommerceProvider key="hydrating-session" syncLocalStorage={false}>
            <CartOperationsProvider>
              <Harness />
            </CartOperationsProvider>
          </EcommerceProvider>
        </NextIntlClientProvider>
      )
    );
    await act(async () => button("Try checkout").click());
    expect(
      container
        .querySelector("[data-checkout-attempts]")
        ?.getAttribute("data-checkout-attempts")
    ).toBe("0");
    await act(async () =>
      finishUser(Response.json({ error: "offline" }, { status: 503 }))
    );
    await act(async () => button("Try checkout").click());
    expect(
      container
        .querySelector("[data-checkout-attempts]")
        ?.getAttribute("data-checkout-attempts")
    ).toBe("0");
  });

  it("confirms creation of an empty-session cart without inventing local cart state", async () => {
    hasCart = false;
    await act(async () =>
      root.render(
        <NextIntlClientProvider locale="en" messages={en}>
          <EcommerceProvider key="empty-session" syncLocalStorage={false}>
            <CartOperationsProvider>
              <Harness />
            </CartOperationsProvider>
          </EcommerceProvider>
        </NextIntlClientProvider>
      )
    );
    await act(async () => button("Add existing item").click());
    expect(calls.find(({ path }) => path === "/api/carts")?.body).toMatchObject(
      { items: [{ product: "product", quantity: 1 }] }
    );
    await act(async () =>
      resolveMutation!(
        Response.json({
          doc: {
            id: "cart",
            currency: "KRW",
            items: [
              {
                id: "line",
                product: "product",
                product_name: "Shirt",
                quantity: 1
              }
            ]
          }
        })
      )
    );
    expect(
      container.querySelector("[data-result]")?.getAttribute("data-result")
    ).toBe("true");
    expect(container.querySelector("output")?.textContent).toBe("1");
  });

  it("locks a lost removal response without displaying a successful removal", async () => {
    await act(async () => button("Remove Shirt").click());
    quantity = 0;
    await act(async () => rejectMutation!(new Error("Response lost")));
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(button("Remove Shirt").disabled).toBe(true);
    await act(async () => button("Toggle drawer").click());
    await act(async () => button("Toggle drawer").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
  });

  it("keeps session-level recovery metadata when the vendor resets a missing cart", async () => {
    await act(async () => button("Clear all items").click());
    await act(async () => resolveMutation!(Response.json({ success: false })));
    expect(container.querySelector("output")).toBeNull();
    expect(
      container.querySelector("[data-result]")?.getAttribute("data-result")
    ).toBe("false");
    expect(
      container
        .querySelector("[data-operation]")
        ?.getAttribute("data-operation")
    ).toBe("unconfirmed");
  });

  it.each([
    ["Add existing item", 4],
    ["Clear all items", 0]
  ] as const)(
    "confirms %s only after the authoritative cart refresh",
    async (action, expected) => {
      await act(async () => button(action).click());
      expect(
        container.querySelector("[data-operation]")?.getAttribute("data-result")
      ).toBe("undefined");
      quantity = expected;
      await act(async () => resolveMutation!(Response.json({ success: true })));
      expect(
        container.querySelector("[data-operation]")?.getAttribute("data-result")
      ).toBe("true");
      expect(
        container
          .querySelector("[data-operation]")
          ?.getAttribute("data-operation")
      ).toBe("idle");
    }
  );

  it.each(["Add existing item", "Clear all items"])(
    "does not report %s success if the response is lost after the server write",
    async (action) => {
      await act(async () => button(action).click());
      quantity = action === "Add existing item" ? 4 : 0;
      await act(async () => rejectMutation!(new Error("Response lost")));
      expect(
        container.querySelector("[data-operation]")?.getAttribute("data-result")
      ).toBe("false");
      expect(
        container
          .querySelector("[data-operation]")
          ?.getAttribute("data-operation")
      ).toBe("unconfirmed");
      const count = calls.length;
      await act(async () => button("Try other mutations").click());
      expect(calls).toHaveLength(count);
    }
  );

  it("preserves the lock if a successful mutation acknowledgement is followed by a failed cart refresh", async () => {
    await act(async () => button("Add existing item").click());
    quantity = 4;
    refreshFails = true;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(
      container.querySelector("[data-operation]")?.getAttribute("data-result")
    ).toBe("false");
    expect(
      container
        .querySelector("[data-operation]")
        ?.getAttribute("data-operation")
    ).toBe("unconfirmed");
    expect(container.querySelector("output")?.textContent).toBe("2");
  });

  it("resets uncertainty only when the provider lifetime changes and the cart rehydrates", async () => {
    await act(async () => button("Increase quantity for Shirt").click());
    quantity = 3;
    await act(async () => rejectMutation!(new Error("Response lost")));
    await act(async () =>
      root.render(
        <NextIntlClientProvider locale="en" messages={en}>
          <EcommerceProvider key="new-session" syncLocalStorage={false}>
            <CartOperationsProvider>
              <Harness />
            </CartOperationsProvider>
          </EcommerceProvider>
        </NextIntlClientProvider>
      )
    );
    expect(container.querySelector("output")?.textContent).toBe("3");
    expect(button("Increase quantity for Shirt").disabled).toBe(false);
    expect(
      container
        .querySelector("[data-operation]")
        ?.getAttribute("data-operation")
    ).toBe("idle");
  });

  it("retains uncertain mutation state after the drawer closes before the response", async () => {
    await act(async () => button("Increase quantity for Shirt").click());
    await act(async () => button("Toggle drawer").click());
    quantity = 3; // The server committed, but the acknowledgement was lost.
    await act(async () =>
      resolveMutation!(Response.json({ error: "unavailable" }, { status: 503 }))
    );
    await act(async () => button("Toggle drawer").click());
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(button("Increase quantity for Shirt").disabled).toBe(true);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not confirm"
    );
    await act(async () => button("Increase quantity for Shirt").click());
    expect(
      calls.filter(({ path }) => path.endsWith("update-item"))
    ).toHaveLength(1);
  });

  it("keeps a pending mutation locked across drawer remount and unlocks confirmed success", async () => {
    await act(async () => button("Increase quantity for Shirt").click());
    await act(async () => button("Toggle drawer").click());
    await act(async () => button("Toggle drawer").click());
    expect(button("Increase quantity for Shirt").disabled).toBe(true);
    quantity = 3;
    await act(async () => resolveMutation!(Response.json({ success: true })));
    expect(container.querySelector("output")?.textContent).toBe("3");
    expect(button("Increase quantity for Shirt").disabled).toBe(false);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("blocks all adapter mutation paths while pending and uncertain, including same-tick calls", async () => {
    await act(async () => {
      button("Increase quantity for Shirt").click();
      button("Try other mutations").click();
    });
    const afterStart = calls.length;
    await act(async () =>
      resolveMutation!(Response.json({ error: "unavailable" }, { status: 503 }))
    );
    await act(async () => button("Toggle drawer").click());
    await act(async () => button("Try other mutations").click());
    expect(calls).toHaveLength(afterStart);
    expect(
      calls.filter(({ path }) => path.endsWith("update-item"))
    ).toHaveLength(1);
  });
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
