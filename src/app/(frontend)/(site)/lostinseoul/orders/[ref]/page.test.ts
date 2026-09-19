import { createElement, type ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  session: vi.fn(),
  detail: vi.fn(),
  payload: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  })
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.session
}));
vi.mock("@/lib/payload", () => ({ getPayload: mocks.payload }));
vi.mock("@/payload/plugins/ecommerce/order-history", () => ({
  getCustomerOrder: mocks.detail
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key
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

const order = {
  orderRef: "LIS-1",
  lifecycleStatus: "pending_payment",
  paymentStatus: "pending",
  fulfillmentStatus: "unfulfilled",
  currency: "KRW",
  amount: 24000,
  items: ["First historical shirt", "Second historical shirt"].map(
    (productName, index) => ({
      key: `LIS-1:${index}`,
      productName,
      sku: `SKU-${index}`,
      skuLabel: "Original size",
      quantity: 1,
      unitAmount: 12000,
      lineAmount: 12000,
      options: [{ label: "Size", value: "Standard" }]
    })
  ),
  shippingAddress: { addressLine1: "Original shipping address" },
  billingAddress: { addressLine1: "Original billing address" },
  deliveryNote: "Original delivery note",
  shippingAmount: 0,
  taxAmount: 0
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
async function render(ref = "LIS-1") {
  const onError = vi.fn();
  try {
    const stream = await renderToReadableStream(
      createElement(Page, { params: Promise.resolve({ ref }) }),
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
  params: Promise<{ ref: string }>,
  release: () => void
) {
  const rendering = renderToReadableStream(
    createElement(
      "div",
      { "data-layout": "static" },
      createElement(Page, { params })
    )
  );
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const blocked = new Promise<never>((_, reject) => {
      deadline = setTimeout(
        () => reject(new Error("Request data blocked the detail shell")),
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
    expect(mocks.detail).not.toHaveBeenCalled();
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
  mocks.payload.mockResolvedValue({});
  mocks.session.mockResolvedValue({ user: { id: "user-1" } });
  mocks.detail.mockResolvedValue(order);
});

describe("order detail request streaming", () => {
  it("flushes the shell before the request's order reference resolves", async () => {
    const params = deferred<{ ref: string }>();
    await expectShellWhilePending(params.promise, () =>
      params.resolve({ ref: "LIS-1" })
    );
  });

  it("flushes the shell before request headers resolve", async () => {
    const request = deferred<Headers>();
    mocks.headers.mockReturnValue(request.promise);
    await expectShellWhilePending(Promise.resolve({ ref: "LIS-1" }), () =>
      request.resolve(new Headers())
    );
  });

  it("renders every immutable line and address for the verified owner with the reference-specific page slug", async () => {
    const { html } = await render();
    expect(mocks.detail).toHaveBeenCalledWith(
      {},
      { orderRef: "LIS-1", customerID: "user-1" }
    );
    expect(html).toContain('data-page="lostinseoul/orders/LIS-1"');
    for (const expected of [
      "First historical shirt",
      "Second historical shirt",
      "Original shipping address",
      "Original billing address",
      "Original delivery note"
    ])
      expect(html).toContain(expected);
    expect(html).not.toContain('name="purchaseAccessToken"');
  });

  it("renders a guest capability form without an anonymous database lookup", async () => {
    mocks.session.mockResolvedValue(null);
    const { html } = await render();
    expect(mocks.detail).not.toHaveBeenCalled();
    expect(mocks.payload).not.toHaveBeenCalled();
    expect(html).toContain('name="purchaseAccessToken"');
    expect(html).not.toContain("First historical shirt");
  });

  it("keeps a missing or inaccessible order private and offers capability lookup", async () => {
    mocks.detail.mockResolvedValue(null);
    const { html } = await render();
    expect(html).toContain('name="purchaseAccessToken"');
    expect(html).not.toContain("First historical shirt");
  });

  it.each(["", "x".repeat(101)])(
    "rejects an invalid reference before authentication or data lookup",
    async (ref) => {
      const { onError } = await render(ref);
      expect(mocks.notFound).toHaveBeenCalledOnce();
      expect(mocks.session).not.toHaveBeenCalled();
      expect(mocks.detail).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    }
  );

  it("propagates an order read failure instead of offering a misleading guest lookup", async () => {
    const error = new Error("order unavailable");
    mocks.detail.mockRejectedValue(error);
    const { html, onError } = await render();
    expect(onError).toHaveBeenCalledWith(error, expect.anything());
    expect(html).not.toContain('name="purchaseAccessToken"');
  });
});
