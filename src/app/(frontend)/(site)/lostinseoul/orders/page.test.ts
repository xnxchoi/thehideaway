import { createElement, type ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  session: vi.fn(),
  payload: vi.fn(),
  list: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  })
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound
}));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.session
}));
vi.mock("@/lib/payload", () => ({ getPayload: mocks.payload }));
vi.mock(
  "@/payload/plugins/ecommerce/order-history",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/payload/plugins/ecommerce/order-history")
    >()),
    listCustomerOrders: mocks.list
  })
);
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getFormatter: async () => ({ dateTime: () => "September 19, 2026" })
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children, slug }: { children: ReactNode; slug: string[] }) =>
    createElement("div", { "data-page": slug.join("/") }, children)
}));
vi.mock("@/components/core/Link/Link", () => ({
  Link: ({ children, ...props }: { children: ReactNode; href: string }) =>
    createElement("a", props, children)
}));
import Page from "./page";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
async function render(
  searchParams = Promise.resolve<{ page?: string | string[] }>({})
) {
  const onError = vi.fn();
  try {
    const stream = await renderToReadableStream(
      createElement(Page, { searchParams }),
      { onError }
    );
    return { html: await new Response(stream).text(), onError };
  } catch (error) {
    // React may reject the root before a shell exists; retain its reported error.
    if (!onError.mock.calls.some(([reported]) => reported === error))
      throw error;
    return { html: "", onError };
  }
}
async function expectShellWhilePending(
  searchParams: Promise<{ page?: string | string[] }>,
  release: () => void
) {
  const rendering = renderToReadableStream(
    createElement(
      "div",
      { "data-layout": "static" },
      createElement(Page, { searchParams })
    )
  );
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const blocked = new Promise<never>((_, reject) => {
      deadline = setTimeout(
        () => reject(new Error("Request data blocked the page shell")),
        500
      );
    });
    const stream = await Promise.race([rendering, blocked]);
    const reader = stream.getReader();
    try {
      const first = await Promise.race([reader.read(), blocked]);
      expect(first.done).toBe(false);
      expect(new TextDecoder().decode(first.value)).toContain(
        'data-layout="static"'
      );
    } finally {
      reader.releaseLock();
    }
    expect(mocks.list).not.toHaveBeenCalled();
  } finally {
    clearTimeout(deadline);
    release();
    const reader = (await rendering).getReader();
    try {
      while (!(await reader.read()).done) {
        /* Drain the completed stream. */
      }
    } finally {
      reader.releaseLock();
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
  mocks.session.mockResolvedValue({ user: { id: "owner-one" } });
  mocks.payload.mockResolvedValue({});
  mocks.list.mockResolvedValue({
    orders: [],
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false
  });
});

describe("order list request streaming", () => {
  it("flushes the shell while request headers are pending", async () => {
    const request = deferred<Headers>();
    mocks.headers.mockReturnValue(request.promise);
    await expectShellWhilePending(Promise.resolve({}), () =>
      request.resolve(new Headers())
    );
  });

  it("flushes the shell while pagination search parameters are pending", async () => {
    const search = deferred<{ page?: string }>();
    await expectShellWhilePending(search.promise, () =>
      search.resolve({ page: "2" })
    );
    expect(mocks.list).toHaveBeenCalledWith({}, "owner-one", "2");
  });

  it("redirects an anonymous request before reading private orders", async () => {
    mocks.session.mockResolvedValue(null);
    const { onError } = await render();
    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining("lostinseoul")
    );
    expect(mocks.payload).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it.each([{ page: "0" }, { page: ["1", "2"] }])(
    "rejects invalid pagination %j before reading orders",
    async ({ page }) => {
      const { onError } = await render(Promise.resolve({ page }));
      expect(mocks.notFound).toHaveBeenCalledOnce();
      expect(mocks.list).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    }
  );

  it("renders the verified owner's history and pagination under the existing page slug", async () => {
    mocks.list.mockResolvedValue({
      orders: [
        {
          orderRef: "LIS-history",
          createdAt: "2026-09-19T00:00:00.000Z",
          lifecycleStatus: "pending_payment",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          currency: "KRW",
          amount: 12000
        }
      ],
      page: 2,
      totalPages: 3,
      hasPrevPage: true,
      hasNextPage: true
    });
    const { html } = await render(Promise.resolve({ page: "2" }));
    expect(mocks.list).toHaveBeenCalledWith({}, "owner-one", "2");
    expect(html).toContain('data-page="lostinseoul/orders"');
    expect(html).toContain("LIS-history");
    expect(html).toContain("/lostinseoul/orders?page=1");
    expect(html).toContain("/lostinseoul/orders?page=3");
  });

  it("propagates private history read failures instead of presenting an empty history", async () => {
    const error = new Error("history unavailable");
    mocks.list.mockRejectedValue(error);
    const { html, onError } = await render();
    expect(onError).toHaveBeenCalledWith(error, expect.anything());
    expect(html).not.toContain(">empty</p>");
  });
});
