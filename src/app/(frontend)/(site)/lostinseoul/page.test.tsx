import { createElement, type ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection, getLostHomeData } = vi.hoisted(() => ({
  connection: vi.fn(),
  getLostHomeData: vi.fn()
}));

vi.mock("@/lib/lost-commerce/queries", () => ({ getLostHomeData }));
vi.mock("next/server", () => ({ connection }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key
}));
vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: ReactNode }) =>
    createElement("main", null, children)
}));
vi.mock("@lostinseoul/storefront", () => ({
  StoreFront: ({ products }: { products: { name: string }[] }) =>
    createElement(
      "section",
      null,
      products.map((product) => product.name).join(", ") || "Empty catalog"
    )
}));

import Page from "./page";

describe("storefront server rendering", () => {
  beforeEach(() => {
    getLostHomeData.mockReset();
    connection.mockReset().mockResolvedValue(undefined);
  });

  it("defers localized runtime content until a request without blocking the shell", async () => {
    let resolveConnection!: () => void;
    connection.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveConnection = resolve;
      })
    );
    getLostHomeData.mockResolvedValue({ products: [], drops: [] });
    const stream = await renderToReadableStream(createElement(Page));
    try {
      expect(getLostHomeData).not.toHaveBeenCalled();
    } finally {
      resolveConnection();
      await new Response(stream).text();
    }
  });

  it("streams the page shell while the catalog is still loading", async () => {
    let resolveCatalog!: (data: {
      products: { name: string }[];
      drops: never[];
    }) => void;
    getLostHomeData.mockReturnValue(
      new Promise((resolve) => {
        resolveCatalog = resolve;
      })
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    try {
      const stream = await renderToReadableStream(createElement(Page), {
        signal: controller.signal
      });
      expect(stream).toBeTruthy();
      resolveCatalog({ products: [{ name: "Test fragrance" }], drops: [] });
      expect(await new Response(stream).text()).toContain("Test fragrance");
    } finally {
      clearTimeout(timeout);
      resolveCatalog({ products: [], drops: [] });
    }
  });

  it("renders a successful empty catalog", async () => {
    getLostHomeData.mockResolvedValue({ products: [], drops: [] });
    const stream = await renderToReadableStream(createElement(Page));
    expect(await new Response(stream).text()).toContain("Empty catalog");
  });

  it("propagates a failed catalog read instead of rendering an empty catalog", async () => {
    const error = new Error("Database unavailable");
    getLostHomeData.mockRejectedValue(error);
    const onError = vi.fn();
    const stream = await renderToReadableStream(createElement(Page), {
      onError
    });
    const html = await new Response(stream).text();
    expect(onError).toHaveBeenCalledWith(error, expect.anything());
    expect(html).not.toContain("Empty catalog");
  });
});
