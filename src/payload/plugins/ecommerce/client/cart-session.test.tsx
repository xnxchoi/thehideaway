// @vitest-environment happy-dom
import { act, Component, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useEcommerce } from "@payloadcms/plugin-ecommerce/client/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartSession } from "./cart-session";
import { GUEST_RECOVERY_KEY } from "./prepare-cart-session";

const key = "lostinseoul.plugin-cart";
let root: Root;
let container: HTMLDivElement;
let identity: string | null;
let mergeFails: boolean;
let requests: { path: string; method: string; body?: string }[];
const carts = {
  guest: { id: "guest", items: [{ product: "p", quantity: 1 }] },
  A: { id: "A-cart", items: [] },
  B: { id: "B-cart", items: [] }
};

function View() {
  const { cart, user, addresses } = useEcommerce();
  return (
    <output>
      {JSON.stringify({ cart: cart?.id, user: user?.id, addresses })}
    </output>
  );
}
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? <p>Session failed</p> : this.props.children;
  }
}
async function render(userId: string | null) {
  identity = userId;
  await act(async () =>
    root.render(
      <Boundary>
        <CartSession userId={userId}>
          <View />
        </CartSession>
      </Boundary>
    )
  );
}
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // Node 25's optional Web Storage global otherwise masks happy-dom's storage.
  vi.stubGlobal("localStorage", new window.Storage());
  localStorage.clear();
  identity = null;
  mergeFails = false;
  requests = [];
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const path = new URL(input, "https://store.test").pathname;
      requests.push({
        path,
        method: init?.method ?? "GET",
        body: init?.body as string
      });
      if (path === "/api/users/me")
        return Response.json({
          user: identity
            ? { id: identity, cart: { docs: [`${identity}-cart`] } }
            : null
        });
      if (path === "/api/addresses")
        return Response.json({
          docs: identity ? [{ id: `${identity}-address` }] : []
        });
      if (path.endsWith("/merge"))
        return Response.json(
          { success: !mergeFails },
          { status: mergeFails ? 503 : 200 }
        );
      if (path === "/api/carts/guest") return Response.json(carts.guest);
      if (path === "/api/carts/A-cart") return Response.json(carts.A);
      if (path === "/api/carts/B-cart") return Response.json(carts.B);
      throw new Error(`Unhandled request: ${path}`);
    })
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("mounted official cart session", () => {
  it("keeps preparatory vendor data inert and blocks cart/payment actions", async () => {
    const action = vi.fn();
    identity = "A";
    await act(async () =>
      root.render(
        <CartSession userId={undefined}>
          <View />
          <button onClick={action}>Cart action</button>
          <form onSubmit={action}>
            <button type="submit">Pay</button>
          </form>
        </CartSession>
      )
    );
    const shell = container.querySelector<HTMLElement>("[inert]")!;
    expect(shell.hidden).toBe(true);
    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")!.click();
      container
        .querySelector<HTMLFormElement>("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
    });
    expect(action).not.toHaveBeenCalled();
    await render("B");
    expect(container.querySelector("[inert]")).toBeNull();
    expect(container.textContent).toContain("B-cart");
    expect(container.textContent).not.toContain("A-");
  });
  it("restores the guest cart and merges once despite provider callback changes", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    await render(null);
    expect(container.textContent).toContain('"cart":"guest"');
    await render("A");
    await render("A");
    expect(container.textContent).toContain('"cart":"A-cart"');
    expect(requests.filter(({ path }) => path.endsWith("/merge"))).toHaveLength(
      1
    );
    expect(
      JSON.parse(requests.find(({ path }) => path.endsWith("/merge"))!.body!)
    ).toEqual({ sourceCartID: "guest", sourceSecret: "proof" });
    expect(localStorage.getItem(`${key}_secret`)).toBeNull();
  });

  it("retains guest proof through StrictMode effect replay and merges once", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    await act(async () =>
      root.render(
        <StrictMode>
          <CartSession userId={null}>
            <View />
          </CartSession>
        </StrictMode>
      )
    );
    expect(container.textContent).toContain('"cart":"guest"');
    identity = "A";
    await act(async () =>
      root.render(
        <StrictMode>
          <CartSession userId="A">
            <View />
          </CartSession>
        </StrictMode>
      )
    );
    expect(container.textContent).toContain('"cart":"A-cart"');
    expect(requests.filter(({ path }) => path.endsWith("/merge"))).toHaveLength(
      1
    );
  });

  it("drops account cart and addresses on direct account switch and logout", async () => {
    await render("A");
    expect(container.textContent).toContain("A-address");
    await render("B");
    expect(container.textContent).not.toContain("A-");
    expect(container.textContent).toContain("B-address");
    await render(null);
    expect(container.textContent).not.toContain("B-");
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("retains both guest credentials when the merge fails", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    mergeFails = true;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await render("A");
      expect(container.textContent).toBe("Session failed");
      expect(localStorage.getItem(key)).toBe("guest");
      expect(localStorage.getItem(`${key}_secret`)).toBe("proof");
    } finally {
      error.mockRestore();
    }
  });

  it("claims a guest cart through the guarded merge route when the account has no cart", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    const normalFetch = fetch;
    let claimed = false;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (input.startsWith("/api/users/me"))
          return Promise.resolve(
            Response.json({
              user: { id: "A", cart: { docs: claimed ? ["guest"] : [] } }
            })
          );
        if (input === "/api/carts/guest/merge") claimed = true;
        return normalFetch(input, init);
      })
    );
    await render("A");
    expect(container.textContent).toContain('"cart":"guest"');
    expect(
      requests
        .filter(({ path }) => path.endsWith("/merge"))
        .map(({ path }) => path)
    ).toEqual(["/api/carts/guest/merge"]);
    expect(requests.some(({ method }) => method === "PATCH")).toBe(false);
  });

  it("recovers a retained proof on a later mount after vendor storage was erased", async () => {
    localStorage.setItem(
      GUEST_RECOVERY_KEY,
      JSON.stringify({ id: "guest", secret: "proof" })
    );
    await render("A");
    expect(container.textContent).toContain('"cart":"A-cart"');
    expect(
      JSON.parse(requests.find(({ path }) => path.endsWith("/merge"))!.body!)
    ).toEqual({ sourceCartID: "guest", sourceSecret: "proof" });
    expect(localStorage.getItem(GUEST_RECOVERY_KEY)).toBeNull();
  });

  it("ignores an old account's delayed addresses after switching identities", async () => {
    const normalFetch = fetch;
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (input.startsWith("/api/addresses") && identity === "A") {
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        }
        return normalFetch(input, init);
      })
    );
    await render("A");
    await render("B");
    expect(container.textContent).toContain("B-address");
    await act(async () =>
      finish(Response.json({ docs: [{ id: "A-address" }] }))
    );
    expect(container.textContent).not.toContain("A-");
    expect(container.textContent).toContain("B-address");
  });

  it("keeps recovery proof when obsolete guest hydration rejects after a failed merge", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    const normalFetch = fetch;
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (input.startsWith("/api/carts/guest?"))
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        return normalFetch(input, init);
      })
    );
    await render(null);
    mergeFails = true;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await render("A");
      await act(async () =>
        finish(Response.json({ error: "unavailable" }, { status: 503 }))
      );
      expect(container.textContent).toBe("Session failed");
      expect(JSON.parse(localStorage.getItem(GUEST_RECOVERY_KEY)!)).toEqual({
        id: "guest",
        secret: "proof"
      });
      mergeFails = false;
      await act(async () =>
        root.render(
          <Boundary key="retry">
            <CartSession userId="A">
              <View />
            </CartSession>
          </Boundary>
        )
      );
      expect(container.textContent).toContain("A-cart");
      const merges = requests.filter(({ path }) => path.endsWith("/merge"));
      expect(merges).toHaveLength(2);
      expect(JSON.parse(merges[1]!.body!)).toEqual({
        sourceCartID: "guest",
        sourceSecret: "proof"
      });
      expect(localStorage.getItem(GUEST_RECOVERY_KEY)).toBeNull();
    } finally {
      error.mockRestore();
    }
  });

  it("does not mount an obsolete session after its login lookup completes", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    const normalFetch = fetch;
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (input.startsWith("/api/users/me") && identity === "A") {
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        }
        return normalFetch(input, init);
      })
    );
    await render("A");
    await render("B");
    await act(async () =>
      finish(Response.json({ user: { id: "A", cart: { docs: ["A-cart"] } } }))
    );
    expect(container.textContent).toContain("B-cart");
    expect(container.textContent).not.toContain("A-");
    expect(
      requests
        .filter(({ path }) => path.endsWith("/merge"))
        .map(({ path }) => path)
    ).toEqual(["/api/carts/B-cart/merge"]);
  });
});
