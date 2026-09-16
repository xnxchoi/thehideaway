// @vitest-environment happy-dom
import { act, Component, StrictMode, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../../messages/en.json";
import ko from "../../../../../messages/ko.json";
import { useEcommerce } from "@payloadcms/plugin-ecommerce/client/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartSession } from "./cart-session";
import { GUEST_RECOVERY_KEY } from "./prepare-cart-session";
import { TransitionReadinessProvider } from "@/providers/transition-readiness";
import { LostEcommerceProvider } from "./provider";

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: "A" } }, isPending: false })
  }
}));

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
  const { cart, user, addresses, addItem } = useEcommerce();
  return (
    <>
      <output>
        {JSON.stringify({ cart: cart?.id, user: user?.id, addresses })}
      </output>
      <button onClick={() => void addItem({ product: "p" }, 1)}>
        Add product
      </button>
    </>
  );
}
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <p>Session failed</p>
    ) : (
      <NextIntlClientProvider locale="en" messages={en}>
        {this.props.children}
      </NextIntlClientProvider>
    );
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
  it("does no cart work for a known account before the final transition tree", async () => {
    identity = "A";
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    const reads = vi.spyOn(localStorage, "getItem");
    const writes = vi.spyOn(localStorage, "setItem");
    const removals = vi.spyOn(localStorage, "removeItem");
    let current!: ReturnType<typeof useEcommerce>;
    function Capture() {
      const ecommerce = useEcommerce();
      useEffect(() => {
        current = ecommerce;
      }, [ecommerce]);
      return <View />;
    }
    try {
      await act(async () =>
        root.render(
          <CartSession userId="A" transitionReady={false}>
            <Capture />
          </CartSession>
        )
      );
      expect(requests).toEqual([]);
      expect(reads).not.toHaveBeenCalled();
      expect(writes).not.toHaveBeenCalled();
      expect(removals).not.toHaveBeenCalled();
      expect(container.querySelector("[inert]")).not.toBeNull();
      expect(() => current.addItem({ product: "p" }, 1)).toThrow("not ready");
      expect(() => current.initiatePayment("portone")).toThrow("not ready");
    } finally {
      reads.mockRestore();
      writes.mockRestore();
      removals.mockRestore();
    }
  });

  it("starts the production cart bridge only after wrapper replacement, then waits for hydration", async () => {
    identity = "A";
    const normalFetch = fetch;
    let finish!: () => void;
    let mutations = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          mutations += 1;
          return Promise.resolve(
            Response.json({ doc: carts.A, success: true })
          );
        }
        if (new URL(input, "https://store.test").pathname === "/api/users/me") {
          return new Promise<Response>((resolve) => {
            finish = () => {
              void normalFetch(input, init).then(resolve);
            };
          });
        }
        return normalFetch(input, init);
      })
    );
    const tree = (ready: boolean) => {
      const content = (
        <LostEcommerceProvider>
          <View />
        </LostEcommerceProvider>
      );
      return (
        <Boundary>
          <TransitionReadinessProvider ready={ready}>
            {ready ? <main>{content}</main> : content}
          </TransitionReadinessProvider>
        </Boundary>
      );
    };
    await act(async () => root.render(tree(false)));
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => container.querySelector("button")!.click());
    expect(mutations).toBe(0);
    await act(async () => root.render(tree(true)));
    expect(fetch).toHaveBeenCalledOnce();
    expect(container.querySelector("[inert]")).not.toBeNull();
    await act(async () => container.querySelector("button")!.click());
    expect(mutations).toBe(0);
    await act(async () => finish());
    expect(container.querySelector("[inert]")).toBeNull();
    expect(container.textContent).toContain("A-cart");
    await act(async () => root.render(tree(true)));
    expect(
      requests.filter(({ path }) => path === "/api/users/me")
    ).toHaveLength(1);
    await act(async () => container.querySelector("button")!.click());
    expect(mutations).toBe(1);
  });

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
  it.each([
    ["empty guest user", null, "/api/users/me", false],
    ["empty account user", "A", "/api/users/me", false],
    ["saved guest cart", null, "/api/carts/guest", true],
    ["account cart", "A", "/api/carts/A-cart", false],
    ["account addresses", "A", "/api/addresses", false]
  ] as const)(
    "blocks actual Add until final %s hydration completes",
    async (_, userId, deferredPath, stored) => {
      if (stored) {
        localStorage.setItem(key, "guest");
        localStorage.setItem(`${key}_secret`, "proof");
      }
      const normalFetch = fetch;
      let finish!: () => void;
      let mutations = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn((input: string, init?: RequestInit) => {
          const path = new URL(input, "https://store.test").pathname;
          if (init?.method === "POST") {
            mutations += 1;
            return Promise.resolve(
              Response.json({
                doc: { id: "created", items: [] },
                success: true
              })
            );
          }
          if (path === deferredPath)
            return new Promise<Response>((resolve) => {
              finish = () => {
                if (path === "/api/users/me")
                  resolve(
                    Response.json({
                      user: userId ? { id: userId, cart: { docs: [] } } : null
                    })
                  );
                else void normalFetch(input, init).then(resolve);
              };
            });
          return normalFetch(input, init);
        })
      );
      await render(userId);
      expect(finish).toBeTypeOf("function");
      await act(async () =>
        container.querySelector<HTMLButtonElement>("button")!.click()
      );
      expect(mutations).toBe(0);
      expect(container.querySelector("[inert]")).not.toBeNull();
      await act(async () => finish());
      expect(container.querySelector("[inert]")).toBeNull();
      await act(async () =>
        container.querySelector<HTMLButtonElement>("button")!.click()
      );
      expect(mutations).toBe(1);
    }
  );

  it("does not initialize the neutral provider while identity is unresolved", async () => {
    await act(async () =>
      root.render(
        <CartSession userId={undefined}>
          <View />
        </CartSession>
      )
    );
    expect(requests).toEqual([]);
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
      expect(container.querySelector("[role=alert]")?.textContent).toContain(
        en.CartSession.unavailable
      );
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
      expect(container.querySelector("[role=alert]")?.textContent).toContain(
        en.CartSession.unavailable
      );
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
  it.each(["/api/users/me", "/api/carts/guest", "/api/addresses"])(
    "shows recoverable hydration failure for %s without losing guest proof",
    async (failedPath) => {
      const account = failedPath === "/api/addresses";
      if (!account) {
        localStorage.setItem(key, "guest");
        localStorage.setItem(`${key}_secret`, "proof");
      }
      const normalFetch = fetch;
      vi.stubGlobal(
        "fetch",
        vi.fn((input: string, init?: RequestInit) =>
          new URL(input, "https://store.test").pathname === failedPath
            ? Promise.resolve(
                Response.json(
                  { error: "private provider error" },
                  { status: 503 }
                )
              )
            : normalFetch(input, init)
        )
      );
      await render(account ? "A" : null);
      expect(container.querySelector("[role=alert]")?.textContent).toContain(
        en.CartSession.unavailable
      );
      expect(container.textContent).not.toContain("private provider error");
      expect(container.querySelector("[inert]")).not.toBeNull();
      if (!account) {
        expect(localStorage.getItem(key)).toBe("guest");
        expect(localStorage.getItem(`${key}_secret`)).toBe("proof");
      }
      const reload = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => {});
      await act(async () =>
        container
          .querySelector<HTMLButtonElement>("[role=alert] button")!
          .click()
      );
      expect(reload).toHaveBeenCalledOnce();
      reload.mockRestore();
    }
  );

  it("renders Korean recovery copy for preparation errors", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    mergeFails = true;
    identity = "A";
    await act(async () =>
      root.render(
        <NextIntlClientProvider locale="ko" messages={ko}>
          <CartSession userId="A">
            <View />
          </CartSession>
        </NextIntlClientProvider>
      )
    );
    expect(container.querySelector("[role=alert]")?.textContent).toContain(
      ko.CartSession.unavailable
    );
    expect(container.querySelector("[role=alert] button")?.textContent).toBe(
      ko.CartSession.reload
    );
  });

  it("uses one final initialization request under StrictMode and rerenders", async () => {
    let finish!: (response: Response) => void;
    const network = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", network);
    const tree = () => (
      <StrictMode>
        <CartSession userId={null}>
          <View />
        </CartSession>
      </StrictMode>
    );
    await act(async () => root.render(tree()));
    await act(async () => root.render(tree()));
    expect(network).toHaveBeenCalledOnce();
    await act(async () => finish(Response.json({ user: null })));
    expect(container.querySelector("[inert]")).toBeNull();
    expect(network).toHaveBeenCalledOnce();
  });

  it("blocks direct official cart actions while hydration is unresolved", async () => {
    let current!: ReturnType<typeof useEcommerce>;
    function Capture() {
      const ecommerce = useEcommerce();
      useEffect(() => {
        current = ecommerce;
      }, [ecommerce]);
      return null;
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );
    await act(async () =>
      root.render(
        <CartSession userId={null}>
          <Capture />
        </CartSession>
      )
    );
    expect(current.isHydrating).toBe(true);
    expect(current.isLoading).toBe(true);
    expect(() => current.addItem({ product: "p" }, 1)).toThrow("not ready");
    expect(() => current.clearCart()).toThrow("not ready");
    expect(() => current.initiatePayment("portone")).toThrow("not ready");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("cannot repersist obsolete guest state after switching accounts", async () => {
    localStorage.setItem(key, "guest");
    localStorage.setItem(`${key}_secret`, "proof");
    const normalFetch = fetch;
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (
          new URL(input, "https://store.test").pathname === "/api/carts/guest"
        )
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        return normalFetch(input, init);
      })
    );
    await render(null);
    await render("A");
    await act(async () => finish(Response.json(carts.guest)));
    expect(container.textContent).toContain("A-cart");
    expect(localStorage.getItem(key)).toBeNull();
    expect(localStorage.getItem(`${key}_secret`)).toBeNull();
  });
  it("keeps a changed server identity quarantined until the session is reloaded", async () => {
    const normalFetch = fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) =>
        input.startsWith("/api/users/me")
          ? Promise.resolve(
              Response.json({ user: { id: "B", cart: { docs: ["B-cart"] } } })
            )
          : normalFetch(input, init)
      )
    );
    await render("A");
    expect(container.querySelector("[role=alert]")?.textContent).toContain(
      en.CartSession.unavailable
    );
    expect(container.querySelector<HTMLElement>("[inert]")?.hidden).toBe(true);
    const requestsBeforeClick = requests.length;
    await act(async () =>
      container.querySelector<HTMLButtonElement>("[inert] button")!.click()
    );
    expect(requests).toHaveLength(requestsBeforeClick);
  });
});
